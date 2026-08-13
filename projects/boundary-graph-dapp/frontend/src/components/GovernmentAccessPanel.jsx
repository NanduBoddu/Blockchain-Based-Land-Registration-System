import {
  useState,
} from "react"

import {
  peraWallet,
} from "./WalletConnect"

import {
  isGovernment,
  requestGovernmentAccess,
  getMyGovernmentRequest,
} from "../services/module11Service"


function GovernmentAccessPanel({
  walletAddress,
}) {
  const [
    message,
    setMessage,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)


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
            "Pera Wallet session is not active. Disconnect, reconnect and try again.",
          )
        }
      }


      const signerTransactions =
        txnGroup.map(
          (txn, index) => ({
            txn,

            signers:
              indexesToSign.includes(
                index,
              )
                ? [address]
                : [],
          }),
        )


      let signedTransactions


      try {
        signedTransactions =
          await peraWallet
            .signTransaction(
              [
                signerTransactions,
              ],
              address,
            )
      } catch (err) {
        console.error(
          "Government access signing error:",
          err,
        )

        const message =
          err?.message ||
          ""

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
          throw new Error(
            "Pera Wallet transaction was cancelled.",
          )
        }

        throw new Error(
          message ||
          "Unable to sign transaction with Pera Wallet.",
        )
      }


      if (
        !Array.isArray(
          signedTransactions,
        )
      ) {
        throw new Error(
          "Pera Wallet did not return signed transaction data.",
        )
      }


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
        "Pera Wallet signature response mismatch. Disconnect, refresh and reconnect.",
      )
    }
  }


  function getSession() {
    if (
      !walletAddress
    ) {
      throw new Error(
        "Connect Pera Wallet first.",
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


  async function handleCheckRole() {
    try {
      setLoading(true)

      setMessage(
        "Checking blockchain role...",
      )


      const session =
        getSession()


      const role =
        await isGovernment(
          session,
        )


      if (
        role === 1
      ) {
        setMessage(
          "Government role confirmed on TestNet.",
        )
      } else {
        setMessage(
          "This wallet currently has Public role.",
        )
      }
    } catch (err) {
      console.error(err)

      setMessage(
        err.message ||
        "Unable to check role.",
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleRequest() {
    try {
      setLoading(true)

      setMessage(
        "Approve the Government Access Request in Pera Wallet...",
      )


      const session =
        getSession()


      const result =
        await requestGovernmentAccess(
          session,
        )


      setMessage(
        `Government Access Request submitted successfully. Request ID: ${result.requestId}`,
      )
    } catch (err) {
      console.error(err)

      setMessage(
        err.message ||
        "Unable to submit Government Access Request.",
      )
    } finally {
      setLoading(false)
    }
  }


  async function handleMyRequest() {
    try {
      setLoading(true)

      setMessage(
        "Checking your request...",
      )


      const session =
        getSession()


      const result =
        await getMyGovernmentRequest(
          session,
        )


      if (
        result.requestId === 0
      ) {
        setMessage(
          "No Government Access Request found for this wallet.",
        )

        return
      }


      setMessage(
        `Request #${result.requestId} - ${result.statusText}`,
      )
    } catch (err) {
      console.error(err)

      setMessage(
        err.message ||
        "Unable to load Government Access Request.",
      )
    } finally {
      setLoading(false)
    }
  }


  return (
    <div className="actions-card">

      <h3>
        Government Access
      </h3>

      <p>
        Public users can request Government access.
        Approval is controlled on-chain.
      </p>


      <div className="actions-grid">

        <button
          type="button"
          className="action-btn secondary-btn"
          disabled={
            loading ||
            !walletAddress
          }
          onClick={
            handleCheckRole
          }
        >
          Check My Role
        </button>


        <button
          type="button"
          className="action-btn primary-btn"
          disabled={
            loading ||
            !walletAddress
          }
          onClick={
            handleRequest
          }
        >
          Send Government Access Request
        </button>


        <button
          type="button"
          className="action-btn secondary-btn"
          disabled={
            loading ||
            !walletAddress
          }
          onClick={
            handleMyRequest
          }
        >
          My Request
        </button>

      </div>


      {message && (
        <div
          style={{
            marginTop:
              "16px",

            padding:
              "14px",

            borderRadius:
              "10px",

            background:
              "rgba(255,255,255,0.06)",
          }}
        >
          {message}
        </div>
      )}

    </div>
  )
}


export default GovernmentAccessPanel