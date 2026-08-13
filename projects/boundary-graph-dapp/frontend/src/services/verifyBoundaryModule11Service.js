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


function uint64Bytes(
  value,
) {
  return algosdk.encodeUint64(
    BigInt(
      value,
    ),
  )
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


function createBoundaryBoxName(
  boundaryId,
) {
  return concatBytes(
    new TextEncoder()
      .encode(
        "boundary_",
      ),

    uint64Bytes(
      boundaryId,
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
          "Pera Wallet session is not active. Disconnect and reconnect.",
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


    const signedTransactions =
      await peraWallet
        .signTransaction(
          [
            signerTransactions,
          ],
          address,
        )


    if (
      signedTransactions.length ===
      indexesToSign.length
    ) {
      return signedTransactions
    }


    if (
      signedTransactions.length ===
      txnGroup.length
    ) {
      const requested =
        indexesToSign
          .map(
            (index) =>
              signedTransactions[index],
          )
          .filter(Boolean)


      if (
        requested.length ===
        indexesToSign.length
      ) {
        return requested
      }
    }


    throw new Error(
      "Pera Wallet signature response mismatch.",
    )
  }
}


// ============================================================
// VERIFY BOUNDARY
// Module 11 Government action
//
// ABI:
// verify_boundary(uint64)void
// ============================================================

export async function verifyBoundaryModule11({
  governmentAddress,
  boundaryId,
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
      "Connected Government wallet address is invalid.",
    )
  }


  const numericBoundaryId =
    Number(
      boundaryId,
    )


  if (
    !Number.isInteger(
      numericBoundaryId,
    ) ||
    numericBoundaryId <= 0
  ) {
    throw new Error(
      "Boundary ID must be a positive integer.",
    )
  }


  const governmentBox =
    createGovernmentBoxName(
      governmentAddress,
    )


  const boundaryBox =
    createBoundaryBoxName(
      numericBoundaryId,
    )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "verify_boundary",

      args: [
        {
          type:
            "uint64",

          name:
            "boundary_id",
        },
      ],

      returns: {
        type:
          "void",
      },
    })


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
        numericBoundaryId,
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
          boundaryBox,
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
    boundaryId:
      numericBoundaryId,

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