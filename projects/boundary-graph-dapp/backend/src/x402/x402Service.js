import crypto
  from "crypto"

import algosdk
  from "algosdk"

import dotenv
  from "dotenv"

import db
  from "../db/database.js"

import {
  getX402Action,
  X402_NETWORK,
} from "./x402Config.js"


dotenv.config()


const INDEXER_SERVER =
  process.env.ALGORAND_INDEXER_SERVER ||
  "https://testnet-idx.algonode.cloud"

const INDEXER_PORT =
  process.env.ALGORAND_INDEXER_PORT ||
  ""

const TREASURY_ADDRESS =
  String(
    process.env.X402_TREASURY_ADDRESS ||
    "",
  ).trim()


const indexerClient =
  new algosdk.Indexer(
    "",
    INDEXER_SERVER,
    INDEXER_PORT,
  )


db.exec(`
  CREATE TABLE IF NOT EXISTS x402_payments (
    payment_id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    resource_id TEXT,
    network TEXT NOT NULL,
    amount_microalgo INTEGER NOT NULL,
    pay_to TEXT NOT NULL,
    payer_address TEXT,
    status TEXT NOT NULL DEFAULT 'Pending',
    payment_tx_id TEXT UNIQUE,
    confirmed_round INTEGER,
    created_at TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    verified_at TEXT,
    consumed_at TEXT,
    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE
  );
`)


function ensureColumn(
  tableName,
  columnName,
  definition,
) {
  const columns =
    db.prepare(
      `PRAGMA table_info(${tableName})`,
    ).all()

  const exists =
    columns.some(
      (column) =>
        column.name ===
        columnName,
    )

  if (
    !exists
  ) {
    db.exec(
      `ALTER TABLE ${tableName}
       ADD COLUMN ${columnName} ${definition}`,
    )
  }
}


ensureColumn(
  "x402_payments",
  "resource_id",
  "TEXT",
)

ensureColumn(
  "x402_payments",
  "consumed_at",
  "TEXT",
)


function formatPayment(
  row,
) {
  if (
    !row
  ) {
    return null
  }

  return {
    paymentId:
      row.payment_id,

    userId:
      row.user_id,

    action:
      row.action,

    resourceId:
      row.resource_id ||
      "",

    network:
      row.network,

    amountMicroAlgo:
      Number(
        row.amount_microalgo ||
        0,
      ),

    payTo:
      row.pay_to,

    payerAddress:
      row.payer_address ||
      "",

    status:
      row.status,

    paymentTxId:
      row.payment_tx_id ||
      "",

    confirmedRound:
      row.confirmed_round ===
        null
        ? null
        : Number(
            row.confirmed_round,
          ),

    createdAt:
      row.created_at,

    expiresAt:
      row.expires_at,

    verifiedAt:
      row.verified_at,

    consumedAt:
      row.consumed_at,
  }
}


function ensureTreasuryAddress() {
  if (
    !TREASURY_ADDRESS
  ) {
    throw new Error(
      "X402 treasury address is not configured.",
    )
  }

  if (
    !algosdk.isValidAddress(
      TREASURY_ADDRESS,
    )
  ) {
    throw new Error(
      "Configured X402 treasury address is invalid.",
    )
  }
}


