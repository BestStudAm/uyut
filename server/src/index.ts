import express from "express";
import cors from "cors";

import authRouter from "./routes/auth.js";
import listingsRouter from "./routes/listings.js";
import myListingsRouter from "./routes/myListings.js";

import { ensureDemoUser } from "./data/users.js";

import favoritesRouter from "./routes/favorites.js";
import bookingsRouter from "./routes/bookings.js";

const app = express();

const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(
  express.json({
    limit: "12mb",
  }),
);

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

// Создаём тестового пользователя,
// если его ещё нет в SQLite.
ensureDemoUser();

app.use(
  "/api/auth",
  authRouter,
);

app.use(
  "/api/listings",
  listingsRouter,
);

app.use(
  "/api/favorites",
  favoritesRouter,
);

app.use(
  "/api/bookings",
  bookingsRouter,
);

app.use(
  "/api/my/listings",
  myListingsRouter,
);

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`,
  );
});