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


function createUniqueNote(
  prefix,
) {
  return new TextEncoder()
    .encode(
      `${prefix}-${Date.now()}-${Math.random()}`,
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
// GLOBAL STATE HELPERS
// ============================================================

function decodeStateKey(
  value,
) {
  if (
    value instanceof
    Uint8Array
  ) {
    return new TextDecoder()
      .decode(
        value,
      )
  }


  if (
    Array.isArray(
      value,
    )
  ) {
    return new TextDecoder()
      .decode(
        new Uint8Array(
          value,
        ),
      )
  }


  if (
    typeof value ===
    "string"
  ) {
    try {
      const binary =
        atob(
          value,
        )

      const bytes =
        Uint8Array.from(
          binary,
          (char) =>
            char.charCodeAt(0),
        )

      return new TextDecoder()
        .decode(
          bytes,
        )
    } catch {
      return value
    }
  }


  return ""
}


async function getGlobalUint(
  wantedKey,
) {
  const appInfo =
    await algodClient
      .getApplicationByID(
        ALGORAND_CONFIG.appId,
      )
      .do()


  const globalState =
    appInfo?.params?.globalState ||
    appInfo?.params?.[
      "global-state"
    ] ||
    []


  for (
    const item of globalState
  ) {
    const key =
      decodeStateKey(
        item.key,
      )


    if (
      key === wantedKey
    ) {
      return Number(
        item?.value?.uint ??
        0,
      )
    }
  }


  return 0
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
              signedTransactions[
                index
              ],
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
// ADD BOUNDARY
// MODULE 11 GOVERNMENT ACTION
//
// IMPORTANT ABI:
// add_boundary(uint64,uint64,byte[])uint64
// ============================================================

export async function addBoundaryModule11({
  governmentAddress,
  landA,
  landB,
  boundaryHash,
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


  const numericLandA =
    Number(
      landA,
    )


  const numericLandB =
    Number(
      landB,
    )


  if (
    !Number.isInteger(
      numericLandA,
    ) ||
    numericLandA <= 0
  ) {
    throw new Error(
      "Land A must be a valid positive Land ID.",
    )
  }


  if (
    !Number.isInteger(
      numericLandB,
    ) ||
    numericLandB <= 0
  ) {
    throw new Error(
      "Land B must be a valid positive Land ID.",
    )
  }


  if (
    numericLandA ===
    numericLandB
  ) {
    throw new Error(
      "Land A and Land B cannot be the same.",
    )
  }


  const cleanBoundaryHash =
    String(
      boundaryHash ?? "",
    ).trim()


  if (
    !cleanBoundaryHash
  ) {
    throw new Error(
      "Boundary Hash / Survey Reference is required.",
    )
  }


  const totalBoundaries =
    await getGlobalUint(
      "total_boundaries",
    )


  const nextBoundaryId =
    totalBoundaries + 1


  // ----------------------------------------------------------
  // REQUIRED BOX REFERENCES
  // ----------------------------------------------------------

  const governmentBox =
    createGovernmentBoxName(
      governmentAddress,
    )


  const landABox =
    createLandBoxName(
      numericLandA,
    )


  const landBBox =
    createLandBoxName(
      numericLandB,
    )


  const boundaryBox =
    createBoundaryBoxName(
      nextBoundaryId,
    )


  // ----------------------------------------------------------
  // ABI ARGUMENT
  //
  // Contract expects BYTE[], not STRING.
  // ----------------------------------------------------------

  const boundaryHashBytes =
    new TextEncoder()
      .encode(
        cleanBoundaryHash,
      )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "add_boundary",

      args: [
        {
          type:
            "uint64",

          name:
            "land_a",
        },

        {
          type:
            "uint64",

          name:
            "land_b",
        },

        {
          type:
            "byte[]",

          name:
            "boundary_hash",
        },
      ],

      returns: {
        type:
          "uint64",
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
        numericLandA,
      ),

      BigInt(
        numericLandB,
      ),

      boundaryHashBytes,
    ],

    sender:
      governmentAddress,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        `add-boundary-${nextBoundaryId}`,
      ),

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
          landABox,
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          landBBox,
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
      abiResult?.returnValue !==
      undefined
        ? Number(
            abiResult
              .returnValue,
          )
        : nextBoundaryId,

    landA:
      numericLandA,

    landB:
      numericLandB,

    boundaryHash:
      cleanBoundaryHash,

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