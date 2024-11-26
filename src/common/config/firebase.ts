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

const storage = getStorage(app);
const bucket = storage.bucket();

// const policy = await bucket.getMetadata()
// await bucket.setCorsConfiguration([
//   {
//     origin: ["https://192.168.0.103:5000"],
//     method: ["PUT", "GET"],
//     responseHeader: ["Content-Type", "Access-Control-Allow-Origin"], 
//     maxAgeSeconds: 604800,
//   },
// ]);


export { bucket };
