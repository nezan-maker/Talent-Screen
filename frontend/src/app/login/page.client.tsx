'use client';

import axios from 'axios';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import toast from '@/lib/toast';
import { AuthShell } from '@/components/auth/AuthShell';
import { GoogleIcon } from '@/components/auth/GoogleIcon';
import { BrainLoader } from '@/components/ui/BrainLoader';
import { Button } from '@/components/ui/Button';
import { getGoogleAuthErrorMessage, getGoogleAuthStartUrl } from '@/lib/auth';
import { getApiErrorMessage, loginUser } from '@/lib/api';
import { ROUTES } from '@/lib/constants';
import { recordLastLoginAt } from '@/lib/settings';

const googleAuthUrl = getGoogleAuthStartUrl();

const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

function getLoginErrorContent(error: unknown) {
  const message = getApiErrorMessage(error, 'Unable to sign in right now.');
  const normalized = message.toLowerCase();

  const isUnverifiedAccount =
    normalized.includes('not verified') ||
    (normalized.includes('confirm') && normalized.includes('email'));

  if (isUnverifiedAccount) {
    return {
      title: 'Verify Your Email Before Signing In',
      description:
        'Your account is almost ready. Please confirm your email from your inbox, then try signing in again.',
    };
  }

  return {
    title: 'Sign-In Failed',
    description: message,
  };
}

function getVerificationRedirectPayload(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return null;
  }

  const responseData = error.response?.data;
  if (!responseData || typeof responseData !== 'object') {
    return null;
  }

  const data = responseData as Record<string, unknown>;
  const authError =
    typeof data.auth_error === 'string'
      ? data.auth_error.toLowerCase()
      : '';
  const isUnverifiedAccount =
    data.verificationRequired === true ||
    authError.includes('not verified') ||
    (authError.includes('confirm') && authError.includes('email'));

  if (!isUnverifiedAccount) {
    return null;
  }

  const signupToken =
    typeof data.signupToken === 'string' && data.signupToken.trim()
      ? data.signupToken.trim()
      : undefined;
  const devOtpToken =
    typeof data.devOtpToken === 'string' && data.devOtpToken.trim()
      ? data.devOtpToken.trim()
      : undefined;

  return {
    signupToken,
    devOtpToken,
  };
}

function getPostAuthRoute(onboardingCompleted?: boolean) {
  return onboardingCompleted ? ROUTES.dashboard : ROUTES.welcome;
}

export default function LoginPage() {
  const router = useRouter();
  const [oauthErrorShown, setOauthErrorShown] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>(
    {}
  );
  const [touched, setTouched] = useState<{
    email?: boolean;
    password?: boolean;
  }>({});
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (oauthErrorShown || typeof window === 'undefined') {
      return;
    }

    const params = new URLSearchParams(window.location.search);
    const oauthError = getGoogleAuthErrorMessage(params.get('error')?.trim() ?? '');
    if (!oauthError) {
      return;
    }

    setOauthErrorShown(true);
    toast.error(oauthError);
  }, [oauthErrorShown]);

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!isValidEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleBlur = (field: 'email' | 'password') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const handleEmailChange = (value: string) => {
    setEmail(value);
    if (!touched.email) {
      return;
    }

    if (!value.trim()) {
      setErrors((prev) => ({ ...prev, email: 'Email is required' }));
    } else if (!isValidEmail(value)) {
      setErrors((prev) => ({ ...prev, email: 'Please enter a valid email' }));
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
      setErrors((prev) => ({ ...prev, password: 'Password is required' }));
    } else {
      setErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setBusy(true);

    try {
      const response = await loginUser({
        user_email: email.trim(),
        user_pass: password,
      });
      recordLastLoginAt();
      toast.success('Signed in successfully.');
      router.push(getPostAuthRoute(response.user?.onboardingCompleted));
    } catch (error) {
      const verificationPayload = getVerificationRedirectPayload(error);
      if (verificationPayload) {
        const verificationParams = new URLSearchParams({
          verify: '1',
          email: email.trim(),
        });

        if (verificationPayload.signupToken) {
          verificationParams.set('signup_token', verificationPayload.signupToken);
        }

        if (verificationPayload.devOtpToken) {
          verificationParams.set('confirm_otp', verificationPayload.devOtpToken);
        }

        toast.error({
          title: 'Verify Your Email Before Signing In',
          description:
            'Your account is not verified yet. A fresh confirmation code has been prepared. Complete verification to continue.',
        });
        router.push(`${ROUTES.register}?${verificationParams.toString()}`);
        return;
      }

      toast.error(getLoginErrorContent(error));
    } finally {
      setBusy(false);
    }
  }

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to manage jobs, screening, and shortlists."
      showTopBrand={false}
      footer={
        <>
          Don&apos;t have an account?{' '}
          <Link
            href={ROUTES.register}
            className="font-semibold text-accent hover:text-accent-hover"
          >
            Create one
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-5">
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
            onChange={(e) => handleEmailChange(e.target.value)}
            onBlur={() => handleBlur('email')}
            className={`mt-2 h-11 w-full rounded-input border bg-surface px-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
              errors.email && touched.email
                ? 'border-danger focus:border-danger focus:ring-danger/20'
                : 'border-border focus:border-accent/40 focus:ring-accent/20'
            }`}
            placeholder="you@company.com"
          />
          {errors.email && touched.email ? (
            <p className="mt-1.5 text-xs font-medium text-danger">
              {errors.email}
            </p>
          ) : null}
        </div>

        <div>
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="password"
              className="text-sm font-semibold text-text-primary"
            >
              Password
            </label>
            <Link
              href={ROUTES.forgotPassword}
              className="text-xs font-semibold text-accent hover:text-accent-hover"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative mt-2">
            <input
              id="password"
              name="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              onBlur={() => handleBlur('password')}
              className={`h-11 w-full rounded-input border bg-surface px-3 pr-10 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:ring-2 ${
                errors.password && touched.password
                  ? 'border-danger focus:border-danger focus:ring-danger/20'
                  : 'border-border focus:border-accent/40 focus:ring-accent/20'
              }`}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={() => setShowPassword((prev) => !prev)}
              className="absolute right-2 top-1/2 inline-flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-bg hover:text-text-primary"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
              title={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
          {errors.password && touched.password ? (
            <p className="mt-1.5 text-xs font-medium text-danger">
              {errors.password}
            </p>
          ) : null}
        </div>

        <Button type="submit" className="h-11 w-full" disabled={busy}>
          {busy ? (
            <>
              <BrainLoader className="h-4 w-4 text-white" label="Signing in" />
              Signing in...
            </>
          ) : (
            'Sign in'
          )}
        </Button>

        <div className="flex items-center gap-3 pt-1">
          <div className="h-px flex-1 bg-border" />
          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
            Or continue with
          </span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <Button
          type="button"
          variant="outline"
          className="h-11 w-full gap-2.5"
          onClick={() => {
            if (!googleAuthUrl) {
              toast.error('Google sign-in is not configured yet.');
              return;
            }
            window.location.href = googleAuthUrl;
          }}
        >
          <GoogleIcon className="h-4 w-4" />
          Continue with Google
        </Button>
      </form>
    </AuthShell>
  );
}
