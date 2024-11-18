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

// const policy = await bucket.getMetadata()
// await bucket.setCorsConfiguration([
//   {
//     origin: ["https://192.168.0.103:5000"],
//     method: ["PUT", "GET"],
//     responseHeader: ["Content-Type", "Access-Control-Allow-Origin"], // Add this
//     maxAgeSeconds: 604800,
//   },
// ]);


async function updateCacheControlForDirectory(prefix: string, cacheControlValue: string) {
  try {
    // Get all files under the specified prefix
    const [files] = await bucket.getFiles({ prefix });

    console.log(`Found ${files.length} files under prefix: ${prefix}`);
    if (files.length === 0) {
      console.log('No files to update.');
      return;
    }

    // Update Cache-Control metadata for each file
    const updatePromises = files.map(file =>
      file.setMetadata({
        cacheControl: cacheControlValue,
      })
    );

    await Promise.all(updatePromises);
    console.log(`Updated Cache-Control to "${cacheControlValue}" for all files.`);
  } catch (err) {
    console.error('Error updating file metadata:', err);
  }
}

const cacheControlValue = 'public, max-age=31536000, immutable';
// updateCacheControlForDirectory('avatars/default',cacheControlValue)

export { bucket };
