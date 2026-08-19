const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");

// Contract & Connection Setup
const CONTRACT_ADDRESS = "0x28c9c77549F21dfb76834eE91F90EeEA1861F495";
const RPC_URL = "https://ethereum-sepolia-rpc.publicnode.com"; 
require("dotenv").config();

const PRIVATE_KEY = process.env.PRIVATE_KEY;

if (!PRIVATE_KEY) {
  throw new Error("PRIVATE_KEY is missing from environment variables (.env file).");
}

// Contract ABI
const ABI = [
  "function anchorBatch(bytes32 batchId, bytes32 merkleRoot, uint256 totalRecords) external",
  "function getBatch(bytes32 batchId) external view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords)",
  "function verifyProof(bytes32[] calldata proof, bytes32 root, bytes32 leaf) public pure returns (bool)"
];

async function main() {
  const provider = new ethers.JsonRpcProvider(RPC_URL);
  const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
  const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, wallet);

  // Read Merkle payload safely from the root folder
  const payloadPath = path.join(__dirname, "../batch_payload.json");
  const rawData = fs.readFileSync(payloadPath, "utf8").replace(/^\uFEFF/, "").trim();
  const payload = JSON.parse(rawData);

  // Format arguments for anchorBatch
  const batchId = ethers.id(payload.batch_id);
  console.log("EXACT BATCH ID HASH:", batchId);``
  const merkleRoot = payload.merkle_root; 
  const totalRecords = payload.total_records;

  console.log("Submitting Merkle root to Sepolia...");
  const tx = await contract.anchorBatch(batchId, merkleRoot, totalRecords);
  await tx.wait();

  console.log(`Transaction confirmed! Tx Hash: ${tx.hash}`);
}

main().catch(console.error);