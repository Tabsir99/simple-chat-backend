import { initializeApp, cert, getApp, getApps } from "firebase-admin/app";
import { getStorage } from "firebase-admin/storage";
import { configService } from "./env";

let app;

if (getApps().length === 0) {
  app = initializeApp({
    credential: cert(JSON.parse(configService.get("firebaseKey"))),
    storageBucket: "gs://simple-chat-cg.appspot.com",
  });
} else {
  app = getApp();
}

// Get the storage bucket
const storage = getStorage(app);
const bucket = storage.bucket();

// const policy = await bucket.iam.getPolicy()
// console.log(policy)
// await bucket.setCorsConfiguration([
//   {
//     origin: ["http://localhost:5000"],
//     method: ["PUT", "GET"],
//     responseHeader: ["Content-Type", "Access-Control-Allow-Origin"], // Add this
//     maxAgeSeconds: 604800,
//   },
// ]);


export { bucket };
