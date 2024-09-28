import nodemailer from "nodemailer";
import config from "./env";
import { generateUsernameFromEmail } from "../utils/utils";
import verificationEmailTemplate from "../templates/verificationTemplate";

export interface IEmailService {
  sendVerificationEmail(email: string, link: string): Promise<void>;
}

export class EmailService implements IEmailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
        host: "smtp.zoho.com",
        port: 587,
        secure: false,
        auth: {
          user: config.nodemailerUser,
          pass: config.nodemailerPass,
        },
        tls: {
          ciphers: "SSLv3",
          minVersion: "TLSv1.2",
          rejectUnauthorized: false,
      
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 999,
      });
  }

  async sendVerificationEmail(email: string, link: string): Promise<void> {
    const mailOptions = {
            from: {
              name: "TabsirCG Support",
              address: config.nodemailerUser,
            },
            to: email,
            subject: "Verify Your Email",
            html: verificationEmailTemplate(
              link,
              generateUsernameFromEmail(email)
            ),
          };

          
    await this.transporter.sendMail(mailOptions);
  }
  
}


export const emailService = new EmailService()