import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import listingsRouter from "./routes/listings.js";
import myListingsRouter from "./routes/myListings.js";

const app = express();

const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

// Лимит по умолчанию 100 КБ, а объявление приезжает вместе с фотографиями
// в виде data:image — иначе публикация падает с 413.
app.use(express.json({ limit: "12mb" }));

app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
  });
});

app.use(
  "/api/auth",
  authRouter,
);

app.use(
  "/api/listings",
  listingsRouter,
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