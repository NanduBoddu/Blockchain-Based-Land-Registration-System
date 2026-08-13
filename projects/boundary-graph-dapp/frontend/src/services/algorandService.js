

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


const indexerClient =
  new algosdk.Indexer(
    "",
    ALGORAND_CONFIG.indexerServer,
    ALGORAND_CONFIG.indexerPort,
  )


let activeWalletAddress = ""

let activeWalletSigner = null


export function setWalletSession({
  address,
  signer,
}) {
  activeWalletAddress =
    address || ""

  activeWalletSigner =
    signer || null
}


/* =========================================================
   PUBLIC WALLET SESSION
   Used by x402 payment service
   ========================================================= */

export function getWalletSession() {
  if (
    !activeWalletAddress ||
    !activeWalletSigner
  ) {
    return null
  }

  return {
    address:
      activeWalletAddress,

    signer:
      activeWalletSigner,
  }
}


/* =========================================================
   INTERNAL WALLET SIGNER
   ========================================================= */

function getWalletSigner() {
  if (
    !activeWalletAddress ||
    !activeWalletSigner
  ) {
    throw new Error(
      "Connect your Pera Wallet on TestNet before submitting a transaction.",
    )
  }

  return {
    address:
      activeWalletAddress,

    signer:
      activeWalletSigner,
  }
}




function decodeBytes(value) {
  if (
    value instanceof
    Uint8Array
  ) {
    return new TextDecoder()
      .decode(value)
  }

  if (
    typeof value ===
    "string"
  ) {
    const binary =
      atob(value)

    const bytes =
      Uint8Array.from(
        binary,
        (char) =>
          char.charCodeAt(0),
      )

    return new TextDecoder()
      .decode(bytes)
  }

  return ""
}


function createBoxName(
  prefixText,
  id,
) {
  const prefix =
    new TextEncoder()
      .encode(prefixText)

  const idBytes =
    algosdk.encodeUint64(
      BigInt(id),
    )

  const boxName =
    new Uint8Array(
      prefix.length +
        idBytes.length,
    )

  boxName.set(
    prefix,
    0,
  )

  boxName.set(
    idBytes,
    prefix.length,
  )

  return boxName
}


function createLandBoxName(
  landId,
) {
  return createBoxName(
    "land_",
    landId,
  )
}


function createBoundaryBoxName(
  boundaryId,
) {
  return createBoxName(
    "boundary_",
    boundaryId,
  )
}


export async function getNetworkStatus() {
  const status =
    await algodClient
      .status()
      .do()

  return {
    network:
      ALGORAND_CONFIG.network,

    lastRound:
      Number(
        status.lastRound,
      ),

    connected: true,
  }
}


export async function getApplicationInfo() {
  return await algodClient
    .getApplicationByID(
      ALGORAND_CONFIG.appId,
    )
    .do()
}


export async function getGlobalState() {
  const appInfo =
    await getApplicationInfo()

  const globalState =
    appInfo.params?.globalState ||
    appInfo.params?.[
      "global-state"
    ] ||
    []

  const decodedState = {}

  for (
    const item of globalState
  ) {
    const key =
      decodeBytes(
        item.key,
      )

    if (
      item.value.type === 2
    ) {
      decodedState[key] =
        Number(
          item.value.uint,
        )
    } else if (
      item.value.type === 1
    ) {
      decodedState[key] =
        decodeBytes(
          item.value.bytes,
        )
    }
  }

  return decodedState
}


export async function getLand(
  landId,
) {
  const boxName =
    createLandBoxName(
      landId,
    )

  const response =
    await algodClient
      .getApplicationBoxByName(
        ALGORAND_CONFIG.appId,
        boxName,
      )
      .do()

  const landType =
    algosdk.ABIType.from(
      "(string,uint64,byte[],uint64)",
    )

  const decoded =
    landType.decode(
      response.value,
    )

  const [
    surveyNumber,
    extent,
    ownerBytes,
    verificationStatus,
  ] = decoded

  let ownerAddress = ""

  try {
    ownerAddress =
      algosdk.encodeAddress(
        new Uint8Array(
          ownerBytes,
        ),
      )
  } catch {
    ownerAddress =
      "Unable to decode owner"
  }

  return {
    landId:
      Number(landId),

    surveyNumber,

    extent:
      Number(extent),

    ownerAddress,

    verificationStatus:
      Number(
        verificationStatus,
      ),
  }
}


