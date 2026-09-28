import { randomBytes } from "node:crypto";
import { hashToken } from "../auth/tokens.js";

const accessCode = randomBytes(32).toString("base64url");

console.log("Generated a new App Review credential.");
console.log("Store the access code in App Store Connect or your password manager; it cannot be recovered from the hash.");
console.log(`\nAccess code: ${accessCode}`);
console.log(`APP_REVIEW_ACCESS_CODE_HASH=${hashToken(accessCode)}`);
