import {
  useEffect,
  useState,
} from "react"

import {
  getAllLands,
} from "../services/algorandService"

import {
  addBoundaryModule11,
} from "../services/boundaryModule11Service"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService"


function AddBoundaryModal({
  onClose,
  onSuccess,
  connectedWalletAddress = "",
  currentUser = null,
}) {
  const [
    lands,
    setLands,
  ] = useState([])

  const [
    landA,
    setLandA,
  ] = useState("")

  const [
    landB,
    setLandB,
  ] = useState("")

  const [
    boundaryHash,
    setBoundaryHash,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(true)

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
    async function loadLands() {
      try {
        setLoading(
          true,
        )

        setError("")

        const result =
          await getAllLands()

        setLands(
          result || [],
        )
      } catch (err) {
        console.error(
          err,
        )

        setError(
          err?.message ||
            "Unable to load lands.",
        )
      } finally {
        setLoading(
          false,
        )
      }
    }

    loadLands()
  }, [])


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
        "Government account information is missing.",
      )

      return
    }


    if (
      !landA ||
      !landB
    ) {
      setError(
        "Select Land A and Land B.",
      )

      return
    }


    if (
      Number(
        landA,
      ) ===
      Number(
        landB,
      )
    ) {
      setError(
        "Land A and Land B cannot be the same.",
      )

      return
    }


    const cleanBoundaryHash =
      boundaryHash.trim()


    if (
      !cleanBoundaryHash
    ) {
      setError(
        "Boundary Hash / Survey Reference is required.",
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


      const numericLandA =
        Number(
          landA,
        )

      const numericLandB =
        Number(
          landB,
        )


      /*
       * Same boundary pair must always produce
       * the same order for retry-safe payments.
       */

      const firstLand =
        Math.min(
          numericLandA,
          numericLandB,
        )

      const secondLand =
        Math.max(
          numericLandA,
          numericLandB,
        )


      const resourceId =
        `add-boundary-${firstLand}-${secondLand}-${cleanBoundaryHash}`


      const x402Payment =
        await executeX402Payment({
          action:
            "add_boundary",

          userId:
            currentUser.id,

          resourceId,
        })


      console.log(
        "Add Boundary x402 payment verified:",
        x402Payment,
      )


      /*
       * ==========================================
       * STEP 2
       * ALGORAND ADD BOUNDARY
       * ==========================================
       */

      setProcessingStage(
        "Payment Verified - Step 2/2: Confirm Boundary Transaction in Pera",
      )


      const result =
        await addBoundaryModule11({
          governmentAddress:
            connectedWalletAddress,

          landA:
            numericLandA,

          landB:
            numericLandB,

          boundaryHash:
            cleanBoundaryHash,
        })


      /*
       * ==========================================
       * CONSUME X402 PAYMENT
       *
       * Only after blockchain transaction
       * succeeded.
       * ==========================================
       */

      await consumeX402Payment({
        paymentId:
          x402Payment.paymentId,

        action:
          "add_boundary",

        resourceId,
      })


      setProcessingStage(
        "Boundary Added - Updating Dashboard...",
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
        "Add boundary error:",
        err,
      )


      const message =
        err?.message ||
        "Boundary creation failed."


      if (
        message
          .toLowerCase()
          .includes(
            "cancel",
          ) ||
        message
          .toLowerCase()
          .includes(
            "reject",
          )
      ) {
        setError(
          "Transaction was cancelled or rejected in Pera Wallet.",
        )

      } else if (
        message
          .toLowerCase()
          .includes(
            "pending",
          )
      ) {
        setError(
          "Another Pera Wallet transaction is pending. Close it and try again.",
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
            onClose()
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
              Add Boundary
            </h2>

            <p>
              Create a new immutable
              relationship between two land
              parcels.
            </p>

          </div>


          <button
            type="button"

            className="close-btn"

            onClick={
              onClose
            }

            disabled={
              submitting
            }
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
                "14px",

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
              padding:
                "18px",

              borderRadius:
                "12px",

              background:
                "rgba(80,180,120,0.12)",
            }}
          >

            <h3>
              ✅ Boundary Added Successfully
            </h3>


            <p>
              <strong>
                Boundary ID:
              </strong>{" "}

              {
                success.boundaryId
              }
            </p>


            <p>
              Land #
              {
                success.landA
              }

              {" ↔ "}

              Land #
              {
                success.landB
              }
            </p>


            {success.txId && (
              <a
                href={
                  `https://lora.algokit.io/testnet/transaction/${success.txId}`
                }

                target="_blank"

                rel="noopener noreferrer"
              >
                View Transaction ↗
              </a>
            )}


            <div
              style={{
                marginTop:
                  "18px",
              }}
            >

              <button
                type="button"

                className="action-btn primary-btn"

                onClick={
                  onClose
                }
              >
                Done
              </button>

            </div>

          </div>
        )}


        {!success && (
          <form
            onSubmit={
              handleSubmit
            }
          >

            {loading ? (
              <p>
                Loading lands...
              </p>
            ) : (

              <div
                style={{
                  display:
                    "grid",

                  gap:
                    "18px",
                }}
              >

                <div>

                  <label>
                    <strong>
                      Land A
                    </strong>
                  </label>


                  <select
                    value={
                      landA
                    }

                    onChange={
                      (event) =>
                        setLandA(
                          event.target.value,
                        )
                    }

                    disabled={
                      submitting
                    }

                    required

                    style={{
                      width:
                        "100%",

                      marginTop:
                        "8px",

                      padding:
                        "12px",
                    }}
                  >

                    <option value="">
                      Select Land A
                    </option>


                    {lands.map(
                      (
                        land,
                      ) => (
                        <option
                          key={
                            land.landId
                          }

                          value={
                            land.landId
                          }
                        >
                          #
                          {
                            land.landId
                          }

                          {" - "}

                          {
                            land.surveyNumber
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>


                <div>

                  <label>
                    <strong>
                      Land B
                    </strong>
                  </label>


                  <select
                    value={
                      landB
                    }

                    onChange={
                      (event) =>
                        setLandB(
                          event.target.value,
                        )
                    }

                    disabled={
                      submitting
                    }

                    required

                    style={{
                      width:
                        "100%",

                      marginTop:
                        "8px",

                      padding:
                        "12px",
                    }}
                  >

                    <option value="">
                      Select Land B
                    </option>


                    {lands.map(
                      (
                        land,
                      ) => (
                        <option
                          key={
                            land.landId
                          }

                          value={
                            land.landId
                          }
                        >
                          #
                          {
                            land.landId
                          }

                          {" - "}

                          {
                            land.surveyNumber
                          }
                        </option>
                      ),
                    )}

                  </select>

                </div>


                <div>

                  <label>
                    <strong>
                      Boundary Hash / Survey Reference
                    </strong>
                  </label>


                  <input
                    type="text"

                    value={
                      boundaryHash
                    }

                    onChange={
                      (event) =>
                        setBoundaryHash(
                          event.target.value,
                        )
                    }

                    placeholder="Example: BOUNDARY-TSY-001-002"

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
                        "12px",
                    }}
                  />


                  <small>
                    This value will be stored
                    immutably in the boundary
                    record.
                  </small>

                </div>


                {landA &&
                  landB && (

                    <div
                      style={{
                        padding:
                          "18px",

                        borderRadius:
                          "12px",

                        background:
                          "rgba(255,255,255,0.06)",

                        textAlign:
                          "center",
                      }}
                    >

                      <strong>
                        Boundary Preview
                      </strong>


                      <p>
                        <strong>
                          Land #
                          {
                            landA
                          }
                        </strong>
                      </p>


                      <div>
                        ─────────
                      </div>


                      <p>
                        <strong>
                          Land #
                          {
                            landB
                          }
                        </strong>
                      </p>

                    </div>
                  )}


                {submitting &&
                  processingStage && (

                    <div
                      style={{
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


                <div
                  style={{
                    display:
                      "flex",

                    justifyContent:
                      "flex-end",

                    gap:
                      "10px",
                  }}
                >

                  <button
                    type="button"

                    className="action-btn secondary-btn"

                    onClick={
                      onClose
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
                      submitting ||
                      loading
                    }
                  >
                    {submitting
                      ? (
                          processingStage ||
                          "Processing..."
                        )
                      : "Add Boundary on Algorand"}
                  </button>

                </div>

              </div>
            )}

          </form>
        )}

      </div>

    </div>
  )
}


export default AddBoundaryModal