import algosdk from "algosdk"

import {
  ALGORAND_CONFIG,
} from "../config/algorandConfig.js"

import {
  getWalletSession,
} from "./algorandService.js"


const API_BASE =
  "http://localhost:4000/api"


const algodClient =
  new algosdk.Algodv2(
    ALGORAND_CONFIG.token,
    ALGORAND_CONFIG.algodServer,
    ALGORAND_CONFIG.algodPort,
  )


async function readJson(
  response,
) {
  return await response
    .json()
    .catch(
      () => null,
    )
}


/* =========================================================
   CREATE / REUSE X402 CHALLENGE
   ========================================================= */

export async function createX402Challenge({
  action,
  userId,
  resourceId,
}) {
  const wallet =
    getWalletSession()


  if (
    !wallet?.address
  ) {
    throw new Error(
      "Connect your Pera Wallet before making the x402 payment.",
    )
  }


  if (
    !action
  ) {
    throw new Error(
      "x402 action is required.",
    )
  }


  if (
    !userId
  ) {
    throw new Error(
      "Signed-in user ID is required.",
    )
  }


  if (
    !resourceId
  ) {
    throw new Error(
      "x402 resource ID is required.",
    )
  }


  let response


  try {
    response =
      await fetch(
        `${API_BASE}/x402/challenge`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              action,

              userId,

              resourceId,

              payerAddress:
                wallet.address,
            }),
        },
      )
  } catch {
    throw new Error(
      "BoundaryGraph backend is not reachable. Make sure backend is running on port 4000.",
    )
  }


  const data =
    await readJson(
      response,
    )


  /*
   * Backend found an already VERIFIED,
   * unconsumed payment for this exact
   * resource/action.
   *
   * No new Pera payment is needed.
   */

  if (
    response.status === 200 &&
    data?.payment?.status ===
      "Verified"
  ) {
    return {
      ...data.payment,

      alreadyVerified:
        true,
    }
  }


  /*
   * HTTP 402 is EXPECTED when payment
   * is required.
   */

  if (
    response.status !== 402
  ) {
    throw new Error(
      data?.message ||
      "Unable to create x402 payment challenge.",
    )
  }


  if (
    !data?.x402?.paymentId
  ) {
    throw new Error(
      "Backend did not return an x402 payment ID.",
    )
  }


  return {
    ...data.x402,

    alreadyVerified:
      false,
  }
}


/* =========================================================
   SEND REAL ALGO PAYMENT THROUGH PERA
   ========================================================= */

export async function sendX402AlgoPayment({
  challenge,
}) {
  const wallet =
    getWalletSession()


  if (
    !wallet?.address ||
    !wallet?.signer
  ) {
    throw new Error(
      "Connect your Pera Wallet before making the payment.",
    )
  }


  if (
    !challenge?.paymentId
  ) {
    throw new Error(
      "x402 payment ID is missing.",
    )
  }


  if (
    !challenge?.payTo
  ) {
    throw new Error(
      "x402 payment receiver is missing.",
    )
  }


  const amount =
    Number(
      challenge.amountMicroAlgo,
    )


  if (
    !Number.isSafeInteger(
      amount,
    ) ||
    amount <= 0
  ) {
    throw new Error(
      "Invalid x402 payment amount.",
    )
  }


  if (
    !algosdk.isValidAddress(
      challenge.payTo,
    )
  ) {
    throw new Error(
      "Invalid x402 treasury address.",
    )
  }


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  /*
   * Include Payment ID in the transaction
   * note. This gives us a unique on-chain
   * reference for later recovery.
   */

  const note =
    new TextEncoder()
      .encode(
        `BoundaryGraph-x402:${challenge.paymentId}`,
      )


  const paymentTransaction =
    algosdk
      .makePaymentTxnWithSuggestedParamsFromObject({
        sender:
          wallet.address,

        receiver:
          challenge.payTo,

        amount:
          BigInt(
            amount,
          ),

        note,

        suggestedParams,
      })


  const composer =
    new algosdk
      .AtomicTransactionComposer()


  composer.addTransaction({
    txn:
      paymentTransaction,

    signer:
      wallet.signer,
  })


  const result =
    await composer.execute(
      algodClient,
      4,
    )


  const paymentTxId =
    result.txIDs?.[0] ||
    paymentTransaction.txID()


  if (
    !paymentTxId
  ) {
    throw new Error(
      "Unable to obtain x402 payment transaction ID.",
    )
  }


  return {
    paymentTxId,

    confirmedRound:
      Number(
        result.confirmedRound ||
        0,
      ),
  }
}


