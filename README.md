Low-Cost Lite Blockchain-Based Certificate Generation

A certificate issuing and verification system built around a simple idea: keep the certificate data off-chain, but make its integrity independently verifiable.

The project combines a web interface, a C++ hashing/Merkle-tree engine, and an Ethereum smart contract. Certificates are grouped into batches, a Merkle root is calculated for each batch, and that root is anchored on the Sepolia test network. The verification interface can then check a certificate using its ID, hash, or QR code.

This repository is a prototype.

What it does

There are three main parts to the system:

Faculty portal — issue certificates, choose a certificate template, and manage issued records.

Student portal — view certificates associated with an enrollment number.

Public verification — verify a certificate by ID/hash or scan its QR code.

The cryptographic side works in batches rather than writing every certificate individually to the blockchain. The C++ engine takes the certificate hashes in a batch and produces a Merkle root. The root and batch metadata can then be submitted to the MerkleAnchor contract on Ethereum Sepolia.

This keeps the on-chain record small while still giving the system a cryptographic commitment to the batch.

How the pipeline works

Certificate data
      │
      ▼
SHA-256 hash
      │
      ▼
Batch of certificate hashes
      │
      ▼
C++ Merkle tree
      │
      ▼
Merkle root
      │
      ▼
Ethereum Sepolia
      │
      ▼
MerkleAnchor.sol

Verification follows the reverse path: the application looks up the certificate record, checks its integrity against the stored cryptographic data, and reports whether the credential is authentic, revoked, or appears to have been modified.

Tech stack

Part                                        Technology

Frontend                               HTML, CSS, JavaScript

QR scanning                                html5-qrcode

Hashing                                      SHA-256

Merkle tree                                    C++

JSON handling                             nlohmann/json

Blockchain interaction                      ethers.js

Smart contract                              Solidity

Blockchain network                        Ethereum Sepolia

External data/API layer                  Google Apps Script

Build tooling                                CMake + npm

The Node.js side currently depends on ethers and dotenv. The package scripts expose the intended build, batch-mining, blockchain-anchoring, and full-pipeline commands.

Repository layout

.
├── assets/                     # Logos and frontend assets
├── contracts/                  # Solidity contracts
│   └── MerkleAnchor.sol
├── docs/                       # Project documentation
├── include/                    # C++ headers
├── scripts/                    # Node.js blockchain / pipeline scripts
├── src/                        # C++ SHA-256 and Merkle tree implementation
│   ├── merkle.cpp
│   └── sha256.cpp
├── index.html                  # Main landing page
├── teacher-login.html          # Faculty login
├── teacher-dashboard.html      # Certificate issuing interface
├── student-login.html          # Student login
├── student-dashboard.html      # Student certificate view
├── verify.html                 # Public verification page
├── style.css                   # Shared frontend styles
├── script.js                   # Frontend application logic
├── main.cpp                    # C++ Merkle-tree CLI
├── c_interface.cpp             # C-compatible interface for hashing/Merkle functions
├── batch_payload.json          # Batch input/output payload
├── sample_students.csv         # Sample student data
├── package.json                # Node.js scripts and dependencies
└── CMakeLists.txt              # C++ build configuration

Getting started

Prerequisites

Install:

Node.js 16+ (Node 18+ recommended)

npm

a C++ compiler

CMake

an Ethereum Sepolia RPC endpoint

a funded Sepolia wallet for blockchain writes

Clone the repository:

git clone https://github.com/Imranalam01/Low_Cost_Lite_Blockchain_Based_Certificate_Generation.git
cd Low_Cost_Lite_Blockchain_Based_Certificate_Generation

Install the JavaScript dependencies:

npm install

Environment variables

The blockchain anchoring script expects the private key to be supplied through an environment variable:

PRIVATE_KEY=your_sepolia_wallet_private_key

Keep this value out of source control. Do not use a wallet containing valuable assets for experimentation.

The current anchoring script is configured for Ethereum Sepolia and points at the deployed MerkleAnchor contract used by the project.

Build the C++ component

The intended npm command is:

npm run build:cpp

which runs:

cmake -B build
cmake --build build

The C++ executable reads batch_payload.json by default and outputs the batch ID, Merkle root, and number of records.

You can also provide another JSON payload directly to the executable:

./build/merkle_engine path/to/payload.json

A payload should contain a non-empty records array whose entries contain raw_hash values.

Example:

{
  "batch_id": "batch_001",
  "records": [
    { "raw_hash": "..." },
    { "raw_hash": "..." }
  ]
}

Anchoring a batch

Once the Merkle root has been generated, the Node.js anchoring script reads batch_payload.json and calls the smart contract's anchorBatch function.

npm run anchor:web3

The script hashes the human-readable batch ID with ethers.id(...), submits the Merkle root and record count, and waits for the transaction to be confirmed.

For the complete pipeline:

npm run pipeline:full

That runs:

build C++ → process batch → anchor Merkle root on Sepolia

Frontend

The frontend is currently a collection of static HTML pages rather than a framework-based SPA.

For local development, serve the repository with a simple HTTP server rather than opening the HTML files directly. For example:

python -m http.server 8000

Then open:

http://localhost:8000/

The main entry points are:

/index.html — home page

/teacher-login.html — faculty login

/teacher-dashboard.html — certificate issuance

/student-login.html — student login

/student-dashboard.html — student certificates

/verify.html — public certificate verification

Some application functionality depends on the configured Google Apps Script backend, so a locally served frontend alone is not a complete standalone deployment.

Verification

The public verification page supports:

Certificate ID / enrollment number / hash lookup

QR-code scanning with the device camera

QR-code image upload

Display of certificate metadata

Integrity status

Revocation status

Link to the original certificate PDF when available

The QR scanner is loaded from html5-qrcode.

Smart contract

The repository contains contracts/MerkleAnchor.sol.

The JavaScript anchoring client uses the following contract operations:

anchorBatch(batchId, merkleRoot, totalRecords) — store a batch commitment

getBatch(batchId) — retrieve the stored batch information

verifyProof(proof, root, leaf) — verify a Merkle proof

The project currently targets Ethereum Sepolia for anchoring.

Important notes

This project should be treated as a prototype.

In particular:

The Sepolia private key must never be committed to the repository.

The frontend contains references to external services, including Google Apps Script.

Authentication in the frontend uses browser-side session state and should not be treated as production-grade authentication.

The sample data and current deployment configuration are intended for development/testing.

A blockchain anchor proves the integrity of the data represented by the committed hash; it does not, by itself, prove that the underlying certificate was legitimately issued.

Before using this architecture for real academic credentials, the authentication, authorization, key management, backend validation, certificate storage, revocation model, and deployment configuration should be redesigned and audited.

Team

Developed by Team CodeLEOS.

Contributors:

Imran

Ayush Jha

Kirti Bhardwaj

Tushar

Divya Rishabh

Virenraj

License

NA
