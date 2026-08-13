const USERS_KEY = "boundarygraph_users_v2"
const SESSION_KEY = "boundarygraph_session_v2"
const GOV_REQUESTS_KEY =
  "boundarygraph_government_signup_requests_v1"


function readJson(
  key,
  fallback,
) {
  try {
    return JSON.parse(
      localStorage.getItem(
        key,
      ) ||
        JSON.stringify(
          fallback,
        ),
    )
  } catch {
    return fallback
  }
}


function writeJson(
  key,
  value,
) {
  localStorage.setItem(
    key,
    JSON.stringify(
      value,
    ),
  )
}


function readUsers() {
  return readJson(
    USERS_KEY,
    [],
  )
}


function writeUsers(
  users,
) {
  writeJson(
    USERS_KEY,
    users,
  )
}


function readGovernmentRequests() {
  return readJson(
    GOV_REQUESTS_KEY,
    [],
  )
}


function writeGovernmentRequests(
  requests,
) {
  writeJson(
    GOV_REQUESTS_KEY,
    requests,
  )
}


function bytesToHex(
  bytes,
) {
  return Array.from(
    bytes,
  )
    .map(
      (
        byte,
      ) =>
        byte
          .toString(16)
          .padStart(
            2,
            "0",
          ),
    )
    .join("")
}


function randomSalt() {
  const bytes =
    new Uint8Array(
      16,
    )

  crypto.getRandomValues(
    bytes,
  )

  return bytesToHex(
    bytes,
  )
}


async function hashPassword(
  password,
  salt,
) {
  const data =
    new TextEncoder()
      .encode(
        `${salt}:${password}`,
      )

  const digest =
    await crypto.subtle.digest(
      "SHA-256",
      data,
    )

  return bytesToHex(
    new Uint8Array(
      digest,
    ),
  )
}


function sessionFromUser(
  user,
) {
  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email,

    role:
      user.role,
  }
}


function saveSession(
  user,
) {
  const session =
    sessionFromUser(
      user,
    )

  writeJson(
    SESSION_KEY,
    session,
  )

  return session
}


export function hasGovernmentAccount() {
  return readUsers()
    .some(
      (
        user,
      ) =>
        user.role ===
        "Government",
    )
}


export async function signUpUser({
  name,
  email,
  password,
  confirmPassword,
  role,
}) {
  const cleanName =
    String(
      name || "",
    ).trim()

  const cleanEmail =
    String(
      email || "",
    )
      .trim()
      .toLowerCase()


  if (
    !cleanName
  ) {
    throw new Error(
      "Name is required.",
    )
  }


  if (
    !cleanEmail ||
    !cleanEmail.includes(
      "@",
    )
  ) {
    throw new Error(
      "Enter a valid email address.",
    )
  }


  if (
    String(
      password || "",
    ).length < 6
  ) {
    throw new Error(
      "Password must contain at least 6 characters.",
    )
  }


  if (
    password !==
    confirmPassword
  ) {
    throw new Error(
      "Password and Confirm Password do not match.",
    )
  }


  if (
    role !== "Public" &&
    role !== "Government"
  ) {
    throw new Error(
      "Select Public or Government role.",
    )
  }


  const users =
    readUsers()


  const existingUser =
    users.find(
      (
        user,
      ) =>
        user.name
          .toLowerCase() ===
          cleanName
            .toLowerCase() ||
        user.email ===
          cleanEmail,
    )


  if (
    existingUser
  ) {
    throw new Error(
      "An account with this name or email already exists.",
    )
  }


  const salt =
    randomSalt()


  const passwordHash =
    await hashPassword(
      password,
      salt,
    )


  const governmentExists =
    users.some(
      (
        user,
      ) =>
        user.role ===
        "Government",
    )


  // FIRST GOVERNMENT ACCOUNT
  if (
    role === "Government" &&
    !governmentExists
  ) {
    const user = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      name:
        cleanName,

      email:
        cleanEmail,

      role:
        "Government",

      salt,

      passwordHash,

      createdAt:
        new Date()
          .toISOString(),
    }


    users.push(
      user,
    )


    writeUsers(
      users,
    )


    return {
      type:
        "account_created",

      user:
        saveSession(
          user,
        ),
    }
  }


  // NORMAL PUBLIC SIGNUP
  if (
    role === "Public"
  ) {
    const user = {
      id:
        `${Date.now()}-${Math.random()
          .toString(36)
          .slice(2)}`,

      name:
        cleanName,

      email:
        cleanEmail,

      role:
        "Public",

      salt,

      passwordHash,

      createdAt:
        new Date()
          .toISOString(),
    }


    users.push(
      user,
    )


    writeUsers(
      users,
    )


    return {
      type:
        "account_created",

      user:
        saveSession(
          user,
        ),
    }
  }


  // ADDITIONAL GOVERNMENT USER
  // CREATE AS PUBLIC + SEND GOVERNMENT REQUEST

  const user = {
    id:
      `${Date.now()}-${Math.random()
        .toString(36)
        .slice(2)}`,

    name:
      cleanName,

    email:
      cleanEmail,

    role:
      "Public",

    salt,

    passwordHash,

    createdAt:
      new Date()
        .toISOString(),
  }


  users.push(
    user,
  )


  writeUsers(
    users,
  )


  const requests =
    readGovernmentRequests()


  const requestId =
    requests.length === 0
      ? 1
      : Math.max(
          ...requests.map(
            (
              item,
            ) =>
              Number(
                item.requestId,
              ) || 0,
          ),
        ) + 1


  const request = {
    requestId,

    userId:
      user.id,

    name:
      user.name,

    email:
      user.email,

    status:
      "Pending",

    requestedAt:
      new Date()
        .toISOString(),

    reviewedAt:
      null,

    reviewedBy:
      null,
  }


  requests.push(
    request,
  )


  writeGovernmentRequests(
    requests,
  )


  return {
    type:
      "government_request_sent",

    request,

    user:
      saveSession(
        user,
      ),
  }
}


