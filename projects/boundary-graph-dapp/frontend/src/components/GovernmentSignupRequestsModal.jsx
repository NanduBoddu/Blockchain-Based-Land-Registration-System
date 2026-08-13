import {
  useEffect,
  useState,
} from "react"

import {
  getGovernmentSignupRequests,
  reviewGovernmentSignupRequest,
  syncGovernmentSignupRequests,
} from "../services/authService"


function GovernmentSignupRequestsModal({
  onClose,
  currentUser,
  onRequestUpdated,
}) {
  const [
    requests,
    setRequests,
  ] = useState([])


  const [
    loading,
    setLoading,
  ] = useState(true)


  const [
    processingId,
    setProcessingId,
  ] = useState(null)


  const [
    error,
    setError,
  ] = useState("")


  const [
    message,
    setMessage,
  ] = useState("")


  function loadCachedRequests() {
    const cached =
      getGovernmentSignupRequests()

    setRequests(
      Array.isArray(cached)
        ? cached
        : [],
    )
  }


  async function loadRequestsFromBackend() {
    try {
      setLoading(true)
      setError("")

      const backendRequests =
        await syncGovernmentSignupRequests()

      setRequests(
        Array.isArray(
          backendRequests,
        )
          ? backendRequests
          : [],
      )
    } catch (err) {
      console.error(
        "Unable to load Government signup requests:",
        err,
      )

      setError(
        err?.message ||
          "Unable to load Government signup requests.",
      )

      loadCachedRequests()
    } finally {
      setLoading(false)
    }
  }


  useEffect(() => {
    loadCachedRequests()
    loadRequestsFromBackend()
  }, [])


  async function handleDecision(
    request,
    decision,
  ) {
    if (
      !request ||
      processingId
    ) {
      return
    }


    const identifier =
      request.id ||
      request.requestId


    try {
      setProcessingId(
        identifier,
      )

      setError("")
      setMessage("")


      const updatedRequest =
        await reviewGovernmentSignupRequest({
          requestId:
            identifier,

          decision,

          reviewer: {
            id:
              currentUser?.id ||
              "",

            name:
              currentUser?.name ||
              "Government",
          },
        })


      setMessage(
        decision === "Approved"
          ? `${request.name || "User"} Government access approved successfully.`
          : `${request.name || "User"} Government access request rejected.`,
      )


      await loadRequestsFromBackend()


      if (
        typeof onRequestUpdated ===
        "function"
      ) {
        onRequestUpdated(
          updatedRequest,
        )
      }
    } catch (err) {
      console.error(
        "Government request review failed:",
        err,
      )

      setError(
        err?.message ||
          "Unable to update Government signup request.",
      )
    } finally {
      setProcessingId(
        null,
      )
    }
  }


  const pendingRequests =
    requests.filter(
      (request) =>
        request.status ===
        "Pending",
    )


  const completedRequests =
    requests.filter(
      (request) =>
        request.status !==
        "Pending",
    )


  function formatDate(
    value,
  ) {
    if (
      !value
    ) {
      return "—"
    }


    const date =
      new Date(value)


    if (
      Number.isNaN(
        date.getTime(),
      )
    ) {
      return value
    }


    return date.toLocaleString()
  }


  function shortWallet(
    wallet,
  ) {
    if (
      !wallet
    ) {
      return "Not provided"
    }


    if (
      wallet.length <= 18
    ) {
      return wallet
    }


    return `${wallet.slice(
      0,
      8,
    )}...${wallet.slice(
      -8,
    )}`
  }


  function renderRequest(
    request,
  ) {
    const identifier =
      request.id ||
      request.requestId


    const isProcessing =
      processingId ===
      identifier


    return (
      <div
        key={
          identifier
        }
        style={{
          border:
            "1px solid var(--border)",
          borderRadius:
            "14px",
          padding:
            "16px",
          textAlign:
            "left",
          display:
            "grid",
          gap:
            "12px",
        }}
      >

        <div
          style={{
            display:
              "flex",
            justifyContent:
              "space-between",
            gap:
              "12px",
            alignItems:
              "flex-start",
            flexWrap:
              "wrap",
          }}
        >

          <div>
            <strong
              style={{
                color:
                  "var(--text-h)",
              }}
            >
              {request.name ||
                "Unknown User"}
            </strong>

            <div
              style={{
                marginTop:
                  "4px",
                fontSize:
                  "14px",
              }}
            >
              {request.email ||
                "No email"}
            </div>
          </div>


          <span
            style={{
              padding:
                "5px 10px",
              borderRadius:
                "999px",
              fontSize:
                "13px",
              fontWeight:
                "700",
              border:
                "1px solid var(--border)",
            }}
          >
            {request.status ||
              "Pending"}
          </span>

        </div>


        <div
          style={{
            display:
              "grid",
            gap:
              "6px",
            fontSize:
              "14px",
          }}
        >

          <div>
            <strong>
              Request ID:
            </strong>{" "}
            {request.requestId ??
              request.id ??
              "—"}
          </div>


          <div>
            <strong>
              Wallet:
            </strong>{" "}
            {shortWallet(
              request.walletAddress,
            )}
          </div>


          <div>
            <strong>
              Requested:
            </strong>{" "}
            {formatDate(
              request.requestedAt,
            )}
          </div>


          {request.reviewedAt && (
            <div>
              <strong>
                Reviewed:
              </strong>{" "}
              {formatDate(
                request.reviewedAt,
              )}
            </div>
          )}


          {request.reviewedBy && (
            <div>
              <strong>
                Reviewed By:
              </strong>{" "}
              {request.reviewedBy}
            </div>
          )}

        </div>


        {request.status ===
          "Pending" && (
          <div
            style={{
              display:
                "flex",
              gap:
                "10px",
              flexWrap:
                "wrap",
            }}
          >

            <button
              type="button"
              className="action-btn primary-btn"
              disabled={
                Boolean(
                  processingId,
                )
              }
              onClick={
                () =>
                  handleDecision(
                    request,
                    "Approved",
                  )
              }
            >
              {isProcessing
                ? "Processing..."
                : "Approve"}
            </button>


            <button
              type="button"
              className="action-btn"
              disabled={
                Boolean(
                  processingId,
                )
              }
              onClick={
                () =>
                  handleDecision(
                    request,
                    "Rejected",
                  )
              }
              style={{
                border:
                  "1px solid rgba(255,80,80,0.5)",
                color:
                  "#ef4444",
              }}
            >
              {isProcessing
                ? "Processing..."
                : "Reject"}
            </button>

          </div>
        )}

      </div>
    )
  }


  return (
    <div
      className="modal-overlay"
      onMouseDown={
        (event) => {
          if (
            event.target ===
              event.currentTarget &&
            !processingId
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
        style={{
          maxWidth:
            "760px",
          width:
            "min(760px, 96%)",
          maxHeight:
            "90vh",
          overflowY:
            "auto",
        }}
      >

        <div
          className="modal-header"
        >

          <div>
            <h2>
              Signup Requests
            </h2>

            <p>
              Review Government role
              signup requests stored in
              the LandRegistration System with Blockchain backend.
            </p>
          </div>


          <button
            type="button"
            className="close-btn"
            onClick={
              onClose
            }
            disabled={
              Boolean(
                processingId,
              )
            }
            aria-label="Close"
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


        {message && (
          <div
            style={{
              marginBottom:
                "16px",
              padding:
                "12px",
              borderRadius:
                "10px",
              background:
                "rgba(0,212,170,0.12)",
            }}
          >
            {message}
          </div>
        )}


        {loading ? (
          <div
            style={{
              padding:
                "30px 10px",
            }}
          >
            Loading signup requests...
          </div>
        ) : (
          <>

            <div
              style={{
                marginBottom:
                  "22px",
              }}
            >

              <h3>
                Pending Requests (
                {pendingRequests.length}
                )
              </h3>


              {pendingRequests.length ===
              0 ? (
                <div
                  style={{
                    padding:
                      "20px",
                    border:
                      "1px solid var(--border)",
                    borderRadius:
                      "14px",
                  }}
                >
                  No pending Government
                  signup requests.
                </div>
              ) : (
                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >
                  {pendingRequests.map(
                    renderRequest,
                  )}
                </div>
              )}

            </div>


            {completedRequests.length >
              0 && (
              <div>

                <h3>
                  Reviewed Requests
                </h3>


                <div
                  style={{
                    display:
                      "grid",
                    gap:
                      "12px",
                  }}
                >
                  {completedRequests.map(
                    renderRequest,
                  )}
                </div>

              </div>
            )}

          </>
        )}

      </div>

    </div>
  )
}


export default GovernmentSignupRequestsModal