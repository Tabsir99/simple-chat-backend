import { Router } from "express";
import { exec } from "child_process";

const whRouter = Router();

whRouter.post("/github", (_, res) => {
  res.json({});
  console.info("New changes pushed, pulling data...");

  // Step 1: git pull
  exec("git pull", { cwd: "/var/www/scb" }, (err, stdout, stderr) => {
    if (err) {
      console.error("❌ Git pull failed:", stderr);
      return;
    }

    console.log("✅ Git pull done:", stdout);

    // Step 2: run prisma migrate deploy
    exec(
      "npx prisma migrate deploy",
      { cwd: "/var/www/scb" },
      (mErr, mOut, mErrOut) => {
        if (mErr) {
          console.error("❌ Prisma migrate failed:", mErrOut);
          return;
        }

        console.log("✅ Prisma migrate done");
      }
    );
  });
});

export default whRouter;
