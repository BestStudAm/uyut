import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";

const dataDir = path.resolve(
  process.cwd(),
  "data",
);

fs.mkdirSync(dataDir, {
  recursive: true,
});

const dbPath = path.join(
  dataDir,
  "uyut.db",
);

export const db = new Database(dbPath);

db.pragma("foreign_keys = ON");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    name TEXT NOT NULL,

    email TEXT NOT NULL
      COLLATE NOCASE
      UNIQUE,

    password_hash TEXT NOT NULL,

    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS listings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    owner_id INTEGER,

    title TEXT NOT NULL,
    city TEXT NOT NULL,
    district TEXT NOT NULL,

    type TEXT NOT NULL,

    price_per_night INTEGER NOT NULL DEFAULT 0,

    rating REAL NOT NULL DEFAULT 0,
    reviews_count INTEGER NOT NULL DEFAULT 0,

    guests INTEGER NOT NULL,
    rooms INTEGER NOT NULL,
    area REAL NOT NULL,

    amenities TEXT NOT NULL DEFAULT '[]',

    lat REAL NOT NULL,
    lng REAL NOT NULL,

    status TEXT NOT NULL DEFAULT 'draft',

    photos TEXT NOT NULL DEFAULT '[]',

    description TEXT NOT NULL DEFAULT '',

    rules TEXT NOT NULL DEFAULT '[]',

    address TEXT NOT NULL DEFAULT '',

    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    updated_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (owner_id)
      REFERENCES users(id)
      ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_listings_owner_id
    ON listings(owner_id);

  CREATE INDEX IF NOT EXISTS idx_listings_status
    ON listings(status);

  CREATE TABLE IF NOT EXISTS favorites (
    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,

    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    PRIMARY KEY (user_id, listing_id),

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (listing_id)
      REFERENCES listings(id)
      ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    user_id INTEGER NOT NULL,
    listing_id INTEGER NOT NULL,

    check_in TEXT NOT NULL,
    check_out TEXT NOT NULL,

    guests INTEGER NOT NULL,

    status TEXT NOT NULL DEFAULT 'active',

    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (user_id)
      REFERENCES users(id)
      ON DELETE CASCADE,

    FOREIGN KEY (listing_id)
      REFERENCES listings(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_bookings_user_id
    ON bookings(user_id);

  CREATE INDEX IF NOT EXISTS idx_bookings_listing_id
    ON bookings(listing_id);
`);

