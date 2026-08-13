import {
  useState,
} from "react"

import algosdk from "algosdk"

import {
  transferOwnership,
} from "../services/ownershipService"

import {
  consumeX402Payment,
  executeX402Payment,
} from "../services/x402ClientService"

import {
  peraWallet,
} from "./WalletConnect"


function TransferOwnershipModal({
  walletAddress,
  currentUser = null,
  onClose,
  onSuccess,
}) {
  const [
    landId,
    setLandId,
  ] = useState("")

  const [
    newOwnerAddress,
    setNewOwnerAddress,
  ] = useState("")

  const [
    loading,
    setLoading,
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


  function getSession() {
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
  }


  async function handleSubmit(
    event,
  ) {
    event.preventDefault()


    if (
      loading
    ) {
      return
    }


    setError("")
    setSuccess(null)


    const numericLandId =
      Number(
        landId,
      )


    if (
      !Number.isInteger(
        numericLandId,
      ) ||
      numericLandId <= 0
    ) {
      setError(
        "Enter a valid Land ID.",
      )

      return
    }


    const cleanNewOwner =
      newOwnerAddress.trim()


    if (
      !cleanNewOwner
    ) {
      setError(
        "Enter the new owner's Algorand wallet address.",
      )

      return
    }


    if (
      !algosdk.isValidAddress(
        cleanNewOwner,
      )
    ) {
      setError(
        "Enter a valid Algorand new owner wallet address.",
      )

      return
    }


    if (
      !walletAddress
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
      setLoading(
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
        `transfer-ownership-${numericLandId}-${cleanNewOwner}`


      const x402Payment =
        await executeX402Payment({
          action:
            "transfer_ownership",

          userId:
            currentUser.id,

          resourceId,
        })


      console.log(
        "Transfer Ownership x402 payment verified:",
        x402Payment,
      )


      /*
       * ==========================================
       * STEP 2
       * OWNERSHIP TRANSFER
       * ==========================================
       */

      setProcessingStage(
        "Payment Verified - Step 2/2: Confirm Ownership Transfer in Pera",
      )


      const session =
        getSession()


      const result =
        await transferOwnership({
          ...session,

          landId:
            numericLandId,

          newOwnerAddress:
            cleanNewOwner,
        })


      /*
       * ==========================================
       * CONSUME X402 PAYMENT
       *
       * Only consume after the ownership
       * transfer transaction succeeds.
       * ==========================================
       */

      await consumeX402Payment({
        paymentId:
          x402Payment.paymentId,

        action:
          "transfer_ownership",

        resourceId,
      })


      setProcessingStage(
        "Ownership Transferred - Updating Dashboard...",
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
        "Transfer ownership error:",
        err,
      )


      const message =
        err?.message ||
        "Unable to transfer ownership."


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
          "Pera Wallet transaction was cancelled or rejected.",
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
      setLoading(
        false,
      )

      setProcessingStage("")
    }
  }


  function handleReset() {
    if (
      loading
    ) {
      return
    }

    setLandId("")
    setNewOwnerAddress("")
    setError("")
    setSuccess(null)
    setProcessingStage("")
  }


  function handleClose() {
    if (
      loading
    ) {
      return
    }

    onClose()
  }


  return (
    <div
      className="modal-overlay"

      onClick={
        (event) => {
          if (
            event.target ===
              event.currentTarget
          ) {
            handleClose()
          }
        }
      }
    >

      <div
        className="modal-card"

        onClick={
          (event) =>
            event.stopPropagation()
        }

        style={{
          maxWidth:
            "650px",
        }}
      >

        <div className="modal-header">

          <div>

            <h2>
              Transfer Ownership
            </h2>

            <p>
              Government can transfer a
              registered land parcel to a new
              Algorand wallet owner.
            </p>

          </div>


          <button
            type="button"

            className="modal-close"

            onClick={
              handleClose
            }

            disabled={
              loading
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
                  htmlFor="transfer-land-id"

                  style={{
                    display:
                      "block",

                    marginBottom:
                      "8px",

                    fontWeight:
                      "600",
                  }}
                >
                  Land ID
                </label>


                <input
                  id="transfer-land-id"

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

                  required

                  disabled={
                    loading
                  }

                  style={{
                    width:
                      "100%",

                    boxSizing:
                      "border-box",

                    padding:
                      "12px 14px",

                    borderRadius:
                      "10px",
                  }}
                />

              </div>


              <div>

                <label
                  htmlFor="new-owner-address"

                  style={{
                    display:
                      "block",

                    marginBottom:
                      "8px",

                    fontWeight:
                      "600",
                  }}
                >
                  New Owner Wallet Address
                </label>


                <textarea
                  id="new-owner-address"

                  value={
                    newOwnerAddress
                  }

                  onChange={
                    (event) =>
                      setNewOwnerAddress(
                        event.target.value,
                      )
                  }

                  placeholder="Enter the new owner's Algorand wallet address"

                  rows="4"

                  required

                  disabled={
                    loading
                  }

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
                  Important:
                </strong>{" "}

                The current owner stored
                on-chain will be replaced by
                this wallet, while the
                ownership transfer history
                remains recorded on the
                blockchain.

              </div>


              {loading &&
                processingStage && (

                  <div
                    style={{
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


              {error && (
                <div
                  style={{
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

                  disabled={
                    loading
                  }

                  onClick={
                    handleClose
                  }
                >
                  Cancel
                </button>


                <button
                  type="submit"

                  className="action-btn primary-btn"

                  disabled={
                    loading
                  }
                >
                  {loading
                    ? (
                        processingStage ||
                        "Processing..."
                      )
                    : "Transfer Ownership"}
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
                ✅ Ownership Transfer Successful
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
                  Transfer ID:
                </strong>{" "}

                {
                  success.transferId
                }

              </p>


              <p>

                <strong>
                  New Owner:
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
                  success.newOwnerAddress
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
                    Transaction:
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
                    View on TestNet Explorer ↗
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
                  handleReset
                }
              >
                Transfer Another
              </button>


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


export default TransferOwnershipModal