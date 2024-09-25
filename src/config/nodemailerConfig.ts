import { createTransport } from "nodemailer";
import config from "./env";

const transport = createTransport({
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


// transport
//   .verify()
//   .then(() => console.log("It worked"))
//   .catch((err) => console.log("error occured ", err))


export default transport;
