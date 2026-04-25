'use client';

import hotToast, { type ToastOptions } from 'react-hot-toast';
import { AppToast, type AppToastVariant } from '@/components/ui/AppToast';

type ToastInput =
  | string
  | {
      title?: string;
      description?: string;
    };

type AppToastOptions = Omit<ToastOptions, 'icon' | 'style' | 'className'>;

function normalizeContent(
  input: ToastInput,
  fallbackTitle: string
): { title?: string; description: string } {
  if (typeof input === 'string') {
    return {
      title: fallbackTitle,
      description: input,
    };
  }

  const title = input.title?.trim();
  const description = input.description?.trim();

  if (!title && !description) {
    return {
      title: fallbackTitle,
      description: fallbackTitle,
    };
  }

  if (!description) {
    return {
      title: fallbackTitle,
      description: title || fallbackTitle,
    };
  }

  return {
    title: title || fallbackTitle,
    description,
  };
}

function defaultTitleForVariant(variant: AppToastVariant) {
  if (variant === 'success') {
    return 'Success';
  }

  if (variant === 'error') {
    return 'Something Went Wrong';
  }

  if (variant === 'warning') {
    return 'Attention';
  }

  if (variant === 'loading') {
    return 'Working On It';
  }

  return 'Notice';
}

function showToast(
  variant: AppToastVariant,
  input: ToastInput,
  options?: AppToastOptions
) {
  const defaultTitle = defaultTitleForVariant(variant);
  const content = normalizeContent(input, defaultTitle);

  return hotToast.custom(
    (toastInstance) => (
      <AppToast
        toast={toastInstance}
        variant={variant}
        title={content.title}
        description={content.description}
      />
    ),
    {
      position: 'bottom-right',
      duration: variant === 'loading' ? Infinity : 4400,
      ...options,
    }
  );
}

type ToastFn = ((input: ToastInput, options?: AppToastOptions) => string) & {
  success: (input: ToastInput, options?: AppToastOptions) => string;
  error: (input: ToastInput, options?: AppToastOptions) => string;
  info: (input: ToastInput, options?: AppToastOptions) => string;
  warning: (input: ToastInput, options?: AppToastOptions) => string;
  loading: (input: ToastInput, options?: AppToastOptions) => string;
  dismiss: typeof hotToast.dismiss;
  remove: typeof hotToast.remove;
};

const toast = Object.assign(
  (input: ToastInput, options?: AppToastOptions) =>
    showToast('info', input, options),
  {
    success: (input: ToastInput, options?: AppToastOptions) =>
      showToast('success', input, options),
    error: (input: ToastInput, options?: AppToastOptions) =>
      showToast('error', input, options),
    info: (input: ToastInput, options?: AppToastOptions) =>
      showToast('info', input, options),
    warning: (input: ToastInput, options?: AppToastOptions) =>
      showToast('warning', input, options),
    loading: (input: ToastInput, options?: AppToastOptions) =>
      showToast('loading', input, options),
    dismiss: hotToast.dismiss,
    remove: hotToast.remove,
  }
) as ToastFn;

export type { ToastInput, AppToastOptions };
export default toast;
