import {
  useCallback,
  useEffect,
  useState,
} from "react"

import LandingPage
  from "./components/LandingPage"

import AuthModal
  from "./components/AuthModal"

import GovernmentSignupRequestsModal
  from "./components/GovernmentSignupRequestsModal"

import MyGovernmentRequestModal
  from "./components/MyGovernmentRequestModal"

import ViewUsersModal
  from "./components/ViewUsersModal"

import SettingsModal
  from "./components/SettingsModal"

import PublicRegisterLandModal
  from "./components/PublicRegisterLandModal"

import LandRegistrationRequestsModal
  from "./components/LandRegistrationRequestsModal"

import MyLandsModal
  from "./components/MyLandsModal"

import PublicLandRequestsModal
  from "./components/PublicLandRequestsModal"

import {
  getSignedInUser,
  getUserGovernmentSignupRequest,
  refreshSignedInUser,
  signOutUser,
} from "./services/authService"

import {
  getUserLandRegistrationRequests,
  hasUserRegisteredLands,
  syncUserLandRegistrationRequests,
} from "./services/publicLandRequestService"

import {
  getAppId,
  getGlobalState,
  getNetworkStatus,
} from "./services/algorandService"

import {
  isGovernment,
  getMyGovernmentRequest,
} from "./services/module11Service"

import PublicLandVerificationModal
  from "./components/PublicLandVerificationModal"

import RegisterLandModal
  from "./components/RegisterLandModal"

import AddBoundaryModal
  from "./components/AddBoundaryModal"

import VerifyLandModal
  from "./components/VerifyLandModal"

import VerifyBoundaryModal
  from "./components/VerifyBoundaryModal"

import RecentActivity
  from "./components/RecentActivity"

import WalletConnect,
{
  peraWallet,
} from "./components/WalletConnect"

import GovernmentAccessPanel
  from "./components/GovernmentAccessPanel"

import GovernmentRequestsModal
  from "./components/GovernmentRequestsModal"

import TransferOwnershipModal
  from "./components/TransferOwnershipModal"

import "./App.css"
import "./theme.css"


const TESTNET_EXPLORER =
  "https://lora.algokit.io/testnet"


