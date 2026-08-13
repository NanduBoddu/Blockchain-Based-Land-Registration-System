# 🏡 Blockchain Based Land Registration System

A decentralized and secure **Land Registration and Boundary Verification System** built using **Algorand Blockchain**, designed to make land records transparent, immutable, verifiable, and resistant to fraudulent modification.

The system provides separate **Public User** and **Government** roles and integrates **Algorand TestNet, Smart Contracts, Pera Wallet, and x402-based payments** to create a complete blockchain-powered land management workflow.

---

## 📌 Project Overview

Traditional land registration systems can face problems such as:

- Fake ownership documents
- Unauthorized modification of land records
- Land encroachment (Kabja)
- Boundary disputes
- Lack of transparency
- Duplicate or fraudulent registrations
- Difficulty verifying ownership history

The **Blockchain Based Land Registration System** addresses these problems by storing important land operations on the **Algorand blockchain**.

Once a transaction is confirmed on-chain, it provides immutable blockchain proof that can be independently verified through the Algorand TestNet explorer.

---

## 🎯 Main Objective

The main objective of this project is to create a secure and transparent digital land registration system where:

- Public users can request land registration.
- Government users can approve and register land.
- Registered land can be verified.
- Land boundaries can be added and verified.
- Ownership can be transferred securely.
- Blockchain transactions provide permanent proof.
- Protected operations can use an x402 payment flow.

---

## ✨ Key Features

### 👤 Public User

Public users can:

- Create an account and sign in
- Connect a Pera Wallet
- Submit land registration requests
- View their land registration requests
- View their registered lands
- Verify land information
- View blockchain proof of registered land
- Request Government access where applicable

### 🏛️ Government User

Authorized Government users can:

- Register new land
- Review public land registration requests
- Approve or reject registration requests
- Verify registered land
- Add land boundaries
- Verify land boundaries
- Transfer land ownership
- View registered public users
- View blockchain transaction activity

Government blockchain operations require an authorized wallet.

---

## ⛓️ Algorand Blockchain Integration

The project uses **Algorand TestNet** for blockchain operations.

Land-related operations are executed through the **LandRegistry smart contract**.

Blockchain integration provides:

- Immutable records
- Transparent transactions
- Tamper resistance
- Verifiable ownership information
- Transaction IDs
- Confirmed blockchain rounds
- Public blockchain proof

Users can view transaction proof using the **AlgoKit Lora TestNet Explorer**.

---

## 🗺️ Boundary Verification

The system provides blockchain-based boundary management for registered land.

Government users can add boundary relationships between land parcels and verify those boundaries.

This creates a verifiable **boundary graph**, which can help identify land relationships and reduce unauthorized boundary manipulation and land encroachment disputes.

---

## 🔄 Ownership Transfer

The system supports secure ownership transfer for registered land.

During ownership transfer:

1. Government selects the Land ID.
2. A new owner's Algorand wallet address is provided.
3. The transaction is signed through the connected wallet.
4. The smart contract updates the current owner.
5. The ownership change is permanently recorded on Algorand.

This provides blockchain proof of the ownership transfer.

---

## 💳 x402 Payment Integration

The project integrates an **x402-style HTTP payment flow** for protected blockchain operations.

The payment flow works as follows:

1. A user starts a protected operation.
2. The application requests payment information from the backend.
3. The backend generates a payment challenge.
4. The payment transaction is processed using Algorand.
5. The backend verifies the payment.
6. The verified payment is consumed for the requested operation.
7. Only after successful payment verification does the protected blockchain operation continue.

This demonstrates how blockchain payments can be combined with HTTP-based application services.

---

## 🔐 Role-Based Security

The application separates access into two major roles:

### Public

Designed primarily for land owners and normal users.

Public users receive access to public registration, verification, land request, and land viewing functionality.

### Government

Designed for authorized officials.

Government users receive access to sensitive blockchain write operations such as:

- Land registration
- Land verification
- Boundary management
- Ownership transfer
- Registration request approval

