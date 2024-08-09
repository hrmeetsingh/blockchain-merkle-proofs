## Blockchain verification using Merkle proof in JavaScript

Example code taken from [This repo](https://gist.github.com/eddmann/6b8d0ddd3123c37f296b7680b8fa198a)

To run the verification script

`npm i`


`npm run verify`

What this is doing?
- Fetching the latest block hash from blockchain
- Getting information of the block and picking up two specific data points - merkle root and transaction hashes
- Selecting a random transaction hash from the list (leaf)
- Calculating the merkle proof using the transaction and the whole list of transactions
- Verifying the merkle proof stands for the proof generated in previous step

Merkel proof calculation complexity ( log<sub>2</sub>1438 steps)
-------
!["Merkle proof calculation"](assets/MerkelRootProofCalculation.png "Merkel Proof Calculations")
