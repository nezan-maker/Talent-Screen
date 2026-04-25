'use client';

import {
  AlertTriangle,
  Check,
  Info,
  Loader2,
  X,
  XCircle,
} from 'lucide-react';
import hotToast, { type Toast as HotToast } from 'react-hot-toast';

export type AppToastVariant =
  | 'success'
  | 'error'
  | 'info'
  | 'warning'
  | 'loading';

const VARIANT_STYLES: Record<
  AppToastVariant,
  {
    accent: string;
    iconBg: string;
    surface: string;
    closeText: string;
    title: string;
  }
> = {
  success: {
    accent: '#F97316',
    iconBg: 'rgba(249, 115, 22, 0.18)',
    surface: '#F8FAFC',
    closeText: '#64748B',
    title: 'Success',
  },
  error: {
    accent: '#EF4444',
    iconBg: 'rgba(239, 68, 68, 0.2)',
    surface: '#F8FAFC',
    closeText: '#64748B',
    title: 'Something Went Wrong',
  },
  info: {
    accent: '#1F2937',
    iconBg: 'rgba(31, 41, 55, 0.2)',
    surface: '#F8FAFC',
    closeText: '#64748B',
    title: 'Notice',
  },
  warning: {
    accent: '#F59E0B',
    iconBg: 'rgba(245, 158, 11, 0.2)',
    surface: '#F8FAFC',
    closeText: '#64748B',
    title: 'Attention',
  },
  loading: {
    accent: '#FB7A2A',
    iconBg: 'rgba(251, 122, 42, 0.2)',
    surface: '#F8FAFC',
    closeText: '#64748B',
    title: 'Working On It',
  },
};

function ToastIcon({ variant }: { variant: AppToastVariant }) {
  if (variant === 'success') {
    return <Check className="h-4 w-4" />;
  }

  if (variant === 'error') {
    return <XCircle className="h-4 w-4" />;
  }

  if (variant === 'warning') {
    return <AlertTriangle className="h-4 w-4" />;
  }

  if (variant === 'loading') {
    return <Loader2 className="h-4 w-4 animate-spin" />;
  }

  return <Info className="h-4 w-4" />;
}

export function AppToast({
  toast,
  variant,
  title,
  description,
}: {
  toast: HotToast;
  variant: AppToastVariant;
  title?: string;
  description: string;
}) {
  const palette = VARIANT_STYLES[variant];
  const fallbackTitle = palette.title;
  const resolvedTitle = title?.trim() || fallbackTitle;

  return (
    <div
      className={[
        'pointer-events-auto w-[320px] max-w-[calc(100vw-1rem)] overflow-hidden rounded-2xl border transition-all duration-200',
        toast.visible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0',
      ].join(' ')}
      style={{
        borderColor: '#D6DEE8',
        background: palette.surface,
        boxShadow: `0 0 0 1px ${palette.accent}2E, 0 10px 22px rgba(15, 23, 42, 0.12)`,
      }}
    >
      <div className="flex min-w-0 items-start gap-3 px-4 py-3.5">
        <div className="flex min-w-0 flex-1 items-start gap-3">
          <span
            className="mt-0.5 inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
            style={{
              backgroundColor: palette.iconBg,
              color: palette.accent,
            }}
          >
            <ToastIcon variant={variant} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-bold leading-5 tracking-[-0.01em] text-[#1F2937]">
              {resolvedTitle}
            </p>
            <p className="mt-0.5 text-sm leading-5 text-[#475569]">{description}</p>
          </div>
        </div>

        <button
          type="button"
          aria-label="Dismiss notification"
          onClick={() => hotToast.dismiss(toast.id)}
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-all hover:bg-slate-200/70"
          style={{ color: palette.closeText }}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
