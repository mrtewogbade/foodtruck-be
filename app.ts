import express, { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import compression from "compression";
import http from "http";
import path from "path";
import multer from "multer";

import ConnectDB from "./src/configs/db.config";

import AppError from "./src/error/AppError";
import GlobalErrorHandler from "./src/error/errorHandler";
import authRoutes from "./src/routes/auth.routes";
import restaurantRoutes from "./src/routes/restaurant.routes"


import logger, { logRequest } from "./src/middleware/logger";
import { COOKIE_SECRET, PORT } from "./serviceUrl";



dotenv.config();
const port = PORT || 8081;

const app = express();



process.on("uncaughtException", (err: Error) => {
  logger.error("Unhandled Exception, shutting down...");
  logger.error(`${err.name}: ${err.message}`);
  process.exit(1);
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("trust proxy", 1);
app.use(multer().any());

app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"],
  })
);

app.use(cookieParser(COOKIE_SECRET));
app.use(
  helmet({
    contentSecurityPolicy: false,
  })
);

//set view engine
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "ejs");

//This code is converting our req.body to a string which is actually false.
// app.use(sanitizeInputs);
app.use(mongoSanitize());
app.use(logRequest);
const shouldCompress = (req: express.Request, res: express.Response) => {
  if (req.headers["x-no-compression"]) {
    // Don't compress responses if this request header is present
    return false;
  }
  return compression.filter(req, res);
};

app.use(compression({ filter: shouldCompress }));

  //All Routes comes in Here
  app.use("/v1/api/auth", authRoutes);
  app.use("/v1/api/restaurant", restaurantRoutes)
// app.use("/v1/api/user", userRoutes);


app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.send("This is Foodtruck App developed by Kelvin, Kazeem and Betty");
});

app.use("*", (req: Request, res: Response, next: NextFunction) => {
  const errorMessage = `Can not find ${req.originalUrl} with ${req.method} on this server`;
  logger.warn(errorMessage);
  next(new AppError(errorMessage, 501));
});

app.use(GlobalErrorHandler);
const server = ConnectDB().then(() => {
  const httpServer = http.createServer(app);
  httpServer.listen(port, () => {
    logger.info(`Server running on port ${port}`);
  });

  return httpServer;
});

process.on("unhandledRejection", (err: Error) => {
  logger.error("Unhandled Rejection, shutting down server...");
  logger.error(`${err.name}: ${err.message}`);
  server.catch(() => {
    process.exit(1);
  });
});

