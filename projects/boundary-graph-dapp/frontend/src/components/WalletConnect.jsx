import {
  useEffect,
  useState,
} from "react"

import {
  PeraWalletConnect,
} from "@perawallet/connect"

import {
  setWalletSession,
} from "../services/algorandService"


export const peraWallet =
  new PeraWalletConnect({
    chainId: 416002,
  })


function WalletConnect({
  onAccountChange,
}) {
  const [
    accountAddress,
    setAccountAddress,
  ] = useState("")

  const [
    connecting,
    setConnecting,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")


  function shortAddress(address) {
    if (!address) {
      return ""
    }

    return `${address.slice(
      0,
      6,
    )}...${address.slice(-6)}`
  }


  function getFriendlyWalletError(
    err,
  ) {
    const message =
      err?.message ||
      ""


    const lowerMessage =
      message.toLowerCase()


    if (
      lowerMessage.includes(
        "signature response mismatch",
      )
    ) {
      return (
        "Pera Wallet did not return the expected signature. " +
        "Disconnect the wallet, refresh this page, reconnect Pera Wallet, and try again."
      )
    }


    if (
      lowerMessage.includes(
        "cancel",
      ) ||
      lowerMessage.includes(
        "reject",
      )
    ) {
      return (
        "The wallet request was cancelled or rejected. " +
        "You can try the transaction again when ready."
      )
    }


    if (
      lowerMessage.includes(
        "timeout",
      )
    ) {
      return (
        "The wallet request timed out. " +
        "Check Pera Wallet and try again."
      )
    }


    if (
      lowerMessage.includes(
        "network",
      )
    ) {
      return (
        "Unable to communicate with Pera Wallet. " +
        "Check your connection and make sure Pera Wallet is using TestNet."
      )
    }


    return (
      message ||
      "Unable to complete the Pera Wallet request."
    )
  }


  function createPeraSigner(
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


      console.log(
        "Pera signing request:",
        {
          wallet:
            address,

          groupSize:
            txnGroup.length,

          indexesToSign,
        },
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
          "Pera signing error:",
          err,
        )

        throw new Error(
          getFriendlyWalletError(
            err,
          ),
        )
      }


      console.log(
        "Pera signing response:",
        {
          received:
            signedTransactions
              ?.length ??
            0,

          expected:
            indexesToSign
              .length,
        },
      )


      if (
        !Array.isArray(
          signedTransactions,
        )
      ) {
        throw new Error(
          "Pera Wallet did not return signed transaction data. Disconnect, reconnect, and try again.",
        )
      }


      /*
       * Algorand TransactionSigner must
       * return one signed transaction
       * for every requested index.
       */
      if (
        signedTransactions.length ===
        indexesToSign.length
      ) {
        return signedTransactions
      }


      /*
       * Defensive fallback:
       *
       * Some wallet implementations may
       * return a result for the entire
       * transaction group.
       */
      if (
        signedTransactions.length ===
        txnGroup.length
      ) {
        const requestedSignatures =
          indexesToSign
            .map(
              (index) =>
                signedTransactions[
                  index
                ],
            )
            .filter(Boolean)


        if (
          requestedSignatures.length ===
          indexesToSign.length
        ) {
          return requestedSignatures
        }
      }


      console.error(
        "Pera signature mismatch:",
        {
          expected:
            indexesToSign.length,

          received:
            signedTransactions.length,

          groupSize:
            txnGroup.length,
        },
      )


      throw new Error(
        "Pera Wallet did not return the expected signature. Disconnect the wallet, refresh this page, reconnect Pera Wallet, and try again.",
      )
    }
  }


  function updateAccount(
    address,
  ) {
    setAccountAddress(
      address,
    )


    if (address) {
      const signer =
        createPeraSigner(
          address,
        )

      setWalletSession({
        address,
        signer,
      })
    } else {
      setWalletSession({
        address: "",
        signer: null,
      })
    }


    if (onAccountChange) {
      onAccountChange(
        address,
      )
    }
  }


  async function handleConnect() {
    if (connecting) {
      return
    }


    try {
      setConnecting(true)
      setError("")


      const accounts =
        await peraWallet
          .connect()


      if (
        accounts &&
        accounts.length > 0
      ) {
        updateAccount(
          accounts[0],
        )
      } else {
        updateAccount("")

        setError(
          "No Pera Wallet account was selected.",
        )
      }
    } catch (err) {
      console.error(
        "Pera connection error:",
        err,
      )


      if (
        err?.data?.type ===
        "CONNECT_MODAL_CLOSED"
      ) {
        setError("")
      } else {
        setError(
          getFriendlyWalletError(
            err,
          ),
        )
      }
    } finally {
      setConnecting(false)
    }
  }


  async function handleDisconnect() {
    try {
      setError("")

      await peraWallet
        .disconnect()

      updateAccount("")
    } catch (err) {
      console.error(
        "Pera disconnect error:",
        err,
      )


      /*
       * Clear the local app session even
       * if the wallet disconnect call
       * itself fails.
       */
      updateAccount("")


      setError(
        "Wallet session was cleared locally. Refresh the page before reconnecting if Pera Wallet still appears connected.",
      )
    }
  }


  useEffect(() => {
    let active = true


    async function reconnectWallet() {
      try {
        const accounts =
          await peraWallet
            .reconnectSession()


        if (!active) {
          return
        }


        if (
          accounts &&
          accounts.length > 0
        ) {
          updateAccount(
            accounts[0],
          )
        } else {
          updateAccount("")
        }
      } catch (err) {
        console.error(
          "Wallet reconnect error:",
          err,
        )


        if (
          active
        ) {
          updateAccount("")
        }
      }
    }


    reconnectWallet()


    return () => {
      active = false
    }
  }, [])


  const isConnected =
    Boolean(
      accountAddress,
    )


  return (
    <div className="wallet-wrapper">

      {isConnected ? (

        <div className="wallet-connected">

          <div className="wallet-address-box">

            <span className="wallet-status-dot">
            </span>


            <div>

              <small>
                Pera Wallet • TestNet
              </small>


              <strong
                title={
                  accountAddress
                }
              >
                {shortAddress(
                  accountAddress,
                )}
              </strong>

            </div>

          </div>


          <button
            type="button"
            className="wallet-disconnect-btn"
            onClick={
              handleDisconnect
            }
          >
            Disconnect
          </button>

        </div>

      ) : (

        <button
          type="button"
          className="wallet-connect-btn"
          onClick={
            handleConnect
          }
          disabled={
            connecting
          }
        >
          {connecting
            ? "Connecting to Pera..."
            : "Connect Pera Wallet"}
        </button>

      )}


      {error && (
        <div
          className="wallet-error"
          role="alert"
        >
          {error}
        </div>
      )}

    </div>
  )
}


export default WalletConnect
