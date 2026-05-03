import { Suspense } from 'react';

import { PageContainer } from '@data-dogs/ui';

import { ContactForm } from './ContactForm';
import styles from './page.module.css';

export const metadata = {
  title: 'Talk to sales — Ibis',
  description:
    'Talk to the Ibis sales team about Enterprise pricing, SSO, dedicated environments and custom data feeds.',
};

export default function ContactPage() {
  return (
    <PageContainer maxWidth="720px">
      <main id="main-content" className={styles.pageMain}>
        <header className={styles.heroHeader}>
          <p className={styles.heroEyebrow}>Talk to sales</p>
          <h1 className={styles.heroTitle}>Enterprise, SSO and dedicated deployments.</h1>
          <p className={styles.heroSubtitle}>
            Tell us a little about your firm and what you need. We answer in less
            than one business day.
          </p>
        </header>

        <Suspense fallback={null}>
          <ContactForm />
        </Suspense>

        <p className={styles.fineprint}>
          Researcher and Team plans are self-serve —
          {' '}
          <a href="/signup?plan=researcher">start a 14-day trial</a>
          {' '}for those.
        </p>
      </main>
    </PageContainer>
  );
}
