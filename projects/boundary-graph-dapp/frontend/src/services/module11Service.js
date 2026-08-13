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


function bytesToAddress(
  value,
) {
  if (
    !value
  ) {
    return ""
  }

  let bytes

  if (
    value instanceof
    Uint8Array
  ) {
    bytes = value
  } else if (
    Array.isArray(
      value,
    )
  ) {
    bytes =
      new Uint8Array(
        value,
      )
  } else {
    return ""
  }

  if (
    bytes.length !== 32
  ) {
    return ""
  }

  return (
    algosdk.encodeAddress(
      bytes,
    )
  )
}


function createUniqueNote(
  prefix = "BoundaryGraph",
) {
  return (
    new TextEncoder()
      .encode(
        `${prefix}-${Date.now()}-${Math.random()}`,
      )
  )
}


// ============================================================
// BOX NAME HELPERS
// ============================================================

function createGovernmentUserBoxName(
  address,
) {
  const prefix =
    new TextEncoder()
      .encode(
        "gov_",
      )

  return concatBytes(
    prefix,
    addressPublicKey(
      address,
    ),
  )
}


function createWalletRequestBoxName(
  address,
) {
  const prefix =
    new TextEncoder()
      .encode(
        "gov_req_wallet_",
      )

  return concatBytes(
    prefix,
    addressPublicKey(
      address,
    ),
  )
}


function createGovernmentRequestBoxName(
  requestId,
) {
  const prefix =
    new TextEncoder()
      .encode(
        "gov_req_",
      )

  const idBytes =
    algosdk.encodeUint64(
      BigInt(
        requestId,
      ),
    )

  return concatBytes(
    prefix,
    idBytes,
  )
}


// ============================================================
// GET REQUEST ID DIRECTLY FROM WALLET BOX
// ============================================================

async function getWalletRequestId(
  address,
) {
  const boxName =
    createWalletRequestBoxName(
      address,
    )

  try {
    const response =
      await algodClient
        .getApplicationBoxByName(
          ALGORAND_CONFIG.appId,
          boxName,
        )
        .do()

    const value =
      new Uint8Array(
        response.value,
      )

    if (
      value.length !== 8
    ) {
      return 0
    }

    return Number(
      algosdk.decodeUint64(
        value,
        "bigint",
      ),
    )
  } catch (error) {
    const status =
      error?.response?.status ??
      error?.status

    if (
      status === 404
    ) {
      return 0
    }

    throw error
  }
}


// ============================================================
// DIRECT ON-CHAIN READ HELPERS
// These reads do NOT create wallet signing requests.
// ============================================================

async function getApplicationInfo() {
  return (
    await algodClient
      .getApplicationByID(
        ALGORAND_CONFIG.appId,
      )
      .do()
  )
}


function getApplicationCreator(
  appInfo,
) {
  return (
    appInfo?.params?.creator ||
    appInfo?.params?.["creator"] ||
    ""
  )
}


