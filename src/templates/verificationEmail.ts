function verificationEmailTemplate(verificationLink: string, userName: string) {
  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Verify Your Email</title>
      </head>
      <body
        style="
          margin: 0;
          padding: 0;
          background-color: #121212;
          font-family: Arial, sans-serif;
          color: #e0e0e0;
          line-height: 1.6;
          display: flex;
          justify-content: center;
          align-items: center;
          height: 100vh;
        "
      >
        <table
          role="presentation"
          cellspacing="0"
          cellpadding="0"
          border="0"
          align="center"
          width="100%"
          style="
            max-width: 600px;
            margin: auto;
            background-color: #1e1e1e;
            border-radius: 5px;
            border: 1px solid rgb(55, 55, 56);
          "
        >
          <tr>
            <td
              style="
                padding: 20px;
                text-align: center;
                border-bottom: 1px solid #333;
              "
            >
              <img
                src="https://your-logo-url.com/logo.png"
                alt="Your Company Logo"
                style="max-width: 120px; margin-bottom: 20px"
              />
              <h1 style="color: #1db954; font-size: 28px; margin: 0">
                Verify Your Email
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px">
              <p style="font-size: 24px; color: #cccccc; margin-bottom: 20px">
                Hello, ${userName},
              </p>
              <p style="font-size: 18px; color: #cccccc; margin-bottom: 20px">
                Thank you for registering with us! To complete your registration,
                please click the button below to verify your email address.
              </p>
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin: 30px auto"
              >
                <tr>
                  <td style="border-radius: 6px; background-color: #0c8f39">
                    <a
                      href="${verificationLink}"
                      style="
                        display: inline-block;
                        padding: 12px 24px;
                        color: #ffffff;
                        text-decoration: none;
                        font-size: 18px;
                      "
                      >Verify My Email &#8594;</a
                    >
                  </td>
                </tr>
              </table>
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="
                  margin: 20px auto;
                  background-color: #f63d3955;
                  border: 1px solid #f44336;
                  border-radius: 5px;
                "
              >
                <tr>
                  <td
                    style="
                      padding: 10px 30px;
                      text-align: center;
                      color: #eee3e2;
                      font-weight: bold;
                      font-size: 18px;
                    "
                  >
                    <strong>⚠️ DO NOT SHARE THIS LINK WITH ANYONE!</strong>
                  </td>
                </tr>
              </table>
              <p style="font-size: 18px; color: #cccccc; text-align: center">
                If you did not create an account, you can safely ignore this email.
              </p>
            </td>
          </tr>
          <tr>
            <td
              style="
                padding: 20px;
                text-align: center;
                border-top: 1px solid #333;
                font-size: 14px;
                color: #888;
              "
            >
              <p style="margin: 10px 0">
                &copy; 2024 Your Company. All rights reserved.
              </p>
              <p style="margin: 10px 0">
                <a
                  href="#"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  >Privacy Policy</a
                >
                <a
                  href="#"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  >Terms of Service</a
                >
                <a
                  href="https://tabsircg.com"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  >Contact Us</a
                >
              </p>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

export default verificationEmailTemplate;
