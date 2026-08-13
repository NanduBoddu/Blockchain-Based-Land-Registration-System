import algosdk from "algosdk"

import {
  ALGORAND_CONFIG,
} from "../config/algorandConfig.js"

import {
  getAllLands,
  getAllBoundaries,
} from "./algorandService"


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


function bytesToAddress(
  value,
) {
  try {
    const bytes =
      value instanceof Uint8Array
        ? value
        : new Uint8Array(
            value,
          )

    if (
      bytes.length !== 32
    ) {
      return ""
    }

    return algosdk.encodeAddress(
      bytes,
    )
  } catch {
    return ""
  }
}


// ============================================================
// BOX HELPERS
// ============================================================

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
          (
            char,
          ) =>
            char.charCodeAt(
              0,
            ),
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
// READ TRANSFER BOX
//
// Contract TransferRecord:
//
// land_id
// previous_owner
// new_owner
//
// ABI representation:
// (uint64,byte[],byte[])
// ============================================================

async function readTransferRecord(
  transferId,
) {
  try {
    const response =
      await algodClient
        .getApplicationBoxByName(
          ALGORAND_CONFIG.appId,
          createTransferBoxName(
            transferId,
          ),
        )
        .do()


    const transferType =
      algosdk.ABIType.from(
        "(uint64,byte[],byte[])",
      )


    const decoded =
      transferType.decode(
        response.value,
      )


    const [
      landId,
      previousOwnerBytes,
      newOwnerBytes,
    ] = decoded


    return {
      transferId:
        Number(
          transferId,
        ),

      landId:
        Number(
          landId,
        ),

      previousOwner:
        bytesToAddress(
          previousOwnerBytes,
        ),

      newOwner:
        bytesToAddress(
          newOwnerBytes,
        ),
    }
  } catch (error) {
    console.error(
      `Unable to read transfer #${transferId}`,
      error,
    )

    return null
  }
}


// ============================================================
// GET OWNERSHIP HISTORY
// ============================================================

export async function getLandOwnershipHistory(
  landId,
) {
  const numericLandId =
    Number(
      landId,
    )


  const totalTransfers =
    await getGlobalUint(
      "total_transfers",
    )


  const history = []


  for (
    let transferId = 1;
    transferId <=
      totalTransfers;
    transferId += 1
  ) {
    const record =
      await readTransferRecord(
        transferId,
      )


    if (
      record &&
      record.landId ===
        numericLandId
    ) {
      history.push(
        record,
      )
    }
  }


  return history
}


// ============================================================
// SEARCH LAND BY ID
// ============================================================

export async function searchLandById(
  landId,
) {
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


  const lands =
    await getAllLands()


  const land =
    lands.find(
      (
        item,
      ) =>
        Number(
          item.landId,
        ) ===
        numericLandId,
    )


  if (
    !land
  ) {
    throw new Error(
      `Land #${numericLandId} was not found.`,
    )
  }


  return land
}


// ============================================================
// SEARCH LAND BY SURVEY NUMBER
// ============================================================

export async function searchLandBySurveyNumber(
  surveyNumber,
) {
  const cleanSurvey =
    String(
      surveyNumber ?? "",
    )
      .trim()
      .toLowerCase()


  if (
    !cleanSurvey
  ) {
    throw new Error(
      "Enter a Survey Number.",
    )
  }


  const lands =
    await getAllLands()


  const land =
    lands.find(
      (
        item,
      ) =>
        String(
          item.surveyNumber ??
          "",
        )
          .trim()
          .toLowerCase() ===
        cleanSurvey,
    )


  if (
    !land
  ) {
    throw new Error(
      `Survey Number "${surveyNumber}" was not found.`,
    )
  }


  return land
}


// ============================================================
// GET RELATED BOUNDARIES
// ============================================================

export async function getLandBoundaries(
  landId,
) {
  const numericLandId =
    Number(
      landId,
    )


  const boundaries =
    await getAllBoundaries()


  return boundaries.filter(
    (
      boundary,
    ) =>
      Number(
        boundary.landA,
      ) ===
        numericLandId ||
      Number(
        boundary.landB,
      ) ===
        numericLandId,
  )
}


// ============================================================
// GET COMPLETE PUBLIC LAND PROFILE
// ============================================================

export async function getPublicLandProfile({
  searchType,
  searchValue,
}) {
  let land


  if (
    searchType ===
    "survey"
  ) {
    land =
      await searchLandBySurveyNumber(
        searchValue,
      )
  } else {
    land =
      await searchLandById(
        searchValue,
      )
  }


  const [
    ownershipHistory,
    boundaries,
  ] =
    await Promise.all([
      getLandOwnershipHistory(
        land.landId,
      ),

      getLandBoundaries(
        land.landId,
      ),
    ])


  const previousOwners = []


  for (
    const transfer of
      ownershipHistory
  ) {
    if (
      transfer.previousOwner &&
      !previousOwners.includes(
        transfer.previousOwner,
      )
    ) {
      previousOwners.push(
        transfer.previousOwner,
      )
    }
  }


  return {
    land,

    currentOwner:
      land.ownerAddress,

    previousOwners,

    ownershipHistory,

    boundaries,

    explorerUrl:
      `https://lora.algokit.io/testnet/application/${ALGORAND_CONFIG.appId}`,

    qrValue:
      `https://lora.algokit.io/testnet/application/${ALGORAND_CONFIG.appId}#land-${land.landId}`,

    appId:
      ALGORAND_CONFIG.appId,
  }
}


// ============================================================
// VERIFICATION LABEL
// ============================================================

export function getLandVerificationText(
  status,
) {
  const numericStatus =
    Number(
      status,
    )


  if (
    numericStatus === 2
  ) {
    return "Verified"
  }


  if (
    numericStatus === 1
  ) {
    return "Pending Verification"
  }


  if (
    numericStatus === 3
  ) {
    return "Flagged"
  }


  return "Unverified"
}