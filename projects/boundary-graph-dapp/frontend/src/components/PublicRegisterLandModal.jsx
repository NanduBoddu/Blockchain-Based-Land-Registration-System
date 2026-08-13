import {
  useEffect,
  useState,
} from "react"

import algosdk
  from "algosdk"

import {
  createLandRegistrationRequest,
} from "../services/publicLandRequestService"


function PublicRegisterLandModal({
  currentUser,
  connectedWalletAddress = "",
  onClose,
  onSubmitted,
}) {
  const [
    surveyNumber,
    setSurveyNumber,
  ] = useState("")

  const [
    extent,
    setExtent,
  ] = useState("")

  const [
    ownerAddress,
    setOwnerAddress,
  ] = useState(
    connectedWalletAddress ||
    "",
  )

  const [
    note,
    setNote,
  ] = useState("")

  const [
    error,
    setError,
  ] = useState("")

  const [
    success,
    setSuccess,
  ] = useState(null)


  useEffect(() => {
    if (
      connectedWalletAddress
    ) {
      setOwnerAddress(
        connectedWalletAddress,
      )
    }
  }, [
    connectedWalletAddress,
  ])


  async function handleSubmit(
    event,
  ) {
    event.preventDefault()

    setError("")
    setSuccess(null)

    const cleanOwner =
      ownerAddress.trim()

    if (
      !algosdk.isValidAddress(
        cleanOwner,
      )
    ) {
      setError(
        "Enter a valid Algorand owner wallet address.",
      )

      return
    }

    try {
      const request =
        await createLandRegistrationRequest({
          user:
            currentUser,

          surveyNumber,

          extent,

          ownerAddress:
            cleanOwner,

          note,
        })

      setSuccess(
        request,
      )

      onSubmitted?.(
        request,
      )
    } catch (err) {
      setError(
        err?.message ||
        "Unable to send land registration request.",
      )
    }
  }


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
            "min(620px, 94vw)",
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
              Land Registration Request
            </h2>

            <p>
              Submit your land details
              for Government approval.
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


        {success ? (
          <div>

            <div
              style={{
                padding:
                  "18px",
                borderRadius:
                  "12px",
                background:
                  "rgba(0,212,170,0.10)",
              }}
            >
              <h3>
                Request Sent Successfully
              </h3>

              <p>
                Request #
                {success.requestNumber}
              </p>

              <p>
                Survey Number:{" "}
                <strong>
                  {success.surveyNumber}
                </strong>
              </p>

              <p>
                Status:{" "}
                <strong>
                  Pending Government Approval
                </strong>
              </p>
            </div>

            <button
              type="button"
              className="action-btn primary-btn"
              onClick={onClose}
              style={{
                marginTop:
                  "18px",
              }}
            >
              Close
            </button>

          </div>
        ) : (
          <form
            onSubmit={
              handleSubmit
            }
          >

            {error && (
              <div className="error-box">
                {error}
              </div>
            )}


            <div className="form-group">
              <label>
                Applicant
              </label>

              <input
                value={
                  currentUser?.name ||
                  ""
                }
                disabled
              />
            </div>


            <div className="form-group">
              <label>
                Survey Number
              </label>

              <input
                value={
                  surveyNumber
                }
                onChange={
                  (event) =>
                    setSurveyNumber(
                      event.target.value,
                    )
                }
                placeholder="Example: SURVEY-005"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Land Extent
              </label>

              <input
                type="number"
                min="1"
                step="1"
                value={
                  extent
                }
                onChange={
                  (event) =>
                    setExtent(
                      event.target.value,
                    )
                }
                placeholder="Enter land extent"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Owner Algorand Address
              </label>

              <input
                value={
                  ownerAddress
                }
                onChange={
                  (event) =>
                    setOwnerAddress(
                      event.target.value,
                    )
                }
                placeholder="Algorand TestNet wallet address"
                required
              />
            </div>


            <div className="form-group">
              <label>
                Registration Note
              </label>

              <textarea
                value={
                  note
                }
                onChange={
                  (event) =>
                    setNote(
                      event.target.value,
                    )
                }
                placeholder="Optional information for Government review"
                rows="4"
              />
            </div>


            <div
              style={{
                display:
                  "flex",
                justifyContent:
                  "flex-end",
                gap:
                  "10px",
                marginTop:
                  "20px",
              }}
            >

              <button
                type="button"
                className="action-btn secondary-btn"
                onClick={onClose}
              >
                Cancel
              </button>

              <button
                type="submit"
                className="action-btn primary-btn"
              >
                Send Registration Request
              </button>

            </div>

          </form>
        )}

      </div>
    </div>
  )
}


export default PublicRegisterLandModal