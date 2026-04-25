"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import toast from "react-hot-toast";
import { AuthShell } from "@/components/auth/AuthShell";
import { Button } from "@/components/ui/Button";
import { confirmSignup, getApiErrorMessage, signupUser } from "@/lib/api";
import { ROUTES } from "@/lib/constants";

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(password);
};

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [pendingEmail, setPendingEmail] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirm?: string;
  }>({});
  const [touched, setTouched] = useState<{
    name?: boolean;
    email?: boolean;
    password?: boolean;
    confirm?: boolean;
  }>({});
  const [busy, setBusy] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!name.trim()) {
      newErrors.name = "Full name is required";
    } else if (name.trim().length < 3) {
      newErrors.name = "Name must be at least 3 characters";
    }

    if (!email.trim()) {
      newErrors.email = "Email is required";
    } else if (!isValidEmail(email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!isStrongPassword(password)) {
      newErrors.password = "Use 8+ chars with upper, lower, number, and symbol";
    }

    if (!confirm) {
      newErrors.confirm = "Please confirm your password";
    } else if (password !== confirm) {
      newErrors.confirm = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0 && agreeToTerms;
  };

  const handleBlur = (field: keyof typeof touched) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleNameChange = (value: string) => {
    setName(value);
    if (!touched.name) {
      return;
    }

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, name: "Full name is required" }));
    } else if (value.trim().length < 3) {
      setErrors((prev) => ({ ...prev, name: "Name must be at least 3 characters" }));
    } else {
      setErrors((prev) => ({ ...prev, name: undefined }));
    }
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!touched.email) {
      return;
    }

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, email: "Email is required" }));
    } else if (!isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: "Please enter a valid email" }));
    } else {
      setErrors((prev) => ({ ...prev, email: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (!touched.password) {
      return;
    }

    if (!value) {
      setErrors((prev) => ({ ...prev, password: "Password is required" }));
    } else if (!isStrongPassword(value)) {
      setErrors((prev) => ({
        ...prev,
        password: "Use 8+ chars with upper, lower, number, and symbol",
      }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmChange = (value: string) => {
    setConfirm(value);
    if (!touched.confirm) {
      return;
    }

    if (!value) {
      setErrors((prev) => ({ ...prev, confirm: "Please confirm your password" }));
    } else if (password !== value) {
      setErrors((prev) => ({ ...prev, confirm: "Passwords do not match" }));
    } else {
      setErrors((prev) => ({ ...prev, confirm: undefined }));
    }
  };

  async function handleVerification(codeOverride?: string) {
    const code = (codeOverride ?? verificationCode).trim();
    if (!code) {
      toast.error("Enter the verification code to continue.");
      return;
    }

    setBusy(true);

    try {
      await confirmSignup(code);
      toast.success("Account verified successfully.");
      router.push(ROUTES.dashboard);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to confirm this account right now."));
    } finally {
      setBusy(false);
    }
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateForm()) {
      if (!agreeToTerms) {
        toast.error("Please agree to the terms and privacy policy");
      }
      return;
    }

    setBusy(true);

    try {
      const signupResponse = await signupUser({
        user_name: name.trim(),
        user_email: email.trim(),
        user_pass: password,
        user_pass_conf: confirm,
      });

      if (signupResponse.verificationRequired) {
        setPendingEmail(email.trim());

        if (signupResponse.devOtpToken) {
          await handleVerification(signupResponse.devOtpToken);
          return;
        }

        setAwaitingVerification(true);
        toast.success("Account created. Enter the verification code to finish setup.");
        return;
      }

      toast.success("Account created successfully.");
      router.push(ROUTES.dashboard);
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to create your account right now."));
    } finally {
      setBusy(false);
    }
  }

  if (awaitingVerification) {
    return (
      <AuthShell
        title="Confirm your account"
        subtitle={`Enter the verification code sent to ${pendingEmail || "your email address"}.`}
        footer={
          <button
            type="button"
            className="font-semibold text-accent hover:text-accent-hover"
            onClick={() => {
              setAwaitingVerification(false);
              setVerificationCode("");
            }}
          >
            Use different registration details
          </button>
        }
      >
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleVerification();
          }}
          className="space-y-5"
        >
          <div>
            <label htmlFor="verification-code" className="text-sm font-semibold text-text-primary">
              Verification code
            </label>
            <input
              id="verification-code"
              name="verification-code"
              type="text"
              inputMode="numeric"
              value={verificationCode}
              onChange={(event) => setVerificationCode(event.target.value)}
              className="mt-2 h-11 w-full rounded-input border border-border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-accent/40 focus:ring-2 focus:ring-accent/20"
              placeholder="Enter the 6-digit code"
            />
            <p className="mt-1.5 text-xs text-text-muted">
              This step uses your backend `POST /auth/confirm` route and the verification cookie set at signup.
            </p>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? "Confirming..." : "Confirm account"}
          </Button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your workspace"
      subtitle="Start posting roles and running recruiter-friendly workflows in minutes."
      footer={
        <>
          Already have an account?{" "}
          <Link href={ROUTES.login} className="font-semibold text-accent hover:text-accent-hover">
            Sign in
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="text-sm font-semibold text-text-primary">
            Full name
          </label>
          <input
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            value={name}
            onChange={(event) => handleNameChange(event.target.value)}
            onBlur={() => handleBlur("name")}
            className={`mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
              errors.name && touched.name
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-accent/40 focus:ring-accent/20"
            }`}
            placeholder="Alex Recruiter"
          />
          {errors.name && touched.name ? (
            <p className="mt-1.5 text-xs font-medium text-danger">{errors.name}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-semibold text-text-primary">
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => handleEmailChange(event.target.value)}
            onBlur={() => handleBlur("email")}
            className={`mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
              errors.email && touched.email
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-accent/40 focus:ring-accent/20"
            }`}
            placeholder="you@company.com"
          />
          {errors.email && touched.email ? (
            <p className="mt-1.5 text-xs font-medium text-danger">{errors.email}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-semibold text-text-primary">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={password}
            onChange={(event) => handlePasswordChange(event.target.value)}
            onBlur={() => handleBlur("password")}
            className={`mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
              errors.password && touched.password
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-accent/40 focus:ring-accent/20"
            }`}
            placeholder="Use upper, lower, number, and symbol"
          />
          {errors.password && touched.password ? (
            <p className="mt-1.5 text-xs font-medium text-danger">{errors.password}</p>
          ) : null}
        </div>

        <div>
          <label htmlFor="confirm" className="text-sm font-semibold text-text-primary">
            Confirm password
          </label>
          <input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            value={confirm}
            onChange={(event) => handleConfirmChange(event.target.value)}
            onBlur={() => handleBlur("confirm")}
            className={`mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
              errors.confirm && touched.confirm
                ? "border-danger focus:border-danger focus:ring-danger/20"
                : "border-border focus:border-accent/40 focus:ring-accent/20"
            }`}
            placeholder="Repeat password"
          />
          {errors.confirm && touched.confirm ? (
            <p className="mt-1.5 text-xs font-medium text-danger">{errors.confirm}</p>
          ) : null}
        </div>

        <label
          className={`flex items-start gap-3 text-sm transition-colors ${
            !agreeToTerms ? "text-danger" : "text-text-muted"
          }`}
        >
          <input
            type="checkbox"
            checked={agreeToTerms}
            onChange={(event) => setAgreeToTerms(event.target.checked)}
            className="mt-1 h-4 w-4 cursor-pointer rounded border-border text-accent"
          />
          <span>
            I agree to the{" "}
            <button
              type="button"
              className="font-semibold text-accent hover:text-accent-hover"
              onClick={() => toast("Terms are still placeholder content.")}
            >
              Terms
            </button>{" "}
            and{" "}
            <button
              type="button"
              className="font-semibold text-accent hover:text-accent-hover"
              onClick={() => toast("Privacy policy is still placeholder content.")}
            >
              Privacy Policy
            </button>
            .
          </span>
        </label>

        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? "Creating account..." : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}