function App() {
  const [
    authUser,
    setAuthUser,
  ] = useState(
    () =>
      getSignedInUser(),
  )

  const [
    authMode,
    setAuthMode,
  ] = useState("")

  const [
    theme,
    setTheme,
  ] = useState(
    () =>
      localStorage.getItem(
        "boundarygraph_theme",
      ) || "dark",
  )

  const [
    showGovernmentSignupRequests,
    setShowGovernmentSignupRequests,
  ] = useState(false)

const [
  showViewUsers,
  setShowViewUsers,
] = useState(false)

  const [
    showMyGovernmentRequest,
    setShowMyGovernmentRequest,
  ] = useState(false)

  const [
    showSettings,
    setShowSettings,
  ] = useState(false)

  const [
    showPublicRegisterLand,
    setShowPublicRegisterLand,
  ] = useState(false)

  const [
    showLandRegistrationRequests,
    setShowLandRegistrationRequests,
  ] = useState(false)

  const [
    showMyLands,
    setShowMyLands,
  ] = useState(false)

  const [
    showPublicLandRequests,
    setShowPublicLandRequests,
  ] = useState(false)

  const [
    landRequestVersion,
    setLandRequestVersion,
  ] = useState(0)

  const [
    networkStatus,
    setNetworkStatus,
  ] = useState(null)

  const [
    globalState,
    setGlobalState,
  ] = useState(null)

  const [
    walletAddress,
    setWalletAddress,
  ] = useState("")

  const [
    userRole,
    setUserRole,
  ] = useState("Disconnected")

  const [
    selectedPortal,
    setSelectedPortal,
  ] = useState("")

  const [
    requestInfo,
    setRequestInfo,
  ] = useState(null)

  const [
    roleLoading,
    setRoleLoading,
  ] = useState(false)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")

  const [
    showRegisterModal,
    setShowRegisterModal,
  ] = useState(false)

  const [
    showAddBoundary,
    setShowAddBoundary,
  ] = useState(false)

  const [
    showVerifyLand,
    setShowVerifyLand,
  ] = useState(false)

  const [
    showVerifyBoundary,
    setShowVerifyBoundary,
  ] = useState(false)

  const [
    showGovernmentRequests,
    setShowGovernmentRequests,
  ] = useState(false)

  const [
    showTransferOwnership,
    setShowTransferOwnership,
  ] = useState(false)

  const [
    showPublicLandVerification,
    setShowPublicLandVerification,
  ] = useState(false)


  const currentAuthGovernmentRequest =
    authUser?.id
      ? getUserGovernmentSignupRequest(
          authUser.id,
        )
      : null


  const currentUserHasRegisteredLands =
    authUser?.id
      ? hasUserRegisteredLands(
          authUser.id,
        )
      : false


  const currentUserHasLandRequests =
    authUser?.id
      ? getUserLandRegistrationRequests(
          authUser.id,
        ).length > 0
      : false


  const loadDashboard =
    useCallback(
      async () => {
        try {
          setError("")

          const [
            network,
            state,
          ] =
            await Promise.all([
              getNetworkStatus(),
              getGlobalState(),
            ])

          setNetworkStatus(
            network,
          )

          setGlobalState(
            state,
          )
        } catch (err) {
          console.error(err)

          setError(
            err.message ||
              "Unable to connect to Algorand TestNet",
          )
        } finally {
          setLoading(false)
        }
      },
      [],
    )


  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])


  useEffect(() => {
    if (
      authUser?.role
    ) {
      setSelectedPortal(
        authUser.role,
      )
    } else {
      setSelectedPortal("")
    }
  }, [authUser])


  useEffect(() => {
    document.documentElement.setAttribute(
      "data-theme",
      theme,
    )

    localStorage.setItem(
      "boundarygraph_theme",
      theme,
    )
  }, [theme])


  useEffect(() => {
    function refreshLandRequests() {
      setLandRequestVersion(
        (current) =>
          current + 1,
      )
    }

    window.addEventListener(
      "boundarygraph-land-requests-changed",
      refreshLandRequests,
    )

    window.addEventListener(
      "storage",
      refreshLandRequests,
    )

    return () => {
      window.removeEventListener(
        "boundarygraph-land-requests-changed",
        refreshLandRequests,
      )

      window.removeEventListener(
        "storage",
        refreshLandRequests,
      )
    }
  }, [])


  function toggleTheme() {
    setTheme(
      (
        current,
      ) =>
        current === "dark"
          ? "light"
          : "dark",
    )
  }


  function createSigner(
    address,
  ) {
    return async (
      txnGroup,
      indexesToSign,
    ) => {
      if (
        !Array.isArray(
          indexesToSign,
        ) ||
        indexesToSign.length === 0
      ) {
        return []
      }

      if (
        !peraWallet.isConnected
      ) {
        const accounts =
          await peraWallet
            .reconnectSession()

        if (
          !accounts ||
          accounts.length === 0
        ) {
          throw new Error(
            "Pera Wallet session is not active.",
          )
        }
      }

      const signerTransactions =
        txnGroup.map(
          (
            txn,
            index,
          ) => ({
            txn,

            signers:
              indexesToSign.includes(
                index,
              )
                ? [address]
                : [],
          }),
        )

      const signedTransactions =
        await peraWallet
          .signTransaction(
            [
              signerTransactions,
            ],
            address,
          )

      if (
        signedTransactions.length ===
        indexesToSign.length
      ) {
        return signedTransactions
      }

      if (
        signedTransactions.length ===
        txnGroup.length
      ) {
        return indexesToSign
          .map(
            (index) =>
              signedTransactions[
                index
              ],
          )
          .filter(Boolean)
      }

      throw new Error(
        "Pera Wallet signature response mismatch.",
      )
    }
  }


  const loadRole =
    useCallback(
      async (
        address,
      ) => {
        if (
          !address
        ) {
          setUserRole(
            "Disconnected",
          )

          setRequestInfo(
            null,
          )

          return
        }

        try {
          setRoleLoading(
            true,
          )

          const session = {
            address,

            signer:
              createSigner(
                address,
              ),
          }

          const role =
            await isGovernment(
              session,
            )

          if (
            Number(
              role,
            ) === 1
          ) {
            setUserRole(
              "Government",
            )

            setRequestInfo(
              null,
            )
          } else {
            setUserRole(
              "Public",
            )

            const request =
              await getMyGovernmentRequest(
                session,
              )

            setRequestInfo(
              request,
            )
          }
        } catch (err) {
          console.error(
            "Role loading error:",
            err,
          )

          setUserRole(
            "Public",
          )
        } finally {
          setRoleLoading(
            false,
          )
        }
      },
      [],
    )


  useEffect(() => {
    loadRole(
      walletAddress,
    )
  }, [
    walletAddress,
    loadRole,
  ])


  async function handleChainUpdate() {
    await loadDashboard()

    if (
      walletAddress
    ) {
      await loadRole(
        walletAddress,
      )
    }
  }


  function handleWalletChange(
    address,
  ) {
    setWalletAddress(
      address || "",
    )

    if (
      !address
    ) {
      setUserRole(
        "Disconnected",
      )

      setRequestInfo(
        null,
      )

      setShowGovernmentRequests(
        false,
      )

      setShowTransferOwnership(
        false,
      )
    }
  }


  async function handleAuthenticated(
    user,
  ) {
    setAuthUser(
      user,
    )

    setAuthMode("")

    setSelectedPortal(
      user.role,
    )

    try {
      if (
        user?.id
      ) {
        await syncUserLandRegistrationRequests(
          user.id,
        )

        setLandRequestVersion(
          (
            current,
          ) =>
            current + 1,
        )
      }
    } catch (err) {
      console.error(
        "Land request sync error:",
        err,
      )
    }
  }
  
  async function handleAuthDataChanged() {
    const refreshed =
      refreshSignedInUser()

    if (
      refreshed
    ) {
      setAuthUser(
        refreshed,
      )

      setSelectedPortal(
        refreshed.role,
      )

      try {
        await syncUserLandRegistrationRequests(
          refreshed.id,
        )

        setLandRequestVersion(
          (
            current,
          ) =>
            current + 1,
        )
      } catch (err) {
        console.error(
          "Land request refresh error:",
          err,
        )
      }
    }
  }

  async function handleSignOut() {
    try {
      if (
        peraWallet.isConnected
      ) {
        await peraWallet.disconnect()
      }
    } catch (err) {
      console.error(
        "Wallet disconnect during sign out:",
        err,
      )
    }

    signOutUser()

    setAuthUser(
      null,
    )

    setAuthMode("")

    setSelectedPortal("")

    setWalletAddress("")

    setUserRole(
      "Disconnected",
    )

    setRequestInfo(
      null,
    )

    setShowRegisterModal(false)
    setShowAddBoundary(false)
    setShowVerifyLand(false)
    setShowVerifyBoundary(false)
    setShowGovernmentRequests(false)
    setShowTransferOwnership(false)
    setShowPublicLandVerification(false)
    setShowGovernmentSignupRequests(false)
    setShowMyGovernmentRequest(false)
    setShowSettings(false)
    setShowPublicRegisterLand(false)
    setShowLandRegistrationRequests(false)
    setShowMyLands(false)
    setShowPublicLandRequests(false)
  }


  function applicationUrl() {
    return `${TESTNET_EXPLORER}/application/${getAppId()}`
  }


  if (
    loading
  ) {
    return (
      <div className="loading-screen">

        <h2>
          Loading Boundary Graph Dashboard...
        </h2>

      </div>
    )
  }


  if (
    error
  ) {
    return (
      <div className="error-screen">

        <h2>
          Connection Error
        </h2>

        <p>
          {error}
        </p>

      </div>
    )
  }


  if (
    !authUser
  ) {
    return (
      <>
        <LandingPage
          theme={
            theme
          }
          onToggleTheme={
            toggleTheme
          }
          onSignIn={() =>
            setAuthMode(
              "signin",
            )
          }
          onSignUp={() =>
            setAuthMode(
              "signup",
            )
          }
        />

        {authMode && (
          <AuthModal
            mode={
              authMode
            }
            onClose={() =>
              setAuthMode("")
            }
            onSuccess={
              handleAuthenticated
            }
          />
        )}
      </>
    )
  }


  return (
    <div
      className="app"
      data-land-request-version={
        landRequestVersion
      }
    >

      <nav className="navbar">

        <div className="logo">

          <div className="logo-icon">
            •
          </div>

          <span>
            LandRegistration System with Blockchain
          </span>

        </div>


        <div className="navbar-right">

          {selectedPortal && (
            <WalletConnect
              onAccountChange={
                handleWalletChange
              }
            />
          )}


          <div
            className="network-badge"
            style={{
              marginLeft:
                "8px",
            }}
          >
            {authUser.name} • {authUser.role}
          </div>


          <button
            type="button"
            className="theme-toggle-btn"
            onClick={() =>
              setShowSettings(
                true,
              )
            }
            title="Account Settings"
            aria-label="Open account settings"
          >
            <svg
              width="21"
              height="21"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle
                cx="12"
                cy="12"
                r="3"
              />
              <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1.1V21a2 2 0 1 1-4 0v-.09A1.7 1.7 0 0 0 8.6 19.4a1.7 1.7 0 0 0-1.88.34l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.7 1.7 0 0 0 4.6 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1.1-.4H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.6 8.6a1.7 1.7 0 0 0-.34-1.88l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1.1V3a2 2 0 1 1 4 0v.09A1.7 1.7 0 0 0 15.4 4.6a1.7 1.7 0 0 0 1.88-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.7 1.7 0 0 0 19.4 9c.14.36.36.68.65.94.3.25.68.39 1.07.4H21a2 2 0 1 1 0 4h-.09a1.7 1.7 0 0 0-1.51.66z" />
            </svg>
          </button>

        </div>

      </nav>


      <section className="hero">

        <h1>
          Decentralized Smart
          <br />

          <span className="hero-highlight">
            Land Registration
          </span>
        </h1>

        <p>
          Secure, immutable and transparent
          land registration with boundary
          verification powered by the
          Algorand blockchain.
        </p>

      </section>


      <main className="dashboard">

        <div
          className="actions-card"
          style={{
            marginBottom:
              "22px",
          }}
        >
          <strong>
            Signed in as {authUser.name}
          </strong>

          <p
            style={{
              marginBottom:
                0,
            }}
          >
            Account Role: {authUser.role}
            {authUser.role === "Government"
              ? " • Government blockchain actions require an authorized Pera Wallet."
              : " • Public access is read-only."}
          </p>
        </div>


        <>
        <div className="dashboard-title">

          <h2>
            Blockchain Dashboard
          </h2>

          <div className="connection">

            <span className="connection-dot">
            </span>

            {networkStatus?.connected
              ? "TestNet Connected"
              : "Disconnected"}

          </div>

        </div>


        <div className="stats-grid">

          <div className="stat-card">

            <div className="stat-label">
              Registered Lands
            </div>

            <div className="stat-value">
              {globalState?.total_lands ?? 0}
            </div>

            <div className="stat-sub">
              TestNet land records
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Boundaries
            </div>

            <div className="stat-value">
              {globalState?.total_boundaries ?? 0}
            </div>

            <div className="stat-sub">
              Boundary graph records
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Application ID
            </div>

            <a
              href={
                applicationUrl()
              }
              target="_blank"
              rel="noopener noreferrer"
              style={{
                textDecoration:
                  "none",

                color:
                  "inherit",
              }}
            >

              <div className="stat-value">
                {getAppId()} ↗
              </div>

            </a>

            <div className="stat-sub">
              Algorand TestNet contract
            </div>

          </div>


          <div className="stat-card">

            <div className="stat-label">
              Connected Role
            </div>

            <div className="stat-value">
              {walletAddress
                ? authUser.role
                : "None"}
            </div>

            <div className="stat-sub">
              {authUser.role === "Government"
                ? "Government access validated on-chain"
                : "Public read-only portal"}
            </div>

          </div>

        </div>


        {!walletAddress && (
          <div className="actions-card">

            <h3>
              Connect Pera Wallet
            </h3>

            <p>
              You selected the <strong>{selectedPortal}</strong> Portal.
              Connect your Pera Wallet to continue.
            </p>

          </div>
        )}


        {authUser.role ===
            "Government" &&
          walletAddress &&
          userRole ===
            "Government" && (
            <div className="actions-card">

              <h3>
                Government Dashboard
              </h3>

              <p>
                Authorized Government actions.
              </p>

              <div className="actions-grid">

                <button
                  className="action-btn primary-btn"
                  onClick={() =>
                    setShowRegisterModal(
                      true,
                    )
                  }
                >
                  + Register Land
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowVerifyLand(
                      true,
                    )
                  }
                >
                  Verify Land
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowAddBoundary(
                      true,
                    )
                  }
                >
                  + Add Boundary
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowVerifyBoundary(
                      true,
                    )
                  }
                >
                  Verify Boundary
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowTransferOwnership(
                      true,
                    )
                  }
                >
                  Transfer Ownership
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowLandRegistrationRequests(
                      true,
                    )
                  }
                >
                  Land Registration Requests
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowGovernmentSignupRequests(
                      true,
                    )
                  }
                >
                  Signup Requests
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowViewUsers(
                      true,
                    )
                  }
                >
                  View Users
                </button>

              </div>

            </div>
          )}


        {authUser.role ===
            "Government" &&
          walletAddress &&
          !roleLoading &&
          userRole !==
            "Government" && (
            <div className="actions-card">

              <h3>
                Government Access Denied
              </h3>

              <p>
                This connected wallet is not authorized
                as a Government account on-chain.
                Use Change Role to enter the Public Portal,
                or connect an authorized Government wallet.
              </p>

            </div>
          )}


        {authUser.role ===
            "Public" &&
          walletAddress && (
            <div className="actions-card">

              <h3>
                Public Dashboard
              </h3>

              <p>
                Public verification and
                Government request access.
              </p>

              <div className="actions-grid">

                <button
                  className="action-btn primary-btn"
                  onClick={() =>
                    setShowPublicRegisterLand(
                      true,
                    )
                  }
                >
                  + Register Land
                </button>


                <button
                  className="action-btn secondary-btn"
                  onClick={() =>
                    setShowPublicLandVerification(
                      true,
                    )
                  }
                >
                  Verify Land
                </button>


                {currentUserHasRegisteredLands && (
                  <button
                    className="action-btn secondary-btn"
                    onClick={() =>
                      setShowMyLands(
                        true,
                      )
                    }
                  >
                    View My Lands
                  </button>
                )}


                {currentUserHasLandRequests && (
                  <button
                    className="action-btn secondary-btn"
                    onClick={() =>
                      setShowPublicLandRequests(
                        true,
                      )
                    }
                  >
                    My Land Requests
                  </button>
                )}


                {currentAuthGovernmentRequest && (
                  <button
                    className="action-btn secondary-btn"
                    onClick={() =>
                      setShowMyGovernmentRequest(
                        true,
                      )
                    }
                  >
                    View Requests
                  </button>
                )}

              </div>

            </div>
          )}


        {authUser.role ===
          "Government" && (
          <RecentActivity />
        )}


        <div className="info-panel">

          <div className="info-box">

            <h4>
              🛡️ Immutable Ownership
            </h4>

            <p>
              Every registered land parcel is
              stored on Algorand TestNet through
              the LandRegistry smart contract.
            </p>

          </div>


          <div className="info-box">

            <h4>
              {authUser.role === "Government"
                ? "🔗 Role-Based Authorization"
                : "🔎 Public Verification"}
            </h4>

            <p>
              {authUser.role === "Government"
                ? "Government permissions are validated directly by the Algorand smart contract."
                : "Public users can verify land records and blockchain proof without Government write permissions."}
            </p>

          </div>

        </div>

        </>

      </main>


      {showRegisterModal && (
  <RegisterLandModal
    currentUser={
      authUser
    }

    connectedWalletAddress={
      walletAddress
    }

    onClose={() =>
      setShowRegisterModal(
        false,
      )
    }

    onSuccess={
      handleChainUpdate
    }
  />
)}


      {showVerifyLand && (
  <VerifyLandModal
    currentUser={
      authUser
    }

    connectedWalletAddress={
      walletAddress
    }

    onClose={() =>
      setShowVerifyLand(
        false,
      )
    }

    onSuccess={
      handleChainUpdate
    }
  />
)}


     {showAddBoundary && (
  <AddBoundaryModal
    currentUser={
      authUser
    }

    connectedWalletAddress={
      walletAddress
    }

    onClose={() =>
      setShowAddBoundary(
        false,
      )
    }

    onSuccess={
      handleChainUpdate
    }
  />
)}


     {showVerifyBoundary && (
  <VerifyBoundaryModal
    currentUser={
      authUser
    }

    onClose={() =>
      setShowVerifyBoundary(
        false,
      )
    }

    onSuccess={
      handleChainUpdate
    }
  />
)}


      {showGovernmentRequests &&
        walletAddress &&
        userRole ===
          "Government" && (
          <GovernmentRequestsModal
            walletAddress={
              walletAddress
            }

            onClose={() =>
              setShowGovernmentRequests(
                false,
              )
            }

            onSuccess={
              handleChainUpdate
            }
          />
        )}


      {showTransferOwnership &&
  walletAddress &&
  userRole ===
    "Government" && (
    <TransferOwnershipModal
      currentUser={
        authUser
      }

      walletAddress={
        walletAddress
      }

      onClose={() =>
        setShowTransferOwnership(
          false,
        )
      }

      onSuccess={
        handleChainUpdate
      }
    />
  )}


      {showPublicLandVerification && (
        <PublicLandVerificationModal
          onClose={() =>
            setShowPublicLandVerification(
              false,
            )
          }
        />
      )}


      {showGovernmentSignupRequests &&
        authUser.role ===
          "Government" && (
          <GovernmentSignupRequestsModal
            currentUser={
              authUser
            }

            onClose={() =>
              setShowGovernmentSignupRequests(
                false,
              )
            }

            onRequestUpdated={
              handleAuthDataChanged
            }
          />
        )}


      {showViewUsers &&
    authUser.role ===
      "Government" && (
      <ViewUsersModal
        onClose={() =>
          setShowViewUsers(
            false,
          )
        }
      />
    )}


  {showMyGovernmentRequest &&
        authUser.role ===
          "Public" && (
          <MyGovernmentRequestModal
            currentUser={
              authUser
            }
            onClose={() => {
              setShowMyGovernmentRequest(
                false,
              )

              handleAuthDataChanged()
            }}
          />
        )}


      {showPublicRegisterLand &&
        authUser.role ===
          "Public" && (
          <PublicRegisterLandModal
            currentUser={
              authUser
            }
            connectedWalletAddress={
              walletAddress
            }
            onClose={() =>
              setShowPublicRegisterLand(
                false,
              )
            }
            onSubmitted={() =>
              setLandRequestVersion(
                (current) =>
                  current + 1,
              )
            }
          />
        )}


      {showLandRegistrationRequests &&
        authUser.role ===
          "Government" &&
        walletAddress &&
        userRole ===
          "Government" && (
          <LandRegistrationRequestsModal
            currentUser={
              authUser
            }
            governmentWalletAddress={
              walletAddress
            }
            onClose={() =>
              setShowLandRegistrationRequests(
                false,
              )
            }
            onChanged={async () => {
              setLandRequestVersion(
                (current) =>
                  current + 1,
              )

              await handleChainUpdate()
            }}
          />
        )}


      {showPublicLandRequests &&
        authUser.role ===
          "Public" && (
          <PublicLandRequestsModal
            currentUser={
              authUser
            }
            onClose={() =>
              setShowPublicLandRequests(
                false,
              )
            }
          />
        )}


      {showMyLands &&
        authUser.role ===
          "Public" && (
          <MyLandsModal
            currentUser={
              authUser
            }
            onClose={() =>
              setShowMyLands(
                false,
              )
            }
          />
        )}


      {showSettings && (
        <SettingsModal
          currentUser={
            authUser
          }
          onClose={() =>
            setShowSettings(
              false,
            )
          }
          theme={
            theme
          }
          onToggleTheme={
            toggleTheme
          }
          onLogout={
            handleSignOut
          }
        />
      )}


      <footer className="footer">
        LandRegistration System with Blockchain • Decentralized Smart Land
        Registration • Powered by Algorand TestNet
      </footer>

    </div>
  )
}


export default App


