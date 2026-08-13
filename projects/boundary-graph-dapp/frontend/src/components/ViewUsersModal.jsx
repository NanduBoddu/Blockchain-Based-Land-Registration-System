import {
  useEffect,
  useMemo,
  useState,
} from "react"


function ViewUsersModal({
  onClose,
}) {
  const [
    users,
    setUsers,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    themeVersion,
    setThemeVersion,
  ] = useState(0)


  /*
   * Detect current website theme.
   * App already applies data-theme on <html>.
   */
  const isDark =
    useMemo(
      () => {
        void themeVersion

        return (
          document
            .documentElement
            .getAttribute(
              "data-theme",
            ) === "dark"
        )
      },
      [
        themeVersion,
      ],
    )


  useEffect(() => {
    const observer =
      new MutationObserver(
        () => {
          setThemeVersion(
            (value) =>
              value + 1,
          )
        },
      )

    observer.observe(
      document.documentElement,
      {
        attributes:
          true,

        attributeFilter:
          [
            "data-theme",
          ],
      },
    )

    return () =>
      observer.disconnect()
  }, [])


  useEffect(() => {
    let active =
      true


    async function loadUsers() {
      try {
        setLoading(
          true,
        )

        setError("")


        const response =
          await fetch(
            "http://localhost:4000/api/auth/public-users",
          )


        const data =
          await response.json()


        if (
          !response.ok ||
          !data?.ok
        ) {
          throw new Error(
            data?.message ||
            "Unable to load public users.",
          )
        }


        if (
          active
        ) {
          setUsers(
            Array.isArray(
              data.users,
            )
              ? data.users
              : [],
          )
        }

      } catch (err) {
        console.error(
          "View users error:",
          err,
        )


        if (
          active
        ) {
          setError(
            err?.message ||
            "Unable to load public users.",
          )
        }

      } finally {
        if (
          active
        ) {
          setLoading(
            false,
          )
        }
      }
    }


    loadUsers()


    return () => {
      active =
        false
    }
  }, [])


  const colors =
    isDark
      ? {
          overlay:
            "rgba(2, 6, 23, 0.78)",

          card:
            "#0f172a",

          cardBorder:
            "#293548",

          primaryText:
            "#f8fafc",

          secondaryText:
            "#94a3b8",

          closeBg:
            "#1e293b",

          closeBorder:
            "#334155",

          closeText:
            "#e2e8f0",

          summaryBg:
            "linear-gradient(90deg, rgba(5,150,105,0.15), rgba(37,99,235,0.14))",

          summaryBorder:
            "#244858",

          countBg:
            "#162033",

          countBorder:
            "#334155",

          countText:
            "#34d399",

          userBg:
            "#182235",

          userBorder:
            "#2c3a50",

          email:
            "#60a5fa",

          avatarBg:
            "linear-gradient(135deg, rgba(16,185,129,0.20), rgba(59,130,246,0.20))",

          publicBg:
            "rgba(34,197,94,0.16)",

          publicBorder:
            "rgba(34,197,94,0.28)",

          publicText:
            "#86efac",

          errorBg:
            "rgba(239,68,68,0.12)",

          errorBorder:
            "rgba(239,68,68,0.30)",

          errorText:
            "#fecaca",

          neutralBg:
            "#172033",

          neutralBorder:
            "#334155",

          neutralText:
            "#cbd5e1",

          buttonBg:
            "#1e293b",

          buttonBorder:
            "#334155",

          buttonText:
            "#f8fafc",
        }
      : {
          overlay:
            "rgba(15, 23, 42, 0.55)",

          card:
            "#ffffff",

          cardBorder:
            "#dce5ef",

          primaryText:
            "#172033",

          secondaryText:
            "#718096",

          closeBg:
            "#f3f7fb",

          closeBorder:
            "#dbe4ee",

          closeText:
            "#475569",

          summaryBg:
            "linear-gradient(90deg, #ecfdf5, #eff6ff)",

          summaryBorder:
            "#c7e8df",

          countBg:
            "#ffffff",

          countBorder:
            "#d6e4df",

          countText:
            "#059669",

          userBg:
            "#f8fafc",

          userBorder:
            "#e2e8f0",

          email:
            "#2563eb",

          avatarBg:
            "linear-gradient(135deg, #d1fae5, #dbeafe)",

          publicBg:
            "#dcfce7",

          publicBorder:
            "#bbf7d0",

          publicText:
            "#047857",

          errorBg:
            "#fff1f2",

          errorBorder:
            "#fecdd3",

          errorText:
            "#be123c",

          neutralBg:
            "#f8fafc",

          neutralBorder:
            "#e2e8f0",

          neutralText:
            "#64748b",

          buttonBg:
            "#eef3f8",

          buttonBorder:
            "#d6e0ea",

          buttonText:
            "#172033",
        }


  return (
    <div
      style={{
        position:
          "fixed",

        inset:
          0,

        zIndex:
          99999,

        background:
          colors.overlay,

        backdropFilter:
          "blur(5px)",

        display:
          "flex",

        alignItems:
          "center",

        justifyContent:
          "center",

        padding:
          "20px",
      }}

      onMouseDown={
        (event) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose()
          }
        }
      }
    >

      <div
        style={{
          width:
            "100%",

          maxWidth:
            "720px",

          maxHeight:
            "85vh",

          overflowY:
            "auto",

          background:
            colors.card,

          color:
            colors.primaryText,

          border:
            `1px solid ${colors.cardBorder}`,

          borderRadius:
            "20px",

          padding:
            "26px",

          boxShadow:
            isDark
              ? "0 28px 80px rgba(0,0,0,0.48)"
              : "0 25px 70px rgba(15,23,42,0.20)",

          transition:
            "background 0.2s ease, color 0.2s ease, border-color 0.2s ease",
        }}

        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >

        <div
          style={{
            display:
              "flex",

            alignItems:
              "flex-start",

            justifyContent:
              "space-between",

            gap:
              "20px",

            marginBottom:
              "24px",
          }}
        >

          <div>

            <h2
              style={{
                margin:
                  "0 0 8px",

                fontSize:
                  "26px",

                color:
                  colors.primaryText,
              }}
            >
              View Public Users
            </h2>


            <p
              style={{
                margin:
                  0,

                color:
                  colors.secondaryText,

                fontSize:
                  "15px",
              }}
            >
              Registered public users in
              LandRegistration System with Blockchain.
            </p>

          </div>


          <button
            type="button"

            onClick={
              onClose
            }

            aria-label="Close"

            style={{
              border:
                `1px solid ${colors.closeBorder}`,

              background:
                colors.closeBg,

              color:
                colors.closeText,

              width:
                "40px",

              height:
                "40px",

              borderRadius:
                "11px",

              cursor:
                "pointer",

              fontSize:
                "23px",

              fontWeight:
                "600",

              lineHeight:
                1,
            }}
          >
            ×
          </button>

        </div>


        {loading && (
          <div
            style={{
              padding:
                "34px",

              textAlign:
                "center",

              color:
                colors.neutralText,

              background:
                colors.neutralBg,

              border:
                `1px solid ${colors.neutralBorder}`,

              borderRadius:
                "14px",
            }}
          >
            Loading public users...
          </div>
        )}


        {error && (
          <div
            style={{
              padding:
                "16px",

              marginBottom:
                "18px",

              borderRadius:
                "12px",

              background:
                colors.errorBg,

              border:
                `1px solid ${colors.errorBorder}`,

              color:
                colors.errorText,
            }}
          >
            <strong>
              Unable to load users
            </strong>

            <div
              style={{
                marginTop:
                  "6px",
              }}
            >
              {error}
            </div>
          </div>
        )}


        {!loading &&
          !error && (
            <>

              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "space-between",

                  alignItems:
                    "center",

                  padding:
                    "15px 18px",

                  marginBottom:
                    "18px",

                  borderRadius:
                    "13px",

                  background:
                    colors.summaryBg,

                  border:
                    `1px solid ${colors.summaryBorder}`,
                }}
              >

                <span
                  style={{
                    fontWeight:
                      "700",

                    color:
                      colors.primaryText,
                  }}
                >
                  Public Accounts
                </span>


                <strong
                  style={{
                    minWidth:
                      "36px",

                    height:
                      "36px",

                    borderRadius:
                      "10px",

                    display:
                      "flex",

                    alignItems:
                      "center",

                    justifyContent:
                      "center",

                    background:
                      colors.countBg,

                    border:
                      `1px solid ${colors.countBorder}`,

                    color:
                      colors.countText,

                    fontSize:
                      "18px",
                  }}
                >
                  {users.length}
                </strong>

              </div>


              {users.length ===
              0 ? (

                <div
                  style={{
                    padding:
                      "34px",

                    textAlign:
                      "center",

                    color:
                      colors.neutralText,

                    background:
                      colors.neutralBg,

                    border:
                      `1px solid ${colors.neutralBorder}`,

                    borderRadius:
                      "14px",
                  }}
                >
                  No public users found.
                </div>

              ) : (

                <div
                  style={{
                    display:
                      "grid",

                    gap:
                      "12px",

                    maxHeight:
                      "420px",

                    overflowY:
                      "auto",

                    paddingRight:
                      "3px",
                  }}
                >

                  {users.map(
                    (
                      user,
                      index,
                    ) => (

                      <div
                        key={
                          user.id ||
                          index
                        }

                        style={{
                          display:
                            "flex",

                          alignItems:
                            "center",

                          gap:
                            "15px",

                          padding:
                            "16px",

                          borderRadius:
                            "14px",

                          background:
                            colors.userBg,

                          border:
                            `1px solid ${colors.userBorder}`,
                        }}
                      >

                        <div
                          style={{
                            width:
                              "48px",

                            height:
                              "48px",

                            flexShrink:
                              0,

                            display:
                              "flex",

                            alignItems:
                              "center",

                            justifyContent:
                              "center",

                            borderRadius:
                              "50%",

                            background:
                              colors.avatarBg,

                            color:
                              colors.publicText,

                            fontSize:
                              "22px",
                          }}
                        >
                          👤
                        </div>


                        <div
                          style={{
                            minWidth:
                              0,

                            flex:
                              1,
                          }}
                        >

                          <div
                            style={{
                              fontSize:
                                "17px",

                              fontWeight:
                                "700",

                              color:
                                colors.primaryText,

                              marginBottom:
                                "5px",
                            }}
                          >
                            {
                              user.name ||
                              "Unnamed User"
                            }
                          </div>


                          <div
                            style={{
                              color:
                                colors.email,

                              wordBreak:
                                "break-all",

                              fontSize:
                                "15px",
                            }}
                          >
                            {
                              user.email ||
                              "-"
                            }
                          </div>

                        </div>


                        <div
                          style={{
                            padding:
                              "7px 11px",

                            borderRadius:
                              "999px",

                            background:
                              colors.publicBg,

                            color:
                              colors.publicText,

                            fontSize:
                              "12px",

                            fontWeight:
                              "800",

                            border:
                              `1px solid ${colors.publicBorder}`,
                          }}
                        >
                          PUBLIC
                        </div>

                      </div>
                    ),
                  )}

                </div>
              )}

            </>
          )}


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

            onClick={
              onClose
            }

            style={{
              padding:
                "11px 22px",

              border:
                `1px solid ${colors.buttonBorder}`,

              borderRadius:
                "11px",

              background:
                colors.buttonBg,

              color:
                colors.buttonText,

              cursor:
                "pointer",

              fontWeight:
                "700",

              fontSize:
                "14px",
            }}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  )
}


export default ViewUsersModal