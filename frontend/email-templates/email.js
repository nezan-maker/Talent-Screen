const fs = require("node:fs");
const path = require("node:path");

const ROOT = __dirname;
const TEMPLATES_DIR = path.join(ROOT, "templates");
const DIST_DIR = path.join(ROOT, "dist");
const CSS_PATH = path.join(ROOT, "email.css");

const TEMPLATE_MAP = {
  "welcome-workspace": {
    fileName: "welcome-workspace.html",
    subject: "Welcome to WiseRank",
  },
  "account-verification": {
    fileName: "account-verification.html",
    subject: "Confirm your WiseRank account",
  },
  "password-reset": {
    fileName: "password-reset.html",
    subject: "Reset your WiseRank password",
  },
  "shortlist-ready": {
    fileName: "shortlist-ready.html",
    subject: "Your WiseRank shortlist is ready",
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function readTemplate(templateName) {
  const definition = TEMPLATE_MAP[templateName];
  if (!definition) {
    throw new Error(`Unknown email template: ${templateName}`);
  }

  return fs.readFileSync(path.join(TEMPLATES_DIR, definition.fileName), "utf8");
}

function stripCssComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, "");
}

function stripCssImports(css) {
  return css.replace(/@import[^;]+;\s*/g, "");
}

function stripCssMediaBlocks(css) {
  let result = "";
  let cursor = 0;

  while (cursor < css.length) {
    const mediaIndex = css.indexOf("@media", cursor);
    if (mediaIndex === -1) {
      result += css.slice(cursor);
      break;
    }

    result += css.slice(cursor, mediaIndex);

    const blockStart = css.indexOf("{", mediaIndex);
    if (blockStart === -1) {
      break;
    }

    let depth = 1;
    let blockEnd = blockStart + 1;

    while (blockEnd < css.length && depth > 0) {
      if (css[blockEnd] === "{") {
        depth += 1;
      } else if (css[blockEnd] === "}") {
        depth -= 1;
      }

      blockEnd += 1;
    }

    cursor = blockEnd;
  }

  return result;
}

