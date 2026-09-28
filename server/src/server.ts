import "dotenv/config";
import { buildApp } from "./app.js";
import { validateAppReviewConfiguration } from "./auth/app-review.js";

// Hard requirement, not just a docs recommendation: without an allowlist,
// anyone who finds an email-enabled API can request a code, verify it, and
// create their own account and site. A dedicated review instance may instead
// disable email auth entirely and expose only its high-entropy hashed pairing
// credential. Refuse every other production configuration.
if (
  process.env.NODE_ENV === "production" &&
  process.env.DISABLE_EMAIL_AUTH !== "true" &&
  !process.env.ALLOWED_SIGNUP_EMAILS
) {
  console.error(
    "ALLOWED_SIGNUP_EMAILS must be set in production — without it, anyone who finds this server's API can " +
      "sign up and create their own account and site. Set it to a comma-separated list of the email(s) that " +
      "should be able to sign in. See SELF_HOSTING.md.",
  );
  process.exit(1);
}

validateAppReviewConfiguration();

const app = buildApp();
const port = Number(process.env.PORT ?? 3000);

app
  .listen({ port, host: "0.0.0.0" })
  .then(() => {
    app.log.info(`Flightstead server listening on :${port}`);
  })
  .catch((err) => {
    app.log.error(err);
    process.exit(1);
  });
