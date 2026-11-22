import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));

if (process.env.NODE_ENV !== "production") {
  app.use(morgan("dev"));
}

app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;