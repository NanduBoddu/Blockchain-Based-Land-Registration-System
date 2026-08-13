import {
  useCallback,
  useEffect,
  useState,
} from "react"

import {
  getAllGovernmentRequests,
  approveGovernmentRequest,
  rejectGovernmentRequest,
} from "../services/module11Service"

import {
  peraWallet,
} from "./WalletConnect"


function GovernmentRequestsModal({
  walletAddress,
  onClose,
  onSuccess,
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
    actionLoading,
    setActionLoading,
  ] = useState(null)

  const [
    error,
    setError,
  ] = useState("")

  const [
    message,
    setMessage,
  ] = useState("")


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
            "Pera Wallet session is not active. Disconnect and reconnect.",
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
        const requested =
          indexesToSign
            .map(
              (index) =>
                signedTransactions[
                  index
                ],
            )
            .filter(Boolean)

        if (
          requested.length ===
          indexesToSign.length
        ) {
          return requested
        }
      }


      throw new Error(
        "Pera Wallet signature response mismatch.",
      )
    }
  }


  const getSession =
    useCallback(
      () => {
        if (
          !walletAddress
        ) {
          throw new Error(
            "Connect Government Pera Wallet first.",
          )
        }

        return {
          address:
            walletAddress,

          signer:
            createSigner(
              walletAddress,
            ),
        }
      },
      [
        walletAddress,
      ],
    )


  const loadRequests =
    useCallback(
      async () => {
        try {
          setLoading(
            true,
          )

          setError(
            "",
          )

          const session =
            getSession()


          const result =
            await getAllGovernmentRequests(
              session,
            )


          setRequests(
            result.requests || [],
          )
        } catch (err) {
          console.error(
            "Government request loading error:",
            err,
          )

          setError(
            err.message ||
              "Unable to load Government requests.",
          )
        } finally {
          setLoading(
            false,
          )
        }
      },
      [
        getSession,
      ],
    )


  useEffect(() => {
    loadRequests()
  }, [
    loadRequests,
  ])


  async function handleApprove(
    request,
  ) {
    if (
      Number(
        request.status,
      ) !== 0
    ) {
      return
    }


    const confirmed =
      window.confirm(
        `Approve Government Access Request #${request.requestId}?`,
      )


    if (
      !confirmed
    ) {
      return
    }


    try {
      setActionLoading(
        `approve-${request.requestId}`,
      )

      setError(
        "",
      )

      setMessage(
        `Approve Request #${request.requestId} in Pera Wallet...`,
      )


      const session =
        getSession()


      const result =
        await approveGovernmentRequest({
          ...session,

          requestId:
            request.requestId,

          requesterAddress:
            request.requesterAddress,
        })


      setMessage(
        `Request #${request.requestId} approved successfully.${result.txId ? ` TX: ${result.txId}` : ""}`,
      )


      await loadRequests()


      if (
        onSuccess
      ) {
        await onSuccess()
      }
    } catch (err) {
      console.error(
        "Government approve error:",
        err,
      )

      setError(
        err.message ||
          "Unable to approve Government request.",
      )

      setMessage(
        "",
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }


  async function handleReject(
    request,
  ) {
    if (
      Number(
        request.status,
      ) !== 0
    ) {
      return
    }


    const confirmed =
      window.confirm(
        `Reject Government Access Request #${request.requestId}?`,
      )


    if (
      !confirmed
    ) {
      return
    }


    try {
      setActionLoading(
        `reject-${request.requestId}`,
      )

      setError(
        "",
      )

      setMessage(
        `Reject Request #${request.requestId} in Pera Wallet...`,
      )


      const session =
        getSession()


      const result =
        await rejectGovernmentRequest({
          ...session,

          requestId:
            request.requestId,
        })


      setMessage(
        `Request #${request.requestId} rejected successfully.${result.txId ? ` TX: ${result.txId}` : ""}`,
      )


      await loadRequests()


      if (
        onSuccess
      ) {
        await onSuccess()
      }
    } catch (err) {
      console.error(
        "Government reject error:",
        err,
      )

      setError(
        err.message ||
          "Unable to reject Government request.",
      )

      setMessage(
        "",
      )
    } finally {
      setActionLoading(
        null,
      )
    }
  }


  function shortAddress(
    address,
  ) {
    if (
      !address
    ) {
      return "Unknown"
    }

    if (
      address.length <= 18
    ) {
      return address
    }

    return (
      `${address.slice(
        0,
        8,
      )}...${address.slice(
        -8,
      )}`
    )
  }


  function statusStyle(
    status,
  ) {
    const value =
      Number(
        status,
      )

    if (
      value === 0
    ) {
      return {
        text:
          "Pending",
      }
    }

    if (
      value === 1
    ) {
      return {
        text:
          "Approved",
      }
    }

    if (
      value === 2
    ) {
      return {
        text:
          "Rejected",
      }
    }

    return {
      text:
        "Unknown",
    }
  }


  return (
    <div
      className="modal-overlay"
      onClick={
        onClose
      }
    >
      <div
        className="modal-card"
        onClick={
          (
            event,
          ) =>
            event.stopPropagation()
        }
        style={{
          maxWidth:
            "850px",
        }}
      >

        <div className="modal-header">

          <div>

            <h2>
              Government Access Requests
            </h2>

            <p>
              Review Public wallet requests and
              approve or reject Government access
              directly on Algorand TestNet.
            </p>

          </div>


          <button
            type="button"
            className="modal-close"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>


        {loading && (
          <div
            style={{
              padding:
                "20px 0",
            }}
          >
            Loading Government requests...
          </div>
        )}


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
                "rgba(255, 80, 80, 0.12)",
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
                "14px",

              borderRadius:
                "10px",

              background:
                "rgba(80, 180, 120, 0.12)",
            }}
          >
            {message}
          </div>
        )}


        {!loading &&
          requests.length === 0 && (
            <div
              style={{
                padding:
                  "24px",

                textAlign:
                  "center",
              }}
            >
              No Government access requests found.
            </div>
          )}


        {!loading &&
          requests.length > 0 && (
            <div
              style={{
                display:
                  "grid",

                gap:
                  "14px",
              }}
            >

              {requests.map(
                (
                  request,
                ) => {
                  const status =
                    statusStyle(
                      request.status,
                    )

                  const approveKey =
                    `approve-${request.requestId}`

                  const rejectKey =
                    `reject-${request.requestId}`

                  const isPending =
                    Number(
                      request.status,
                    ) === 0

                  return (
                    <div
                      key={
                        request.requestId
                      }
                      style={{
                        padding:
                          "18px",

                        border:
                          "1px solid rgba(255,255,255,0.12)",

                        borderRadius:
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
                            "15px",

                          alignItems:
                            "flex-start",

                          flexWrap:
                            "wrap",
                        }}
                      >

                        <div>

                          <h3
                            style={{
                              marginTop:
                                0,

                              marginBottom:
                                "8px",
                            }}
                          >
                            Request #
                            {
                              request.requestId
                            }
                          </h3>


                          <div
                            style={{
                              marginBottom:
                                "6px",
                            }}
                          >
                            <strong>
                              Wallet:
                            </strong>{" "}

                            <span
                              title={
                                request.requesterAddress ||
                                ""
                              }
                            >
                              {
                                shortAddress(
                                  request.requesterAddress,
                                )
                              }
                            </span>
                          </div>


                          <div>
                            <strong>
                              Status:
                            </strong>{" "}

                            {
                              status.text
                            }
                          </div>

                        </div>


                        {isPending && (
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
                                actionLoading !==
                                null
                              }
                              onClick={() =>
                                handleApprove(
                                  request,
                                )
                              }
                            >
                              {actionLoading ===
                              approveKey
                                ? "Approving..."
                                : "Approve"}
                            </button>


                            <button
                              type="button"
                              className="action-btn secondary-btn"
                              disabled={
                                actionLoading !==
                                null
                              }
                              onClick={() =>
                                handleReject(
                                  request,
                                )
                              }
                            >
                              {actionLoading ===
                              rejectKey
                                ? "Rejecting..."
                                : "Reject"}
                            </button>

                          </div>
                        )}

                      </div>

                    </div>
                  )
                },
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
          >
            Close
          </button>
        </div>

      </div>
    </div>
  )
}


export default GovernmentRequestsModal