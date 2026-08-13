import {
  useState,
} from "react"

import {
  changeUserPassword,
} from "../services/authService"


function SettingsModal({
  currentUser,
  theme,
  onToggleTheme,
  onClose,
  onLogout,
}) {
  const [
    screen,
    setScreen,
  ] = useState("menu")

  const [
    currentPassword,
    setCurrentPassword,
  ] = useState("")

  const [
    newPassword,
    setNewPassword,
  ] = useState("")

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    loggingOut,
    setLoggingOut,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState("")


  function resetPasswordForm() {
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")
    setError("")
    setSuccess("")
  }


  function goToMenu() {
    resetPasswordForm()
    setScreen("menu")
  }


  async function handlePasswordChange(
    event,
  ) {
    event.preventDefault()

    if (
      loading
    ) {
      return
    }

    try {
      setLoading(true)
      setError("")
      setSuccess("")

      await changeUserPassword({
        userId:
          currentUser.id,

        currentPassword,

        newPassword,

        confirmPassword,
      })

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")

      setSuccess(
        "Password updated successfully.",
      )
    } catch (err) {
      setError(
        err?.message ||
          "Unable to update password.",
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleLogout() {
    if (
      loggingOut ||
      loading
    ) {
      return
    }

    const confirmed =
      window.confirm(
        "Are you sure you want to log out?",
      )

    if (
      !confirmed
    ) {
      return
    }

    try {
      setLoggingOut(true)

      if (
        onLogout
      ) {
        await onLogout()
      }
    } finally {
      setLoggingOut(false)
    }
  }


  return (
    <div
      className="modal-overlay"
      onMouseDown={
        (event) => {
          if (
            event.target ===
              event.currentTarget &&
            !loading &&
            !loggingOut
          ) {
            onClose()
          }
        }
      }
      style={{
        overflowY:
          "auto",

        alignItems:
          "flex-start",
      }}
    >

      <div
        className="modal-card"
        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
        style={{
          width:
            "min(620px, 94vw)",

          maxHeight:
            "90vh",

          overflowY:
            "auto",

          margin:
            "5vh auto",

          position:
            "relative",
        }}
      >

        <div
          className="modal-header"
          style={{
            position:
              "sticky",

            top:
              0,

            zIndex:
              10,

            paddingBottom:
              "14px",
          }}
        >

          <div>
            <h2>
              Account Settings
            </h2>

            <p>
              Manage your LandRegistration System with Blockchain account,
              appearance and security.
            </p>
          </div>


          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={
              loading ||
              loggingOut
            }
            title="Close"
            aria-label="Close settings"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M6 6l12 12" />
              <path d="M18 6L6 18" />
            </svg>
          </button>

        </div>


        {screen ===
          "menu" && (
          <div
            style={{
              display:
                "grid",

              gap:
                "14px",
            }}
          >

            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={() =>
                setScreen(
                  "profile",
                )
              }
              style={{
                minHeight:
                  "82px",

                textAlign:
                  "left",

                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  fontSize:
                    "17px",
                  fontWeight:
                    "700",
                  marginBottom:
                    "6px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20 21a8 8 0 0 0-16 0" />
                  <circle cx="12" cy="7" r="4" />
                </svg>

                View Profile
              </div>

              <div
                style={{
                  fontSize:
                    "13px",

                  opacity:
                    0.75,
                }}
              >
                View your name, email,
                role and account ID.
              </div>
            </button>


            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={() => {
                resetPasswordForm()

                setScreen(
                  "password",
                )
              }}
              style={{
                minHeight:
                  "82px",

                textAlign:
                  "left",

                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  fontSize:
                    "17px",
                  fontWeight:
                    "700",
                  marginBottom:
                    "6px",
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect
                    x="4"
                    y="10"
                    width="16"
                    height="10"
                    rx="2"
                  />
                  <path d="M8 10V7a4 4 0 0 1 8 0v3" />
                </svg>

                Update Password
              </div>

              <div
                style={{
                  fontSize:
                    "13px",

                  opacity:
                    0.75,
                }}
              >
                Change your current
                LandRegistration System with Blockchain password.
              </div>
            </button>


            <button
              type="button"
              className="action-btn secondary-btn"
              onClick={
                onToggleTheme
              }
              style={{
                minHeight:
                  "82px",

                textAlign:
                  "left",

                padding:
                  "18px",
              }}
            >
              <div
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap:
                    "10px",
                  fontSize:
                    "17px",
                  fontWeight:
                    "700",
                  marginBottom:
                    "6px",
                }}
              >
                {theme === "dark" ? (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <circle cx="12" cy="12" r="4" />
                    <path d="M12 2v2" />
                    <path d="M12 20v2" />
                    <path d="M2 12h2" />
                    <path d="M20 12h2" />
                    <path d="m4.93 4.93 1.41 1.41" />
                    <path d="m17.66 17.66 1.41 1.41" />
                    <path d="m6.34 17.66-1.41 1.41" />
                    <path d="m19.07 4.93-1.41 1.41" />
                  </svg>
                ) : (
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
                  </svg>
                )}

                Appearance
              </div>

              <div
                style={{
                  fontSize:
                    "13px",

                  opacity:
                    0.75,
                }}
              >
                Current theme:{" "}
                <strong>
                  {theme === "dark"
                    ? "Dark"
                    : "Light"}
                </strong>
                . Click to switch.
              </div>
            </button>


            <div
              style={{
                borderTop:
                  "1px solid rgba(128,128,128,0.18)",

                paddingTop:
                  "16px",

                marginTop:
                  "2px",
              }}
            >
              <button
                type="button"
                onClick={
                  handleLogout
                }
                disabled={
                  loggingOut ||
                  loading
                }
                style={{
                  width:
                    "100%",

                  minHeight:
                    "52px",

                  border:
                    "1px solid rgba(255,75,75,0.55)",

                  borderRadius:
                    "12px",

                  background:
                    "rgba(255,75,75,0.12)",

                  color:
                    "#ff5f5f",

                  fontSize:
                    "16px",

                  fontWeight:
                    "700",

                  cursor:
                    loggingOut
                      ? "not-allowed"
                      : "pointer",
                }}
              >
                {loggingOut
                  ? "Logging Out..."
                  : "Log Out"}
              </button>
            </div>

          </div>
        )}


        {screen ===
          "profile" && (
          <div>

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={
                  goToMenu
                }
              >
                Back
              </button>
            </div>


            <h3
              style={{
                marginBottom:
                  "18px",
              }}
            >
              Profile Details
            </h3>


            <div
              style={{
                display:
                  "grid",

                gap:
                  "12px",
              }}
            >

              <div
                style={{
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid rgba(128,128,128,0.18)",
                }}
              >
                <small>
                  Name
                </small>

                <div>
                  <strong>
                    {currentUser.name}
                  </strong>
                </div>
              </div>


              <div
                style={{
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid rgba(128,128,128,0.18)",
                }}
              >
                <small>
                  Email
                </small>

                <div>
                  <strong>
                    {currentUser.email}
                  </strong>
                </div>
              </div>


              <div
                style={{
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid rgba(128,128,128,0.18)",
                }}
              >
                <small>
                  Role
                </small>

                <div>
                  <strong>
                    {currentUser.role}
                  </strong>
                </div>
              </div>


              <div
                style={{
                  padding:
                    "16px",
                  borderRadius:
                    "12px",
                  border:
                    "1px solid rgba(128,128,128,0.18)",
                  overflowWrap:
                    "anywhere",
                }}
              >
                <small>
                  Account ID
                </small>

                <div>
                  <strong>
                    {currentUser.id}
                  </strong>
                </div>
              </div>

            </div>


            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",

                marginTop:
                  "22px",
              }}
            >
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onClose}
              >
                Close
              </button>
            </div>

          </div>
        )}


        {screen ===
          "password" && (
          <div>

            <div
              style={{
                marginBottom:
                  "20px",
              }}
            >
              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={
                  goToMenu
                }
                disabled={loading}
              >
                Back
              </button>
            </div>


            <h3
              style={{
                marginBottom:
                  "18px",
              }}
            >
              Update Password
            </h3>


            {error && (
              <div
                style={{
                  marginBottom:
                    "14px",
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


            {success && (
              <div
                style={{
                  marginBottom:
                    "14px",
                  padding:
                    "12px",
                  borderRadius:
                    "10px",
                  background:
                    "rgba(0,212,170,0.12)",
                }}
              >
                {success}
              </div>
            )}


            <form
              onSubmit={
                handlePasswordChange
              }
              style={{
                display:
                  "grid",

                gap:
                  "16px",
              }}
            >

              <div className="form-group">
                <label>
                  Current Password
                </label>

                <input
                  type="password"
                  value={
                    currentPassword
                  }
                  onChange={
                    (event) =>
                      setCurrentPassword(
                        event.target.value,
                      )
                  }
                  placeholder="Enter current password"
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  New Password
                </label>

                <input
                  type="password"
                  value={
                    newPassword
                  }
                  onChange={
                    (event) =>
                      setNewPassword(
                        event.target.value,
                      )
                  }
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>


              <div className="form-group">
                <label>
                  Confirm New Password
                </label>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={
                    (event) =>
                      setConfirmPassword(
                        event.target.value,
                      )
                  }
                  placeholder="Re-enter new password"
                  required
                />
              </div>


              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "10px",

                  marginTop:
                    "8px",
                }}
              >
                <button
                  type="button"
                  className="action-btn secondary-btn"
                  onClick={onClose}
                  disabled={loading}
                >
                  Close
                </button>

                <button
                  type="submit"
                  className="action-btn primary-btn"
                  disabled={loading}
                >
                  {loading
                    ? "Updating..."
                    : "Update Password"}
                </button>
              </div>

            </form>

          </div>
        )}

      </div>

    </div>
  )
}


export default SettingsModal