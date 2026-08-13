import {
  useState,
} from "react"

import {
  getBoundary,
} from "../services/algorandService"

import {
  verifyBoundaryModule11,
} from "../services/verifyBoundaryModule11Service"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService"

import {
  peraWallet,
} from "./WalletConnect"


const TESTNET_EXPLORER =
  "https://lora.algokit.io/testnet"


function VerifyBoundaryModal({
  onClose,
  onSuccess,
  currentUser = null,
}) {
  const [
    boundaryId,
    setBoundaryId,
  ] = useState("")

  const [
    boundary,
    setBoundary,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    verifying,
    setVerifying,
  ] = useState(false)

  const [
    processingStage,
    setProcessingStage,
  ] = useState("")

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState(null)


  function statusText(
    status,
  ) {
    const value =
      Number(
        status,
      )

    if (
      value === 2
    ) {
      return "Verified"
    }

    if (
      value === 1
    ) {
      return "Under Review"
    }

    return "Pending"
  }


  function displayBoundaryHash(
    value,
  ) {
    if (
      value === undefined ||
      value === null
    ) {
      return "-"
    }

    if (
      typeof value ===
      "string"
    ) {
      return value
    }

    if (
      value instanceof
      Uint8Array
    ) {
      try {
        return new TextDecoder()
          .decode(
            value,
          )
      } catch {
        return "-"
      }
    }

    if (
      Array.isArray(
        value,
      )
    ) {
      try {
        return new TextDecoder()
          .decode(
            new Uint8Array(
              value,
            ),
          )
      } catch {
        return "-"
      }
    }

    return String(
      value,
    )
  }


  async function getGovernmentAddress() {
    try {
      const accounts =
        await peraWallet
          .reconnectSession()

      if (
        !accounts ||
        accounts.length === 0
      ) {
        throw new Error(
          "Pera Wallet session is not active. Disconnect and reconnect your Government wallet.",
        )
      }

      return accounts[0]
    } catch (err) {
      console.error(
        "Pera Wallet session error:",
        err,
      )

      throw new Error(
        err?.message ||
        "Unable to detect connected Government wallet.",
      )
    }
  }


  async function handleLoadBoundary() {
    if (
      loading ||
      verifying
    ) {
      return
    }

    try {
      setLoading(
        true,
      )

      setError("")
      setSuccess(null)
      setBoundary(null)


      const numericBoundaryId =
        Number(
          boundaryId,
        )


      if (
        !Number.isInteger(
          numericBoundaryId,
        ) ||
        numericBoundaryId <= 0
      ) {
        throw new Error(
          "Enter a valid Boundary ID.",
        )
      }


      const result =
        await getBoundary(
          numericBoundaryId,
        )


      if (
        !result
      ) {
        throw new Error(
          `Boundary #${numericBoundaryId} was not found.`,
        )
      }


      setBoundary(
        result,
      )

    } catch (err) {
      console.error(
        "Load boundary error:",
        err,
      )

      setError(
        err?.message ||
        "Unable to load boundary.",
      )

    } finally {
      setLoading(
        false,
      )
    }
  }


  async function handleVerify() {
    if (
      verifying
    ) {
      return
    }


    if (
      !boundary
    ) {
      setError(
        "Load a boundary first.",
      )

      return
    }


    if (
      Number(
        boundary.verificationStatus,
      ) === 2
    ) {
      setError(
        `Boundary #${boundary.boundaryId} is already verified.`,
      )

      return
    }


    if (
      !currentUser?.id
    ) {
      setError(
        "Government account information is missing.",
      )

      return
    }


    try {
      setVerifying(
        true,
      )

      setError("")
      setSuccess(null)


      const governmentAddress =
        await getGovernmentAddress()


      /*
       * ==========================================
       * STEP 1
       * X402 PAYMENT
       * ==========================================
       */

      setProcessingStage(
        "Step 1/2: Confirm x402 Payment in Pera",
      )


      const resourceId =
        `verify-boundary-${boundary.boundaryId}`


      const x402Payment =
        await executeX402Payment({
          action:
            "verify_boundary",

          userId:
            currentUser.id,

          resourceId,
        })


      console.log(
        "Verify Boundary x402 payment verified:",
        x402Payment,
      )


      /*
       * ==========================================
       * STEP 2
       * VERIFY BOUNDARY ON ALGORAND
       * ==========================================
       */

      setProcessingStage(
        "Payment Verified - Step 2/2: Confirm Boundary Verification in Pera",
      )


      const result =
        await verifyBoundaryModule11({
          governmentAddress,

          boundaryId:
            boundary.boundaryId,
        })


      /*
       * ==========================================
       * CONSUME VERIFIED PAYMENT
       * ==========================================
       */

      await consumeX402Payment({
        paymentId:
          x402Payment.paymentId,

        action:
          "verify_boundary",

        resourceId,
      })


      setProcessingStage(
        "Boundary Verified - Updating Dashboard...",
      )


      const updatedBoundary =
        await getBoundary(
          boundary.boundaryId,
        )


      setBoundary(
        updatedBoundary,
      )


      const finalResult = {
        ...result,

        boundary:
          updatedBoundary,
      }


      setSuccess(
        finalResult,
      )


      if (
        onSuccess
      ) {
        try {
          await onSuccess(
            finalResult,
          )
        } catch (
          refreshError
        ) {
          console.error(
            "Dashboard refresh error:",
            refreshError,
          )
        }
      }

    } catch (err) {
      console.error(
        "Verify boundary error:",
        err,
      )


      const message =
        err?.message ||
        "Boundary verification failed."


      const lowerMessage =
        message.toLowerCase()


      if (
        lowerMessage.includes(
          "cancel",
        ) ||
        lowerMessage.includes(
          "reject",
        )
      ) {
        setError(
          "Transaction was cancelled or rejected in Pera Wallet.",
        )

      } else if (
        lowerMessage.includes(
          "pending",
        )
      ) {
        setError(
          "Another Pera Wallet transaction is still pending. Complete or close it and try again.",
        )

      } else if (
        lowerMessage.includes(
          "network mismatch",
        )
      ) {
        setError(
          "Pera Wallet network mismatch. Make sure Pera Wallet is connected to Algorand TestNet.",
        )

      } else {
        setError(
          message,
        )
      }

    } finally {
      setVerifying(
        false,
      )

      setProcessingStage("")
    }
  }


  function handleClose() {
    if (
      verifying
    ) {
      return
    }

    onClose()
  }


  return (
    <div
      className="modal-overlay"

      onMouseDown={
        (event) => {
          if (
            event.target ===
              event.currentTarget &&
            !verifying
          ) {
            handleClose()
          }
        }
      }
    >

      <div
        className="verify-modal-card"

        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <h2>
              Verify Boundary
            </h2>

            <p>
              Verify an existing boundary
              permanently on Algorand TestNet.
            </p>

          </div>


          <button
            type="button"

            className="close-btn"

            onClick={
              handleClose
            }

            disabled={
              verifying
            }
          >
            ×
          </button>

        </div>


        {error && (
          <div
            className="verify-error"

            style={{
              marginBottom:
                "16px",

              padding:
                "14px",

              borderRadius:
                "10px",

              background:
                "rgba(255,80,80,0.12)",
            }}
          >

            <strong>
              Transaction Error
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


        {success && (
          <div
            className="verify-success"

            style={{
              marginBottom:
                "18px",

              padding:
                "18px",

              borderRadius:
                "12px",

              background:
                "rgba(80,180,120,0.12)",
            }}
          >

            <h3>
              ✅ Boundary Verified Successfully
            </h3>


            <p>
              <strong>
                Boundary ID:
              </strong>{" "}

              #
              {
                success.boundaryId
              }
            </p>


            <p>
              <strong>
                Confirmed Round:
              </strong>{" "}

              {
                success.confirmedRound
              }
            </p>


            {success.txId && (
              <p>

                <strong>
                  Transaction:
                </strong>

                <br />

                <a
                  href={
                    `${TESTNET_EXPLORER}/transaction/${success.txId}`
                  }

                  target="_blank"

                  rel="noopener noreferrer"
                >
                  View Transaction on TestNet ↗
                </a>

              </p>
            )}

          </div>
        )}


        <div className="verify-search">

          <div className="form-group">

            <label>
              Boundary ID
            </label>


            <input
              type="number"

              min="1"

              step="1"

              placeholder="Example: 1"

              value={
                boundaryId
              }

              onChange={
                (event) => {
                  setBoundaryId(
                    event.target.value,
                  )

                  setBoundary(
                    null,
                  )

                  setSuccess(
                    null,
                  )

                  setError("")
                }
              }

              disabled={
                verifying
              }
            />

          </div>


          <button
            type="button"

            className="verify-load-btn"

            onClick={
              handleLoadBoundary
            }

            disabled={
              loading ||
              verifying
            }
          >
            {loading
              ? "Loading..."
              : "Load Boundary"}
          </button>

        </div>


        {boundary && (
          <div className="verify-boundary-card">

            <div className="verify-boundary-title">

              <h3>
                Boundary #
                {
                  boundary.boundaryId
                }
              </h3>


              <span>
                {statusText(
                  boundary.verificationStatus,
                )}
              </span>

            </div>


            <div className="verify-boundary-grid">

              <div>

                <span>
                  Land A
                </span>

                <strong>
                  #
                  {
                    boundary.landA
                  }
                </strong>

              </div>


              <div>

                <span>
                  Land B
                </span>

                <strong>
                  #
                  {
                    boundary.landB
                  }
                </strong>

              </div>


              <div>

                <span>
                  Status Code
                </span>

                <strong>
                  {
                    boundary.verificationStatus
                  }
                </strong>

              </div>

            </div>


            <div
              style={{
                marginTop:
                  "16px",
              }}
            >

              <strong>
                Boundary Hash
              </strong>


              <div
                style={{
                  marginTop:
                    "8px",

                  padding:
                    "10px",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(0,0,0,0.15)",

                  wordBreak:
                    "break-all",
                }}
              >
                {
                  displayBoundaryHash(
                    boundary.boundaryHash,
                  )
                }
              </div>

            </div>


            {verifying &&
              processingStage && (

                <div
                  style={{
                    marginTop:
                      "16px",

                    padding:
                      "12px",

                    borderRadius:
                      "10px",

                    background:
                      "rgba(80,150,255,0.12)",

                    textAlign:
                      "center",
                  }}
                >

                  <strong>
                    {
                      processingStage
                    }
                  </strong>

                </div>
              )}


            {Number(
              boundary.verificationStatus,
            ) !== 2 && (

              <button
                type="button"

                className="register-submit-btn"

                onClick={
                  handleVerify
                }

                disabled={
                  verifying
                }

                style={{
                  marginTop:
                    "18px",
                }}
              >
                {verifying
                  ? (
                      processingStage ||
                      "Processing..."
                    )
                  : "Verify Boundary on Algorand"}
              </button>
            )}


            {Number(
              boundary.verificationStatus,
            ) === 2 && (

              <div
                style={{
                  marginTop:
                    "18px",

                  padding:
                    "12px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(80,180,120,0.12)",
                }}
              >
                ✅ This boundary is already
                verified on Algorand TestNet.
              </div>
            )}

          </div>
        )}


        <div className="modal-actions">

          <button
            type="button"

            className="cancel-btn"

            onClick={
              handleClose
            }

            disabled={
              verifying
            }
          >
            Close
          </button>

        </div>

      </div>

    </div>
  )
}


export default VerifyBoundaryModal