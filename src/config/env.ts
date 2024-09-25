import dotenv from "dotenv";

dotenv.config();


const config = {
  jwtSecretMagicLink: process.env.JWT_SECRET_MAGIC_LINK as string,
  jwtSecretAccess: process.env.JWT_SECRET_ACCESS as string,
  jwtSecretRefresh: process.env.JWT_SECRET_REFRESH as string,

  nodemailerUser: process.env.NODEMAILER_USER as string,
  nodemailerPass: process.env.NODEMAILER_PASS as string,

  pgUser: process.env.PGUSER as string,
  pgPass: process.env.PGPASSWORD as string,
  pgHost: process.env.PGHOST as string,
  pgDb: process.env.PGDATABASE as string,
  pgPort: Number(process.env.PGPORT) || (5432 as number),

  baseUrl: process.env.BASE_URL as string,
  baseUrlFrontend: process.env.BASE_URL_FRONTEND as string,
  hostname: process.env.HOSTNAME as string,

  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,

  env: process.env.NODE_ENV as "development" | "test" | "production"
};

export default config;
