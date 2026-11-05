'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Sprout, Eye, EyeOff, ShieldCheck, Flame, Users, Sparkles } from 'lucide-react';

export default function Login() {
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [show, setShow] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage('');
    const values = Object.fromEntries(new FormData(e.currentTarget));

    try {
      const r = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, action: signup ? 'signup' : 'signin' }),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);

      if (!result.confirmed) {
        setMessage(
          'Your account has been created! Please check your email to confirm, then sign in.'
        );
        return;
      }

      const next = new URLSearchParams(location.search).get('return_to') || '/?start=1';
      const safe = new URL(next, location.origin);
      location.assign(
        safe.origin === location.origin && next.startsWith('/') && !next.startsWith('//')
          ? safe.pathname + safe.search
          : '/?start=1'
      );
    } catch (err) {
      setMessage((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-brand-wrap">
        <a className="brand" href="/">
          <div className="brand-icon-wrap">
            <svg width="28" height="28" viewBox="0 0 36 38" fill="none" aria-hidden="true">
              <circle cx="18" cy="19" r="16" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
              <path
                d="M4 29V16a9 9 0 0 1 18 0v13M15 29V12a9 9 0 0 1 18 0v17"
                fill="none"
                stroke="currentColor"
                strokeWidth="3.5"
                strokeLinecap="round"
              />
              <circle cx="28" cy="10" r="3" fill="#ff5c35" />
            </svg>
          </div>
          <span>
            team up<span className="brand-dot">.</span>
          </span>
        </a>
      </div>

      <section className="auth-card">
        <span className="eyebrow">
          <Flame size={14} /> ATOMIC ACCOUNTABILITY
        </span>
        <h1>{signup ? 'Start your circle.' : 'Welcome back.'}</h1>
        <p>
          {signup
            ? 'Create an account to invite your teammates, track habits, and keep each other accountable every single day.'
            : 'Sign in to access your squad, review teammates’ daily streaks, and log your habits.'}
        </p>

        <form onSubmit={submit}>
          <label>
            Email address
            <input
              name="email"
              type="email"
              autoComplete="email"
              required
              maxLength={254}
              placeholder="you@domain.com"
            />
          </label>

          <label>
            Password
            <div className="password-field">
              <input
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete={signup ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={128}
                required
                placeholder="At least 8 characters"
              />
              <button
                type="button"
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </label>

          {signup && (
            <small className="auth-tip">
              <ShieldCheck size={14} /> Use 8+ characters. Your data is encrypted and synced with
              Supabase.
            </small>
          )}

          {message && (
            <div role="status" className="dialog-status">
              {message}
            </div>
          )}

          <button className="button dark full" disabled={busy}>
            {busy ? 'Connecting…' : signup ? 'Create Account & Join Squad' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        <button
          className="auth-switch"
          onClick={() => {
            setSignup(!signup);
            setMessage('');
          }}
        >
          {signup ? 'Already have an account? Sign in' : 'New to Team Up? Create your account'}
        </button>

        <a className="auth-demo" href="/">
          ← Back to interactive demo
        </a>

        <div className="auth-value-props">
          <div>
            <Users size={16} /> <strong>Teammate Accountability</strong>: See friends’ daily habits and
            nudge them if pending.
          </div>
          <div>
            <Flame size={16} /> <strong>Atomic Streaks</strong>: Track individual & squad streaks with
            James Clear principles.
          </div>
          <div>
            <Sparkles size={16} /> <strong>Zero Guilt</strong>: Focus on 1% better every day, never
            missing twice.
          </div>
        </div>
      </section>
    </main>
  );
}
