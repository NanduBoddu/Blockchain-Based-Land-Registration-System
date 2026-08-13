import express from "express"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import crypto from "crypto"

import db from "../db/database.js"


const router =
  express.Router()


const JWT_SECRET =
  process.env.JWT_SECRET ||
  "boundarygraph-development-secret"


function publicUser(user) {
  return {
    id:
      user.id,

    name:
      user.name,

    email:
      user.email,

    role:
      user.role,

    walletAddress:
      user.wallet_address ||
      "",

    createdAt:
      user.created_at,
  }
}


function createToken(user) {
  return jwt.sign(
    {
      id:
        user.id,

      email:
        user.email,

      role:
        user.role,
    },

    JWT_SECRET,

    {
      expiresIn:
        "7d",
    },
  )
}


/* =========================================================
   SIGN UP
   ========================================================= */

router.post(
  "/signup",

  async (
    req,
    res,
  ) => {
    try {
      const {
        name,
        email,
        password,
        confirmPassword,
        role,
        walletAddress,
      } = req.body


      const cleanName =
        String(
          name || "",
        ).trim()


      const cleanEmail =
        String(
          email || "",
        )
          .trim()
          .toLowerCase()


      const requestedRole =
        role ===
        "Government"
          ? "Government"
          : "Public"


      const cleanWallet =
        String(
          walletAddress || "",
        ).trim()


      if (
        !cleanName
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Name is required.",
          })
      }


      if (
        !cleanEmail ||
        !cleanEmail.includes(
          "@",
        )
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Enter a valid email address.",
          })
      }


      if (
        String(
          password || "",
        ).length < 6
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Password must contain at least 6 characters.",
          })
      }


      if (
        password !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Password and Confirm Password do not match.",
          })
      }


      const existingUser =
        db.prepare(`
          SELECT id
          FROM users
          WHERE
            LOWER(name) = LOWER(?)
            OR email = ?
          LIMIT 1
        `).get(
          cleanName,
          cleanEmail,
        )


      if (
        existingUser
      ) {
        return res
          .status(409)
          .json({
            ok:
              false,

            message:
              "An account with this name or email already exists.",
          })
      }


      /*
       * Check whether a Government
       * account already exists.
       */

      const governmentExists =
        Boolean(
          db.prepare(`
            SELECT id
            FROM users
            WHERE role = 'Government'
            LIMIT 1
          `).get(),
        )


      /*
       * First Government signup:
       * Government
       *
       * Later Government signup:
       * Public + Pending request
       */

      const finalRole =
        requestedRole ===
          "Government" &&
        governmentExists
          ? "Public"
          : requestedRole


      const userId =
        crypto.randomUUID()


      const now =
        new Date()
          .toISOString()


      const passwordHash =
        await bcrypt.hash(
          password,
          12,
        )


      let requestId =
        null


      let requestNumber =
        null


      const createAccount =
        db.transaction(
          () => {
            db.prepare(`
              INSERT INTO users (
                id,
                name,
                email,
                password_hash,
                role,
                wallet_address,
                created_at,
                updated_at
              )
              VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            `).run(
              userId,
              cleanName,
              cleanEmail,
              passwordHash,
              finalRole,
              cleanWallet,
              now,
              now,
            )


            if (
              requestedRole ===
                "Government" &&
              governmentExists
            ) {
              requestId =
                crypto.randomUUID()


              const countRow =
                db.prepare(`
                  SELECT COUNT(*) AS count
                  FROM government_signup_requests
                `).get()


              requestNumber =
                Number(
                  countRow?.count ||
                  0,
                ) + 1


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
                requestId,
                userId,
                cleanWallet,
                now,
              )
            }
          },
        )


      createAccount()


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE id = ?
        `).get(
          userId,
        )


      const token =
        createToken(
          user,
        )


      /*
       * Government approval request
       */

      if (
        requestId
      ) {
        return res
          .status(201)
          .json({
            ok:
              true,

            type:
              "government_request_sent",

            message:
              "Government signup request sent successfully.",

            user:
              publicUser(
                user,
              ),

            request: {
              requestId:
                requestNumber,

              id:
                requestId,

              userId,

              name:
                cleanName,

              email:
                cleanEmail,

              walletAddress:
                cleanWallet,

              status:
                "Pending",

              requestedAt:
                now,

              reviewedAt:
                null,

              reviewedBy:
                null,
            },

            token,
          })
      }


      /*
       * Normal Public account
       * OR first Government account
       */

      return res
        .status(201)
        .json({
          ok:
            true,

          type:
            "account_created",

          message:
            "Account created successfully.",

          user:
            publicUser(
              user,
            ),

          token,
        })
    } catch (
      error
    ) {
      console.error(
        "Signup error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to create account.",
        })
    }
  },
)


/* =========================================================
   SIGN IN
   ========================================================= */

router.post(
  "/signin",

  async (
    req,
    res,
  ) => {
    try {
      const {
        name,
        email,
        password,
      } = req.body


      const cleanName =
        String(
          name || "",
        ).trim()


      const cleanEmail =
        String(
          email || "",
        )
          .trim()
          .toLowerCase()


      if (
        (
          !cleanName &&
          !cleanEmail
        ) ||
        !password
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Enter your name and password.",
          })
      }


      let user


      if (
        cleanEmail
      ) {
        user =
          db.prepare(`
            SELECT *
            FROM users
            WHERE email = ?
            LIMIT 1
          `).get(
            cleanEmail,
          )
      } else {
        user =
          db.prepare(`
            SELECT *
            FROM users
            WHERE LOWER(name) = LOWER(?)
            LIMIT 1
          `).get(
            cleanName,
          )
      }


      if (
        !user
      ) {
        return res
          .status(401)
          .json({
            ok:
              false,

            message:
              "Account not found or password is incorrect.",
          })
      }


      const validPassword =
        await bcrypt.compare(
          password,
          user.password_hash,
        )


      if (
        !validPassword
      ) {
        return res
          .status(401)
          .json({
            ok:
              false,

            message:
              "Account not found or password is incorrect.",
          })
      }


      return res.json({
        ok:
          true,

        message:
          "Signed in successfully.",

        user:
          publicUser(
            user,
          ),

        token:
          createToken(
            user,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Signin error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to sign in.",
        })
    }
  },
)


/* =========================================================
   GET USER
   ========================================================= */

router.get(
  "/users/:id",

  (
    req,
    res,
  ) => {
    try {
      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE id = ?
        `).get(
          req.params.id,
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
              "User not found.",
          })
      }


      return res.json({
        ok:
          true,

        user:
          publicUser(
            user,
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Profile error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to load user.",
        })
    }
  },
)


