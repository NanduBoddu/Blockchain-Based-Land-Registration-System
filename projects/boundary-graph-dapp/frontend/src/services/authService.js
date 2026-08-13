const API_BASE =
  "http://localhost:4000/api"

const SESSION_KEY =
  "boundarygraph_session_v3"

const TOKEN_KEY =
  "boundarygraph_auth_token_v1"

const GOV_REQUESTS_CACHE_KEY =
  "boundarygraph_government_signup_requests_cache_v1"


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


function readGovernmentRequestCache() {
  const requests =
    readJson(
      GOV_REQUESTS_CACHE_KEY,
      [],
    )

  return Array.isArray(
    requests,
  )
    ? requests
    : []
}


function writeGovernmentRequestCache(
  requests,
) {
  writeJson(
    GOV_REQUESTS_CACHE_KEY,
    Array.isArray(
      requests,
    )
      ? requests
      : [],
  )
}


/* =========================================================
   BACKEND REQUEST HELPER
   ========================================================= */

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
   SESSION
   Only current login session stays in browser.
   Actual account data stays in SQLite.
   ========================================================= */

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

    walletAddress:
      user.walletAddress ||
      "",
  }
}


function saveSession(
  user,
  token = "",
) {
  const session =
    sessionFromUser(
      user,
    )


  writeJson(
    SESSION_KEY,
    session,
  )


  if (
    token
  ) {
    localStorage.setItem(
      TOKEN_KEY,
      token,
    )
  }


  return session
}


/* =========================================================
   CACHE GOVERNMENT REQUESTS
   ========================================================= */

async function cacheGovernmentRequestsForUser(
  user,
) {
  if (
    !user?.id
  ) {
    writeGovernmentRequestCache(
      [],
    )

    return
  }


  try {
    if (
      user.role ===
      "Government"
    ) {
      const result =
        await apiRequest(
          "/government/requests",
        )


      writeGovernmentRequestCache(
        result?.requests ||
        [],
      )

      return
    }


    const result =
      await apiRequest(
        `/government/requests/user/${encodeURIComponent(
          user.id,
        )}`,
      )


    writeGovernmentRequestCache(
      result?.request
        ? [
            result.request,
          ]
        : [],
    )
  } catch (
    error
  ) {
    console.warn(
      "Government request cache refresh failed:",
      error,
    )
  }
}


/* =========================================================
   GOVERNMENT ACCOUNT EXISTS
   ========================================================= */

export async function hasGovernmentAccount() {
  const result =
    await apiRequest(
      "/government/exists",
    )


  return Boolean(
    result?.exists,
  )
}


/* =========================================================
   SIGN UP
   ========================================================= */

export async function signUpUser({
  name,
  email,
  password,
  confirmPassword,
  role,
  walletAddress = "",
}) {
  const result =
    await apiRequest(
      "/auth/signup",

      {
        method:
          "POST",

        body:
          JSON.stringify({
            name,
            email,
            password,
            confirmPassword,
            role,
            walletAddress,
          }),
      },
    )


  const session =
    saveSession(
      result.user,
      result.token,
    )


  if (
    result.request
  ) {
    writeGovernmentRequestCache([
      result.request,
    ])
  } else {
    await cacheGovernmentRequestsForUser(
      result.user,
    )
  }


  return {
    type:
      result.type ||
      "account_created",

    request:
      result.request ||
      null,

    user:
      session,
  }
}


/* =========================================================
   SIGN IN
   Existing UI uses Name + Password.
   ========================================================= */

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


  const result =
    await apiRequest(
      "/auth/signin",

      {
        method:
          "POST",

        body:
          JSON.stringify({
            name:
              cleanName,

            password,
          }),
      },
    )


  const session =
    saveSession(
      result.user,
      result.token,
    )


  await cacheGovernmentRequestsForUser(
    result.user,
  )


  return session
}


/* =========================================================
   GET CURRENT SESSION
   ========================================================= */

export function getSignedInUser() {
  return readJson(
    SESSION_KEY,
    null,
  )
}


/* =========================================================
   OLD APP COMPATIBILITY
   ========================================================= */

