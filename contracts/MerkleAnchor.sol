// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title MerkleAnchor
 * @dev Stores Merkle Roots on-chain for batch data integrity verification.
 */
contract MerkleAnchor {
    address public owner;

    struct BatchRecord {
        bytes32 merkleRoot;
        uint256 timestamp;
        uint256 totalRecords;
    }

    mapping(bytes32 => BatchRecord) public batchRecords;

    event MerkleRootAnchored(
        bytes32 indexed batchId,
        bytes32 indexed merkleRoot,
        uint256 totalRecords,
        uint256 timestamp
    );

    modifier onlyOwner() {
        require(msg.sender == owner, "MerkleAnchor: caller is not the owner");
        _;
    }

    constructor() {
        owner = msg.sender;
    }

    function anchorBatch(
        bytes32 batchId,
        bytes32 merkleRoot,
        uint256 totalRecords
    ) external onlyOwner {
        require(batchRecords[batchId].timestamp == 0, "MerkleAnchor: Batch ID already exists");
        require(merkleRoot != bytes32(0), "MerkleAnchor: Invalid Merkle Root");

        batchRecords[batchId] = BatchRecord({
            merkleRoot: merkleRoot,
            timestamp: block.timestamp,
            totalRecords: totalRecords
        });

        emit MerkleRootAnchored(batchId, merkleRoot, totalRecords, block.timestamp);
    }

    function getBatch(bytes32 batchId) external view returns (bytes32 merkleRoot, uint256 timestamp, uint256 totalRecords) {
        BatchRecord memory record = batchRecords[batchId];
        require(record.timestamp > 0, "MerkleAnchor: Batch ID not found");
        return (record.merkleRoot, record.timestamp, record.totalRecords);
    }

    function verifyProof(
        bytes32[] calldata proof,
        bytes32 root,
        bytes32 leaf
    ) public pure returns (bool) {
        bytes32 computedHash = leaf;

        for (uint256 i = 0; i < proof.length; i++) {
            bytes32 proofElement = proof[i];
            if (computedHash <= proofElement) {
                computedHash = keccak256(abi.encodePacked(computedHash, proofElement));
            } else {
                computedHash = keccak256(abi.encodePacked(proofElement, computedHash));
            }
        }
        return computedHash == root;
    }
}