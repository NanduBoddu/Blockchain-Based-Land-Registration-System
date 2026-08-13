import express from "express"
import crypto from "crypto"

import db from "../db/database.js"


const router =
  express.Router()


function nextRequestNumber() {
  const row =
    db.prepare(`
      SELECT
        COALESCE(
          MAX(request_number),
          0
        ) AS max_number
      FROM land_registration_requests
    `).get()


  return (
    Number(
      row?.max_number ||
      0,
    ) + 1
  )
}


function formatRequest(
  row,
) {
  if (
    !row
  ) {
    return null
  }


  return {
    id:
      row.id,

    requestNumber:
      Number(
        row.request_number ||
        0,
      ),

    userId:
      row.user_id,

    applicantName:
      row.applicant_name ||
      "",

    applicantEmail:
      row.applicant_email ||
      "",

    surveyNumber:
      row.survey_number,

    extent:
      Number(
        row.extent ||
        0,
      ),

    ownerAddress:
      row.owner_address,

    note:
      row.note ||
      "",

    status:
      row.status,

    createdAt:
      row.created_at,

    reviewedAt:
      row.reviewed_at,

    reviewedBy:
      row.reviewed_by ||
      "",

    rejectionReason:
      row.rejection_reason ||
      "",

    landId:
      row.land_id ===
        null
        ? null
        : Number(
            row.land_id,
          ),

    txId:
      row.blockchain_tx_id ||
      "",

    confirmedRound:
      row.confirmed_round ===
        null
        ? null
        : Number(
            row.confirmed_round,
          ),
  }
}


function getRequestById(
  requestId,
) {
  return db.prepare(`
    SELECT
      r.*,

      u.name
        AS applicant_name,

      u.email
        AS applicant_email

    FROM land_registration_requests r

    JOIN users u
      ON u.id =
         r.user_id

    WHERE r.id = ?
  `).get(
    requestId,
  )
}


/* =========================================================
   CREATE LAND REGISTRATION REQUEST
   ========================================================= */

