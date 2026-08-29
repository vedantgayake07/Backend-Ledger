# Ledger Backend

A backend API for managing users, accounts, and financial transactions using Node.js, Express.js, MongoDB, and Mongoose.

This project focuses on backend fundamentals such as authentication, account management, transaction processing, ledger entries, and idempotency.

## Features

* User registration and authentication
* JWT-based authentication
* Account creation and management
* Account status validation
* Balance checking
* Account-to-account transactions
* Double-entry ledger system
* Debit and credit ledger entries
* Transaction status management
* Idempotency key support to prevent duplicate transactions
* Initial funds functionality
* MongoDB and Mongoose integration
* Centralized error handling

## Transaction Flow

A transaction follows this basic flow:

```text
Client Request
      ↓
Validate Request
      ↓
Validate Accounts
      ↓
Check Account Status
      ↓
Check Balance
      ↓
Create Transaction
      ↓
Create DEBIT Ledger Entry
      ↓
Create CREDIT Ledger Entry
      ↓
Mark Transaction COMPLETED
      ↓
Send Response
```

## Double-Entry Ledger

Each transaction creates two ledger entries:

* **DEBIT** → amount is deducted from the sender's account
* **CREDIT** → amount is added to the receiver's account

For example:

```text
Account A
   DEBIT  → ₹500

Account B
   CREDIT → ₹500
```

This keeps a record of both sides of a transaction.

## Idempotency

The API uses an `idempotencyKey` to prevent the same transaction request from being processed multiple times.

If a request with the same idempotency key has already been completed, the existing transaction is returned instead of creating another transaction.

Example:

```json
{
  "fromAccount": "ACCOUNT_ID",
  "toAccount": "ACCOUNT_ID",
  "amount": 500,
  "idempotencyKey": "unique-payment-key-001"
}
```

## Tech Stack

* **Node.js** — JavaScript runtime
* **Express.js** — Web framework
* **MongoDB** — Database
* **Mongoose** — MongoDB ODM
* **JWT** — Authentication
* **bcrypt** — Password hashing

## Project Structure

```text
ledger-backend/
│
├── controllers/
│   ├── user.controller.js
│   ├── account.controller.js
│   └── transaction.controller.js
│
├── models/
│   ├── user.model.js
│   ├── account.model.js
│   ├── transaction.model.js
│   └── ledger.model.js
│
├── routes/
│   ├── user.routes.js
│   ├── account.routes.js
│   └── transaction.routes.js
│
├── middleware/
│   └── auth.middleware.js
│
├── config/
│   └── db.js
│
├── app.js
├── server.js
├── package.json
└── .env
```

> The exact folder structure may vary depending on the implementation.

## Installation

Clone the repository:

```bash
git clone <your-repository-url>
```

Navigate into the project:

```bash
cd ledger-backend
```

Install dependencies:

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory:

```env
PORT=3000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
```

Do not commit your `.env` file to GitHub.

Add it to `.gitignore`:

```text
.env
node_modules/
```

## Running the Project

Start the development server:

```bash
npm run dev
```

Or start normally:

```bash
npm start
```

The API will be available at:

```text
http://localhost:3000
```

## API Overview

### Authentication

| Method | Endpoint             | Description         |
| ------ | -------------------- | ------------------- |
| POST   | `/api/auth/register` | Register a new user |
| POST   | `/api/auth/login`    | Login user          |

### Accounts

| Method | Endpoint        | Description         |
| ------ | --------------- | ------------------- |
| POST   | `/api/accounts` | Create an account   |
| GET    | `/api/accounts` | Get account details |

### Transactions

| Method | Endpoint                          | Description          |
| ------ | --------------------------------- | -------------------- |
| POST   | `/api/transactions`               | Create a transaction |
| POST   | `/api/transactions/initial-funds` | Add initial funds    |

> Update the endpoints above if your actual routes use different paths.

## Example Transaction Request

```http
POST /api/transactions
```

```json
{
  "fromAccount": "FROM_ACCOUNT_ID",
  "toAccount": "TO_ACCOUNT_ID",
  "amount": 500,
  "idempotencyKey": "transaction-001"
}
```

## Transaction Status

Transactions can have different states:

```text
PENDING
COMPLETED
FAILED
REVERSED
```

A successful transaction follows:

```text
PENDING → COMPLETED
```

## Purpose

This project was built as a backend practice/revision project to understand:

* REST API development
* Express.js controllers and routes
* MongoDB database operations
* Mongoose models
* JWT authentication
* Account and transaction management
* Ledger-based financial records
* Idempotency
* Error handling
* Backend project structure