export async function getAllLands() {
  const globalState =
    await getGlobalState()

  const totalLands =
    Number(
      globalState
        .total_lands ?? 0,
    )

  const lands = []

  for (
    let landId = 1;
    landId <= totalLands;
    landId++
  ) {
    try {
      const land =
        await getLand(
          landId,
        )

      lands.push(
        land,
      )
    } catch (error) {
      console.error(
        `Unable to load land ${landId}`,
        error,
      )
    }
  }

  return lands
}


export async function getBoundary(
  boundaryId,
) {
  const boxName =
    createBoundaryBoxName(
      boundaryId,
    )

  const response =
    await algodClient
      .getApplicationBoxByName(
        ALGORAND_CONFIG.appId,
        boxName,
      )
      .do()

  const boundaryType =
    algosdk.ABIType.from(
      "(uint64,uint64,byte[],uint64)",
    )

  const decoded =
    boundaryType.decode(
      response.value,
    )

  const [
    landA,
    landB,
    boundaryHashBytes,
    verificationStatus,
  ] = decoded

  let boundaryHash = ""

  try {
    boundaryHash =
      new TextDecoder()
        .decode(
          new Uint8Array(
            boundaryHashBytes,
          ),
        )
  } catch {
    boundaryHash =
      "Unable to decode hash"
  }

  return {
    boundaryId:
      Number(
        boundaryId,
      ),

    landA:
      Number(landA),

    landB:
      Number(landB),

    boundaryHash,

    verificationStatus:
      Number(
        verificationStatus,
      ),
  }
}


export async function getAllBoundaries() {
  const globalState =
    await getGlobalState()

  const totalBoundaries =
    Number(
      globalState
        .total_boundaries ??
        0,
    )

  const boundaries = []

  for (
    let boundaryId = 1;
    boundaryId <=
      totalBoundaries;
    boundaryId++
  ) {
    try {
      const boundary =
        await getBoundary(
          boundaryId,
        )

      boundaries.push(
        boundary,
      )
    } catch (error) {
      console.error(
        `Unable to load boundary ${boundaryId}`,
        error,
      )
    }
  }

  return boundaries
}


export async function getBoundaryGraphData() {
  const [
    lands,
    boundaries,
  ] = await Promise.all([
    getAllLands(),
    getAllBoundaries(),
  ])

  return {
    lands,
    boundaries,
  }
}


export async function getRecentActivity() {
  const methods = [
    new algosdk.ABIMethod({
      name:
        "register_land",

      args: [
        { type: "string" },
        { type: "uint64" },
        { type: "byte[]" },
      ],

      returns: {
        type: "uint64",
      },
    }),

    new algosdk.ABIMethod({
      name:
        "verify_land",

      args: [
        { type: "uint64" },
      ],

      returns: {
        type: "void",
      },
    }),

    new algosdk.ABIMethod({
      name:
        "add_boundary",

      args: [
        { type: "uint64" },
        { type: "uint64" },
        { type: "byte[]" },
      ],

      returns: {
        type: "uint64",
      },
    }),

    new algosdk.ABIMethod({
      name:
        "verify_boundary",

      args: [
        { type: "uint64" },
      ],

      returns: {
        type: "void",
      },
    }),
  ]

  const selectorMap =
    new Map(
      methods.map(
        (method) => [
          Array.from(
            method.getSelector(),
          ).join(","),

          method.name,
        ],
      ),
    )

  const response =
    await indexerClient
      .searchForTransactions()
      .applicationID(
        ALGORAND_CONFIG.appId,
      )
      .limit(100)
      .do()

  return response.transactions
    .map((tx) => {
      const args =
        tx
          .applicationTransaction
          ?.applicationArgs ||
        []

      let methodName =
        "unknown"

      if (
        args.length > 0
      ) {
        const key =
          Array.from(
            args[0],
          ).join(",")

        methodName =
          selectorMap.get(
            key,
          ) ||
          "unknown"
      }

      return {
        txId:
          tx.id,

        round:
          Number(
            tx.confirmedRound,
          ),

        method:
          methodName,
      }
    })
    .filter(
      (activity) =>
        activity.method !==
        "unknown",
    )
    .sort(
      (a, b) =>
        b.round -
        a.round,
    )
    .slice(
      0,
      10,
    )
}