function normalizeCssDeclarations(block) {
  return block
    .split(";")
    .map((declaration) => declaration.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .map((declaration) => `${declaration};`)
    .join(" ");
}

function parseSimpleSelector(selector) {
  const normalized = selector.trim();

  if (!normalized || /[\s:[>+~*]/.test(normalized)) {
    return null;
  }

  if (normalized.startsWith(".")) {
    const className = normalized.slice(1);
    if (!/^[A-Za-z0-9_-]+$/.test(className)) {
      return null;
    }

    return {
      type: "class",
      value: className,
    };
  }

  if (!/^[A-Za-z][A-Za-z0-9:-]*$/.test(normalized)) {
    return null;
  }

  return {
    type: "tag",
    value: normalized.toLowerCase(),
  };
}

function extractInlineCssRules(css) {
  const simpleCss = stripCssMediaBlocks(stripCssImports(stripCssComments(css)));
  const rulePattern = /([^{}]+)\{([^{}]+)\}/g;
  const rules = [];
  let match;

  while ((match = rulePattern.exec(simpleCss)) !== null) {
    const selectors = match[1]
      .split(",")
      .map((selector) => selector.trim())
      .filter(Boolean);
    const declarations = normalizeCssDeclarations(match[2]);

    if (!declarations) {
      continue;
    }

    for (const selector of selectors) {
      const parsedSelector = parseSimpleSelector(selector);
      if (!parsedSelector) {
        continue;
      }

      rules.push({
        ...parsedSelector,
        declarations,
      });
    }
  }

  return rules;
}

function maskHtmlComments(html) {
  const comments = [];
  const maskedHtml = html.replace(/<!--[\s\S]*?-->/g, (comment) => {
    const token = `__WR_COMMENT_${comments.length}__`;
    comments.push(comment);
    return token;
  });

  return {
    comments,
    maskedHtml,
  };
}

function restoreHtmlComments(html, comments) {
  return comments.reduce(
    (result, comment, index) => result.replace(`__WR_COMMENT_${index}__`, comment),
    html
  );
}

function normalizeInlineStyle(style) {
  const normalized = String(style ?? "").trim();
  if (!normalized) {
    return "";
  }

  return normalized.endsWith(";") ? normalized : `${normalized};`;
}

function inlineCriticalCss(html, css) {
  const rules = extractInlineCssRules(css);
  if (rules.length === 0) {
    return html;
  }

  const { comments, maskedHtml } = maskHtmlComments(html);

  const inlinedHtml = maskedHtml.replace(
    /<([A-Za-z][A-Za-z0-9:-]*)(\s[^<>]*?)?(\/?)>/g,
    (fullMatch, rawTagName, rawAttributes = "", selfClosing = "") => {
      const tagName = rawTagName.toLowerCase();
      if (["head", "link", "meta", "script", "style", "title"].includes(tagName)) {
        return fullMatch;
      }

      const classMatch = rawAttributes.match(/\bclass\s*=\s*("([^"]*)"|'([^']*)')/i);
      const classNames = classMatch ? classMatch[2] ?? classMatch[3] ?? "" : "";
      const classSet = new Set(classNames.split(/\s+/).filter(Boolean));

      const matchedDeclarations = [];
      for (const rule of rules) {
        if (rule.type === "tag" && rule.value === tagName) {
          matchedDeclarations.push(rule.declarations);
          continue;
        }

        if (rule.type === "class" && classSet.has(rule.value)) {
          matchedDeclarations.push(rule.declarations);
        }
      }

      if (matchedDeclarations.length === 0) {
        return fullMatch;
      }

      const styleMatch = rawAttributes.match(/\bstyle\s*=\s*("([^"]*)"|'([^']*)')/i);
      const existingStyle = normalizeInlineStyle(styleMatch ? styleMatch[2] ?? styleMatch[3] : "");
      const mergedStyle = [...matchedDeclarations, existingStyle].filter(Boolean).join(" ");

      if (styleMatch) {
        const quote = styleMatch[2] !== undefined ? '"' : "'";
        const updatedAttributes = rawAttributes.replace(
          styleMatch[0],
          `style=${quote}${mergedStyle}${quote}`
        );
        return `<${rawTagName}${updatedAttributes}${selfClosing ? " /" : ""}>`;
      }

      return `<${rawTagName}${rawAttributes} style="${mergedStyle}"${selfClosing ? " /" : ""}>`;
    }
  );

  return restoreHtmlComments(inlinedHtml, comments);
}

function buildHeadStyles(css) {
  return stripCssImports(stripCssComments(css)).trim();
}

function renderBrandLockup() {
  return `
<table role="presentation" cellpadding="0" cellspacing="0" class="wr-brand-table">
  <tr>
    <td class="wr-brand-mark-cell" width="48" valign="middle">
      <!--[if mso]>
      <div style="width:46px;height:46px;line-height:46px;text-align:center;border-radius:14px;background:#0f172a;color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:20px;font-weight:800;">W</div>
      <![endif]-->
      <!--[if !mso]><!-- -->
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 64 64"
        width="46"
        height="46"
        class="wr-brand-svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="wrBrandTile" x1="8" y1="6" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#13253B" />
            <stop offset="0.55" stop-color="#0F172A" />
            <stop offset="1" stop-color="#08111C" />
          </linearGradient>
          <radialGradient id="wrBrandGlow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(46 14) rotate(139) scale(31 28)">
            <stop stop-color="#6EE7B7" stop-opacity="0.95" />
            <stop offset="1" stop-color="#6EE7B7" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="wrBrandRing" x1="12" y1="16" x2="50" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#A7F3D0" stop-opacity="0.25" />
            <stop offset="0.55" stop-color="#34D399" stop-opacity="0.85" />
            <stop offset="1" stop-color="#ECFDF5" stop-opacity="0.28" />
          </linearGradient>
          <linearGradient id="wrBrandSweep" x1="14" y1="24" x2="51" y2="35" gradientUnits="userSpaceOnUse">
            <stop stop-color="#34D399" stop-opacity="0.18" />
            <stop offset="0.55" stop-color="#A7F3D0" stop-opacity="0.95" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.22" />
          </linearGradient>
          <linearGradient id="wrBrandEdge" x1="10" y1="8" x2="58" y2="58" gradientUnits="userSpaceOnUse">
            <stop stop-color="#86EFAC" stop-opacity="0.55" />
            <stop offset="1" stop-color="#F8FAFC" stop-opacity="0.1" />
          </linearGradient>
        </defs>
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandTile)" />
        <rect x="4" y="4" width="56" height="56" rx="18" fill="url(#wrBrandGlow)" />
        <rect x="4.5" y="4.5" width="55" height="55" rx="17.5" stroke="url(#wrBrandEdge)" />
        <circle cx="32" cy="33" r="18.5" stroke="url(#wrBrandRing)" stroke-width="2.5" />
        <path
          d="M14 35.5C18.2 27.1667 24.2 23 32 23C39.8 23 45.8 27.1667 50 35.5"
          stroke="url(#wrBrandSweep)"
          stroke-width="3.2"
          stroke-linecap="round"
        />
        <path
          d="M16.5 20.5L24 42L32 28.5L40 42L47.5 20.5"
          stroke="#F8FAFC"
          stroke-width="5"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <circle cx="32" cy="15.5" r="5.5" fill="#34D399" />
        <path
          d="M29.5 15.7L31.2 17.5L34.7 13.6"
          stroke="#052E26"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
      <!--<![endif]-->
    </td>
    <td class="wr-brand-copy-cell" valign="middle">
      <div class="wr-brand-title">WiseRank</div>
      <div class="wr-brand-subtitle">Recruiter Workspace</div>
    </td>
  </tr>
</table>`.trim();
}

function renderCandidateStack(candidates) {
  return `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-list-table">
  ${candidates
    .map(
      (candidate) => `
  <tr>
    <td class="wr-list-cell">
      <div class="wr-list-card">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" class="wr-list-row">
          <tr>
            <td valign="top">
              <div class="wr-list-person">${escapeHtml(candidate.name)}</div>
              <div class="wr-list-role">${escapeHtml(candidate.role)}</div>
            </td>
            <td align="right" valign="top">
              <span class="wr-score-pill">${escapeHtml(candidate.score)}</span>
            </td>
          </tr>
        </table>
        <p class="wr-list-copy">${escapeHtml(candidate.summary)}</p>
      </div>
    </td>
  </tr>`
    )
    .join("")}
</table>`.trim();
}

function merge(base, overrides) {
  return {
    ...base,
    ...overrides,
  };
}

function getBaseContext() {
  return {
    brandLockupHtml: renderBrandLockup(),
    companyAddress: "Kigali, Rwanda",
    contactUrl: "https://app.rankwise.dev/contact",
    currentYear: new Date().getFullYear(),
    dashboardUrl: "https://app.rankwise.dev/dashboard",
    jobsUrl: "https://app.rankwise.dev/dashboard/jobs/new",
    loginUrl: "https://app.rankwise.dev/login",
    productName: "WiseRank",
    registerUrl: "https://app.rankwise.dev/register",
    supportEmail: "hello@rankwise.io",
    supportUrl: "mailto:hello@rankwise.io",
  };
}

function buildTemplateContext(templateName, overrides = {}) {
  const base = getBaseContext();

  if (templateName === "welcome-workspace") {
    return merge(
      {
        ...base,
        preheader:
          "Your WiseRank workspace is ready. Start creating roles and screening candidates with explainable AI.",
        userName: "Alex",
        workspaceName: "WiseRank Recruiter Workspace",
      },
      overrides
    );
  }

  if (templateName === "account-verification") {
    return merge(
      {
        ...base,
        expiresIn: "10 minutes",
        preheader:
          "Use this code to confirm your WiseRank account and finish setting up your recruiter workspace.",
        recipientEmail: "alex@company.com",
        userName: "Alex",
        verificationCode: "438291",
        verifyUrl: "https://app.rankwise.dev/register",
      },
      overrides
    );
  }

  if (templateName === "password-reset") {
    return merge(
      {
        ...base,
        expiresIn: "30 minutes",
        preheader:
          "A password reset was requested for your WiseRank account. Verify the request and choose a new password.",
        recipientEmail: "alex@company.com",
        resetCode: "804117",
        resetUrl: "https://app.rankwise.dev/forgot-password",
        userName: "Alex",
      },
      overrides
    );
  }

  if (templateName === "shortlist-ready") {
    return merge(
      {
        ...base,
        candidateRowsHtml: renderCandidateStack([
          {
            name: "Nadine Uwase",
            role: "Frontend Lead | Kigali",
            score: "94 AI Score",
            summary:
              "Strong React depth, clean system thinking, and a portfolio that maps well to product-facing hiring workflows.",
          },
          {
            name: "Samuel Ouma",
            role: "Senior UI Engineer | Nairobi",
            score: "91 AI Score",
            summary:
              "Excellent component architecture, clear accessibility habits, and direct experience shipping recruiter-facing UX.",
          },
        ]),
        exportUrl: "https://app.rankwise.dev/dashboard/screening/job_001/results",
        jobTitle: "Senior Frontend Engineer",
        maybeCount: "4",
        preheader:
          "Your screening run is complete. Review the latest WiseRank shortlist and share the strongest candidates.",
        qualifiedCount: "6",
        reviewUrl: "https://app.rankwise.dev/dashboard/screening/job_001/results",
        screenedCount: "24",
        userName: "Alex",
        verdict:
          "Top candidates were shortlisted based on skills relevance, education fit, and recruiter-friendly AI reasoning.",
      },
      overrides
    );
  }

  throw new Error(`No data builder configured for template: ${templateName}`);
}

function replaceTokens(template, data) {
  return template.replace(/{{\s*([\w]+)\s*}}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      return String(data[key] ?? "");
    }

    return "";
  });
}

