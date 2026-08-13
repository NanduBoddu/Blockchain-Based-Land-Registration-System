import {
  useEffect,
  useState,
} from "react"

import {
  hasGovernmentAccount,
  signInUser,
  signUpUser,
} from "../services/authService"


function AuthModal({
  mode,
  onClose,
  onSuccess,
}) {
  const isSignup =
    mode === "signup"


  const [
    name,
    setName,
  ] = useState("")


  const [
    email,
    setEmail,
  ] = useState("")


  const [
    password,
    setPassword,
  ] = useState("")


  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")


  const [
    role,
    setRole,
  ] = useState("Public")


  const [
    governmentExists,
    setGovernmentExists,
  ] = useState(false)


  const [
    checkingGovernment,
    setCheckingGovernment,
  ] = useState(false)


  const [
    loading,
    setLoading,
  ] = useState(false)


  const [
    error,
    setError,
  ] = useState("")


  const [
    message,
    setMessage,
  ] = useState("")


  useEffect(() => {
    let active =
      true


    async function checkGovernmentStatus() {
      if (
        !isSignup
      ) {
        return
      }


      try {
        setCheckingGovernment(
          true,
        )

        setError("")


        const exists =
          await hasGovernmentAccount()


        if (
          active
        ) {
          setGovernmentExists(
            exists,
          )
        }
      } catch (
        err
      ) {
        if (
          active
        ) {
          setError(
            err?.message ||
              "Unable to check Government account status.",
          )
        }
      } finally {
        if (
          active
        ) {
          setCheckingGovernment(
            false,
          )
        }
      }
    }


    checkGovernmentStatus()


    return () => {
      active =
        false
    }
  }, [
    isSignup,
    role,
  ])


  const isGovernmentRequest =
    isSignup &&
    role ===
      "Government" &&
    governmentExists


  async function handleSubmit(
    event,
  ) {
    event.preventDefault()


    if (
      loading
    ) {
      return
    }


    try {
      setLoading(
        true,
      )

      setError("")
      setMessage("")


      if (
        isSignup
      ) {
        const result =
          await signUpUser({
            name,
            email,
            password,
            confirmPassword,
            role,
          })


        if (
          result.type ===
          "government_request_sent"
        ) {
          setMessage(
            `Government signup request #${result.request?.requestId ?? ""} sent successfully. Your account is created as Public while the request is Pending.`,
          )


          setTimeout(
            () => {
              onSuccess(
                result.user,
              )
            },
            700,
          )


          return
        }


        onSuccess(
          result.user,
        )

        return
      }


      const user =
        await signInUser({
          name,
          password,
        })


      onSuccess(
        user,
      )
    } catch (
      err
    ) {
      setError(
        err?.message ||
          "Authentication failed.",
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  return (
    <div
      className="modal-overlay"

      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
              event.currentTarget &&
            !loading
          ) {
            onClose()
          }
        }
      }
    >

      <div
        className="modal-card"

        onMouseDown={
          (
            event,
          ) =>
            event.stopPropagation()
        }

        style={{
          maxWidth:
            "520px",

          maxHeight:
            "90vh",

          overflowY:
            "auto",
        }}
      >

        <div
          className="modal-header"
        >

          <div>
            <h2>
              {isSignup
                ? "Create Account"
                : "Sign In"}
            </h2>

            <p>
              {isSignup
                ? "Create your LandRegistration System with Blockchain account and choose your role."
                : "Welcome back. Enter your account name and password."}
            </p>
          </div>


          <button
            type="button"

            className="close-btn"

            onClick={
              onClose
            }

            disabled={
              loading
            }

            aria-label="Close"
          >
            ×
          </button>

        </div>


        {error && (
          <div
            style={{
              marginBottom:
                "16px",

              padding:
                "12px",

              borderRadius:
                "10px",

              background:
                "rgba(255,80,80,0.12)",
            }}
          >
            {error}
          </div>
        )}


        {message && (
          <div
            style={{
              marginBottom:
                "16px",

              padding:
                "12px",

              borderRadius:
                "10px",

              background:
                "rgba(0,212,170,0.12)",
            }}
          >
            {message}
          </div>
        )}


        <form
          onSubmit={
            handleSubmit
          }

          style={{
            display:
              "grid",

            gap:
              "14px",
          }}
        >

          <div
            className="form-group"
          >

            <label>
              Name
            </label>


            <input
              type="text"

              value={
                name
              }

              onChange={
                (
                  event,
                ) =>
                  setName(
                    event.target.value,
                  )
              }

              placeholder="Enter your name"

              autoFocus

              required
            />

          </div>


          {isSignup && (
            <div
              className="form-group"
            >

              <label>
                Email ID
              </label>


              <input
                type="email"

                value={
                  email
                }

                onChange={
                  (
                    event,
                  ) =>
                    setEmail(
                      event.target.value,
                    )
                }

                placeholder="name@example.com"

                required
              />

            </div>
          )}


          <div
            className="form-group"
          >

            <label>
              Password
            </label>


            <input
              type="password"

              value={
                password
              }

              onChange={
                (
                  event,
                ) =>
                  setPassword(
                    event.target.value,
                  )
              }

              placeholder="Enter password"

              required
            />

          </div>


          {isSignup && (
            <>
              <div
                className="form-group"
              >

                <label>
                  Confirm Password
                </label>


                <input
                  type="password"

                  value={
                    confirmPassword
                  }

                  onChange={
                    (
                      event,
                    ) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                  }

                  placeholder="Confirm password"

                  required
                />

              </div>


              <div
                className="form-group"
              >

                <label>
                  Select Role
                </label>


                <select
                  value={
                    role
                  }

                  onChange={
                    (
                      event,
                    ) => {
                      setRole(
                        event.target.value,
                      )

                      setError("")
                      setMessage("")
                    }
                  }
                >
                  <option
                    value="Public"
                  >
                    Public
                  </option>

                  <option
                    value="Government"
                  >
                    Government
                  </option>
                </select>

              </div>


              {role ===
                "Government" &&
                checkingGovernment && (
                  <div
                    style={{
                      padding:
                        "12px",

                      borderRadius:
                        "10px",

                      background:
                        "rgba(100,130,255,0.12)",
                    }}
                  >
                    Checking Government account status...
                  </div>
                )}


              {isGovernmentRequest && (
                <div
                  style={{
                    padding:
                      "12px",

                    borderRadius:
                      "10px",

                    background:
                      "rgba(255,188,70,0.12)",
                  }}
                >
                  A Government account already exists.
                  Your account will be created as Public
                  and a Government access request will be sent
                  for approval.
                </div>
              )}
            </>
          )}


          <button
            type="submit"

            className="action-btn primary-btn"

            disabled={
              loading ||
              (
                isSignup &&
                role ===
                  "Government" &&
                checkingGovernment
              )
            }
          >
            {loading
              ? "Please wait..."
              : isGovernmentRequest
                ? "Send Request"
                : isSignup
                  ? "Create Account"
                  : "Sign In"}
          </button>

        </form>

      </div>

    </div>
  )
}


export default AuthModal