export function getReusablePayment({
  userId,
  action,
  resourceId,
}) {
  const row =
    db.prepare(`
      SELECT *
      FROM x402_payments
      WHERE
        user_id = ?
        AND action = ?
        AND resource_id = ?
        AND status = 'Verified'
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      userId,
      action,
      resourceId,
    )

  return formatPayment(
    row,
  )
}


export function createPaymentChallenge({
  action,
  userId,
  resourceId,
  payerAddress = "",
}) {
  ensureTreasuryAddress()

  const config =
    getX402Action(
      action,
    )

  if (
    !config
  ) {
    throw new Error(
      "Unsupported x402 action.",
    )
  }

  const cleanUserId =
    String(
      userId ||
      "",
    ).trim()

  const cleanResourceId =
    String(
      resourceId ||
      "",
    ).trim()

  if (
    !cleanUserId
  ) {
    throw new Error(
      "User ID is required.",
    )
  }

  if (
    !cleanResourceId
  ) {
    throw new Error(
      "Resource ID is required.",
    )
  }


  const reusable =
    getReusablePayment({
      userId:
        cleanUserId,

      action:
        config.action,

      resourceId:
        cleanResourceId,
    })

  if (
    reusable
  ) {
    return {
      ...reusable,
      reusable:
        true,
    }
  }


  const pending =
    db.prepare(`
      SELECT *
      FROM x402_payments
      WHERE
        user_id = ?
        AND action = ?
        AND resource_id = ?
        AND status = 'Pending'
        AND expires_at > ?
      ORDER BY created_at DESC
      LIMIT 1
    `).get(
      cleanUserId,
      config.action,
      cleanResourceId,
      new Date()
        .toISOString(),
    )

  if (
    pending
  ) {
    return {
      ...formatPayment(
        pending,
      ),

      reusable:
        true,
    }
  }


  const paymentId =
    crypto.randomUUID()

  const createdAt =
    new Date()
      .toISOString()

  const expiresAt =
    new Date(
      Date.now() +
      5 * 60 * 1000,
    ).toISOString()


  db.prepare(`
    INSERT INTO x402_payments (
      payment_id,
      user_id,
      action,
      resource_id,
      network,
      amount_microalgo,
      pay_to,
      payer_address,
      status,
      created_at,
      expires_at
    )

    VALUES (
      ?, ?, ?, ?, ?, ?, ?, ?,
      'Pending', ?, ?
    )
  `).run(
    paymentId,
    cleanUserId,
    config.action,
    cleanResourceId,
    X402_NETWORK,
    config.amountMicroAlgo,
    TREASURY_ADDRESS,
    String(
      payerAddress ||
      "",
    ).trim(),
    createdAt,
    expiresAt,
  )


  return {
    ...getPaymentChallenge(
      paymentId,
    ),

    reusable:
      false,
  }
}


export function getPaymentChallenge(
  paymentId,
) {
  const row =
    db.prepare(`
      SELECT *
      FROM x402_payments
      WHERE payment_id = ?
    `).get(
      paymentId,
    )

  return formatPayment(
    row,
  )
}


function paymentTxAlreadyUsed(
  paymentTxId,
) {
  return Boolean(
    db.prepare(`
      SELECT payment_id
      FROM x402_payments
      WHERE payment_tx_id = ?
      LIMIT 1
    `).get(
      paymentTxId,
    ),
  )
}


export async function verifyAlgorandPayment({
  paymentId,
  paymentTxId,
}) {
  ensureTreasuryAddress()

  const challenge =
    getPaymentChallenge(
      paymentId,
    )

  if (
    !challenge
  ) {
    throw new Error(
      "Payment challenge was not found.",
    )
  }


  if (
    challenge.status ===
      "Verified"
  ) {
    return challenge
  }


  if (
    challenge.consumedAt
  ) {
    throw new Error(
      "This payment has already been consumed.",
    )
  }


  if (
    new Date(
      challenge.expiresAt,
    ).getTime() <
    Date.now()
  ) {
    throw new Error(
      "Payment challenge has expired.",
    )
  }


  if (
    paymentTxAlreadyUsed(
      paymentTxId,
    )
  ) {
    throw new Error(
      "This payment transaction has already been used.",
    )
  }


  let lookupResult

  try {
    lookupResult =
      await indexerClient
        .lookupTransactionByID(
          paymentTxId,
        )
        .do()
  } catch {
    throw new Error(
      "Payment transaction was not found on Algorand TestNet yet.",
    )
  }


  const transaction =
    lookupResult?.transaction

  if (
    !transaction
  ) {
    throw new Error(
      "Payment transaction was not found.",
    )
  }


  if (
    String(
      transaction.txType ||
      "",
    ) !==
    "pay"
  ) {
    throw new Error(
      "Transaction is not an ALGO payment.",
    )
  }


  const payment =
    transaction
      .paymentTransaction

  if (
    !payment
  ) {
    throw new Error(
      "Payment details are missing.",
    )
  }


  const receiver =
    payment.receiver
      ?.toString?.() ||
    String(
      payment.receiver ||
      "",
    )

  const sender =
    transaction.sender
      ?.toString?.() ||
    String(
      transaction.sender ||
      "",
    )

  const amount =
    Number(
      payment.amount ||
      0,
    )

  const confirmedRound =
    Number(
      transaction.confirmedRound ||
      0,
    )


  if (
    receiver !==
    challenge.payTo
  ) {
    throw new Error(
      "Payment receiver does not match treasury wallet.",
    )
  }


  if (
    amount !==
    challenge.amountMicroAlgo
  ) {
    throw new Error(
      "Incorrect x402 payment amount.",
    )
  }


  if (
    challenge.payerAddress &&
    sender !==
      challenge.payerAddress
  ) {
    throw new Error(
      "Payment sender does not match connected wallet.",
    )
  }


  if (
    confirmedRound <= 0
  ) {
    throw new Error(
      "Payment is not confirmed yet.",
    )
  }


  const verifiedAt =
    new Date()
      .toISOString()


  db.prepare(`
    UPDATE x402_payments
    SET
      status = 'Verified',
      payment_tx_id = ?,
      confirmed_round = ?,
      verified_at = ?
    WHERE payment_id = ?
  `).run(
    paymentTxId,
    confirmedRound,
    verifiedAt,
    paymentId,
  )


  return getPaymentChallenge(
    paymentId,
  )
}


export function consumePayment({
  paymentId,
  action,
  resourceId,
}) {
  const payment =
    getPaymentChallenge(
      paymentId,
    )

  if (
    !payment
  ) {
    throw new Error(
      "Payment was not found.",
    )
  }


  if (
    payment.status !==
    "Verified"
  ) {
    throw new Error(
      "Payment is not verified.",
    )
  }


  if (
    payment.consumedAt
  ) {
    return payment
  }


  if (
    payment.action !==
      action ||
    payment.resourceId !==
      resourceId
  ) {
    throw new Error(
      "Payment does not belong to this action.",
    )
  }


  db.prepare(`
    UPDATE x402_payments
    SET consumed_at = ?
    WHERE payment_id = ?
  `).run(
    new Date()
      .toISOString(),
    paymentId,
  )


  return getPaymentChallenge(
    paymentId,
  )
}