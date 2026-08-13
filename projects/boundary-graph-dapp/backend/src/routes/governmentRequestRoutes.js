import express from "express"
import crypto from "crypto"

import db from "../db/database.js"

const router = express.Router()


function getRequestNumber() {
  const row =
    db.prepare(`
      SELECT COUNT(*) AS count
      FROM government_signup_requests
    `).get()

  return Number(row?.count || 0) + 1
}


/* =========================================================
   CHECK IF GOVERNMENT ACCOUNT EXISTS
   ========================================================= */

router.get("/exists", (req, res) => {
  try {
    const governmentUser =
      db.prepare(`
        SELECT id
        FROM users
        WHERE role = 'Government'
        LIMIT 1
      `).get()

    return res.json({
      ok: true,
      exists: Boolean(governmentUser),
    })
  } catch (error) {
    console.error(
      "Government exists check error:",
      error,
    )

    return res.status(500).json({
      ok: false,
      message:
        "Unable to check Government account.",
    })
  }
})


/* =========================================================
   CREATE GOVERNMENT REQUEST
   ========================================================= */

router.post("/requests", (req, res) => {
  try {
    const {
      userId,
      walletAddress,
    } = req.body

    if (!userId) {
      return res.status(400).json({
        ok: false,
        message:
          "User ID is required.",
      })
    }

    const user =
      db.prepare(`
        SELECT *
        FROM users
        WHERE id = ?
      `).get(userId)

    if (!user) {
      return res.status(404).json({
        ok: false,
        message:
          "User account was not found.",
      })
    }

    const existingPending =
      db.prepare(`
        SELECT *
        FROM government_signup_requests
        WHERE user_id = ?
        AND status = 'Pending'
        LIMIT 1
      `).get(userId)

    if (existingPending) {
      return res.status(409).json({
        ok: false,
        message:
          "A Government signup request is already pending.",
      })
    }

    if (user.role === "Government") {
      return res.status(400).json({
        ok: false,
        message:
          "This user already has Government access.",
      })
    }

    const id =
      crypto.randomUUID()

    const now =
      new Date().toISOString()

    const requestNumber =
      getRequestNumber()

    db.prepare(`
      INSERT INTO government_signup_requests (
        id,
        user_id,
        requested_wallet_address,
        status,
        created_at
      )
      VALUES (?, ?, ?, 'Pending', ?)
    `).run(
      id,
      userId,
      String(walletAddress || "").trim(),
      now,
    )

    const request =
      db.prepare(`
        SELECT
          g.id,
          g.user_id,
          g.requested_wallet_address,
          g.status,
          g.reviewed_by,
          g.created_at,
          g.reviewed_at,
          u.name,
          u.email,
          u.wallet_address
        FROM government_signup_requests g
        JOIN users u
          ON u.id = g.user_id
        WHERE g.id = ?
      `).get(id)

    return res.status(201).json({
      ok: true,

      message:
        "Government signup request sent successfully.",

      request: {
        requestId:
          requestNumber,

        id:
          request.id,

        userId:
          request.user_id,

        name:
          request.name,

        email:
          request.email,

        walletAddress:
          request.requested_wallet_address ||
          request.wallet_address ||
          "",

        status:
          request.status,

        requestedAt:
          request.created_at,

        reviewedAt:
          request.reviewed_at,

        reviewedBy:
          request.reviewed_by,
      },
    })
  } catch (error) {
    console.error(
      "Create Government request error:",
      error,
    )

    return res.status(500).json({
      ok: false,
      message:
        "Unable to create Government signup request.",
    })
  }
})


/* =========================================================
   GET ALL GOVERNMENT REQUESTS
   ========================================================= */

router.get("/requests", (req, res) => {
  try {
    const rows =
      db.prepare(`
        SELECT
          g.id,
          g.user_id,
          g.requested_wallet_address,
          g.status,
          g.reviewed_by,
          g.created_at,
          g.reviewed_at,
          u.name,
          u.email,
          u.wallet_address
        FROM government_signup_requests g
        JOIN users u
          ON u.id = g.user_id
        ORDER BY g.created_at DESC
      `).all()

    const requests =
      rows.map((row, index) => ({
        requestId:
          rows.length - index,

        id:
          row.id,

        userId:
          row.user_id,

        name:
          row.name,

        email:
          row.email,

        walletAddress:
          row.requested_wallet_address ||
          row.wallet_address ||
          "",

        status:
          row.status,

        requestedAt:
          row.created_at,

        reviewedAt:
          row.reviewed_at,

        reviewedBy:
          row.reviewed_by,
      }))

    return res.json({
      ok: true,
      requests,
    })
  } catch (error) {
    console.error(
      "Get Government requests error:",
      error,
    )

    return res.status(500).json({
      ok: false,
      message:
        "Unable to load Government signup requests.",
    })
  }
})


