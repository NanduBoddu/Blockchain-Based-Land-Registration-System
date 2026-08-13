const STORAGE_KEY =
  "boundarygraph_public_land_requests"


function readRequests() {
  try {
    const raw =
      localStorage.getItem(
        STORAGE_KEY,
      )

    const parsed =
      raw
        ? JSON.parse(raw)
        : []

    return Array.isArray(parsed)
      ? parsed
      : []
  } catch {
    return []
  }
}


function writeRequests(
  requests,
) {
  localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(
      requests,
    ),
  )

  window.dispatchEvent(
    new Event(
      "boundarygraph-land-requests-changed",
    ),
  )
}


function createId() {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .slice(2, 9)}`
}


export function createLandRegistrationRequest({
  user,
  surveyNumber,
  extent,
  ownerAddress,
  note = "",
}) {
  if (!user?.id) {
    throw new Error(
      "Sign in before submitting a land registration request.",
    )
  }

  const cleanSurvey =
    String(
      surveyNumber || "",
    ).trim()

  const numericExtent =
    Number(
      extent,
    )

  const cleanOwner =
    String(
      ownerAddress || "",
    ).trim()

  if (!cleanSurvey) {
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

  if (!cleanOwner) {
    throw new Error(
      "Owner Algorand wallet address is required.",
    )
  }

  const requests =
    readRequests()

  const duplicate =
    requests.find(
      (request) =>
        request.userId ===
          user.id &&
        request.surveyNumber
          .toLowerCase() ===
          cleanSurvey.toLowerCase() &&
        request.status ===
          "Pending",
    )

  if (duplicate) {
    throw new Error(
      "You already have a pending request for this survey number.",
    )
  }

  const request = {
    id:
      createId(),

    requestNumber:
      requests.length + 1,

    userId:
      user.id,

    applicantName:
      user.name || "",

    applicantEmail:
      user.email || "",

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

    status:
      "Pending",

    createdAt:
      new Date()
        .toISOString(),

    reviewedAt:
      null,

    reviewedBy:
      "",

    landId:
      null,

    txId:
      "",

    confirmedRound:
      null,

    rejectionReason:
      "",
  }

  requests.push(
    request,
  )

  writeRequests(
    requests,
  )

  return request
}


export function getAllLandRegistrationRequests() {
  return readRequests()
    .sort(
      (a, b) =>
        new Date(
          b.createdAt,
        ) -
        new Date(
          a.createdAt,
        ),
    )
}


export function getUserLandRegistrationRequests(
  userId,
) {
  if (!userId) {
    return []
  }

  return getAllLandRegistrationRequests()
    .filter(
      (request) =>
        request.userId ===
        userId,
    )
}


export function getUserRegisteredLands(
  userId,
) {
  return getUserLandRegistrationRequests(
    userId,
  ).filter(
    (request) =>
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


export function approveLandRegistrationRequest({
  requestId,
  governmentUser,
  blockchainResult,
}) {
  const requests =
    readRequests()

  const index =
    requests.findIndex(
      (request) =>
        request.id ===
        requestId,
    )

  if (index === -1) {
    throw new Error(
      "Land registration request was not found.",
    )
  }

  if (
    requests[index].status !==
    "Pending"
  ) {
    throw new Error(
      "This request has already been reviewed.",
    )
  }

  requests[index] = {
    ...requests[index],

    status:
      "Approved",

    reviewedAt:
      new Date()
        .toISOString(),

    reviewedBy:
      governmentUser?.name ||
      "Government",

    landId:
      Number(
        blockchainResult?.landId ??
        blockchainResult?.id ??
        0,
      ),

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
  }

  writeRequests(
    requests,
  )

  return requests[index]
}


export function rejectLandRegistrationRequest({
  requestId,
  governmentUser,
  reason = "",
}) {
  const requests =
    readRequests()

  const index =
    requests.findIndex(
      (request) =>
        request.id ===
        requestId,
    )

  if (index === -1) {
    throw new Error(
      "Land registration request was not found.",
    )
  }

  if (
    requests[index].status !==
    "Pending"
  ) {
    throw new Error(
      "This request has already been reviewed.",
    )
  }

  requests[index] = {
    ...requests[index],

    status:
      "Rejected",

    reviewedAt:
      new Date()
        .toISOString(),

    reviewedBy:
      governmentUser?.name ||
      "Government",

    rejectionReason:
      String(
        reason || "",
      ).trim(),
  }

  writeRequests(
    requests,
  )

  return requests[index]
}