Government blockchain permissions are validated using the connected Algorand wallet and application authorization logic.

---

## 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │      User / Admin   │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │   React Frontend    │
                 │   Web Application   │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌─────────────────┐         ┌─────────────────┐
     │ Node.js Backend │         │   Pera Wallet   │
     │ REST APIs/x402  │         │ Transaction Sign│
     └────────┬────────┘         └────────┬────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
                 ┌─────────────────────┐
                 │ Algorand Smart      │
                 │ Contract            │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │ Algorand TestNet    │
                 │ Immutable Records   │
                 └─────────────────────┘
```

---

## 🛠️ Technologies Used

| Technology | Purpose |
|---|---|
| **Algorand** | Blockchain network |
| **Algorand TestNet** | Blockchain testing and deployment |
| **AlgoKit** | Algorand development environment |
| **Python** | Smart contract development and blockchain scripts |
| **Algopy / ARC4** | Algorand smart contract implementation |
| **React.js** | Frontend user interface |
| **JavaScript** | Frontend and application logic |
| **Vite** | Frontend development/build tooling |
| **Node.js** | Backend services |
| **Express.js** | REST API backend |
| **Pera Wallet** | Algorand wallet connection and transaction signing |
| **x402** | Payment-protected HTTP operation flow |
| **Git & GitHub** | Version control and source-code hosting |

---

## 🔗 Major Blockchain Operations

The application supports operations such as:

```text
Register Land
     ↓
Verify Land
     ↓
Add Boundary
     ↓
Verify Boundary
     ↓
Transfer Ownership
```

Each supported blockchain write operation generates verifiable transaction information on **Algorand TestNet**.

---

## 🔍 Blockchain Proof

For successful blockchain transactions, the application can display information such as:

```text
Transaction ID
Confirmed Round
Application ID
Network: Algorand TestNet
```

Transaction IDs can be inspected using the Algorand TestNet explorer, providing transparent blockchain proof.

---

## 🚀 Running the Project

### Prerequisites

Install the required development tools:

- Git
- Node.js
- Python
- AlgoKit
- Docker Desktop
- Pera Wallet

Clone the repository:

```bash
git clone https://github.com/NanduBoddu/Blockchain-Based-Land-Registration-System.git
```

Enter the repository:

```bash
cd Blockchain-Based-Land-Registration-System
```

Navigate to the application project:

```bash
cd projects/boundary-graph-dapp
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Backend

Install the backend dependencies according to the package configuration and start the backend service.

Environment files containing credentials or configuration values are intentionally excluded from this repository for security.

---

## 🔒 Security

Sensitive configuration files such as:

```text
.env
.env.local
.env.testnet
```

are excluded from Git version control.

Private keys, wallet mnemonics, authentication secrets, and other sensitive credentials should **never be committed to GitHub**.

---

## 🌟 Advantages

- Transparent land registration
- Immutable blockchain records
- Secure ownership management
- Blockchain-based boundary verification
- Reduced possibility of record tampering
- Publicly verifiable transaction proof
- Role-based Government authorization
- Wallet-based transaction signing
- x402 payment integration
- Decentralized transaction history

---

## 🔮 Future Scope

The project can be further enhanced with:

- GIS and satellite map integration
- GPS-based boundary coordinates
- Digital land document storage
- IPFS integration
- Advanced Government identity verification
- Mobile application support
- Production blockchain deployment
- Automated fraud detection
- Integration with official land-record databases

---

## 👥 Team

**Team Leader:** B. Siva Nandu

**Team Members:**
- A. Sai Raviteja
- G. Aravind

---

## 📚 Project

**Project Name:** Blockchain Based Land Registration System

**Blockchain:** Algorand

**Network:** Algorand TestNet

**Category:** Blockchain / Web3 / Land Management

---

## 📄 Disclaimer

This project is developed as an academic/hackathon prototype. It demonstrates how blockchain technology can be used for secure land registration, boundary verification, ownership management, and payment-protected operations. Production deployment would require integration with legally authorized Government land-record systems and applicable regulatory processes.