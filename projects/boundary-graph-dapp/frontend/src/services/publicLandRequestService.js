const API_BASE =
  "http://localhost:4000/api"

const CACHE_KEY =
  "boundarygraph_land_requests_cache_v2"


function readCache() {
  try {
    const raw =
      localStorage.getItem(
        CACHE_KEY,
      )

    const parsed =
      raw
        ? JSON.parse(raw)
        : []

    return Array.isArray(
      parsed,
    )
      ? parsed
      : []
  } catch {
    return []
  }
}


function writeCache(
  requests,
) {
  localStorage.setItem(
    CACHE_KEY,
    JSON.stringify(
      Array.isArray(
        requests,
      )
        ? requests
        : [],
    ),
  )


  window.dispatchEvent(
    new Event(
      "boundarygraph-land-requests-changed",
    ),
  )
}


async function apiRequest(
  path,
  options = {},
) {
  let response


  try {
    response =
      await fetch(
        `${API_BASE}${path}`,
        {
          ...options,

          headers: {
            "Content-Type":
              "application/json",

            ...(
              options.headers ||
              {}
            ),
          },
        },
      )
  } catch {
    throw new Error(
      "BoundaryGraph backend is not reachable. Make sure backend is running on port 4000.",
    )
  }


  let data =
    null


  try {
    data =
      await response.json()
  } catch {
    data =
      null
  }


  if (
    !response.ok
  ) {
    throw new Error(
      data?.message ||
        `Backend request failed with status ${response.status}.`,
    )
  }


  return data
}


/* =========================================================
   SYNC ALL LAND REQUESTS FROM BACKEND
   ========================================================= */

export async function syncAllLandRegistrationRequests() {
  const result =
    await apiRequest(
      "/land-requests",
    )


  const requests =
    result?.requests ||
    []


  writeCache(
    requests,
  )


  return requests
}


/* =========================================================
   SYNC ONE USER'S LAND REQUESTS
   ========================================================= */

export async function syncUserLandRegistrationRequests(
  userId,
) {
  if (
    !userId
  ) {
    return []
  }


  const result =
    await apiRequest(
      `/land-requests/user/${encodeURIComponent(
        userId,
      )}`,
    )


  const requests =
    result?.requests ||
    []


  /*
   * Preserve cached requests belonging
   * to other users while replacing this
   * user's latest backend records.
   */

  const otherRequests =
    readCache()
      .filter(
        (
          request,
        ) =>
          request.userId !==
          userId,
      )


  writeCache([
    ...otherRequests,
    ...requests,
  ])


  return requests
}


/* =========================================================
   CREATE LAND REGISTRATION REQUEST
   ========================================================= */

export async function createLandRegistrationRequest({
  user,
  surveyNumber,
  extent,
  ownerAddress,
  note = "",
}) {
  if (
    !user?.id
  ) {
    throw new Error(
      "Sign in before submitting a land registration request.",
    )
  }


  const cleanSurvey =
    String(
      surveyNumber ||
      "",
    ).trim()


  const numericExtent =
    Number(
      extent,
    )


  const cleanOwner =
    String(
      ownerAddress ||
      "",
    ).trim()


  if (
    !cleanSurvey
  ) {
    throw new Error(
      "Survey number is required.",
    )
  }


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


  if (
    !cleanOwner
  ) {
    throw new Error(
      "Owner Algorand wallet address is required.",
    )
  }


  const result =
    await apiRequest(
      "/land-requests",

      {
        method:
          "POST",

        body:
          JSON.stringify({
            userId:
              user.id,

            surveyNumber:
              cleanSurvey,

            extent:
              numericExtent,

            ownerAddress:
              cleanOwner,

            note:
              String(
                note || "",
              ).trim(),
          }),
      },
    )


  await syncUserLandRegistrationRequests(
    user.id,
  )


  return result.request
}


/* =========================================================
   SYNCHRONOUS CACHE READS

   Existing App.jsx depends on these
   being synchronous.
   ========================================================= */

export function getAllLandRegistrationRequests() {
  return readCache()
    .sort(
      (
        first,
        second,
      ) =>
        new Date(
          second.createdAt ||
          0,
        ) -
        new Date(
          first.createdAt ||
          0,
        ),
    )
}


export function getUserLandRegistrationRequests(
  userId,
) {
  if (
    !userId
  ) {
    return []
  }


  return getAllLandRegistrationRequests()
    .filter(
      (
        request,
      ) =>
        request.userId ===
        userId,
    )
}


export function getUserRegisteredLands(
  userId,
) {
  return getUserLandRegistrationRequests(
    userId,
  )
    .filter(
      (
        request,
      ) =>
        request.status ===
          "Approved" &&
        Number(
          request.landId,
        ) > 0,
    )
}


export function hasUserRegisteredLands(
  userId,
) {
  return (
    getUserRegisteredLands(
      userId,
    ).length > 0
  )
}


/* =========================================================
   APPROVE REQUEST AFTER BLOCKCHAIN TRANSACTION
   ========================================================= */

export async function approveLandRegistrationRequest({
  requestId,
  governmentUser,
  blockchainResult,
}) {
  if (
    !requestId
  ) {
    throw new Error(
      "Land registration request was not found.",
    )
  }


  const landId =
    Number(
      blockchainResult?.landId ??
      blockchainResult?.id ??
      0,
    )


  if (
    !Number.isInteger(
      landId,
    ) ||
    landId <= 0
  ) {
    throw new Error(
      "Blockchain registration did not return a valid Land ID.",
    )
  }


  const result =
    await apiRequest(
      `/land-requests/${encodeURIComponent(
        requestId,
      )}/approve`,

      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            governmentUser: {
              id:
                governmentUser?.id ||
                "",

              name:
                governmentUser?.name ||
                "Government",
            },

            landId,

            txId:
              blockchainResult?.txId ||
              blockchainResult?.txID ||
              "",

            confirmedRound:
              Number(
                blockchainResult
                  ?.confirmedRound ??
                0,
              ),
          }),
      },
    )


  await syncAllLandRegistrationRequests()


  return result.request
}


/* =========================================================
   REJECT REQUEST
   ========================================================= */

export async function rejectLandRegistrationRequest({
  requestId,
  governmentUser,
  reason = "",
}) {
  if (
    !requestId
  ) {
    throw new Error(
      "Land registration request was not found.",
    )
  }


  const result =
    await apiRequest(
      `/land-requests/${encodeURIComponent(
        requestId,
      )}/reject`,

      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            governmentUser: {
              id:
                governmentUser?.id ||
                "",

              name:
                governmentUser?.name ||
                "Government",
            },

            reason:
              String(
                reason || "",
              ).trim(),
          }),
      },
    )


  await syncAllLandRegistrationRequests()


  return result.request
}