async function getGlobalUint(
  wantedKey,
) {
  const appInfo =
    await getApplicationInfo()

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


async function readBoxBytes(
  boxName,
) {
  const response =
    await algodClient
      .getApplicationBoxByName(
        ALGORAND_CONFIG.appId,
        boxName,
      )
      .do()

  return new Uint8Array(
    response.value,
  )
}


async function readGovernmentRoleBox(
  address,
) {
  try {
    const value =
      await readBoxBytes(
        createGovernmentUserBoxName(
          address,
        ),
      )

    if (
      value.length !== 8
    ) {
      return 0
    }

    return Number(
      algosdk.decodeUint64(
        value,
        "bigint",
      ),
    )
  } catch (error) {
    const status =
      error?.response?.status ??
      error?.status

    if (
      status === 404
    ) {
      return 0
    }

    throw error
  }
}


async function readGovernmentRequestBox(
  requestId,
) {
  const rawValue =
    await readBoxBytes(
      createGovernmentRequestBoxName(
        requestId,
      ),
    )

  const requestType =
    algosdk.ABIType.from(
      "(byte[],uint64)",
    )

  const decoded =
    requestType.decode(
      rawValue,
    )

  const requesterBytes =
    decoded[0]

  const status =
    Number(
      decoded[1],
    )

  return {
    requestId:
      Number(
        requestId,
      ),

    requesterBytes,

    requesterAddress:
      bytesToAddress(
        requesterBytes,
      ),

    status,

    statusText:
      getRequestStatusText(
        status,
      ),
  }
}


// ============================================================
// CHECK GOVERNMENT ROLE
// DIRECT READ - NO PERA SIGNING REQUIRED
// ============================================================

export async function isGovernment({
  address,
}) {
  if (
    !address
  ) {
    throw new Error(
      "Connect Pera Wallet first.",
    )
  }


  const appInfo =
    await getApplicationInfo()


  const creator =
    getApplicationCreator(
      appInfo,
    )


  if (
    creator &&
    creator === address
  ) {
    return 1
  }


  return (
    await readGovernmentRoleBox(
      address,
    )
  )
}


// ============================================================
// PUBLIC -> REQUEST GOVERNMENT ACCESS
// ============================================================

export async function requestGovernmentAccess({
  address,
  signer,
}) {
  if (
    !address ||
    !signer
  ) {
    throw new Error(
      "Connect Pera Wallet first.",
    )
  }


  const existingRequestId =
    await getWalletRequestId(
      address,
    )


  if (
    existingRequestId > 0
  ) {
    throw new Error(
      `Government access request already exists. Request ID: ${existingRequestId}`,
    )
  }


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


  let totalRequests = 0


  for (
    const item of globalState
  ) {
    const key =
      decodeStateKey(
        item.key,
      )

    if (
      key ===
      "total_government_requests"
    ) {
      totalRequests =
        Number(
          item.value.uint ??
            0,
        )
    }
  }


  const nextRequestId =
    totalRequests + 1


  const governmentBox =
    createGovernmentUserBoxName(
      address,
    )


  const requestBox =
    createGovernmentRequestBoxName(
      nextRequestId,
    )


  const walletRequestBox =
    createWalletRequestBoxName(
      address,
    )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "request_government_access",

      args: [],

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

    methodArgs: [],

    sender:
      address,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        "request-government",
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
          requestBox,
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          walletRequestBox,
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
    requestId:
      Number(
        abiResult?.returnValue ??
          nextRequestId,
      ),

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
// PUBLIC -> GET MY GOVERNMENT REQUEST
// DIRECT READ - NO PERA SIGNING REQUIRED
// ============================================================

export async function getMyGovernmentRequest({
  address,
}) {
  if (
    !address
  ) {
    throw new Error(
      "Connect Pera Wallet first.",
    )
  }


  const requestId =
    await getWalletRequestId(
      address,
    )


  if (
    requestId === 0
  ) {
    return {
      requestId: 0,
      status: null,
      statusText:
        "No Request",
    }
  }


  return (
    await readGovernmentRequestBox(
      requestId,
    )
  )
}


// ============================================================
// GOVERNMENT -> GET REQUEST COUNT
// DIRECT READ - NO PERA SIGNING REQUIRED
// ============================================================

export async function getGovernmentRequestCount() {
  return (
    await getGlobalUint(
      "total_government_requests",
    )
  )
}


// ============================================================
// GOVERNMENT -> GET ONE REQUEST
// DIRECT READ - NO PERA SIGNING REQUIRED
// ============================================================

export async function getGovernmentRequest({
  requestId,
}) {
  if (
    !requestId ||
    Number(requestId) <= 0
  ) {
    throw new Error(
      "Invalid Government Request ID.",
    )
  }


  return (
    await readGovernmentRequestBox(
      requestId,
    )
  )
}


// ============================================================
// GOVERNMENT -> LOAD ALL REQUESTS
// DIRECT READ - NO PERA SIGNING REQUIRED
// ============================================================

export async function getAllGovernmentRequests() {
  const count =
    await getGovernmentRequestCount()


  const requests = []


  for (
    let requestId = 1;
    requestId <= count;
    requestId += 1
  ) {
    try {
      const request =
        await readGovernmentRequestBox(
          requestId,
        )

      requests.push(
        request,
      )
    } catch (error) {
      console.error(
        `Unable to read Government Request #${requestId}`,
        error,
      )
    }
  }


  return {
    count,
    requests,
  }
}


// ============================================================
// GOVERNMENT -> APPROVE REQUEST
// ============================================================

export async function approveGovernmentRequest({
  address,
  signer,
  requestId,
  requesterAddress,
}) {
  if (
    !address ||
    !signer
  ) {
    throw new Error(
      "Connect Government Pera Wallet first.",
    )
  }


  if (
    !requestId ||
    Number(requestId) <= 0
  ) {
    throw new Error(
      "Invalid Government Request ID.",
    )
  }


  let finalRequesterAddress =
    requesterAddress


  if (
    !finalRequesterAddress
  ) {
    const request =
      await getGovernmentRequest({
        requestId,
      })

    finalRequesterAddress =
      request.requesterAddress
  }


  if (
    !finalRequesterAddress
  ) {
    throw new Error(
      "Unable to determine requester wallet address.",
    )
  }


  const governmentBox =
    createGovernmentUserBoxName(
      address,
    )


  const requesterGovernmentBox =
    createGovernmentUserBoxName(
      finalRequesterAddress,
    )


  const requestBox =
    createGovernmentRequestBoxName(
      requestId,
    )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "approve_government_request",

      args: [
        {
          type:
            "uint64",
        },
      ],

      returns: {
        type:
          "void",
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
        requestId,
      ),
    ],

    sender:
      address,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        `approve-government-${requestId}`,
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
          requestBox,
      },

      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          requesterGovernmentBox,
      },
    ],
  })


  const result =
    await composer.execute(
      algodClient,
      4,
    )


  return {
    requestId:
      Number(
        requestId,
      ),

    requesterAddress:
      finalRequesterAddress,

    txId:
      result
        .methodResults?.[0]
        ?.txID ||
      result.txIDs?.[0] ||
      "",

    confirmedRound:
      Number(
        result.confirmedRound,
      ),
  }
}


