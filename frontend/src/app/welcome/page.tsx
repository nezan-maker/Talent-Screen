import type { Metadata } from 'next';
import WelcomePageClient from './page.client';
import { buildMetadata } from '@/lib/metadata';

export const metadata: Metadata = buildMetadata({
  title: 'Welcome',
  description:
    'Finish setting up your Talvo workspace with your company details and hiring preferences before entering the dashboard.',
  path: '/welcome',
  noIndex: true,
  keywords: ['welcome', 'workspace setup', 'onboarding'],
});

export default function Page() {
  return <WelcomePageClient />;
}
