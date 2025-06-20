import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

// CORS middleware (configure origin if needed)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN, // your frontend URL
    credentials: true, // allow cookies to be sent
  })
);

// Core middlewares
app.use(express.json({ limit: "18kb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// routes import

import userRouter from "./routes/user.routes.js";

app.use("/api/v1/users", userRouter);

export default app;