/* =========================================================
   VERIFY PAYMENT WITH BACKEND
   ========================================================= */

export async function verifyX402Payment({
  paymentId,
  paymentTxId,
}) {
  let response


  try {
    response =
      await fetch(
        `${API_BASE}/x402/verify`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              paymentId,
              paymentTxId,
            }),
        },
      )
  } catch {
    throw new Error(
      "BoundaryGraph backend is not reachable while verifying the payment.",
    )
  }


  const data =
    await readJson(
      response,
    )


  if (
    !response.ok
  ) {
    throw new Error(
      data?.message ||
      "x402 payment verification failed.",
    )
  }


  if (
    data?.payment?.status !==
      "Verified"
  ) {
    throw new Error(
      "Backend did not verify the x402 payment.",
    )
  }


  return data.payment
}


/* =========================================================
   CONSUME VERIFIED PAYMENT

   Call only AFTER the protected blockchain
   action and backend update are successful.
   ========================================================= */

export async function consumeX402Payment({
  paymentId,
  action,
  resourceId,
}) {
  if (
    !paymentId ||
    !action ||
    !resourceId
  ) {
    throw new Error(
      "Payment ID, action and resource ID are required.",
    )
  }


  let response


  try {
    response =
      await fetch(
        `${API_BASE}/x402/consume`,
        {
          method:
            "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body:
            JSON.stringify({
              paymentId,
              action,
              resourceId,
            }),
        },
      )
  } catch {
    throw new Error(
      "BoundaryGraph backend is not reachable while consuming the payment.",
    )
  }


  const data =
    await readJson(
      response,
    )


  if (
    !response.ok
  ) {
    throw new Error(
      data?.message ||
      "Unable to consume x402 payment.",
    )
  }


  return data.payment
}


/* =========================================================
   COMPLETE X402 PAYMENT GATE
   ========================================================= */

export async function executeX402Payment({
  action,
  userId,
  resourceId,
}) {
  if (
    !action
  ) {
    throw new Error(
      "x402 action is required.",
    )
  }


  if (
    !userId
  ) {
    throw new Error(
      "Signed-in user ID is required for x402 payment.",
    )
  }


  if (
    !resourceId
  ) {
    throw new Error(
      "x402 resource ID is required.",
    )
  }


  /*
   * STEP 1
   * Ask backend whether this resource
   * already has a usable payment.
   */

  const challenge =
    await createX402Challenge({
      action,
      userId,
      resourceId,
    })


  /*
   * Already paid and verified earlier.
   *
   * IMPORTANT:
   * No Pera popup.
   * No second payment.
   */

  if (
    challenge.alreadyVerified
  ) {
    return {
      reused:
        true,

      challenge,

      paymentId:
        challenge.paymentId,

      paymentTxId:
        challenge.paymentTxId,

      confirmedRound:
        Number(
          challenge.confirmedRound ||
          0,
        ),

      payment:
        challenge,
    }
  }


  /*
   * STEP 2
   * Real Pera Wallet payment.
   */

  const transaction =
    await sendX402AlgoPayment({
      challenge,
    })


  /*
   * STEP 3
   * Backend verifies TestNet transaction.
   */

  const payment =
    await verifyX402Payment({
      paymentId:
        challenge.paymentId,

      paymentTxId:
        transaction.paymentTxId,
    })


  return {
    reused:
      false,

    challenge,

    paymentId:
      challenge.paymentId,

    paymentTxId:
      transaction.paymentTxId,

    confirmedRound:
      transaction.confirmedRound,

    payment,
  }
}