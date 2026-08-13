import {
  useEffect,
  useState,
} from "react"

import {
  getUserLandRegistrationRequests,
} from "../services/publicLandRequestService"


const EXPLORER =
  "https://lora.algokit.io/testnet"


function PublicLandRequestsModal({
  currentUser,
  onClose,
}) {
  const [
    requests,
    setRequests,
  ] = useState([])


  useEffect(() => {
    function refresh() {
      setRequests(
        getUserLandRegistrationRequests(
          currentUser?.id,
        ),
      )
    }

    refresh()

    window.addEventListener(
      "boundarygraph-land-requests-changed",
      refresh,
    )

    window.addEventListener(
      "storage",
      refresh,
    )

    return () => {
      window.removeEventListener(
        "boundarygraph-land-requests-changed",
        refresh,
      )

      window.removeEventListener(
        "storage",
        refresh,
      )
    }
  }, [
    currentUser?.id,
  ])


  function statusLabel(
    status,
  ) {
    if (
      status ===
      "Approved"
    ) {
      return "✅ Approved"
    }

    if (
      status ===
      "Rejected"
    ) {
      return "❌ Rejected"
    }

    return "⏳ Pending"
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
            "min(780px, 96vw)",
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
              My Land Registration Requests
            </h2>

            <p>
              Track Government approval status
              for your submitted land requests.
            </p>
          </div>

          <button
            type="button"
            className="close-btn"
            onClick={onClose}
          >
            ×
          </button>

        </div>


        {requests.length ===
        0 ? (
          <div
            style={{
              padding:
                "26px",
              textAlign:
                "center",
            }}
          >
            You have not submitted any
            land registration requests.
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
                    border:
                      "1px solid rgba(128,128,128,0.20)",
                    borderRadius:
                      "14px",
                    padding:
                      "18px",
                  }}
                >

                  <div
                    style={{
                      display:
                        "flex",
                      justifyContent:
                        "space-between",
                      gap:
                        "14px",
                      alignItems:
                        "center",
                      flexWrap:
                        "wrap",
                    }}
                  >
                    <h3
                      style={{
                        margin:
                          0,
                      }}
                    >
                      Request #
                      {
                        request.requestNumber
                      }
                    </h3>

                    <strong>
                      {
                        statusLabel(
                          request.status,
                        )
                      }
                    </strong>
                  </div>


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


                  {request.status ===
                    "Pending" && (
                    <p>
                      Waiting for Government
                      review and approval.
                    </p>
                  )}


                  {request.status ===
                    "Approved" && (
                    <div
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      <p>
                        <strong>
                          Registered Land ID:
                        </strong>{" "}
                        #
                        {
                          request.landId
                        }
                      </p>

                      <p>
                        <strong>
                          Approved By:
                        </strong>{" "}
                        {
                          request.reviewedBy ||
                          "Government"
                        }
                      </p>

                      {request.confirmedRound ? (
                        <p>
                          <strong>
                            Confirmed Round:
                          </strong>{" "}
                          {
                            request.confirmedRound
                          }
                        </p>
                      ) : null}

                      {request.txId && (
                        <a
                          href={`${EXPLORER}/transaction/${request.txId}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View Transaction on TestNet ↗
                        </a>
                      )}
                    </div>
                  )}


                  {request.status ===
                    "Rejected" && (
                    <div
                      style={{
                        marginTop:
                          "10px",
                      }}
                    >
                      <p>
                        <strong>
                          Rejected By:
                        </strong>{" "}
                        {
                          request.reviewedBy ||
                          "Government"
                        }
                      </p>

                      {request.rejectionReason && (
                        <p>
                          <strong>
                            Reason:
                          </strong>{" "}
                          {
                            request.rejectionReason
                          }
                        </p>
                      )}
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


export default PublicLandRequestsModal