/* =========================================================
   GET USER'S LATEST GOVERNMENT REQUEST
   ========================================================= */

router.get(
  "/requests/user/:userId",
  (req, res) => {
    try {
      const row =
        db.prepare(`
          SELECT
            g.id,
            g.user_id,
            g.requested_wallet_address,
            g.status,
            g.reviewed_by,
            g.created_at,
            g.reviewed_at,
            u.name,
            u.email,
            u.wallet_address
          FROM government_signup_requests g
          JOIN users u
            ON u.id = g.user_id
          WHERE g.user_id = ?
          ORDER BY g.created_at DESC
          LIMIT 1
        `).get(req.params.userId)

      if (!row) {
        return res.json({
          ok: true,
          request: null,
        })
      }

      return res.json({
        ok: true,

        request: {
          id:
            row.id,

          userId:
            row.user_id,

          name:
            row.name,

          email:
            row.email,

          walletAddress:
            row.requested_wallet_address ||
            row.wallet_address ||
            "",

          status:
            row.status,

          requestedAt:
            row.created_at,

          reviewedAt:
            row.reviewed_at,

          reviewedBy:
            row.reviewed_by,
        },
      })
    } catch (error) {
      console.error(
        "Get user Government request error:",
        error,
      )

      return res.status(500).json({
        ok: false,
        message:
          "Unable to load Government request.",
      })
    }
  },
)


/* =========================================================
   APPROVE / REJECT GOVERNMENT REQUEST
   ========================================================= */

router.patch(
  "/requests/:id",
  (req, res) => {
    try {
      const {
        decision,
        reviewer,
      } = req.body

      if (
        decision !== "Approved" &&
        decision !== "Rejected"
      ) {
        return res.status(400).json({
          ok: false,
          message:
            "Decision must be Approved or Rejected.",
        })
      }

      const request =
        db.prepare(`
          SELECT *
          FROM government_signup_requests
          WHERE id = ?
        `).get(req.params.id)

      if (!request) {
        return res.status(404).json({
          ok: false,
          message:
            "Government signup request not found.",
        })
      }

      if (request.status !== "Pending") {
        return res.status(400).json({
          ok: false,
          message:
            `Request is already ${request.status}.`,
        })
      }

      const reviewedAt =
        new Date().toISOString()

      const reviewerName =
        reviewer?.name ||
        reviewer ||
        "Government"

      const transaction =
        db.transaction(() => {
          db.prepare(`
            UPDATE government_signup_requests
            SET
              status = ?,
              reviewed_by = ?,
              reviewed_at = ?
            WHERE id = ?
          `).run(
            decision,
            reviewerName,
            reviewedAt,
            req.params.id,
          )

          if (decision === "Approved") {
            db.prepare(`
              UPDATE users
              SET
                role = 'Government',
                updated_at = ?
              WHERE id = ?
            `).run(
              reviewedAt,
              request.user_id,
            )
          }
        })

      transaction()

      const updatedRequest =
        db.prepare(`
          SELECT
            g.*,
            u.name,
            u.email,
            u.role,
            u.wallet_address
          FROM government_signup_requests g
          JOIN users u
            ON u.id = g.user_id
          WHERE g.id = ?
        `).get(req.params.id)

      return res.json({
        ok: true,

        message:
          decision === "Approved"
            ? "Government access approved successfully."
            : "Government access request rejected.",

        request: {
          id:
            updatedRequest.id,

          userId:
            updatedRequest.user_id,

          name:
            updatedRequest.name,

          email:
            updatedRequest.email,

          walletAddress:
            updatedRequest.requested_wallet_address ||
            updatedRequest.wallet_address ||
            "",

          status:
            updatedRequest.status,

          role:
            updatedRequest.role,

          requestedAt:
            updatedRequest.created_at,

          reviewedAt:
            updatedRequest.reviewed_at,

          reviewedBy:
            updatedRequest.reviewed_by,
        },
      })
    } catch (error) {
      console.error(
        "Review Government request error:",
        error,
      )

      return res.status(500).json({
        ok: false,
        message:
          "Unable to review Government signup request.",
      })
    }
  },
)


export default router