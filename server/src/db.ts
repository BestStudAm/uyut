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

  CREATE TABLE IF NOT EXISTS reviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,

    listing_id INTEGER NOT NULL,

    author_name TEXT NOT NULL,

    rating INTEGER NOT NULL,

    text TEXT NOT NULL,

    created_at TEXT NOT NULL
      DEFAULT CURRENT_TIMESTAMP,

    FOREIGN KEY (listing_id)
      REFERENCES listings(id)
      ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_reviews_listing_id
    ON reviews(listing_id);
`);

// CREATE TABLE IF NOT EXISTS не добавляет колонки в уже существующую таблицу,
// поэтому недостающие досыпаем вручную. У тех, кто уже запускал проект,
// база лежит на диске со старой схемой.
function addColumnIfMissing(
  table: string,
  column: string,
  definition: string,
) {
  const columns = db
    .prepare(`PRAGMA table_info(${table})`)
    .all() as { name: string }[];

  const exists = columns.some(
    (item) => item.name === column,
  );

  if (!exists) {
    db.exec(
      `ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`,
    );
  }
}

// Стоимость фиксируем в самой брони. Если считать её каждый раз от текущей цены
// объявления, то владелец поднимет цену — и старые брони задним числом подорожают.
addColumnIfMissing(
  "bookings",
  "nights",
  "INTEGER NOT NULL DEFAULT 0",
);

addColumnIfMissing(
  "bookings",
  "price_per_night",
  "INTEGER NOT NULL DEFAULT 0",
);

addColumnIfMissing(
  "bookings",
  "service_fee",
  "INTEGER NOT NULL DEFAULT 0",
);

addColumnIfMissing(
  "bookings",
  "total",
  "INTEGER NOT NULL DEFAULT 0",
);

// Брони, оформленные до появления этих полей, остались с нулями. Считаем им
// стоимость один раз по текущей цене объявления — иначе в кабинете у них пусто.
db.exec(`
  UPDATE bookings
  SET
    nights = MAX(
      1,
      CAST(
        julianday(check_out) - julianday(check_in)
        AS INTEGER
      )
    ),
    price_per_night = COALESCE(
      (
        SELECT price_per_night
        FROM listings
        WHERE listings.id = bookings.listing_id
      ),
      0
    )
  WHERE total = 0;

  UPDATE bookings
  SET
    service_fee = CAST(
      ROUND(nights * price_per_night * 7.0 / 100)
      AS INTEGER
    ),
    total = nights * price_per_night + CAST(
      ROUND(nights * price_per_night * 7.0 / 100)
      AS INTEGER
    )
  WHERE total = 0;
`);

