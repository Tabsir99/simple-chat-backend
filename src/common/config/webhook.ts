import { Router } from "express";
import { exec } from "child_process";

const whRouter = Router();

whRouter.post("/webhook/github", (_, res) => {
  res.json({});
  console.info("New changes pushed, pulling data...");

  exec("git pull", { cwd: "/var/www/scb" }, (err, _, stderr) => {
    if (err) {
      console.error("Git pull failed:", stderr);
      return;
    }

    console.log("Git pull done");
  });
});

export default whRouter;
