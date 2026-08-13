import {
  useEffect,
  useState,
} from "react"

import {
  getRecentActivity,
} from "../services/algorandService"


const TESTNET_EXPLORER =
  "https://lora.algokit.io/testnet"


function RecentActivity() {
  const [
    activities,
    setActivities,
  ] = useState([])

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")


  function getTitle(method) {
    if (
      method ===
      "register_land"
    ) {
      return "Register Land"
    }

    if (
      method ===
      "verify_land"
    ) {
      return "Verify Land"
    }

    if (
      method ===
      "add_boundary"
    ) {
      return "Add Boundary"
    }

    if (
      method ===
      "verify_boundary"
    ) {
      return "Verify Boundary"
    }

    return "Application Call"
  }


  function getIcon(method) {
    if (
      method ===
      "register_land"
    ) {
      return "🏠"
    }

    if (
      method ===
      "verify_land"
    ) {
      return "✅"
    }

    if (
      method ===
      "add_boundary"
    ) {
      return "🔗"
    }

    if (
      method ===
      "verify_boundary"
    ) {
      return "🛡️"
    }

    return "⬢"
  }


  function shortTx(txId) {
    if (!txId) {
      return "-"
    }

    return `${txId.slice(
      0,
      10,
    )}...${txId.slice(-8)}`
  }


  function transactionUrl(
    txId,
  ) {
    return `${TESTNET_EXPLORER}/transaction/${txId}`
  }


  useEffect(() => {
    async function loadActivity() {
      try {
        setLoading(true)
        setError("")

        const result =
          await getRecentActivity()

        setActivities(result)
      } catch (err) {
        console.error(err)

        setError(
          err.message ||
            "Unable to load blockchain activity",
        )
      } finally {
        setLoading(false)
      }
    }


    loadActivity()


    const interval =
      setInterval(
        loadActivity,
        10000,
      )


    return () =>
      clearInterval(
        interval,
      )
  }, [])


  return (
    <section className="recent-activity-card">

      <div className="activity-header">

        <div>

          <h3>
            Recent Blockchain Activity
          </h3>

          <p>
            Latest transactions recorded
            for the LandRegistry smart
            contract.
          </p>

        </div>


        <span className="indexer-status">
          ● Indexer Live
        </span>

      </div>


      {loading && (
        <div className="activity-loading">
          Loading recent activity...
        </div>
      )}


      {error && (
        <div className="activity-error">
          {error}
        </div>
      )}


      {!loading &&
        !error &&
        activities.length === 0 && (
          <div className="activity-empty">
            No recent activity found.
          </div>
        )}


      {!loading &&
        !error &&
        activities.length > 0 && (

          <div className="activity-list">

            {activities.map(
              (activity) => (

                <div
                  className="activity-item"
                  key={
                    activity.txId
                  }
                >

                  <div className="activity-icon">
                    {getIcon(
                      activity.method,
                    )}
                  </div>


                  <div className="activity-main">

                    <strong>
                      {getTitle(
                        activity.method,
                      )}
                    </strong>

                    <span>
                      Round #
                      {activity.round}
                    </span>

                  </div>


                  <a
                    href={
                      transactionUrl(
                        activity.txId,
                      )
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    title={
                      `View transaction ${activity.txId} on TestNet Explorer`
                    }
                    className="activity-tx"
                    style={{
                      textDecoration:
                        "none",

                      cursor:
                        "pointer",
                    }}
                  >
                    <code>
                      {shortTx(
                        activity.txId,
                      )}
                    </code>

                    <span
                      style={{
                        marginLeft:
                          "6px",
                      }}
                    >
                      ↗
                    </span>
                  </a>

                </div>

              ),
            )}

          </div>

        )}

    </section>
  )
}


export default RecentActivity