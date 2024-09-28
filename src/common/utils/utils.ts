
export const generateUsernameFromEmail = (email: string): string => {
  const [username] = email.split("@");
  return username;
};

export async function getGoogleJWKs() {
  const response = await fetch("https://www.googleapis.com/oauth2/v3/certs");
  const jwks = await response.json();
  return jwks.keys;
}

type JWK = {
  e: string; // Public exponent (Base64 URL encoded)
  n: string; // Modulus (Base64 URL encoded)
  use?: string; // Intended use of the key
  alg?: string; // Algorithm
  kid?: string; // Key ID
  kty: string; // Key type (e.g., RSA)
};

export const jwkToPem = (jwk: JWK): string => {
  const base64UrlToBase64 = (base64Url: string): string => {
    return (
      base64Url.replace(/-/g, "+").replace(/_/g, "/") +
      "===".slice(0, (4 - (base64Url.length % 4)) % 4)
    );
  };

  const n = base64UrlToBase64(jwk.n);
  const e = base64UrlToBase64(jwk.e);

  const modulusBuffer = Buffer.from(n, "base64");
  const exponentBuffer = Buffer.from(e, "base64");

  // Construct the public key in ASN.1 format
  const publicKeyBuffer = Buffer.concat([
    Buffer.from([0x30, modulusBuffer.length + exponentBuffer.length + 5]), // SEQUENCE
    Buffer.from([0x02, modulusBuffer.length]), // INTEGER (modulus)
    modulusBuffer,
    Buffer.from([0x02, exponentBuffer.length]), // INTEGER (exponent)
    exponentBuffer,
  ]);

  // Convert to PEM format
  const publicKeyPem = `-----BEGIN PUBLIC KEY-----\n${publicKeyBuffer
    .toString("base64")
    .match(/.{1,64}/g)
    ?.join("\n")}\n-----END PUBLIC KEY-----`;

  return publicKeyPem;
};
