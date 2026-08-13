import algosdk from "algosdk"

import {
  ALGORAND_CONFIG,
} from "../config/algorandConfig.js"


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


function decodeStateKey(
  value,
) {
  if (
    value instanceof Uint8Array
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
    typeof value === "string"
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


function createUniqueNote(
  prefix,
) {
  return new TextEncoder()
    .encode(
      `${prefix}-${Date.now()}-${Math.random()}`,
    )
}


// ============================================================
// BOX NAME HELPERS
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


function createTransferBoxName(
  transferId,
) {
  return concatBytes(
    new TextEncoder()
      .encode(
        "transfer_",
      ),

    uint64Bytes(
      transferId,
    ),
  )
}


function createLandTransferCountBoxName(
  landId,
) {
  return concatBytes(
    new TextEncoder()
      .encode(
        "land_transfer_count_",
      ),

    uint64Bytes(
      landId,
    ),
  )
}


// ============================================================
// GLOBAL UINT READ
// ============================================================

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
    appInfo.params?.globalState ||
    appInfo.params?.[
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
        item.value?.uint ??
          0,
      )
    }
  }

  return 0
}


// ============================================================
// VALIDATE LAND EXISTS
// ============================================================

export async function landExists(
  landId,
) {
  if (
    !landId ||
    Number(
      landId,
    ) <= 0
  ) {
    return false
  }

  try {
    await algodClient
      .getApplicationBoxByName(
        ALGORAND_CONFIG.appId,
        createLandBoxName(
          landId,
        ),
      )
      .do()

    return true
  } catch (error) {
    const status =
      error?.response?.status ??
      error?.status

    if (
      status === 404
    ) {
      return false
    }

    throw error
  }
}


// ============================================================
// TRANSFER OWNERSHIP
// GOVERNMENT ONLY
// ============================================================

export async function transferOwnership({
  address,
  signer,
  landId,
  newOwnerAddress,
}) {
  if (
    !address ||
    !signer
  ) {
    throw new Error(
      "Connect Government Pera Wallet first.",
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
      "Enter a valid Land ID.",
    )
  }


  if (
    !newOwnerAddress
  ) {
    throw new Error(
      "Enter the new owner wallet address.",
    )
  }


  if (
    !algosdk.isValidAddress(
      newOwnerAddress,
    )
  ) {
    throw new Error(
      "New owner Algorand wallet address is invalid.",
    )
  }


  if (
    address ===
    newOwnerAddress
  ) {
    throw new Error(
      "New owner wallet must be different from the connected Government wallet.",
    )
  }


  const exists =
    await landExists(
      numericLandId,
    )


  if (
    !exists
  ) {
    throw new Error(
      `Land #${numericLandId} does not exist.`,
    )
  }


  const totalTransfers =
    await getGlobalUint(
      "total_transfers",
    )


  const nextTransferId =
    totalTransfers + 1


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "transfer_ownership",

      args: [
        {
          type:
            "uint64",
        },

        {
          type:
            "byte[]",
        },
      ],

      returns: {
        type:
          "uint64",
      },
    })


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

      addressPublicKey(
        newOwnerAddress,
      ),
    ],

    sender:
      address,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        `transfer-land-${numericLandId}`,
      ),

    boxes: [
      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          createGovernmentBoxName(
            address,
          ),
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          createLandBoxName(
            numericLandId,
          ),
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          createTransferBoxName(
            nextTransferId,
          ),
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          createLandTransferCountBoxName(
            numericLandId,
          ),
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


  const returnedTransferId =
    Number(
      abiResult?.returnValue ??
        nextTransferId,
    )


  return {
    transferId:
      returnedTransferId,

    landId:
      numericLandId,

    newOwnerAddress,

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


// ============================================================
// SERVICE INFO
// ============================================================

export function getOwnershipAppId() {
  return ALGORAND_CONFIG.appId
}