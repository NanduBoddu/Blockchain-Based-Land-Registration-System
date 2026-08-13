import {
  useState,
} from "react"

import {
  getLand,
} from "../services/algorandService"

import {
  verifyLandModule11,
} from "../services/verifyLandService"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService"


function VerifyLandModal({
  onClose,
  onSuccess,
  connectedWalletAddress = "",
  currentUser = null,
}) {
  const [
    landId,
    setLandId,
  ] = useState("")

  const [
    land,
    setLand,
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
    if (
      Number(status) === 2
    ) {
      return "Verified"
    }

    if (
      Number(status) === 1
    ) {
      return "Under Review"
    }

    return "Pending"
  }


  function shortAddress(
    address,
  ) {
    if (
      !address
    ) {
      return "-"
    }

    return `${address.slice(
      0,
      10,
    )}...${address.slice(
      -8,
    )}`
  }


  async function handleLoadLand() {
    try {
      setLoading(
        true,
      )

      setError("")
      setSuccess(null)
      setLand(null)


      const id =
        Number(
          landId,
        )


      if (
        !Number.isInteger(
          id,
        ) ||
        id <= 0
      ) {
        throw new Error(
          "Enter a valid Land ID.",
        )
      }


      const result =
        await getLand(
          id,
        )


      setLand(
        result,
      )
    } catch (err) {
      console.error(
        err,
      )

      setError(
        err?.message ||
          "Unable to load land.",
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  async function handleVerify() {
    if (
      !land
    ) {
      return
    }


    if (
      Number(
        land.verificationStatus,
      ) === 2
    ) {
      setError(
        `Land #${land.landId} is already verified.`,
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


      /*
       * STEP 1
       * x402 PAYMENT
       */

      setProcessingStage(
        "Step 1/2: Confirm x402 Payment in Pera",
      )


      const resourceId =
        `verify-land-${land.landId}`


      const x402Payment =
        await executeX402Payment({
          action:
            "verify_land",

          userId:
            currentUser.id,

          resourceId,
        })


      console.log(
        "Verify Land x402 payment verified:",
        x402Payment,
      )


      /*
       * STEP 2
       * VERIFY LAND ON ALGORAND
       */

      setProcessingStage(
        "Payment Verified - Step 2/2: Confirm Land Verification in Pera",
      )


      const result =
        await verifyLandModule11({
          governmentAddress:
            connectedWalletAddress,

          landId:
            land.landId,
        })


      /*
       * PAYMENT SUCCESSFULLY USED
       */

      await consumeX402Payment({
        paymentId:
          x402Payment.paymentId,

        action:
          "verify_land",

        resourceId,
      })


      setProcessingStage(
        "Land Verified - Updating Dashboard...",
      )


      const updatedLand =
        await getLand(
          land.landId,
        )


      setLand(
        updatedLand,
      )


      setSuccess({
        ...result,

        land:
          updatedLand,
      })


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
        "Verify land error:",
        err,
      )


      const message =
        err?.message ||
        "Land verification failed."


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
            onClose()
          }
        }
      }
    >

      <div
        className="verify-land-modal-card"
        onMouseDown={
          (event) =>
            event.stopPropagation()
        }
      >

        <div className="modal-header">

          <div>

            <h2>
              Verify Land
            </h2>

            <p>
              Verify an existing land record
              permanently on Algorand TestNet.
            </p>

          </div>


          <button
            type="button"
            className="close-btn"
            onClick={
              onClose
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
              marginBottom:
                "16px",

              padding:
                "14px",

              borderRadius:
                "10px",

              background:
                "rgba(80,180,120,0.12)",
            }}
          >

            <strong>
              ✅ Land verified successfully
            </strong>

            <br />

            Land #
            {success.landId}

            {success.txId && (
              <>
                <br />

                <a
                  href={
                    `https://lora.algokit.io/testnet/transaction/${success.txId}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Transaction ↗
                </a>
              </>
            )}

          </div>
        )}


        <div
          style={{
            display:
              "grid",

            gap:
              "14px",
          }}
        >

          <label>
            <strong>
              Land ID
            </strong>
          </label>


          <input
            type="number"
            min="1"
            step="1"
            value={
              landId
            }
            onChange={
              (event) =>
                setLandId(
                  event.target.value,
                )
            }
            placeholder="Example: 1"
            disabled={
              verifying
            }
          />


          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={
              handleLoadLand
            }
            disabled={
              loading ||
              verifying
            }
          >
            {loading
              ? "Loading..."
              : "Load Land"}
          </button>

        </div>


        {land && (
          <div
            style={{
              marginTop:
                "20px",

              padding:
                "18px",

              borderRadius:
                "12px",

              background:
                "rgba(255,255,255,0.06)",
            }}
          >

            <h3>
              Land #{land.landId}
            </h3>


            <p>
              <strong>
                {statusText(
                  land.verificationStatus,
                )}
              </strong>
            </p>


            <p>
              Survey Number
              <br />

              <strong>
                {land.surveyNumber}
              </strong>
            </p>


            <p>
              Extent
              <br />

              <strong>
                {land.extent}
              </strong>
            </p>


            <p>
              Status Code
              <br />

              <strong>
                {land.verificationStatus}
              </strong>
            </p>


            <p>
              Owner
              <br />

              <code>
                {shortAddress(
                  land.ownerAddress,
                )}
              </code>
            </p>


            {Number(
              land.verificationStatus,
            ) !== 2 && (
              <button
                type="button"
                className="action-btn primary-btn"
                onClick={
                  handleVerify
                }
                disabled={
                  verifying
                }
              >
                {verifying
                  ? (
                      processingStage ||
                      "Processing..."
                    )
                  : "Verify Land on Algorand"}
              </button>
            )}

          </div>
        )}


        <div
          style={{
            marginTop:
              "20px",

            display:
              "flex",

            justifyContent:
              "flex-end",
          }}
        >

          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={
              onClose
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


export default VerifyLandModal