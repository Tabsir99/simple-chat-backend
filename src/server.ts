import express from "express";
import cors from "cors";
import config from "./common/config/env";
import cookieParser from "cookie-parser";
import EventEmitter from "events";
import authRoute from "./modules/authentication/auth.routes";


const emmiter = new EventEmitter();

console.log(emmiter.getMaxListeners(), emmiter.eventNames());

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: config.baseUrlFrontend, credentials: true }));
app.use(cookieParser());

app.use("/api", authRoute);

app.all("*", (req, res) => {
  res
    .json({
      error: "API Route doesn't Exists",
      url: req.url,
    })
    .status(404);
});

const PORT = 3001;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server started at port ${PORT}`);
});
