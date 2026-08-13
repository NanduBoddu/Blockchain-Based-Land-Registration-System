import {
  useState,
} from "react"

import {
  QRCodeSVG,
} from "qrcode.react"

import {
  getPublicLandProfile,
  getLandVerificationText,
} from "../services/publicLandService"


function PublicLandVerificationModal({
  onClose,
}) {
  const [
    searchType,
    setSearchType,
  ] = useState(
    "landId",
  )

  const [
    searchValue,
    setSearchValue,
  ] = useState("")

  const [
    loading,
    setLoading,
  ] = useState(false)

  const [
    error,
    setError,
  ] = useState("")

  const [
    profile,
    setProfile,
  ] = useState(null)


  function shortAddress(
    address,
  ) {
    if (
      !address
    ) {
      return "-"
    }


    return `${address.slice(
      0,
      12,
    )}...${address.slice(
      -10,
    )}`
  }


  function boundaryStatus(
    status,
  ) {
    if (
      Number(
        status,
      ) === 2
    ) {
      return "Verified"
    }

    return "Pending"
  }


  async function handleSearch(
    event,
  ) {
    event?.preventDefault()


    if (
      loading
    ) {
      return
    }


    try {
      setLoading(
        true,
      )

      setError("")
      setProfile(null)


      if (
        !String(
          searchValue,
        ).trim()
      ) {
        throw new Error(
          searchType ===
            "survey"
            ? "Enter a Survey Number."
            : "Enter a Land ID.",
        )
      }


      const result =
        await getPublicLandProfile({
          searchType,

          searchValue:
            String(
              searchValue,
            ).trim(),
        })


      setProfile(
        result,
      )
    } catch (err) {
      console.error(
        "Public land verification error:",
        err,
      )


      setError(
        err?.message ||
        "Unable to verify land.",
      )
    } finally {
      setLoading(
        false,
      )
    }
  }


  return (
    <div
      className="modal-overlay"
      onMouseDown={
        (
          event,
        ) => {
          if (
            event.target ===
            event.currentTarget
          ) {
            onClose()
          }
        }
      }
    >

      <div
        className="modal-card"
        onMouseDown={
          (
            event,
          ) =>
            event.stopPropagation()
        }
        style={{
          maxWidth:
            "900px",

          maxHeight:
            "90vh",

          overflowY:
            "auto",
        }}
      >

        {/* HEADER */}

        <div className="modal-header">

          <div>

            <h2>
              Public Land Verification
            </h2>

            <p>
              Search and independently verify
              immutable land records on
              Algorand TestNet.
            </p>

          </div>


          <button
            type="button"
            className="close-btn"
            onClick={
              onClose
            }
          >
            ×
          </button>

        </div>


        {/* SEARCH */}

        <form
          onSubmit={
            handleSearch
          }
        >

          <div
            style={{
              display:
                "flex",

              gap:
                "10px",

              marginBottom:
                "14px",

              flexWrap:
                "wrap",
            }}
          >

            <button
              type="button"
              className={
                searchType ===
                "landId"
                  ? "action-btn primary-btn"
                  : "action-btn secondary-btn"
              }
              onClick={() => {
                setSearchType(
                  "landId",
                )

                setSearchValue(
                  "",
                )

                setProfile(
                  null,
                )

                setError(
                  "",
                )
              }}
            >
              Land ID
            </button>


            <button
              type="button"
              className={
                searchType ===
                "survey"
                  ? "action-btn primary-btn"
                  : "action-btn secondary-btn"
              }
              onClick={() => {
                setSearchType(
                  "survey",
                )

                setSearchValue(
                  "",
                )

                setProfile(
                  null,
                )

                setError(
                  "",
                )
              }}
            >
              Survey Number
            </button>

          </div>


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

            <input
              type={
                searchType ===
                "landId"
                  ? "number"
                  : "text"
              }
              min={
                searchType ===
                "landId"
                  ? "1"
                  : undefined
              }
              placeholder={
                searchType ===
                "survey"
                  ? "Example: TSY-001"
                  : "Example: 1"
              }
              value={
                searchValue
              }
              onChange={
                (
                  event,
                ) =>
                  setSearchValue(
                    event
                      .target
                      .value,
                  )
              }
              style={{
                flex:
                  "1",

                minWidth:
                  "220px",

                padding:
                  "12px 14px",

                borderRadius:
                  "10px",
              }}
            />


            <button
              type="submit"
              className="action-btn primary-btn"
              disabled={
                loading
              }
            >
              {loading
                ? "Searching Blockchain..."
                : "Verify Land"}
            </button>

          </div>

        </form>


        {/* ERROR */}

        {error && (
          <div
            style={{
              marginTop:
                "18px",

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


        {/* RESULT */}

        {profile && (
          <div
            style={{
              marginTop:
                "24px",
            }}
          >

            {/* VERIFIED HEADER */}

            <div
              style={{
                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  Number(
                    profile
                      .land
                      .verificationStatus,
                  ) === 2
                    ? "rgba(80,180,120,0.12)"
                    : "rgba(255,170,50,0.12)",
              }}
            >

              <h3
                style={{
                  marginTop:
                    0,
                }}
              >
                Land #{profile.land.landId}
              </h3>


              <strong>
                {
                  getLandVerificationText(
                    profile
                      .land
                      .verificationStatus,
                  )
                }
              </strong>


              {Number(
                profile
                  .land
                  .verificationStatus,
              ) !== 2 && (
                <p>
                  ⚠️ This parcel is not fully
                  verified. Do not rely on this
                  record for a legal transaction
                  until verification is complete.
                </p>
              )}

            </div>


            {/* LAND DETAILS */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",
              }}
            >

              <h3>
                Land Details
              </h3>


              <p>
                <strong>
                  Land ID:
                </strong>{" "}
                #{profile.land.landId}
              </p>


              <p>
                <strong>
                  Survey Number:
                </strong>{" "}
                {
                  profile
                    .land
                    .surveyNumber
                }
              </p>


              <p>
                <strong>
                  Extent:
                </strong>{" "}
                {
                  profile
                    .land
                    .extent
                }
              </p>


              <p>
                <strong>
                  Verification Status:
                </strong>{" "}
                {
                  getLandVerificationText(
                    profile
                      .land
                      .verificationStatus,
                  )
                }
                {" "}
                (
                {
                  profile
                    .land
                    .verificationStatus
                }
                )
              </p>

            </div>


            {/* CURRENT OWNER */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",
              }}
            >

              <h3>
                Current Owner
              </h3>


              <div
                style={{
                  padding:
                    "12px",

                  borderRadius:
                    "8px",

                  background:
                    "rgba(0,0,0,0.15)",

                  wordBreak:
                    "break-all",
                }}
              >
                {
                  profile
                    .currentOwner
                }
              </div>

            </div>


            {/* PREVIOUS OWNERS */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",
              }}
            >

              <h3>
                Previous Owner(s)
              </h3>


              {profile
                .previousOwners
                .length ===
              0 ? (
                <p>
                  No previous ownership transfer
                  records found.
                </p>
              ) : (
                profile
                  .previousOwners
                  .map(
                    (
                      owner,
                      index,
                    ) => (
                      <div
                        key={
                          `${owner}-${index}`
                        }
                        style={{
                          marginBottom:
                            "8px",

                          padding:
                            "10px",

                          borderRadius:
                            "8px",

                          background:
                            "rgba(0,0,0,0.15)",

                          wordBreak:
                            "break-all",
                        }}
                      >
                        {owner}
                      </div>
                    ),
                  )
              )}

            </div>


            {/* OWNERSHIP HISTORY */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",
              }}
            >

              <h3>
                Ownership History
              </h3>


              {profile
                .ownershipHistory
                .length ===
              0 ? (
                <p>
                  Original ownership record.
                  No transfers recorded yet.
                </p>
              ) : (
                profile
                  .ownershipHistory
                  .map(
                    (
                      transfer,
                    ) => (
                      <div
                        key={
                          transfer
                            .transferId
                        }
                        style={{
                          marginBottom:
                            "14px",

                          padding:
                            "14px",

                          borderRadius:
                            "10px",

                          background:
                            "rgba(0,0,0,0.15)",
                        }}
                      >

                        <strong>
                          Transfer #
                          {
                            transfer
                              .transferId
                          }
                        </strong>


                        <p>
                          Previous Owner:
                          <br />

                          <code>
                            {
                              shortAddress(
                                transfer
                                  .previousOwner,
                              )
                            }
                          </code>
                        </p>


                        <p>
                          New Owner:
                          <br />

                          <code>
                            {
                              shortAddress(
                                transfer
                                  .newOwner,
                              )
                            }
                          </code>
                        </p>

                      </div>
                    ),
                  )
              )}

            </div>


            {/* BOUNDARIES */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "18px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",
              }}
            >

              <h3>
                Boundary Details
              </h3>


              {profile
                .boundaries
                .length ===
              0 ? (
                <p>
                  No boundary relationships
                  recorded for this parcel.
                </p>
              ) : (
                profile
                  .boundaries
                  .map(
                    (
                      boundary,
                    ) => (
                      <div
                        key={
                          boundary
                            .boundaryId
                        }
                        style={{
                          marginBottom:
                            "14px",

                          padding:
                            "14px",

                          borderRadius:
                            "10px",

                          background:
                            "rgba(0,0,0,0.15)",
                        }}
                      >

                        <strong>
                          Boundary #
                          {
                            boundary
                              .boundaryId
                          }
                        </strong>


                        <p>
                          Land #
                          {
                            boundary
                              .landA
                          }
                          {" ↔ "}
                          Land #
                          {
                            boundary
                              .landB
                          }
                        </p>


                        <p>
                          Reference:{" "}
                          <strong>
                            {
                              boundary
                                .boundaryHash
                            }
                          </strong>
                        </p>


                        <p>
                          Status:{" "}
                          <strong>
                            {
                              boundaryStatus(
                                boundary
                                  .verificationStatus,
                              )
                            }
                          </strong>
                        </p>

                      </div>
                    ),
                  )
              )}

            </div>


            {/* QR + EXPLORER */}

            <div
              style={{
                marginTop:
                  "18px",

                padding:
                  "20px",

                borderRadius:
                  "12px",

                background:
                  "rgba(255,255,255,0.06)",

                textAlign:
                  "center",
              }}
            >

              <h3>
                Blockchain Verification QR
              </h3>


              <div
                style={{
                  display:
                    "inline-block",

                  padding:
                    "16px",

                  background:
                    "white",

                  borderRadius:
                    "12px",
                }}
              >

                <QRCodeSVG
                  value={
                    profile
                      .qrValue
                  }
                  size={
                    180
                  }
                  level="H"
                  includeMargin
                />

              </div>


              <p>
                Scan this QR code to open the
                Algorand TestNet proof for this
                registry application.
              </p>


              <a
                href={
                  profile
                    .explorerUrl
                }
                target="_blank"
                rel="noopener noreferrer"
              >
                View Blockchain / Explorer Proof ↗
              </a>


              <p
                style={{
                  marginTop:
                    "12px",
                }}
              >
                Application ID:{" "}
                <strong>
                  {
                    profile
                      .appId
                  }
                </strong>
              </p>

            </div>

          </div>
        )}


        <div
          style={{
            marginTop:
              "22px",

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


export default PublicLandVerificationModal