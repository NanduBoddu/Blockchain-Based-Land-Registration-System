import Database
  from "better-sqlite3"

import fs
  from "fs"

import path
  from "path"

import {
  fileURLToPath,
} from "url"


const __filename =
  fileURLToPath(
    import.meta.url,
  )

const __dirname =
  path.dirname(
    __filename,
  )


const dataDirectory =
  path.resolve(
    __dirname,
    "../../data",
  )


if (
  !fs.existsSync(
    dataDirectory,
  )
) {
  fs.mkdirSync(
    dataDirectory,
    {
      recursive: true,
    },
  )
}


const databasePath =
  path.join(
    dataDirectory,
    "boundarygraph.db",
  )


const db =
  new Database(
    databasePath,
  )


db.pragma(
  "journal_mode = WAL",
)

db.pragma(
  "foreign_keys = ON",
)


db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,

    name TEXT NOT NULL,

    email TEXT NOT NULL UNIQUE,

    password_hash TEXT NOT NULL,

    role TEXT NOT NULL
      CHECK (
        role IN (
          'Public',
          'Government'
        )
      ),

    wallet_address TEXT,

    created_at TEXT NOT NULL,

    updated_at TEXT NOT NULL
  );


  CREATE TABLE IF NOT EXISTS government_signup_requests (
    id TEXT PRIMARY KEY,

    user_id TEXT NOT NULL,

    requested_wallet_address TEXT,

    status TEXT NOT NULL
      DEFAULT 'Pending'
      CHECK (
        status IN (
          'Pending',
          'Approved',
          'Rejected'
        )
      ),

    reviewed_by TEXT,

    created_at TEXT NOT NULL,

    reviewed_at TEXT,

    FOREIGN KEY (
      user_id
    )
    REFERENCES users(id)
    ON DELETE CASCADE
  );


  CREATE TABLE IF NOT EXISTS land_registration_requests (
    id TEXT PRIMARY KEY,

    request_number INTEGER,

    user_id TEXT NOT NULL,

    survey_number TEXT NOT NULL,

    extent INTEGER NOT NULL,

    owner_address TEXT NOT NULL,

    note TEXT,

    status TEXT NOT NULL
      DEFAULT 'Pending'
      CHECK (
        status IN (
          'Pending',
          'Approved',
          'Rejected'
        )
      ),

    land_id INTEGER,

    blockchain_tx_id TEXT,

    confirmed_round INTEGER,

    reviewed_by TEXT,

    rejection_reason TEXT,

    created_at TEXT NOT NULL,

    reviewed_at TEXT,

    FOREIGN KEY (
      user_id
    )
    REFERENCES users(id)
    ON DELETE CASCADE
  );


  CREATE TABLE IF NOT EXISTS payment_transactions (
    id TEXT PRIMARY KEY,

    user_id TEXT,

    action TEXT NOT NULL,

    amount_microalgo INTEGER NOT NULL,

    payment_tx_id TEXT,

    blockchain_tx_id TEXT,

    status TEXT NOT NULL,

    created_at TEXT NOT NULL,

    FOREIGN KEY (
      user_id
    )
    REFERENCES users(id)
    ON DELETE SET NULL
  );
`)


console.log(
  `SQLite database ready: ${databasePath}`,
)


export default db