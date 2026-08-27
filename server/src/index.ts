import express from "express";
import cors from "cors";
import authRouter from "./routes/auth.js";
import listingsRouter from "./routes/listings.js";

const app = express();

const PORT = 3001;

app.use(
  cors({
    origin: "http://localhost:3000",
  }),
);

app.use(express.json());

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

app.listen(PORT, () => {
  console.log(
    `Server running on http://localhost:${PORT}`,
  );
});