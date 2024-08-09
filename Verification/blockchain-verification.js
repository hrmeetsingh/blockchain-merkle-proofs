const sha256 = require("js-sha256");

class Request {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async fetchData(endpoint) {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`);
      if (!response.ok) {
        throw new Error(`Error: ${response.status} ${response.statusText}`);
      }
      return response;
    } catch (error) {
      console.error("Fetch Error:", error);
      throw error;
    }
  }
}

const fetchLatestBlock = async (requestObj) => {
  const response = await requestObj.fetchData("/q/latesthash?cors=true");
  return response.text();
};

const fetchMerkleRootAndTransactions = async (requestObj, block) => {
  const response = await requestObj.fetchData(`/rawblock/${block}?cors=true`);
  const bodyJson = await response.json();
  return [bodyJson.mrkl_root, bodyJson.tx.map((t) => t.hash)];
};

const random = (arr) => arr[Math.floor(Math.random() * arr.length)];

const toBytes = (hex) =>
  hex.match(/../g).reduce((acc, hex) => [...acc, parseInt(hex, 16)], []);

const toHex = (bytes) =>
  bytes.reduce((acc, bytes) => acc + bytes.toString(16).padStart(2, "0"), "");

const toPairs = (arr) =>
  Array.from(Array(Math.ceil(arr.length / 2)), (_, i) =>
    arr.slice(i * 2, i * 2 + 2),
  );

const hashPair = (a, b = a) => {
  const bytes = toBytes(`${b}${a}`).reverse();
  const hashed = sha256.array(sha256.array(bytes));
  return toHex(hashed.reverse());
};

const merkleProof = (txs, tx, proof = []) => {
  if (txs.length === 1) {
    return proof;
  }

  const tree = [];

  toPairs(txs).forEach((pair) => {
    const hash = hashPair(...pair);

    if (pair.includes(tx)) {
      const idx = (pair[0] === tx) | 0;
      proof.push([idx, pair[idx]]);
      tx = hash;
    }

    tree.push(hash);
  });

  return merkleProof(tree, tx, proof);
};

const merkleProofRoot = (proof, tx) =>
  proof.reduce(
    (root, [idx, tx]) => (idx ? hashPair(root, tx) : hashPair(tx, root)),
    tx,
  );

(async () => {
  const apiRequest = new Request("https://blockchain.info");
  const latestBlock = await fetchLatestBlock(apiRequest);
  console.log(latestBlock);
  const [root, txns] = await fetchMerkleRootAndTransactions(
    apiRequest,
    latestBlock,
  );
  const tx = random(txns);
  const proof = merkleProof(txns, tx);
  const isValid = merkleProofRoot(proof, tx) === root;
  console.log(isValid);
})();