export async function registerLand({
  surveyNumber,
  extent,
  ownerAddress,
}) {
  if (
    !surveyNumber.trim()
  ) {
    throw new Error(
      "Survey number is required",
    )
  }

  const numericExtent =
    Number(extent)

  if (
    !Number.isInteger(
      numericExtent,
    ) ||
    numericExtent <= 0
  ) {
    throw new Error(
      "Extent must be a positive integer",
    )
  }

  if (
    !algosdk.isValidAddress(
      ownerAddress,
    )
  ) {
    throw new Error(
      "Invalid Algorand owner address",
    )
  }

  const {
    address,
    signer,
  } = getWalletSigner()

  const globalState =
    await getGlobalState()

  const nextLandId =
    Number(
      globalState
        .total_lands ?? 0,
    ) + 1

  const boxName =
  createLandBoxName(
    nextLandId,
  )

const governmentPrefix =
  new TextEncoder()
    .encode(
      "gov_",
    )

const governmentPublicKey =
  algosdk.decodeAddress(
    address,
  ).publicKey

const governmentUserBox =
  new Uint8Array(
    governmentPrefix.length +
    governmentPublicKey.length,
  )

governmentUserBox.set(
  governmentPrefix,
  0,
)

governmentUserBox.set(
  governmentPublicKey,
  governmentPrefix.length,
)

const ownerPublicKey =
    algosdk.decodeAddress(
      ownerAddress,
    ).publicKey

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
          type: "string",
          name:
            "survey_number",
        },
        {
          type: "uint64",
          name: "extent",
        },
        {
          type: "byte[]",
          name: "owner",
        },
      ],

      returns: {
        type: "uint64",
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
      surveyNumber.trim(),

      BigInt(
        numericExtent,
      ),

      ownerPublicKey,
    ],

    sender:
      address,

    signer,

    suggestedParams,

    boxes: [
  {
    appIndex:
      BigInt(
        ALGORAND_CONFIG.appId,
      ),

    name:
      governmentUserBox,
  },

  {
    appIndex:
      BigInt(
        ALGORAND_CONFIG.appId,
      ),

    name:
      boxName,
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
    txId:
      abiResult?.txID ||
      result.txIDs?.[0] ||
      "",

    landId:
      abiResult?.returnValue !==
      undefined
        ? Number(
            abiResult
              .returnValue,
          )
        : nextLandId,

    confirmedRound:
      Number(
        result
          .confirmedRound,
      ),
  }
}


