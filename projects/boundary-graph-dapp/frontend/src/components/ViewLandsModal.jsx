import {
  useEffect,
  useState,
} from "react"

import {
  getAllLands,
  getAppId,
} from "../services/algorandService"


function ViewLandsModal({
  onClose,
}) {
  const [lands, setLands] =
    useState([])

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState("")


  useEffect(() => {
    async function loadLands() {
      try {
        setLoading(true)
        setError("")

        const result =
          await getAllLands()

        setLands(result)
      } catch (err) {
        console.error(err)

        setError(
          err.message ||
            "Unable to load land records",
        )
      } finally {
        setLoading(false)
      }
    }

    loadLands()
  }, [])


  function getStatusText(status) {
    if (status === 2) {
      return "Verified"
    }

    if (status === 1) {
      return "Under Review"
    }

    return "Pending"
  }


  function getStatusClass(status) {
    if (status === 2) {
      return "status-verified"
    }

    if (status === 1) {
      return "status-review"
    }

    return "status-pending"
  }


  function shortAddress(address) {
    if (!address) {
      return "-"
    }

    if (
      address ===
      "Unable to decode owner"
    ) {
      return address
    }

    return `${address.slice(
      0,
      8,
    )}...${address.slice(-6)}`
  }


  return (
    <div className="modal-overlay">

      <div className="lands-modal-card">

        <div className="modal-header">

          <div>

            <h2>
              Registered Lands
            </h2>

            <p>
              Immutable land records stored in
              Algorand TestNet App {getAppId()} boxes.
            </p>

          </div>


          <button
            type="button"
            className="close-btn"
            onClick={onClose}
            title="Close"
          >
            ×
          </button>

        </div>


        {loading && (
          <div className="lands-loading">
            Loading land records...
          </div>
        )}


        {error && (
          <div className="lands-error">
            {error}
          </div>
        )}


        {!loading &&
          !error &&
          lands.length === 0 && (
            <div className="lands-empty">
              No land records found.
            </div>
          )}


        {!loading &&
          !error &&
          lands.length > 0 && (

            <div className="lands-table-wrapper">

              <table className="lands-table">

                <thead>
                  <tr>

                    <th>
                      Land ID
                    </th>

                    <th>
                      Survey Number
                    </th>

                    <th>
                      Extent
                    </th>

                    <th>
                      Owner
                    </th>

                    <th>
                      Status
                    </th>

                  </tr>
                </thead>


                <tbody>

                  {lands.map(
                    (land) => (

                      <tr
                        key={
                          land.landId
                        }
                      >

                        <td>
                          #{land.landId}
                        </td>


                        <td>
                          {land.surveyNumber}
                        </td>


                        <td>
                          {land.extent}
                        </td>


                        <td
                          title={
                            land.ownerAddress
                          }
                        >
                          {shortAddress(
                            land.ownerAddress,
                          )}
                        </td>


                        <td>

                          <span
                            className={`land-status ${getStatusClass(
                              land.verificationStatus,
                            )}`}
                          >
                            {getStatusText(
                              land.verificationStatus,
                            )}
                          </span>

                        </td>

                      </tr>

                    ),
                  )}

                </tbody>

              </table>

            </div>

          )}


        <div
          className="modal-actions"
          style={{
            marginTop: "22px",
          }}
        >

          <button
            type="button"
            className="register-submit-btn"
            onClick={onClose}
          >
            Close
          </button>

        </div>

      </div>

    </div>
  )
}


export default ViewLandsModal