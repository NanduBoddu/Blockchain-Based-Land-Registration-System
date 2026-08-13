import {
  getUserGovernmentSignupRequest,
} from "../services/authService"


function MyGovernmentRequestModal({
  currentUser,
  onClose,
}) {
  const request =
    getUserGovernmentSignupRequest(
      currentUser?.id,
    )


  return (
    <div
      className="modal-overlay"
      onMouseDown={
        (event) => {
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
          (event) =>
            event.stopPropagation()
        }
        style={{
          maxWidth:
            "560px",
        }}
      >

        <div className="modal-header">

          <div>
            <h2>
              My Government Request
            </h2>

            <p>
              Track your Government signup
              request status.
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


        {!request ? (
          <p>
            No Government signup request found.
          </p>
        ) : (
          <div
            style={{
              padding:
                "16px",
              borderRadius:
                "12px",
              background:
                "rgba(255,255,255,0.06)",
            }}
          >

            <h3>
              Request #{request.requestId}
            </h3>

            <p>
              <strong>
                Requested Role:
              </strong>{" "}
              Government
            </p>

            <p>
              <strong>
                Status:
              </strong>{" "}
              {request.status}
            </p>


            {request.status ===
              "Pending" && (
              <p>
                Your request is waiting for
                Government approval.
              </p>
            )}


            {request.status ===
              "Approved" && (
              <p>
                ✅ Approved. Sign out and sign
                in again to activate your
                Government account role.
              </p>
            )}


            {request.status ===
              "Rejected" && (
              <p>
                ❌ Your Government signup
                request was rejected.
              </p>
            )}

          </div>
        )}


        <div
          style={{
            display:
              "flex",
            justifyContent:
              "flex-end",
            marginTop:
              "18px",
          }}
        >
          <button
            type="button"
            className="action-btn secondary-btn"
            onClick={onClose}
          >
            Close
          </button>
        </div>

      </div>

    </div>
  )
}


export default MyGovernmentRequestModal