export async function verifyLand(
  landId,
) {
  const numericLandId =
    Number(landId)

  if (
    !Number.isInteger(
      numericLandId,
    ) ||
    numericLandId <= 0
  ) {
    throw new Error(
      "Land ID must be a positive integer",
    )
  }

  const globalState =
    await getGlobalState()

  const totalLands =
    Number(
      globalState
        .total_lands ?? 0,
    )

  if (
    numericLandId >
    totalLands
  ) {
    throw new Error(
      `Land #${numericLandId} does not exist`,
    )
  }

  const currentLand =
    await getLand(
      numericLandId,
    )

  if (
    currentLand
      .verificationStatus === 2
  ) {
    throw new Error(
      `Land #${numericLandId} is already verified`,
    )
  }

  const {
    address,
    signer,
  } = getWalletSigner()

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
          type: "uint64",
          name: "land_id",
        },
      ],

      returns: {
        type: "void",
      },
    })

  const boxName =
    createLandBoxName(
      numericLandId,
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
      address,

    signer,

    suggestedParams,

    boxes: [
      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          boxName,
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

  const updatedLand =
    await getLand(
      numericLandId,
    )

  return {
    txId:
      abiResult?.txID ||
      result.txIDs?.[0] ||
      "",

    confirmedRound:
      Number(
        result
          .confirmedRound,
      ),

    land:
      updatedLand,
  }
}


export async function addBoundary({
  landA,
  landB,
  boundaryHash,
}) {
  const numericLandA =
    Number(landA)

  const numericLandB =
    Number(landB)

  if (
    !Number.isInteger(
      numericLandA,
    ) ||
    numericLandA <= 0
  ) {
    throw new Error(
      "Land A must be a valid positive Land ID",
    )
  }

  if (
    !Number.isInteger(
      numericLandB,
    ) ||
    numericLandB <= 0
  ) {
    throw new Error(
      "Land B must be a valid positive Land ID",
    )
  }

  if (
    numericLandA ===
    numericLandB
  ) {
    throw new Error(
      "Land cannot be its own neighbor",
    )
  }

  if (
    !boundaryHash.trim()
  ) {
    throw new Error(
      "Boundary hash is required",
    )
  }

  const globalState =
    await getGlobalState()

  const totalLands =
    Number(
      globalState
        .total_lands ?? 0,
    )

  if (
    numericLandA >
      totalLands ||
    numericLandB >
      totalLands
  ) {
    throw new Error(
      `Land IDs must be between 1 and ${totalLands}`,
    )
  }

  await Promise.all([
    getLand(
      numericLandA,
    ),
    getLand(
      numericLandB,
    ),
  ])

  const nextBoundaryId =
    Number(
      globalState
        .total_boundaries ??
        0,
    ) + 1

  const boundaryBoxName =
    createBoundaryBoxName(
      nextBoundaryId,
    )

  const {
    address,
    signer,
  } = getWalletSigner()

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
          type: "uint64",
          name: "land_a",
        },
        {
          type: "uint64",
          name: "land_b",
        },
        {
          type: "byte[]",
          name:
            "boundary_hash",
        },
      ],

      returns: {
        type: "uint64",
      },
    })

  const hashBytes =
    new TextEncoder()
      .encode(
        boundaryHash.trim(),
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

      hashBytes,
    ],

    sender:
      address,

    signer,

    suggestedParams,

    boxes: [
      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          boundaryBoxName,
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

  const createdBoundary =
    await getBoundary(
      nextBoundaryId,
    )

  return {
    txId:
      abiResult?.txID ||
      result.txIDs?.[0] ||
      "",

    boundaryId:
      abiResult?.returnValue !==
      undefined
        ? Number(
            abiResult
              .returnValue,
          )
        : nextBoundaryId,

    confirmedRound:
      Number(
        result
          .confirmedRound,
      ),

    boundary:
      createdBoundary,
  }
}


export async function verifyBoundary(
  boundaryId,
) {
  const numericBoundaryId =
    Number(boundaryId)

  if (
    !Number.isInteger(
      numericBoundaryId,
    ) ||
    numericBoundaryId <= 0
  ) {
    throw new Error(
      "Boundary ID must be a positive integer",
    )
  }

  const globalState =
    await getGlobalState()

  const totalBoundaries =
    Number(
      globalState
        .total_boundaries ??
        0,
    )

  if (
    numericBoundaryId >
    totalBoundaries
  ) {
    throw new Error(
      `Boundary #${numericBoundaryId} does not exist`,
    )
  }

  const currentBoundary =
    await getBoundary(
      numericBoundaryId,
    )

  if (
    currentBoundary
      .verificationStatus === 2
  ) {
    throw new Error(
      `Boundary #${numericBoundaryId} is already verified`,
    )
  }

  const {
    address,
    signer,
  } = getWalletSigner()

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
          type: "uint64",
          name:
            "boundary_id",
        },
      ],

      returns: {
        type: "void",
      },
    })

  const boxName =
    createBoundaryBoxName(
      numericBoundaryId,
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
      address,

    signer,

    suggestedParams,

    boxes: [
      {
        appIndex:
          BigInt(
            ALGORAND_CONFIG.appId,
          ),

        name:
          boxName,
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

  const updatedBoundary =
    await getBoundary(
      numericBoundaryId,
    )

  return {
    txId:
      abiResult?.txID ||
      result.txIDs?.[0] ||
      "",

    confirmedRound:
      Number(
        result
          .confirmedRound,
      ),

    boundary:
      updatedBoundary,
  }
}

export function getAlgodClient() {
  return algodClient
}


export function getAppId() {
  return ALGORAND_CONFIG.appId
}
