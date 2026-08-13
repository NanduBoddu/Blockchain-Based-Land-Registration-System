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
// GLOBAL STATE
// ============================================================

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
      const requested =
        indexesToSign
          .map(
            (index) =>
              signed[index],
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
// REGISTER LAND
// ============================================================

export async function registerLandModule11({
  governmentAddress,
  surveyNumber,
  extent,
  ownerAddress,
}) {
  if (
    !governmentAddress
  ) {
    throw new Error(
      "Connect Government Pera Wallet first.",
    )
  }


  const cleanSurvey =
    String(
      surveyNumber ?? "",
    ).trim()


  if (
    !cleanSurvey
  ) {
    throw new Error(
      "Survey number is required.",
    )
  }


  const numericExtent =
    Number(
      extent,
    )


  if (
    !Number.isInteger(
      numericExtent,
    ) ||
    numericExtent <= 0
  ) {
    throw new Error(
      "Land extent must be a positive integer.",
    )
  }


  const cleanOwner =
    String(
      ownerAddress ?? "",
    ).trim()


  if (
    !algosdk.isValidAddress(
      cleanOwner,
    )
  ) {
    throw new Error(
      "Please enter a valid Algorand owner address.",
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


  const totalLands =
    await getGlobalUint(
      "total_lands",
    )


  const nextLandId =
    totalLands + 1


  const governmentBox =
    createGovernmentBoxName(
      governmentAddress,
    )


  const landBox =
    createLandBoxName(
      nextLandId,
    )


  const transferCountBox =
    createLandTransferCountBoxName(
      nextLandId,
    )


  const ownerPublicKey =
    addressPublicKey(
      cleanOwner,
    )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "register_land",

      args: [
        {
          type:
            "string",

          name:
            "survey_number",
        },

        {
          type:
            "uint64",

          name:
            "extent",
        },

        {
          type:
            "byte[]",

          name:
            "owner",
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
      cleanSurvey,

      BigInt(
        numericExtent,
      ),

      ownerPublicKey,
    ],

    sender:
      governmentAddress,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        `register-land-${nextLandId}`,
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
          landBox,
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          transferCountBox,
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
      abiResult?.returnValue !==
      undefined
        ? Number(
            abiResult
              .returnValue,
          )
        : nextLandId,

    surveyNumber:
      cleanSurvey,

    extent:
      numericExtent,

    ownerAddress:
      cleanOwner,

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