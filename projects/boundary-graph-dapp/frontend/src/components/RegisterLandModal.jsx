import {
  useEffect,
  useState,
} from "react"

import algosdk from "algosdk"

import {
  registerLandModule11,
} from "../services/registerLandService"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService.js"


function RegisterLandModal({
  onClose,
  onSuccess,
  currentUser = null,
  connectedWalletAddress = "",
}) {
  const [
    surveyNumber,
    setSurveyNumber,
  ] = useState("")

  const [
    extent,
    setExtent,
  ] = useState("")

  const [
    owner,
    setOwner,
  ] = useState("")

  const [
    useConnectedWallet,
    setUseConnectedWallet,
  ] = useState(
    Boolean(
      connectedWalletAddress,
    ),
  )

  const [
    submitting,
    setSubmitting,
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


  useEffect(() => {
    if (
      connectedWalletAddress &&
      useConnectedWallet
    ) {
      setOwner(
        connectedWalletAddress,
      )
    }
  }, [
    connectedWalletAddress,
    useConnectedWallet,
  ])


  function handleOwnerModeChange(
    event,
  ) {
    const checked =
      event.target.checked

    setUseConnectedWallet(
      checked,
    )

    setError("")

    if (
      checked
    ) {
      setOwner(
        connectedWalletAddress,
      )
    } else {
      setOwner("")
    }
  }


  function handleClose() {
    if (
      submitting
    ) {
      return
    }

    onClose()
  }


  async function handleSubmit(
    event,
  ) {
    event.preventDefault()

    if (
      submitting
    ) {
      return
    }

    setError("")
    setSuccess(null)

    const cleanSurvey =
      surveyNumber.trim()

    const cleanOwner =
      owner.trim()

    const numericExtent =
      Number(
        extent,
      )


    if (
      !cleanSurvey
    ) {
      setError(
        "Survey number is required.",
      )

      return
    }


    if (
      !Number.isInteger(
        numericExtent,
      ) ||
      numericExtent <= 0
    ) {
      setError(
        "Land extent must be a positive integer.",
      )

      return
    }


    if (
      !cleanOwner
    ) {
      setError(
        "Owner Algorand address is required.",
      )

      return
    }


    if (
      !algosdk.isValidAddress(
        cleanOwner,
      )
    ) {
      setError(
        "Please enter a valid Algorand owner address.",
      )

      return
    }


    if (
      !connectedWalletAddress
    ) {
      setError(
        "Connect Government Pera Wallet first.",
      )

      return
    }


    if (
      !currentUser?.id
    ) {
      setError(
        "Signed-in Government user is required for x402 payment.",
      )

      return
    }


    try {
      setSubmitting(
        true,
      )


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
        `direct-register-${currentUser.id}-${cleanSurvey}`


      const x402Payment =
        await executeX402Payment({
          action:
            "register_land",

          userId:
            currentUser.id,

          resourceId,
        })


      console.log(
        "Direct Register Land x402 payment verified:",
        x402Payment,
      )


      /*
       * ==========================================
       * STEP 2
       * REGISTER LAND ON ALGORAND
       * ==========================================
       */

      setProcessingStage(
        "Payment Verified - Step 2/2: Confirm Land Registration in Pera",
      )


      const result =
        await registerLandModule11({
          governmentAddress:
            connectedWalletAddress,

          surveyNumber:
            cleanSurvey,

          extent:
            numericExtent,

          ownerAddress:
            cleanOwner,
        })


      /*
       * ==========================================
       * STEP 3
       * CONSUME X402 PAYMENT
       *
       * Only after blockchain registration
       * succeeds.
       * ==========================================
       */

      await consumeX402Payment({
        paymentId:
          x402Payment.paymentId,

        action:
          "register_land",

        resourceId,
      })


      setProcessingStage(
        "Land Registered - Updating Dashboard...",
      )


      setSuccess(
        result,
      )


      if (
        onSuccess
      ) {
        try {
          await onSuccess(
            result,
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
        "Register land error:",
        err,
      )


      const message =
        err?.message ||
        "Land registration failed."

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
          "Another Pera Wallet transaction is pending. Complete or close it and try again.",
        )

      } else {
        setError(
          message,
        )
      }

    } finally {
      setSubmitting(
        false,
      )

      setProcessingStage("")
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
            !submitting
          ) {
            handleClose()
          }
        }
      }
    >

      <div
        className="modal-card"

        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <h2>
              Register New Land
            </h2>

            <p>
              Create a new immutable land
              record on Algorand TestNet.
            </p>

          </div>


          <button
            className="close-btn"

            onClick={
              handleClose
            }

            type="button"

            disabled={
              submitting
            }
          >
            ×
          </button>

        </div>


        {!success && (
          <form
            onSubmit={
              handleSubmit
            }
          >

            {error && (
              <div
                style={{
                  marginBottom:
                    "18px",

                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255, 80, 80, 0.12)",
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


            {submitting &&
              processingStage && (

                <div
                  style={{
                    marginBottom:
                      "18px",

                    padding:
                      "14px",

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


            <div
              style={{
                display:
                  "grid",

                gap:
                  "18px",
              }}
            >

              <div>

                <label
                  htmlFor="survey-number"
                >
                  <strong>
                    Survey Number
                  </strong>
                </label>


                <input
                  id="survey-number"

                  type="text"

                  value={
                    surveyNumber
                  }

                  onChange={
                    (event) =>
                      setSurveyNumber(
                        event.target.value,
                      )
                  }

                  placeholder="Example: SURVEY-001"

                  disabled={
                    submitting
                  }

                  required

                  style={{
                    width:
                      "100%",

                    boxSizing:
                      "border-box",

                    marginTop:
                      "8px",

                    padding:
                      "12px 14px",

                    borderRadius:
                      "10px",
                  }}
                />

              </div>


              <div>

                <label
                  htmlFor="land-extent"
                >
                  <strong>
                    Land Extent
                  </strong>
                </label>


                <input
                  id="land-extent"

                  type="number"

                  min="1"

                  step="1"

                  value={
                    extent
                  }

                  onChange={
                    (event) =>
                      setExtent(
                        event.target.value,
                      )
                  }

                  placeholder="Example: 1500"

                  disabled={
                    submitting
                  }

                  required

                  style={{
                    width:
                      "100%",

                    boxSizing:
                      "border-box",

                    marginTop:
                      "8px",

                    padding:
                      "12px 14px",

                    borderRadius:
                      "10px",
                  }}
                />


                <small>
                  Enter extent as a
                  positive integer.
                </small>

              </div>


              <div>

                <label
                  htmlFor="owner-address"
                >
                  <strong>
                    Owner Algorand Address
                  </strong>
                </label>


                <div
                  style={{
                    margin:
                      "10px 0",
                  }}
                >

                  <label>

                    <input
                      type="checkbox"

                      checked={
                        useConnectedWallet
                      }

                      disabled={
                        !connectedWalletAddress ||
                        submitting
                      }

                      onChange={
                        handleOwnerModeChange
                      }
                    />

                    {" "}

                    Use my connected Pera
                    Wallet as owner

                  </label>

                </div>


                <textarea
                  id="owner-address"

                  value={
                    owner
                  }

                  onChange={
                    (event) =>
                      setOwner(
                        event.target.value,
                      )
                  }

                  disabled={
                    useConnectedWallet ||
                    submitting
                  }

                  placeholder="Enter Algorand owner wallet address"

                  rows="4"

                  required

                  style={{
                    width:
                      "100%",

                    boxSizing:
                      "border-box",

                    padding:
                      "12px 14px",

                    borderRadius:
                      "10px",

                    resize:
                      "vertical",
                  }}
                />


                {useConnectedWallet &&
                  connectedWalletAddress && (

                    <small>
                      ✓ Connected wallet
                      will be stored as the
                      land owner.
                    </small>
                  )}

              </div>


              <div
                style={{
                  padding:
                    "14px",

                  borderRadius:
                    "10px",

                  background:
                    "rgba(255,255,255,0.06)",
                }}
              >

                <strong>
                  Registration Note
                </strong>

                <p
                  style={{
                    marginBottom:
                      0,
                  }}
                >
                  The connected wallet
                  represents the current
                  Government user. The owner
                  address represents the
                  person who legally owns
                  this land record.
                </p>

              </div>


              <div
                style={{
                  display:
                    "flex",

                  justifyContent:
                    "flex-end",

                  gap:
                    "10px",

                  flexWrap:
                    "wrap",
                }}
              >

                <button
                  type="button"

                  className="action-btn secondary-btn"

                  onClick={
                    handleClose
                  }

                  disabled={
                    submitting
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"

                  className="action-btn primary-btn"

                  disabled={
                    submitting
                  }
                >
                  {submitting
                    ? (
                        processingStage ||
                        "Processing..."
                      )
                    : "Register on Algorand"}
                </button>

              </div>

            </div>

          </form>
        )}


        {success && (
          <div>

            <div
              style={{
                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(80,180,120,0.12)",

                marginBottom:
                  "18px",
              }}
            >

              <h3
                style={{
                  marginTop:
                    0,
                }}
              >
                ✅ Land Registered
                Successfully
              </h3>


              <p>

                <strong>
                  Land ID:
                </strong>{" "}

                {
                  success.landId
                }

              </p>


              <p>

                <strong>
                  Survey Number:
                </strong>{" "}

                {
                  success.surveyNumber
                }

              </p>


              <p>

                <strong>
                  Extent:
                </strong>{" "}

                {
                  success.extent
                }

              </p>


              <p>
                <strong>
                  Owner:
                </strong>
              </p>


              <div
                style={{
                  wordBreak:
                    "break-all",

                  padding:
                    "10px",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(0,0,0,0.15)",
                }}
              >
                {
                  success.ownerAddress
                }
              </div>


              {success.txId && (
                <div
                  style={{
                    marginTop:
                      "16px",
                  }}
                >

                  <strong>
                    Blockchain Proof:
                  </strong>

                  <br />


                  <a
                    href={
                      `https://lora.algokit.io/testnet/transaction/${success.txId}`
                    }

                    target="_blank"

                    rel="noopener noreferrer"

                    style={{
                      wordBreak:
                        "break-all",
                    }}
                  >
                    View Transaction on
                    Algorand TestNet ↗
                  </a>

                </div>
              )}

            </div>


            <div
              style={{
                display:
                  "flex",

                justifyContent:
                  "flex-end",
              }}
            >

              <button
                type="button"

                className="action-btn primary-btn"

                onClick={
                  handleClose
                }
              >
                Done
              </button>

            </div>

          </div>
        )}

      </div>

    </div>
  )
}


export default RegisterLandModal