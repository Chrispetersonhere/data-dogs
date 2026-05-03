'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';

import { getPlanBySlug, pricingPlans } from '../../lib/marketing/plans';

import styles from './page.module.css';

type FormState =
  | { status: 'idle' }
  | { status: 'submitting' }
  | { status: 'success'; email: string }
  | { status: 'error'; message: string };

export function SignupForm() {
  const searchParams = useSearchParams();
  const planParam = searchParams?.get('plan') ?? 'researcher';
  const plan = useMemo(
    () => getPlanBySlug(planParam) ?? getPlanBySlug('researcher'),
    [planParam],
  );

  const [state, setState] = useState<FormState>({ status: 'idle' });

  if (!plan) {
    return null;
  }

  if (state.status === 'success') {
    return (
      <section
        role="status"
        aria-live="polite"
        className={styles.successPanel}
      >
        <p className={styles.successEyebrow}>Request received</p>
        <h2 className={styles.successTitle}>You&apos;re on the list.</h2>
        <p className={styles.successBody}>
          We&apos;ll email <span className={styles.successEmail}>{state.email}</span>{' '}
          when your <strong>{plan.name}</strong> seat is ready. In the meantime, the
          API docs and product overview are open.
        </p>
        <div className={styles.successCtaRow}>
          <a className={styles.ctaSecondary} href="/docs/api">
            Read the API docs
          </a>
          <a className={styles.ctaSecondary} href="/overview">
            See the product overview
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
          useCase: String(formData.get('useCase') ?? '').trim(),
          plan: plan.slug,
        };
        setState({ status: 'submitting' });
        try {
          const res = await fetch('/api/v1/signup', {
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
      <fieldset className={styles.planSelector}>
        <legend className={styles.planSelectorLegend}>Plan</legend>
        <ul className={styles.planSelectorList}>
          {pricingPlans
            .filter((p) => p.slug !== 'enterprise')
            .map((p) => (
              <li key={p.slug}>
                <a
                  className={
                    p.slug === plan.slug
                      ? `${styles.planChip} ${styles.planChipActive}`
                      : styles.planChip
                  }
                  aria-current={p.slug === plan.slug ? 'true' : undefined}
                  href={`/signup?plan=${p.slug}`}
                >
                  <span className={styles.planChipName}>{p.name}</span>
                  <span className={styles.planChipPrice}>
                    {p.price}
                    <span className={styles.planChipCadence}>{p.cadence}</span>
                  </span>
                </a>
              </li>
            ))}
        </ul>
        <p className={styles.planSelectorHint}>
          Looking for Enterprise? <a href="/contact?plan=enterprise">Talk to sales</a>.
        </p>
      </fieldset>

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
        <label className={`${styles.field} ${styles.fieldFull}`}>
          <span className={styles.fieldLabel}>What will you use it for?</span>
          <textarea
            className={styles.fieldTextarea}
            name="useCase"
            rows={3}
            placeholder="e.g. point-in-time fundamentals for a long-only equity fund."
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
        {state.status === 'submitting' ? 'Submitting…' : `Start ${plan.name} trial`}
      </button>
    </form>
  );
}