router.post(
  "/",

  (
    req,
    res,
  ) => {
    try {
      const {
        userId,
        surveyNumber,
        extent,
        ownerAddress,
        note,
      } = req.body


      if (
        !userId
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Sign in before submitting a land registration request.",
          })
      }


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE id = ?
        `).get(
          userId,
        )


      if (
        !user
      ) {
        return res
          .status(404)
          .json({
            ok:
              false,

            message:
              "User account was not found.",
          })
      }


      const cleanSurvey =
        String(
          surveyNumber ||
          "",
        ).trim()


      const numericExtent =
        Number(
          extent,
        )


      const cleanOwner =
        String(
          ownerAddress ||
          "",
        ).trim()


      const cleanNote =
        String(
          note ||
          "",
        ).trim()


      if (
        !cleanSurvey
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Survey number is required.",
          })
      }


      if (
        !Number.isInteger(
          numericExtent,
        ) ||
        numericExtent <= 0
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Land extent must be a positive integer.",
          })
      }


      if (
        !cleanOwner
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Owner Algorand wallet address is required.",
          })
      }


      const duplicate =
        db.prepare(`
          SELECT id
          FROM land_registration_requests
          WHERE
            user_id = ?
            AND LOWER(
              survey_number
            ) = LOWER(?)
            AND status = 'Pending'
          LIMIT 1
        `).get(
          userId,
          cleanSurvey,
        )


      if (
        duplicate
      ) {
        return res
          .status(409)
          .json({
            ok:
              false,

            message:
              "You already have a pending request for this survey number.",
          })
      }


      const requestId =
        crypto.randomUUID()


      const requestNumber =
        nextRequestNumber()


      const createdAt =
        new Date()
          .toISOString()


      db.prepare(`
        INSERT INTO land_registration_requests (
          id,
          request_number,
          user_id,
          survey_number,
          extent,
          owner_address,
          note,
          status,
          created_at
        )

        VALUES (
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          ?,
          'Pending',
          ?
        )
      `).run(
        requestId,
        requestNumber,
        userId,
        cleanSurvey,
        numericExtent,
        cleanOwner,
        cleanNote,
        createdAt,
      )


      const request =
        getRequestById(
          requestId,
        )


      return res
        .status(201)
        .json({
          ok:
            true,

          message:
            "Land registration request sent successfully.",

          request:
            formatRequest(
              request,
            ),
        })
    } catch (
      error
    ) {
      console.error(
        "Create land request error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to create land registration request.",
        })
    }
  },
)


/* =========================================================
   GET ALL LAND REGISTRATION REQUESTS
   ========================================================= */

router.get(
  "/",

  (
    req,
    res,
  ) => {
    try {
      const rows =
        db.prepare(`
          SELECT
            r.*,

            u.name
              AS applicant_name,

            u.email
              AS applicant_email

          FROM land_registration_requests r

          JOIN users u
            ON u.id =
               r.user_id

          ORDER BY
            r.created_at DESC
        `).all()


      return res.json({
        ok:
          true,

        requests:
          rows.map(
            formatRequest,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Get land requests error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to load land registration requests.",
        })
    }
  },
)


/* =========================================================
   GET ONE USER'S LAND REQUESTS
   ========================================================= */

router.get(
  "/user/:userId",

  (
    req,
    res,
  ) => {
    try {
      const rows =
        db.prepare(`
          SELECT
            r.*,

            u.name
              AS applicant_name,

            u.email
              AS applicant_email

          FROM land_registration_requests r

          JOIN users u
            ON u.id =
               r.user_id

          WHERE r.user_id = ?

          ORDER BY
            r.created_at DESC
        `).all(
          req.params.userId,
        )


      return res.json({
        ok:
          true,

        requests:
          rows.map(
            formatRequest,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Get user land requests error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to load user land registration requests.",
        })
    }
  },
)


/* =========================================================
   APPROVE LAND REGISTRATION REQUEST

   IMPORTANT:
   Blockchain transaction happens in existing frontend
   Algorand flow first.

   Then frontend sends:
   landId
   txId
   confirmedRound
   ========================================================= */

router.patch(
  "/:id/approve",

  (
    req,
    res,
  ) => {
    try {
      const {
        governmentUser,
        landId,
        txId,
        confirmedRound,
      } = req.body


      const current =
        getRequestById(
          req.params.id,
        )


      if (
        !current
      ) {
        return res
          .status(404)
          .json({
            ok:
              false,

            message:
              "Land registration request was not found.",
          })
      }


      if (
        current.status !==
        "Pending"
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "This request has already been reviewed.",
          })
      }


      const numericLandId =
        Number(
          landId ||
          0,
        )


      if (
        !Number.isInteger(
          numericLandId,
        ) ||
        numericLandId <= 0
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Valid blockchain Land ID is required before approval.",
          })
      }


      const reviewedAt =
        new Date()
          .toISOString()


      const reviewedBy =
        governmentUser?.name ||
        "Government"


      db.prepare(`
        UPDATE land_registration_requests

        SET
          status =
            'Approved',

          reviewed_at = ?,

          reviewed_by = ?,

          land_id = ?,

          blockchain_tx_id = ?,

          confirmed_round = ?,

          rejection_reason =
            NULL

        WHERE id = ?
      `).run(
        reviewedAt,
        reviewedBy,
        numericLandId,
        String(
          txId ||
          "",
        ),
        Number(
          confirmedRound ||
          0,
        ),
        req.params.id,
      )


      const updated =
        getRequestById(
          req.params.id,
        )


      return res.json({
        ok:
          true,

        message:
          "Land registration request approved successfully.",

        request:
          formatRequest(
            updated,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Approve land request error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to approve land registration request.",
        })
    }
  },
)


/* =========================================================
   REJECT LAND REGISTRATION REQUEST
   ========================================================= */

router.patch(
  "/:id/reject",

  (
    req,
    res,
  ) => {
    try {
      const {
        governmentUser,
        reason,
      } = req.body


      const current =
        getRequestById(
          req.params.id,
        )


      if (
        !current
      ) {
        return res
          .status(404)
          .json({
            ok:
              false,

            message:
              "Land registration request was not found.",
          })
      }


      if (
        current.status !==
        "Pending"
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "This request has already been reviewed.",
          })
      }


      const reviewedAt =
        new Date()
          .toISOString()


      const reviewedBy =
        governmentUser?.name ||
        "Government"


      const rejectionReason =
        String(
          reason ||
          "",
        ).trim()


      db.prepare(`
        UPDATE land_registration_requests

        SET
          status =
            'Rejected',

          reviewed_at = ?,

          reviewed_by = ?,

          rejection_reason = ?

        WHERE id = ?
      `).run(
        reviewedAt,
        reviewedBy,
        rejectionReason,
        req.params.id,
      )


      const updated =
        getRequestById(
          req.params.id,
        )


      return res.json({
        ok:
          true,

        message:
          "Land registration request rejected.",

        request:
          formatRequest(
            updated,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Reject land request error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to reject land registration request.",
        })
    }
  },
)


export default router