export async function signInUser({
  name,
  password,
}) {
  const cleanName =
    String(
      name || "",
    ).trim()


  if (
    !cleanName ||
    !password
  ) {
    throw new Error(
      "Enter your name and password.",
    )
  }


  const users =
    readUsers()


  const user =
    users.find(
      (
        item,
      ) =>
        item.name
          .toLowerCase() ===
        cleanName
          .toLowerCase(),
    )


  if (
    !user
  ) {
    throw new Error(
      "Account not found. Please sign up first.",
    )
  }


  const passwordHash =
    await hashPassword(
      password,
      user.salt,
    )


  if (
    passwordHash !==
    user.passwordHash
  ) {
    throw new Error(
      "Incorrect password.",
    )
  }


  return saveSession(
    user,
  )
}


export function getSignedInUser() {
  return readJson(
    SESSION_KEY,
    null,
  )
}


export function refreshSignedInUser() {
  const current =
    getSignedInUser()


  if (
    !current?.id
  ) {
    return null
  }


  const user =
    readUsers()
      .find(
        (
          item,
        ) =>
          item.id ===
          current.id,
      )


  if (
    !user
  ) {
    signOutUser()

    return null
  }


  return saveSession(
    user,
  )
}


export function signOutUser() {
  localStorage.removeItem(
    SESSION_KEY,
  )
}


export function getGovernmentSignupRequests() {
  return readGovernmentRequests()
    .sort(
      (
        first,
        second,
      ) =>
        Number(
          second.requestId,
        ) -
        Number(
          first.requestId,
        ),
    )
}


export function getUserGovernmentSignupRequest(
  userId,
) {
  if (
    !userId
  ) {
    return null
  }


  const requests =
    readGovernmentRequests()
      .filter(
        (
          request,
        ) =>
          request.userId ===
          userId,
      )
      .sort(
        (
          first,
          second,
        ) =>
          Number(
            second.requestId,
          ) -
          Number(
            first.requestId,
          ),
      )


  return (
    requests[0] ||
    null
  )
}


export function reviewGovernmentSignupRequest({
  requestId,
  decision,
  reviewer,
}) {
  if (
    decision !==
      "Approved" &&
    decision !==
      "Rejected"
  ) {
    throw new Error(
      "Invalid request decision.",
    )
  }


  const requests =
    readGovernmentRequests()


  const index =
    requests.findIndex(
      (
        request,
      ) =>
        Number(
          request.requestId,
        ) ===
        Number(
          requestId,
        ),
    )


  if (
    index === -1
  ) {
    throw new Error(
      "Government signup request not found.",
    )
  }


  const request =
    requests[index]


  if (
    request.status !==
    "Pending"
  ) {
    throw new Error(
      `Request #${request.requestId} is already ${request.status}.`,
    )
  }


  request.status =
    decision

  request.reviewedAt =
    new Date()
      .toISOString()

  request.reviewedBy =
    reviewer?.name ||
    "Government"


  requests[index] =
    request


  writeGovernmentRequests(
    requests,
  )


  if (
    decision ===
    "Approved"
  ) {
    const users =
      readUsers()


    const userIndex =
      users.findIndex(
        (
          user,
        ) =>
          user.id ===
          request.userId,
      )


    if (
      userIndex === -1
    ) {
      throw new Error(
        "Requested user account was not found.",
      )
    }


    users[userIndex] = {
      ...users[userIndex],

      role:
        "Government",

      governmentApprovedAt:
        new Date()
          .toISOString(),

      governmentApprovedBy:
        reviewer?.name ||
        "Government",
    }


    writeUsers(
      users,
    )
  }


  return {
    ...request,
  }
}
export async function changeUserPassword({
  userId,
  currentPassword,
  newPassword,
  confirmPassword,
}) {
  if (
    !userId
  ) {
    throw new Error(
      "User account was not found.",
    )
  }


  if (
    !currentPassword
  ) {
    throw new Error(
      "Enter your current password.",
    )
  }


  if (
    String(
      newPassword || "",
    ).length < 6
  ) {
    throw new Error(
      "New password must contain at least 6 characters.",
    )
  }


  if (
    newPassword !==
    confirmPassword
  ) {
    throw new Error(
      "New Password and Confirm Password do not match.",
    )
  }


  if (
    currentPassword ===
    newPassword
  ) {
    throw new Error(
      "New password must be different from the current password.",
    )
  }


  const users =
    readUsers()


  const userIndex =
    users.findIndex(
      (
        user,
      ) =>
        user.id ===
        userId,
    )


  if (
    userIndex === -1
  ) {
    throw new Error(
      "User account was not found.",
    )
  }


  const user =
    users[userIndex]


  const currentHash =
    await hashPassword(
      currentPassword,
      user.salt,
    )


  if (
    currentHash !==
    user.passwordHash
  ) {
    throw new Error(
      "Current password is incorrect.",
    )
  }


  const newSalt =
    randomSalt()


  const newPasswordHash =
    await hashPassword(
      newPassword,
      newSalt,
    )


  users[userIndex] = {
    ...user,

    salt:
      newSalt,

    passwordHash:
      newPasswordHash,

    passwordUpdatedAt:
      new Date()
        .toISOString(),
  }


  writeUsers(
    users,
  )


  return true
}