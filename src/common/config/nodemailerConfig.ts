import nodemailer from 'nodemailer';
import config from "./env";
import { generateUsernameFromEmail } from "../utils/utils";
import verificationEmailTemplate from "../templates/verificationTemplate";
import { injectable } from "inversify";
import { MailOptions } from 'nodemailer/lib/sendmail-transport';

export interface IEmailService {
  sendVerificationEmail(email: string, link: string): Promise<void>;
}

@injectable()
export class EmailService implements IEmailService {

  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',      
      port: 587,     
      auth: {
        user: config.nodemailerUser,  
        pass: config.nodemailerPass,     
      },
    });
    
  }

  async sendVerificationEmail(email: string, link: string): Promise<void> {
    const mailOptions: MailOptions = {
      from: `TabsirCG Support <${config.nodemailerUser}>`, 
      to: email,                                         
      subject: "Verify Your Email",                      
      html: verificationEmailTemplate(link, generateUsernameFromEmail(email)), 
    };

    try {
      // Sending the email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.info('Verification email sent:', result);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }
}

// Exporting the email service instance
export const emailService = new EmailService();