function renderEmailTemplate(templateName, overrides = {}) {
  const css = fs.readFileSync(CSS_PATH, "utf8");
  const headStyles = buildHeadStyles(css);
  const template = readTemplate(templateName);
  const data = buildTemplateContext(templateName, overrides);

  const html = replaceTokens(template, {
    ...data,
    sharedStyles: `<style>\n${headStyles}\n</style>`,
  });

  return inlineCriticalCss(html, headStyles);
}

function buildAllTemplates() {
  ensureDir(DIST_DIR);

  return Object.keys(TEMPLATE_MAP).map((templateName) => {
    const html = renderEmailTemplate(templateName);
    const outputPath = path.join(DIST_DIR, TEMPLATE_MAP[templateName].fileName);
    fs.writeFileSync(outputPath, html, "utf8");

    return {
      fileName: TEMPLATE_MAP[templateName].fileName,
      outputPath,
      subject: TEMPLATE_MAP[templateName].subject,
      templateName,
    };
  });
}

if (require.main === module) {
  const results = buildAllTemplates();
  for (const result of results) {
    console.log(`Built ${result.templateName} -> ${path.relative(process.cwd(), result.outputPath)}`);
  }
}

module.exports = {
  TEMPLATE_MAP,
  buildAllTemplates,
  buildTemplateContext,
  renderEmailTemplate,
};
