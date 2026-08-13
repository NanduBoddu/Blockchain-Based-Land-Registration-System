import {
  useCallback,
  useEffect,
  useState,
} from "react"

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


const TESTNET_EXPLORER =
  "https://lora.algokit.io/testnet"


function App() {
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


  return (
    <div className="app">

      <nav className="navbar">

        <div className="logo">

          <div className="logo-icon">
            ⬢
          </div>

          <span>
            BoundaryGraph
          </span>

        </div>


        <div className="navbar-right">

          <div className="network-badge">
            ● {networkStatus?.network}
          </div>


          {walletAddress && (
            <div
              className="network-badge"
              style={{
                marginRight:
                  "10px",
              }}
            >
              {roleLoading
                ? "Checking Role..."
                : userRole}
            </div>
          )}


          <WalletConnect
            onAccountChange={
              handleWalletChange
            }
          />

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
                ? userRole
                : "None"}
            </div>

            <div className="stat-sub">
              On-chain authorization
            </div>

          </div>

        </div>


        {!walletAddress && (
          <div className="actions-card">

            <h3>
              Connect Wallet
            </h3>

            <p>
              Connect Pera Wallet to detect
              your Public or Government role.
            </p>

          </div>
        )}


        {walletAddress &&
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
                    setShowGovernmentRequests(
                      true,
                    )
                  }
                >
                  Government Requests
                </button>


                <button
                  className="action-btn secondary-btn"
                  disabled
                  title="Coming later"
                >
                  Settings
                </button>

              </div>

            </div>
          )}


        {walletAddress &&
          userRole ===
            "Public" && (
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
                    setShowPublicLandVerification(
                      true,
                    )
                  }
                >
                  Verify Land
                </button>


                {requestInfo &&
                  requestInfo.requestId >
                    0 && (
                    <button
                      className="action-btn secondary-btn"
                      onClick={() => {
                        alert(
                          `Request #${requestInfo.requestId} - ${requestInfo.statusText}`,
                        )
                      }}
                    >
                      My Requests
                    </button>
                  )}


                <button
                  className="action-btn secondary-btn"
                  disabled
                  title="Coming later"
                >
                  Settings
                </button>

              </div>

            </div>
          )}


        {walletAddress &&
          userRole ===
            "Public" && (
            <GovernmentAccessPanel
              walletAddress={
                walletAddress
              }
            />
          )}


        <RecentActivity />


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
              🔗 Role-Based Authorization
            </h4>

            <p>
              Government permissions are
              validated directly by the
              Algorand smart contract.
            </p>

          </div>

        </div>

      </main>


      {showRegisterModal && (
        <RegisterLandModal
          onClose={() =>
            setShowRegisterModal(
              false,
            )
          }
          onSuccess={
            handleChainUpdate
          }
          connectedWalletAddress={
            walletAddress
          }
        />
      )}


      {showVerifyLand && (
        <VerifyLandModal
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


      <footer className="footer">
        BoundaryGraph • Decentralized Smart Land
        Registration • Powered by Algorand TestNet
      </footer>

    </div>
  )
}


export default App