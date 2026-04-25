'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import toast from '@/lib/toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { Button } from '@/components/ui/Button';
import {
  forgotPassword,
  getApiErrorMessage,
  resetPassword,
  verifyResetCode,
} from '@/lib/api';
import { ROUTES } from '@/lib/constants';

type Step = 'request' | 'verify' | 'reset';

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const isStrongPassword = (password: string) => {
  return /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[^a-zA-Z0-9]).{8,}$/.test(
    password
  );
};

function inputClass(hasError?: boolean) {
  return `mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/20'
      : 'border-border focus:border-accent/40 focus:ring-accent/20'
  }`;
}

export default function ForgotPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const recoveryLinkHandledRef = useRef(false);
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    code?: string;
    password?: string;
    confirm?: string;
  }>({});
  const emailFromLink = useMemo(
    () => searchParams.get('email')?.trim() ?? '',
    [searchParams]
  );
  const codeFromLink = useMemo(
    () => searchParams.get('reset_code')?.trim() ?? '',
    [searchParams]
  );
  const recoveryTokenFromLink = useMemo(
    () => searchParams.get('recovery_token')?.trim() ?? '',
    [searchParams]
  );

  async function handleRequestReset(event: React.FormEvent) {
    event.preventDefault();

    const trimmedEmail = email.trim();
    const nextErrors: typeof errors = {};

    if (!trimmedEmail) {
      nextErrors.email = 'Email is required';
    } else if (!isValidEmail(trimmedEmail)) {
      nextErrors.email = 'Please enter a valid email';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      const response = await forgotPassword(trimmedEmail);

      if (response.devResetToken) {
        await handleVerifyCode(response.devResetToken);
        return;
      }

      toast.success('Reset code generated. Enter it below to continue.');
      setStep('verify');
    } catch (error) {
      toast.error(
        getApiErrorMessage(
          error,
          'Unable to start password recovery right now.'
        )
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyCode(
    codeOverride?: string,
    recoveryTokenOverride?: string
  ) {
    const token = (codeOverride ?? code).trim();
    const nextErrors: typeof errors = {};

    if (!token) {
      nextErrors.code = 'Verification code is required';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      await verifyResetCode(
        token,
        recoveryTokenOverride || recoveryTokenFromLink || undefined
      );
      toast.success('Code verified. Set a new password.');
      setCode(token);
      setStep('reset');
      setErrors({});
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Unable to verify this reset code.')
      );
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!emailFromLink) {
      return;
    }

    setEmail((current) => (current ? current : emailFromLink));
  }, [emailFromLink]);

  useEffect(() => {
    if (
      recoveryLinkHandledRef.current ||
      !codeFromLink ||
      !recoveryTokenFromLink
    ) {
      return;
    }

    recoveryLinkHandledRef.current = true;
    if (emailFromLink) {
      setEmail(emailFromLink);
    }
    setStep('verify');
    setCode(codeFromLink);

    void handleVerifyCode(codeFromLink, recoveryTokenFromLink);
  }, [codeFromLink, emailFromLink, recoveryTokenFromLink]);

  async function handleResetPassword(event: React.FormEvent) {
    event.preventDefault();

    const nextErrors: typeof errors = {};

    if (!password) {
      nextErrors.password = 'Password is required';
    } else if (!isStrongPassword(password)) {
      nextErrors.password =
        'Use 8+ chars with upper, lower, number, and symbol';
    }

    if (!confirm) {
      nextErrors.confirm = 'Please confirm your password';
    } else if (password !== confirm) {
      nextErrors.confirm = 'Passwords do not match';
    }

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setBusy(true);

    try {
      await resetPassword({
        user_pass: password,
        user_pass_conf: confirm,
      });
      toast.success('Password updated. Sign in with your new password.');
      router.push(ROUTES.login);
    } catch (error) {
      toast.error(
        getApiErrorMessage(error, 'Unable to update the password right now.')
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Recover your account"
      subtitle="Use the backend reset flow to verify your email, confirm the recovery code, and set a new password."
      footer={
        <>
          Remembered your password?{' '}
          <Link
            href={ROUTES.login}
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Back to sign in
          </Link>
        </>
      }
    >
      {step === 'request' ? (
        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label
              htmlFor="email"
              className="text-sm font-semibold text-text-primary"
            >
              Work email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className={inputClass(Boolean(errors.email))}
              placeholder="you@company.com"
            />
            {errors.email ? (
              <p className="mt-1.5 text-xs font-medium text-danger">
                {errors.email}
              </p>
            ) : null}
            <p className="mt-1.5 text-xs text-text-muted">
              This step calls `POST /auth/forgot` and starts the cookie-based
              reset session.
            </p>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Sending code...' : 'Send reset code'}
          </Button>
        </form>
      ) : null}

      {step === 'verify' ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            void handleVerifyCode();
          }}
          className="space-y-5"
        >
          <div>
            <label
              htmlFor="code"
              className="text-sm font-semibold text-text-primary"
            >
              Verification code
            </label>
            <input
              id="code"
              name="code"
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className={inputClass(Boolean(errors.code))}
              placeholder="Enter the 6-digit code"
            />
            {errors.code ? (
              <p className="mt-1.5 text-xs font-medium text-danger">
                {errors.code}
              </p>
            ) : null}
            <p className="mt-1.5 text-xs text-text-muted">
              This step calls `POST /auth/verify` and unlocks the password reset
              session.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Button type="submit" className="h-11 w-full" disabled={busy}>
              {busy ? 'Verifying...' : 'Verify code'}
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-11 w-full"
              onClick={() => {
                setStep('request');
                setCode('');
                setErrors({});
              }}
            >
              Use a different email
            </Button>
          </div>
        </form>
      ) : null}

      {step === 'reset' ? (
        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label
              htmlFor="password"
              className="text-sm font-semibold text-text-primary"
            >
              New password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className={inputClass(Boolean(errors.password))}
              placeholder="Use upper, lower, number, and symbol"
            />
            {errors.password ? (
              <p className="mt-1.5 text-xs font-medium text-danger">
                {errors.password}
              </p>
            ) : null}
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="text-sm font-semibold text-text-primary"
            >
              Confirm new password
            </label>
            <input
              id="confirm"
              name="confirm"
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
              className={inputClass(Boolean(errors.confirm))}
              placeholder="Repeat your new password"
            />
            {errors.confirm ? (
              <p className="mt-1.5 text-xs font-medium text-danger">
                {errors.confirm}
              </p>
            ) : null}
            <p className="mt-1.5 text-xs text-text-muted">
              This final step calls `POST /auth/reset` with the reset-session
              cookie from the verify step.
            </p>
          </div>

          <Button type="submit" className="h-11 w-full" disabled={busy}>
            {busy ? 'Updating password...' : 'Update password'}
          </Button>
        </form>
      ) : null}
    </AuthShell>
  );
}