// ============================================================
// GOVERNMENT -> REJECT REQUEST
// ============================================================

export async function rejectGovernmentRequest({
  address,
  signer,
  requestId,
}) {
  if (
    !address ||
    !signer
  ) {
    throw new Error(
      "Connect Government Pera Wallet first.",
    )
  }


  if (
    !requestId ||
    Number(requestId) <= 0
  ) {
    throw new Error(
      "Invalid Government Request ID.",
    )
  }


  const governmentBox =
    createGovernmentUserBoxName(
      address,
    )


  const requestBox =
    createGovernmentRequestBoxName(
      requestId,
    )


  const suggestedParams =
    await algodClient
      .getTransactionParams()
      .do()


  const method =
    new algosdk.ABIMethod({
      name:
        "reject_government_request",

      args: [
        {
          type:
            "uint64",
        },
      ],

      returns: {
        type:
          "void",
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
        requestId,
      ),
    ],

    sender:
      address,

    signer,

    suggestedParams,

    note:
      createUniqueNote(
        `reject-government-${requestId}`,
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
          requestBox,
      },
    ],
  })


  const result =
    await composer.execute(
      algodClient,
      4,
    )


  return {
    requestId:
      Number(
        requestId,
      ),

    txId:
      result
        .methodResults?.[0]
        ?.txID ||
      result.txIDs?.[0] ||
      "",

    confirmedRound:
      Number(
        result.confirmedRound,
      ),
  }
}


// ============================================================
// STATUS HELPER
// ============================================================

export function getRequestStatusText(
  status,
) {
  const numberStatus =
    Number(
      status,
    )

  if (
    numberStatus === 0
  ) {
    return "Pending"
  }

  if (
    numberStatus === 1
  ) {
    return "Approved"
  }

  if (
    numberStatus === 2
  ) {
    return "Rejected"
  }

  return "Unknown"
}


// ============================================================
// MODULE 11 INFO
// ============================================================

export function getModule11AppId() {
  return (
    ALGORAND_CONFIG.appId
  )
}