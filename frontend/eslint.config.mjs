// ESLint configuration for ESLint 8.x compatibility
export default {
  extends: [
    "next/core-web-vitals",
    "next/typescript",
  ],
  ignorePatterns: [
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "node_modules/**",
    ".git/**",
  ],
  rules: {
    "react/display-name": "warn",
    "@next/next/no-html-link-for-pages": "error",
  },
};
