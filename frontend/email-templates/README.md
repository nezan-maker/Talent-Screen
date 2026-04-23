# WiseRank Email Templates

This folder contains reusable source templates for WiseRank user emails.

What is included:

- `templates/`: editable source HTML templates with placeholder tokens like `{{userName}}`
- `email.css`: shared brand styling pulled from the app's navy, slate, and emerald palette
- `email.js`: a small renderer/build helper that injects data and writes ready-to-send HTML into `dist/`
- `dist/`: generated standalone HTML files with the shared CSS inlined

Core templates:

- `welcome-workspace`
- `account-verification`
- `password-reset`
- `shortlist-ready`

Build the standalone email files:

```bash
node email-templates/email.js
```

Use from backend code:

```js
const { renderEmailTemplate } = require("./email-templates/email.js");

const html = renderEmailTemplate("account-verification", {
  userName: "Alex",
  verificationCode: "438291",
  verifyUrl: "https://app.rankwise.dev/register/confirm",
});
```

Notes:

- Email clients typically ignore JavaScript. The JS here is only for rendering/building the final HTML before send time.
- Files in `templates/` are source files and are not meant to be sent or previewed directly. Their `{{sharedStyles}}` placeholder is only resolved when you build `dist/` or call `renderEmailTemplate(...)`.
- Replace the sample URLs, support email, and company address with production values before wiring this into live delivery.
