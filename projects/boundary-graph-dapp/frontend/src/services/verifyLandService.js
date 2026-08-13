import algosdk from "algosdk"

import {
  ALGORAND_CONFIG,
} from "../config/algorandConfig.js"

import {
  peraWallet,
} from "../components/WalletConnect"


const algodClient =
  new algosdk.Algodv2(
    ALGORAND_CONFIG.token,
    ALGORAND_CONFIG.algodServer,
    ALGORAND_CONFIG.algodPort,
  )


// ============================================================
// BYTE HELPERS
// ============================================================

function concatBytes(
  first,
  second,
) {
  const result =
    new Uint8Array(
      first.length +
      second.length,
    )

  result.set(
    first,
    0,
  )

  result.set(
    second,
    first.length,
  )

  return result
}


function addressPublicKey(
  address,
) {
  return (
    algosdk
      .decodeAddress(
        address,
      )
      .publicKey
  )
}


function uint64Bytes(
  value,
) {
  return algosdk.encodeUint64(
    BigInt(
      value,
    ),
  )
}


// ============================================================
// BOX HELPERS
// ============================================================

function createGovernmentBoxName(
  address,
) {
  return concatBytes(
    new TextEncoder()
      .encode(
        "gov_",
      ),

    addressPublicKey(
      address,
    ),
  )
}


function createLandBoxName(
  landId,
) {
  return concatBytes(
    new TextEncoder()
      .encode(
        "land_",
      ),

    uint64Bytes(
      landId,
    ),
  )
}


// ============================================================
// PERA SIGNER
// ============================================================

function createPeraSigner(
  address,
) {
  return async (
    txnGroup,
    indexesToSign,
  ) => {
    if (
      !Array.isArray(
        indexesToSign,
      ) ||
      indexesToSign.length === 0
    ) {
      return []
    }


    if (
      !peraWallet.isConnected
    ) {
      const accounts =
        await peraWallet
          .reconnectSession()

      if (
        !accounts ||
        accounts.length === 0
      ) {
        throw new Error(
          "Pera Wallet session is not active.",
        )
      }
    }


    const signerTransactions =
      txnGroup.map(
        (
          txn,
          index,
        ) => ({
          txn,

          signers:
            indexesToSign.includes(
              index,
            )
              ? [address]
              : [],
        }),
      )


    const signed =
      await peraWallet
        .signTransaction(
          [
            signerTransactions,
          ],
          address,
        )


    if (
      signed.length ===
      indexesToSign.length
    ) {
      return signed
    }


    if (
      signed.length ===
      txnGroup.length
    ) {
      return indexesToSign
        .map(
          (index) =>
            signed[index],
        )
        .filter(Boolean)
    }


    throw new Error(
      "Pera Wallet signature response mismatch.",
    )
  }
}


// ============================================================
// VERIFY LAND
// ============================================================

export async function verifyLandModule11({
  governmentAddress,
  landId,
}) {
  if (
    !governmentAddress
  ) {
    throw new Error(
      "Connect Government Pera Wallet first.",
    )
  }


  if (
    !algosdk.isValidAddress(
      governmentAddress,
    )
  ) {
    throw new Error(
      "Connected wallet address is invalid.",
    )
  }


  const numericLandId =
    Number(
      landId,
    )


  if (
    !Number.isInteger(
      numericLandId,
    ) ||
    numericLandId <= 0
  ) {
    throw new Error(
      "Land ID must be a positive integer.",
    )
  }


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "verify_land",

      args: [
        {
          type:
            "uint64",

          name:
            "land_id",
        },
      ],

      returns: {
        type:
          "void",
      },
    })


  const governmentBox =
    createGovernmentBoxName(
      governmentAddress,
    )


  const landBox =
    createLandBoxName(
      numericLandId,
    )


  const signer =
    createPeraSigner(
      governmentAddress,
    )


  const composer =
    new algosdk
      .AtomicTransactionComposer()


  composer.addMethodCall({
    appID:
      BigInt(
        ALGORAND_CONFIG.appId,
      ),

    method,

    methodArgs: [
      BigInt(
        numericLandId,
      ),
    ],

    sender:
      governmentAddress,

    signer,

    suggestedParams,

    boxes: [
      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          governmentBox,
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          landBox,
      },
    ],
  })


  const result =
    await composer.execute(
      algodClient,
      4,
    )


  const abiResult =
    result
      .methodResults?.[0]


  return {
    landId:
      numericLandId,

    txId:
      abiResult?.txID ||
      result.txIDs?.[0] ||
      "",

    confirmedRound:
      Number(
        result.confirmedRound,
      ),
  }
}