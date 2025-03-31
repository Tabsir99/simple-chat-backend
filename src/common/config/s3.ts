import { S3Client } from "@aws-sdk/client-s3";
import config from "./env";

const s3 = new S3Client({
  credentials: {
    accessKeyId: config.r2AccessKeyId,
    secretAccessKey: config.r2SecretAccessKey,
  },
  endpoint:
    "https://dd35e163a80d2d54d1220081f245f872.r2.cloudflarestorage.com/cg-chat",
  region: "auto",
});

export default s3;
