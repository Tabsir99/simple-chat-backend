import dotenv from "dotenv";

dotenv.config();

const config = {
  jwtSecretMagicLink: process.env.JWT_SECRET_MAGIC_LINK as string,
  jwtSecretAccess: process.env.JWT_SECRET_ACCESS as string,
  jwtSecretRefresh: process.env.JWT_SECRET_REFRESH as string,

  sendGridApiKey: process.env.SENDGRID_API_KEY as string,
  sendGridEmail: process.env.SENDGRID_EMAIL as string,

  pgUser: process.env.PGUSER as string,
  pgPass: process.env.PGPASSWORD as string,
  pgHost: process.env.PGHOST as string,
  pgDb: process.env.PGDATABASE as string,
  pgPort: process.env.PGPORT,
  redisUrl: process.env.REDIS_URL as string,

  baseUrl: process.env.BASE_URL as string,
  baseUrlFrontend: process.env.BASE_URL_FRONTEND as string,
  hostname: process.env.HOSTNAME as string,

  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,

  r2AccessKeyId: process.env.R2_ACCESS_KEY_ID as string,
  r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY as string,

  env: process.env.NODE_ENV as "development" | "test" | "production",
};

export default config;