/* =========================================================
   CHANGE PASSWORD
   ========================================================= */

router.patch(
  "/users/:id/password",

  async (
    req,
    res,
  ) => {
    try {
      const {
        currentPassword,
        newPassword,
        confirmPassword,
      } = req.body


      if (
        !currentPassword
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "Enter your current password.",
          })
      }


      if (
        String(
          newPassword || "",
        ).length < 6
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "New password must contain at least 6 characters.",
          })
      }


      if (
        newPassword !==
        confirmPassword
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "New Password and Confirm Password do not match.",
          })
      }


      if (
        currentPassword ===
        newPassword
      ) {
        return res
          .status(400)
          .json({
            ok:
              false,

            message:
              "New password must be different from the current password.",
          })
      }


      const user =
        db.prepare(`
          SELECT *
          FROM users
          WHERE id = ?
        `).get(
          req.params.id,
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


      const validPassword =
        await bcrypt.compare(
          currentPassword,
          user.password_hash,
        )


      if (
        !validPassword
      ) {
        return res
          .status(401)
          .json({
            ok:
              false,

            message:
              "Current password is incorrect.",
          })
      }


      const newPasswordHash =
        await bcrypt.hash(
          newPassword,
          12,
        )


      db.prepare(`
        UPDATE users
        SET
          password_hash = ?,
          updated_at = ?
        WHERE id = ?
      `).run(
        newPasswordHash,
        new Date()
          .toISOString(),
        user.id,
      )


      return res.json({
        ok:
          true,

        message:
          "Password updated successfully.",
      })
    } catch (
      error
    ) {
      console.error(
        "Change password error:",
        error,
      )


      return res
        .status(500)
        .json({
          ok:
            false,

          message:
            "Unable to update password.",
        })
    }
  },
)

/* =========================================================
   GET PUBLIC USERS
   Government Dashboard - View Users
   ========================================================= */

router.get(
  "/public-users",

  (
    req,
    res,
  ) => {
    try {
      const users =
        db.prepare(`
          SELECT
            id,
            name,
            email,
            created_at
          FROM users
          WHERE role = 'Public'
          ORDER BY created_at DESC
        `).all()

      return res.json({
        ok: true,

        count:
          users.length,

        users:
          users.map(
            (user) => ({
              id:
                user.id,

              name:
                user.name,

              email:
                user.email,

              createdAt:
                user.created_at,
            }),
          ),
      })
    } catch (
      error
    ) {
      console.error(
        "Load public users error:",
        error,
      )

      return res
        .status(500)
        .json({
          ok: false,

          message:
            "Unable to load public users.",
        })
    }
  },
)

export default router