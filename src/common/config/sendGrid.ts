import sgMail from "@sendgrid/mail";
import config from "./env";

sgMail.setApiKey(config.sendGridApiKey as string);

const sendEmail = async (to: string, subject: string, html: string) => {
  await sgMail.send({
    to,
    from: config.sendGridEmail as string,
    subject,
    html,
  });
};

export default sendEmail;
