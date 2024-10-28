import dotenv from "dotenv";
import { injectable } from "inversify";

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
  pgPort: process.env.PGPORT,

  baseUrl: process.env.BASE_URL as string,
  baseUrlFrontend: process.env.BASE_URL_FRONTEND as string,
  hostname: process.env.HOSTNAME as string,

  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
  googleClientId: process.env.GOOGLE_CLIENT_ID as string,
  firebaseKey: process.env.FIREBASE_CLOUD_STORAGE_KEY as string,

  env: process.env.NODE_ENV as "development" | "test" | "production"
};

type ConfigKey = keyof typeof config

export interface IConfigService {
  get(key: ConfigKey): string;
  isDevelopment(): boolean;
  isProduction(): boolean;
}



@injectable()

export class ConfigService implements IConfigService {
  public get(key: ConfigKey): string {
    const value = config[key as keyof typeof config];
    if (!value) {
      throw new Error(`Config key ${key} is missing`);
    }
    return value;
  }



  public isDevelopment(): boolean {
    return config.env === 'development';
  }

  public isProduction(): boolean {
    return config.env === 'production';
  }
}

export const configService = new ConfigService()
export default config;