export function refreshSignedInUser() {
  return getSignedInUser()
}


/* =========================================================
   REFRESH USER FROM BACKEND
   ========================================================= */

export async function refreshSignedInUserFromBackend() {
  const current =
    getSignedInUser()


  if (
    !current?.id
  ) {
    return null
  }


  const result =
    await apiRequest(
      `/auth/users/${encodeURIComponent(
        current.id,
      )}`,
    )


  const session =
    saveSession(
      result.user,

      localStorage.getItem(
        TOKEN_KEY,
      ) ||
        "",
    )


  await cacheGovernmentRequestsForUser(
    result.user,
  )


  return session
}


/* =========================================================
   SIGN OUT
   ========================================================= */

export function signOutUser() {
  localStorage.removeItem(
    SESSION_KEY,
  )


  localStorage.removeItem(
    TOKEN_KEY,
  )


  localStorage.removeItem(
    GOV_REQUESTS_CACHE_KEY,
  )
}


/* =========================================================
   GOVERNMENT REQUESTS
   Synchronous cache functions kept because App.jsx
   currently expects synchronous values.
   ========================================================= */

export function getGovernmentSignupRequests() {
  return readGovernmentRequestCache()
    .sort(
      (
        first,
        second,
      ) =>
        new Date(
          second.requestedAt ||
          0,
        ) -
        new Date(
          first.requestedAt ||
          0,
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
    readGovernmentRequestCache()
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
          new Date(
            second.requestedAt ||
            0,
          ) -
          new Date(
            first.requestedAt ||
            0,
          ),
      )


  return (
    requests[0] ||
    null
  )
}


/* =========================================================
   SYNC ALL GOVERNMENT REQUESTS
   ========================================================= */

export async function syncGovernmentSignupRequests() {
  const result =
    await apiRequest(
      "/government/requests",
    )


  const requests =
    result?.requests ||
    []


  writeGovernmentRequestCache(
    requests,
  )


  return requests
}


/* =========================================================
   SYNC ONE USER GOVERNMENT REQUEST
   ========================================================= */

export async function syncUserGovernmentSignupRequest(
  userId,
) {
  if (
    !userId
  ) {
    writeGovernmentRequestCache(
      [],
    )

    return null
  }


  const result =
    await apiRequest(
      `/government/requests/user/${encodeURIComponent(
        userId,
      )}`,
    )


  writeGovernmentRequestCache(
    result?.request
      ? [
          result.request,
        ]
      : [],
  )


  return (
    result?.request ||
    null
  )
}


/* =========================================================
   APPROVE / REJECT GOVERNMENT REQUEST
   ========================================================= */

export async function reviewGovernmentSignupRequest({
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


  let requests =
    readGovernmentRequestCache()


  let request =
    requests.find(
      (
        item,
      ) =>
        String(
          item.requestId,
        ) ===
          String(
            requestId,
          ) ||
        String(
          item.id,
        ) ===
          String(
            requestId,
          ),
    )


  if (
    !request?.id
  ) {
    requests =
      await syncGovernmentSignupRequests()


    request =
      requests.find(
        (
          item,
        ) =>
          String(
            item.requestId,
          ) ===
            String(
              requestId,
            ) ||
          String(
            item.id,
          ) ===
            String(
              requestId,
            ),
      )
  }


  if (
    !request?.id
  ) {
    throw new Error(
      "Government signup request was not found.",
    )
  }


  const result =
    await apiRequest(
      `/government/requests/${encodeURIComponent(
        request.id,
      )}`,

      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            decision,

            reviewer: {
              name:
                reviewer?.name ||
                "Government",
            },
          }),
      },
    )


  await syncGovernmentSignupRequests()


  return (
    result?.request ||
    null
  )
}


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

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


  const result =
    await apiRequest(
      `/auth/users/${encodeURIComponent(
        userId,
      )}/password`,

      {
        method:
          "PATCH",

        body:
          JSON.stringify({
            currentPassword,
            newPassword,
            confirmPassword,
          }),
      },
    )


  return Boolean(
    result?.ok,
  )
}