'use client';

import { useState } from 'react';
import { useSearchParams } from 'next/navigation';

import styles from './page.module.css';

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; email: string }
  | { status: 'error'; message: string };

const TOPICS = [
  { value: 'pricing', label: 'Enterprise pricing' },
  { value: 'sso', label: 'SSO / SAML' },
  { value: 'deployment', label: 'Dedicated deployment' },
  { value: 'data', label: 'Custom data feed' },
  { value: 'other', label: 'Other' },
] as const;

export function ContactForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams?.get('plan') ?? '';
  const initialTopic = planParam === 'enterprise' ? 'pricing' : 'pricing';

  const [state, setState] = useState<FormState>({ status: 'idle' });

  if (state.status === 'success') {
    return (
      <section role="status" aria-live="polite" className={styles.successPanel}>
        <p className={styles.successEyebrow}>Message received</p>
        <h2 className={styles.successTitle}>Thanks — we&apos;ll be in touch.</h2>
        <p className={styles.successBody}>
          We&apos;ll reach <span className={styles.successEmail}>{state.email}</span>{' '}
          within one business day.
        </p>
        <div className={styles.successCtaRow}>
          <a className={styles.ctaSecondary} href="/overview">
            See the product overview
          </a>
          <a className={styles.ctaSecondary} href="/docs/api">
            Read the API docs
          </a>
        </div>
      </section>
    );
  }

  return (
    <form
      className={styles.form}
      onSubmit={async (event) => {
        event.preventDefault();
        const formData = new FormData(event.currentTarget);
        const payload = {
          email: String(formData.get('email') ?? '').trim(),
          name: String(formData.get('name') ?? '').trim(),
          company: String(formData.get('company') ?? '').trim(),
          topic: String(formData.get('topic') ?? '').trim(),
          message: String(formData.get('message') ?? '').trim(),
        };
        setState({ status: 'submitting' });
        try {
          const res = await fetch('/api/v1/contact', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (!res.ok) {
            const data = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            setState({
              status: 'error',
              message: data.error ?? 'Something went wrong. Please try again.',
            });
            return;
          }
          setState({ status: 'success', email: payload.email });
        } catch {
          setState({
            status: 'error',
            message: 'Network error. Please try again.',
          });
        }
      }}
    >
      <div className={styles.fieldGrid}>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Work email</span>
          <input
            className={styles.fieldInput}
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="you@firm.com"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Name</span>
          <input
            className={styles.fieldInput}
            type="text"
            name="name"
            required
            autoComplete="name"
            placeholder="Jane Smith"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Company</span>
          <input
            className={styles.fieldInput}
            type="text"
            name="company"
            required
            autoComplete="organization"
            placeholder="Capital Partners"
          />
        </label>
        <label className={styles.field}>
          <span className={styles.fieldLabel}>Topic</span>
          <select
            className={styles.fieldInput}
            name="topic"
            defaultValue={initialTopic}
            required
          >
            {TOPICS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.fieldLabel}>How can we help?</span>
          <textarea
            className={styles.fieldTextarea}
            name="message"
            rows={4}
            required
            placeholder="Headcount, timeline, and any data or integration requirements."
          />
        </label>
      </div>

      {state.status === 'error' ? (
        <p role="alert" className={styles.error}>
          {state.message}
        </p>
      ) : null}

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={state.status === 'submitting'}
      >
        {state.status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  );
}
