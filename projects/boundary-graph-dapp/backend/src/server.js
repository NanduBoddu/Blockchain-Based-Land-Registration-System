import express from "express"
import cors from "cors"
import dotenv from "dotenv"

import "./db/database.js"

import authRoutes
  from "./routes/authRoutes.js"

import governmentRequestRoutes
  from "./routes/governmentRequestRoutes.js"

import landRequestRoutes
  from "./routes/landRequestRoutes.js"

import x402Routes
  from "./routes/x402Routes.js"

dotenv.config()


const app =
  express()


const PORT =
  process.env.PORT ||
  4000


app.use(
  cors({
    origin:
      true,

    credentials:
      true,
  }),
)


app.use(
  express.json(),
)


app.get(
  "/api/health",

  (
    req,
    res,
  ) => {
    res.json({
      ok:
        true,

      service:
        "BoundaryGraph Backend",

      message:
        "Backend is running",

      database:
        "SQLite connected",
    })
  },
)


app.use(
  "/api/auth",
  authRoutes,
)


app.use(
  "/api/government",
  governmentRequestRoutes,
)


app.use(
  "/api/land-requests",
  landRequestRoutes,
)

app.use(
  "/api/x402",
  x402Routes,
)

app.listen(
  PORT,

  () => {
    console.log(
      `BoundaryGraph backend running at http://localhost:${PORT}`,
    )
  },
)