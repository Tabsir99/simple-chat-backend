

export default function verificationEmailTemplate(link: string, username: string) {
  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Document</title>
  </head>
  <body style="margin: 0; padding: 0">
    <div
      style="
        margin: 0;
        padding: 0;
        background-color: #121212;
        font-family: Arial, sans-serif;
        color: #e0e0e0;
        line-height: 1.6;
        display: flex;
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
        <tbody>
          <tr>
            <td
              style="
                padding: 20px;
                text-align: center;
                border-bottom: 1px solid #333;
              "
            >
              <img
                src="https://ci3.googleusercontent.com/meips/ADKq_NaBZ5ezoKmTDJFPuHFVwy9glyO9RNc7CSAS10FWkidm3fO2w6ZrAs2p3FWpKYP09HK2qfR59hiP=s0-d-e1-ft#https://your-logo-url.com/logo.png"
                alt="Your Company Logo"
                style="max-width: 120px; margin-bottom: 20px"
                class="CToWUd"
                data-bit="iit"
                jslog="138226; u014N:xr6bB; 53:WzAsMl0."
              />
              <h1 style="color: #1db954; font-size: 28px; margin: 0">
                Verify Your Email
              </h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px">
              <p style="font-size: 24px; color: #cccccc; margin-bottom: 20px">
                Hello, ${username},
              </p>
              <p style="font-size: 18px; color: #cccccc; margin-bottom: 20px">
                Thank you for registering with us! To complete your
                registration, please click the button below to verify your email
                address.
              </p>
              <table
                role="presentation"
                cellspacing="0"
                cellpadding="0"
                border="0"
                style="margin: 30px auto"
              >
                <tbody>
                  <tr>
                    <td style="border-radius: 6px; background-color: #0c8f39">
                      <a
                        href=${link}
                        style="
                          display: inline-block;
                          padding: 12px 24px;
                          color: #ffffff;
                          text-decoration: none;
                          font-size: 18px;
                        "
                        target="_blank"
                        >Verify My Email →</a
                      >
                    </td>
                  </tr>
                </tbody>
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
                <tbody>
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
                </tbody>
              </table>
              <p style="font-size: 18px; color: #cccccc; text-align: center">
                If you did not create an account, you can safely ignore this
                email.
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
                © 2024 Your Company. All rights reserved.
              </p>
              <p style="margin: 10px 0">
                <a
                  href="#m_-5858369438471083958_"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  >Privacy Policy</a
                >
                <a
                  href="#m_-5858369438471083958_"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  >Terms of Service</a
                >
                <a
                  href="https://tabsircg.com"
                  style="color: #1db954; text-decoration: none; margin: 0 10px"
                  target="_blank"
                  data-saferedirecturl="https://www.google.com/url?q=https://tabsircg.com&amp;source=gmail&amp;ust=1727517692271000&amp;usg=AOvVaw0qa9md4v_n2NYAOAtH-Rnz"
                  >Contact Us</a
                >
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </body>
</html>     
        `;
}
