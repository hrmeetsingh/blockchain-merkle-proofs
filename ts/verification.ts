import fetch from "node-fetch";
import crypto from "crypto";
import { retry } from "./retry";

let sha256 = (x: Buffer): Buffer =>
  crypto.createHash("sha256").update(x).digest();

interface UTXO_IN {
  sequence: number;
  witness: string;
  script: string;
}

interface UTXO_OUT {
  spend: boolean;
  tx_index: number;
  type: number;
  addr: string;
  value: number;
  n: number;
  script: string;
}

interface Transaction {
  hash: string;
  lock_time: number;
  ver: number;
  size: number;
  inputs: UTXO_IN[];
  weight: number;
  time: number;
  tx_index: number;
  vin_sz: number;
  relayed_by: string;
  out: UTXO_OUT[];
}

interface RawBlock {
  mrkl_root: string;
  tx: Transaction[];
  hash: string;
  ver: number;
  prev_block: string;
  time: number;
  bits: number;
  fee: number;
  nonce: number;
  n_tx: number;
  size: number;
  block_index: number;
  main_chain: boolean;
  height: number;
  received_time: number;
  relayed_by: string;
}

const toPairs = (arr: any) =>
  Array.from(Array(Math.ceil(arr.length / 2)), (_, i) =>
    arr.slice(i * 2, i * 2 + 2),
  );

const BufferReverse = (buffer: Buffer): Buffer => {
  let newBuffer = Buffer.from(buffer);
  return newBuffer.reverse();
};

const hashPair = (bufpair: Buffer[]) => {
  let [abuf, bbuf] = bufpair;
  if (!bbuf) bbuf = abuf;
  let cbuf = Buffer.concat([BufferReverse(abuf), BufferReverse(bbuf)]);
  let hashbuf = sha256(sha256(cbuf));
  return BufferReverse(hashbuf);
};

const calcMerkleRoot = (txs: Buffer[]): Buffer => {
  if (txs.length === 1) return txs[0];
  return calcMerkleRoot(
    toPairs(txs).reduce((tree, pair) => [...tree, hashPair(pair)], []),
  );
};

let validateMerkleRoot = (blk: RawBlock) => {
  let rootHash;
  if (blk.tx.length === 1) {
    rootHash = blk.tx[1].hash;
  } else {
    let txs = blk.tx.map((t) => Buffer.from(t.hash, "hex"));
    rootHash = calcMerkleRoot(txs).toString("hex");
  }
  console.log(rootHash === blk.mrkl_root);
};

const fetchLatestHash = () =>
  fetch(`https://blockchain.info/q/latesthash?cors=true`).then((r) =>
    r.text(),
  ) as Promise<string>;

const fetchRawBlock = (blockHash: string) =>
  fetch(`https://blockchain.info/rawblock/${blockHash}?cors=true`).then((r) =>
    r.json(),
  ) as Promise<RawBlock>;

let checkHash = () => {
  const hexstrs = [
    "4c5ffa511270ddebaf0c587ae4780759883a3beb207d9da27bdc4db535f0e458",
    "115daa3d573c911bf088981f0cfc6bddd90d711cb700d5c1f4a205e8233fe00c",
  ];
  const bufs = hexstrs.map((hs) => Buffer.from(hs, "hex"));
  console.log(hashPair(bufs));
  console.log(
    'answer should be "530a0de7913c1f0b20e98d8f79868d835c34195832a2d044ebcfc57a2a792e42"',
  );
};

let main = async () => {
  let blkh = await fetchLatestHash();
  console.log("latest block hash=", blkh);
  let blk = await fetchRawBlock(blkh);
  console.log("merkle root=", blk.mrkl_root);
  // console.log(`${blk.tx.length} transactions`);
  validateMerkleRoot(blk);
};

main();
