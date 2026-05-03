import { Suspense } from 'react';

import { PageContainer } from '@data-dogs/ui';

import { SignupForm } from './SignupForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Start a trial — Ibis',
  description:
    'Start a 14-day Ibis trial. Full data and full API access. No credit card required.',
};

export default function SignupPage() {
  return (
    <PageContainer maxWidth="720px">
      <main id="main-content" className={styles.pageMain}>
        <header className={styles.heroHeader}>
          <p className={styles.heroEyebrow}>Start a trial</p>
          <h1 className={styles.heroTitle}>14 days. Full data. No card.</h1>
          <p className={styles.heroSubtitle}>
            We&apos;ll review your request and email you when your seat is ready —
            usually within one business day.
          </p>
        </header>

        <Suspense fallback={null}>
          <SignupForm />
        </Suspense>

        <p className={styles.fineprint}>
          By starting a trial you agree to our
          {' '}
          <a href="/docs/product">terms of service</a>
          {' '}and{' '}
          <a href="/docs/product">privacy policy</a>.
        </p>
      </main>
    </PageContainer>
  );
}
