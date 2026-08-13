import {
  getUserRegisteredLands,
} from "../services/publicLandRequestService"


const EXPLORER =
  "https://lora.algokit.io/testnet"


function MyLandsModal({
  currentUser,
  onClose,
}) {
  const lands =
    getUserRegisteredLands(
      currentUser?.id,
    )


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
            "min(760px, 96vw)",
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
              My Registered Lands
            </h2>

            <p>
              Lands approved by
              Government and registered
              on Algorand TestNet.
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


        {lands.length ===
        0 ? (
          <p>
            You do not have any
            registered lands yet.
          </p>
        ) : (
          <div
            style={{
              display:
                "grid",
              gap:
                "14px",
            }}
          >

            {lands.map(
              (land) => (
                <div
                  key={
                    land.id
                  }
                  style={{
                    padding:
                      "18px",
                    border:
                      "1px solid rgba(128,128,128,0.20)",
                    borderRadius:
                      "14px",
                  }}
                >

                  <h3>
                    Land #
                    {land.landId}
                  </h3>

                  <p>
                    <strong>
                      Survey Number:
                    </strong>{" "}
                    {
                      land.surveyNumber
                    }
                  </p>

                  <p>
                    <strong>
                      Extent:
                    </strong>{" "}
                    {
                      land.extent
                    }
                  </p>

                  <p
                    style={{
                      overflowWrap:
                        "anywhere",
                    }}
                  >
                    <strong>
                      Owner:
                    </strong>{" "}
                    {
                      land.ownerAddress
                    }
                  </p>

                  <p>
                    <strong>
                      Status:
                    </strong>{" "}
                    Registered
                  </p>

                  <p>
                    <strong>
                      Approved By:
                    </strong>{" "}
                    {
                      land.reviewedBy ||
                      "Government"
                    }
                  </p>

                  {land.txId && (
                    <a
                      href={`${EXPLORER}/transaction/${land.txId}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      View Transaction on TestNet ↗
                    </a>
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


export default MyLandsModal