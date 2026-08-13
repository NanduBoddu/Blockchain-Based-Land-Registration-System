import algosdk from "algosdk"

import {
  useEffect,
  useState,
} from "react"

import {
  registerLandModule11,
} from "../services/registerLandService"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService"

import {
  approveLandRegistrationRequest,
  getAllLandRegistrationRequests,
  rejectLandRegistrationRequest,
} from "../services/publicLandRequestService"


function LandRegistrationRequestsModal({
  currentUser,
  governmentWalletAddress,
  onClose,
  onChanged,
}) {
  const [
    requests,
    setRequests,
  ] = useState([])

  const [
    processingId,
    setProcessingId,
  ] = useState("")

  const [
    processingStage,
    setProcessingStage,
  ] = useState("")

  const [
    error,
    setError,
  ] = useState("")


  function refresh() {
    setRequests(
      getAllLandRegistrationRequests(),
    )
  }


  useEffect(() => {
    refresh()
  }, [])


  async function handleApprove(
  request,
) {
  if (
    !governmentWalletAddress
  ) {
    setError(
      "Connect the authorized Government Pera Wallet first.",
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


  /*
   * VALIDATE EVERYTHING BEFORE PAYMENT.
   * User must never pay for an invalid request.
   */

  const cleanSurvey =
    String(
      request?.surveyNumber ||
      "",
    ).trim()

  const numericExtent =
    Number(
      request?.extent,
    )

  const cleanOwner =
    String(
      request?.ownerAddress ||
      "",
    ).trim()


  if (
    !cleanSurvey
  ) {
    setError(
      "Survey number is invalid. Payment was not requested.",
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
      "Land extent is invalid. Payment was not requested.",
    )

    return
  }


  if (
    !algosdk.isValidAddress(
      cleanOwner,
    )
  ) {
    setError(
      "This request contains an invalid Algorand owner address. Payment was not requested.",
    )

    return
  }


  setError("")

  setProcessingId(
    request.id,
  )

  setProcessingStage(
    "Step 1/2: Confirm x402 Payment in Pera",
  )

  try {

    /*
     * STEP 1:
     * x402 payment only after request validation.
     */

    const x402Payment =
      await executeX402Payment({
        action:
          "register_land",

        userId:
          currentUser.id,

       resourceId:
         request.id,
     })


    console.log(
      "x402 payment verified:",
      x402Payment,
    )

    setProcessingStage(
      "Payment Verified - Step 2/2: Confirm Land Registration in Pera",
    )


    /*
     * STEP 2:
     * Register land only after payment verification.
     */

    const result =
      await registerLandModule11({
        governmentAddress:
          governmentWalletAddress,

        surveyNumber:
          cleanSurvey,

        extent:
          numericExtent,

        ownerAddress:
          cleanOwner,
      })
    setProcessingStage(
      "Land Registered - Saving Approval...",
    )


    /*
     * STEP 3:
     * Persist approval in backend.
     */

    await approveLandRegistrationRequest({
      requestId:
        request.id,

      governmentUser:
        currentUser,

      blockchainResult:
        result,
    })

    await consumeX402Payment({
      paymentId:
        x402Payment.paymentId,

      action:
        "register_land",

      resourceId:
        request.id,
    })

    refresh()


    await onChanged?.(
      result,
    )

  } catch (err) {

    console.error(
      "Public land approval error:",
      err,
    )


    setError(
      err?.message ||
      "Land registration failed.",
    )

  } finally {

    setProcessingId("")
    setProcessingStage("")
  }
}


  async function handleReject(
    request,
  ) {
    const reason =
      window.prompt(
        "Enter rejection reason:",
        "",
      )

    if (reason === null) {
      return
    }

    try {
      await rejectLandRegistrationRequest({
        requestId:
          request.id,

        governmentUser:
          currentUser,

        reason,
      })

      refresh()

      onChanged?.()
    } catch (err) {
      setError(
        err?.message ||
        "Unable to reject request.",
      )
    }
  }


  return (
    <div
      className="modal-overlay"
      style={{
        overflowY:
          "auto",
        alignItems:
          "flex-start",
      }}
    >
      <div
        className="modal-card"
        style={{
          width:
            "min(850px, 96vw)",
          maxHeight:
            "90vh",
          overflowY:
            "auto",
          margin:
            "5vh auto",
        }}
      >

        <div className="modal-header">

          <div>
            <h2>
              Land Registration Requests
            </h2>

            <p>
              Review Public land
              registration requests.
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            disabled={
              Boolean(
                processingId,
              )
            }
          >
            ×
          </button>

        </div>


        {error && (
          <div className="error-box">
            {error}
          </div>
        )}


        {requests.length ===
        0 ? (
          <div
            style={{
              padding:
                "30px",
              textAlign:
                "center",
            }}
          >
            No land registration
            requests yet.
          </div>
        ) : (
          <div
            style={{
              display:
                "grid",
              gap:
                "14px",
            }}
          >

            {requests.map(
              (request) => (
                <div
                  key={
                    request.id
                  }
                  style={{
                    padding:
                      "18px",
                    border:
                      "1px solid rgba(128,128,128,0.20)",
                    borderRadius:
                      "14px",
                  }}
                >

                  <h3>
                    Request #
                    {
                      request.requestNumber
                    }
                  </h3>

                  <p>
                    <strong>
                      Applicant:
                    </strong>{" "}
                    {
                      request.applicantName
                    }
                  </p>

                  <p>
                    <strong>
                      Email:
                    </strong>{" "}
                    {
                      request.applicantEmail
                    }
                  </p>

                  <p>
                    <strong>
                      Survey Number:
                    </strong>{" "}
                    {
                      request.surveyNumber
                    }
                  </p>

                  <p>
                    <strong>
                      Extent:
                    </strong>{" "}
                    {
                      request.extent
                    }
                  </p>

                  <p
                    style={{
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    <strong>
                      Owner Wallet:
                    </strong>{" "}
                    {
                      request.ownerAddress
                    }
                  </p>

                  {request.note && (
                    <p>
                      <strong>
                        Note:
                      </strong>{" "}
                      {
                        request.note
                      }
                    </p>
                  )}

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    {
                      request.status
                    }
                  </p>


                  {request.status ===
                    "Approved" && (
                    <>
                      <p>
                        <strong>
                          Land ID:
                        </strong>{" "}
                        #
                        {
                          request.landId
                        }
                      </p>

                      <p>
                        <strong>
                          Confirmed Round:
                        </strong>{" "}
                        {
                          request.confirmedRound ||
                          "-"
                        }
                      </p>
                    </>
                  )}


                  {request.status ===
                    "Rejected" &&
                    request.rejectionReason && (
                    <p>
                      <strong>
                        Rejection Reason:
                      </strong>{" "}
                      {
                        request.rejectionReason
                      }
                    </p>
                  )}


                  {request.status ===
                    "Pending" && (
                    <div
                      style={{
                        display:
                          "flex",
                        gap:
                          "10px",
                        marginTop:
                          "16px",
                        flexWrap:
                          "wrap",
                      }}
                    >

                      <button
                        type="button"
  			className="action-btn primary-btn"
  			disabled={
		          processingId ===
  		          request.id
 		        }
   		        onClick={() =>
    			  handleApprove(
     			    request,
    			  )
  			}
                      >
  			{processingId ===
		        request.id
 		          ? (
    			      processingStage ||
   			     "Processing..."
  			    )
		          : "Approve & Register"}
                      </button>


                      <button
                        type="button"
                        className="action-btn secondary-btn"
                        disabled={
                          Boolean(
                            processingId,
                          )
                        }
                        onClick={() =>
                          handleReject(
                            request,
                          )
                        }
                      >
                        Reject
                      </button>

                    </div>
                  )}

                </div>
              ),
            )}

          </div>
        )}

      </div>
    </div>
  )
}


export default LandRegistrationRequestsModal