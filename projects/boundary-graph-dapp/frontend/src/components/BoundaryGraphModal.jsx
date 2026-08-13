import {
  useEffect,
  useMemo,
  useState,
} from "react"

import {
  getBoundaryGraphData,
  getAppId,
} from "../services/algorandService"


function BoundaryGraphModal({
  onClose,
}) {
  const [
    lands,
    setLands,
  ] = useState([])

  const [
    boundaries,
    setBoundaries,
  ] = useState([])

  const [
    selectedBoundary,
    setSelectedBoundary,
  ] = useState(null)

  const [
    loading,
    setLoading,
  ] = useState(true)

  const [
    error,
    setError,
  ] = useState("")


  useEffect(() => {
    async function loadGraph() {
      try {
        setLoading(true)
        setError("")

        const data =
          await getBoundaryGraphData()

        setLands(
          data.lands,
        )

        setBoundaries(
          data.boundaries,
        )
      } catch (err) {
        console.error(err)

        setError(
          err.message ||
            "Unable to load boundary graph",
        )
      } finally {
        setLoading(false)
      }
    }

    loadGraph()
  }, [])


  const landMap =
    useMemo(() => {
      const map =
        new Map()

      for (
        const land of lands
      ) {
        map.set(
          land.landId,
          land,
        )
      }

      return map
    }, [lands])


  function statusText(status) {
    if (status === 2) {
      return "Verified"
    }

    if (status === 1) {
      return "Under Review"
    }

    return "Pending"
  }


  function statusClass(status) {
    if (status === 2) {
      return "graph-status-verified"
    }

    if (status === 1) {
      return "graph-status-review"
    }

    return "graph-status-pending"
  }


  function landName(landId) {
    const land =
      landMap.get(
        landId,
      )

    if (!land) {
      return `Land #${landId}`
    }

    return (
      land.surveyNumber ||
      `Land #${landId}`
    )
  }


  return (
    <div className="modal-overlay">

      <div className="graph-modal-card">

        <div className="modal-header">

          <div>

            <h2>
              Boundary Graph
            </h2>

            <p>
              Live land-to-land boundary
              relationships stored in
              Algorand TestNet App{" "}
              {getAppId()}.
            </p>

          </div>


          <button
            type="button"
            className="close-btn"
            onClick={
              onClose
            }
            title="Close"
          >
            ×
          </button>

        </div>


        {loading && (
          <div className="graph-loading">
            Loading boundary graph...
          </div>
        )}


        {error && (
          <div className="lands-error">
            {error}
          </div>
        )}


        {!loading &&
          !error &&
          boundaries.length ===
            0 && (
            <div className="graph-empty">
              No boundary
              relationships found.
            </div>
          )}


        {!loading &&
          !error &&
          boundaries.length >
            0 && (
            <>

              <div className="graph-summary">

                <div className="graph-summary-card">

                  <span>
                    Lands
                  </span>

                  <strong>
                    {lands.length}
                  </strong>

                </div>


                <div className="graph-summary-card">

                  <span>
                    Boundary Records
                  </span>

                  <strong>
                    {boundaries.length}
                  </strong>

                </div>


                <div className="graph-summary-card">

                  <span>
                    Verified
                  </span>

                  <strong>
                    {
                      boundaries.filter(
                        (item) =>
                          item
                            .verificationStatus ===
                          2,
                      ).length
                    }
                  </strong>

                </div>


                <div className="graph-summary-card">

                  <span>
                    Pending
                  </span>

                  <strong>
                    {
                      boundaries.filter(
                        (item) =>
                          item
                            .verificationStatus !==
                          2,
                      ).length
                    }
                  </strong>

                </div>

              </div>


              <div className="boundary-network">

                {boundaries.map(
                  (
                    boundary,
                  ) => (

                    <button
                      type="button"
                      key={
                        boundary
                          .boundaryId
                      }
                      className={`boundary-edge-card ${statusClass(
                        boundary
                          .verificationStatus,
                      )}`}
                      onClick={() =>
                        setSelectedBoundary(
                          boundary,
                        )
                      }
                    >

                      <div className="graph-land-node">

                        <span className="node-id">
                          #
                          {
                            boundary.landA
                          }
                        </span>

                        <strong>
                          {landName(
                            boundary.landA,
                          )}
                        </strong>

                      </div>


                      <div className="graph-connection">

                        <span className="connection-line">
                        </span>

                        <span className="connection-badge">
                          Boundary #
                          {
                            boundary
                              .boundaryId
                          }
                        </span>

                        <span className="connection-line">
                        </span>

                      </div>


                      <div className="graph-land-node">

                        <span className="node-id">
                          #
                          {
                            boundary.landB
                          }
                        </span>

                        <strong>
                          {landName(
                            boundary.landB,
                          )}
                        </strong>

                      </div>


                      <div className="boundary-status-row">

                        <span>
                          {
                            statusText(
                              boundary
                                .verificationStatus,
                            )
                          }
                        </span>

                      </div>

                    </button>

                  ),
                )}

              </div>

            </>
          )}


        {selectedBoundary && (
          <div className="boundary-details">

            <div className="boundary-details-header">

              <h3>
                Boundary #
                {
                  selectedBoundary
                    .boundaryId
                }
              </h3>


              <button
                type="button"
                onClick={() =>
                  setSelectedBoundary(
                    null,
                  )
                }
                title="Close boundary details"
              >
                ×
              </button>

            </div>


            <div className="boundary-details-grid">

              <div>

                <span>
                  Land A
                </span>

                <strong>
                  #
                  {
                    selectedBoundary
                      .landA
                  }{" "}
                  {landName(
                    selectedBoundary
                      .landA,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Land B
                </span>

                <strong>
                  #
                  {
                    selectedBoundary
                      .landB
                  }{" "}
                  {landName(
                    selectedBoundary
                      .landB,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Status
                </span>

                <strong>
                  {statusText(
                    selectedBoundary
                      .verificationStatus,
                  )}
                </strong>

              </div>


              <div>

                <span>
                  Boundary ID
                </span>

                <strong>
                  #
                  {
                    selectedBoundary
                      .boundaryId
                  }
                </strong>

              </div>

            </div>


            <div className="boundary-hash-box">

              <span>
                Boundary Hash
              </span>

              <code>
                {
                  selectedBoundary
                    .boundaryHash
                }
              </code>

            </div>

          </div>
        )}


        <div className="modal-actions">

          <button
            type="button"
            className="register-submit-btn"
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


export default BoundaryGraphModal