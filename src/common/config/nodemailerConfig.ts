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
    // Setting up the transporter with your SMTP details (Mailgun, Gmail, or others)
    this.transporter = nodemailer.createTransport({
      host: 'smtp.zoho.com',       // e.g., "smtp.mailgun.org"
      port: 587,       // e.g., 587
      auth: {
        user: config.nodemailerUser,     // Your SMTP username
        pass: config.nodemailerPass,     // Your SMTP password or API key
      },
    });
    
  }

  async sendVerificationEmail(email: string, link: string): Promise<void> {
    const mailOptions: MailOptions = {
      from: `TabsirCG Support <${config.nodemailerUser}>`,  // Sender address
      to: email,                                          // Recipient email
      subject: "Verify Your Email",                       // Email subject
      html: verificationEmailTemplate(link, generateUsernameFromEmail(email)), // Email content (HTML template)
    };

    try {
      // Sending the email
      const result = await this.transporter.sendMail(mailOptions);
      
      console.log('Verification email sent:', result);
    } catch (error) {
      console.error('Error sending verification email:', error);
    }
  }
}

// Exporting the email service instance
export const emailService = new EmailService();
