'use client';
import { useState, type FormEvent } from 'react';
import { ArrowRight, Eye, EyeOff, ShieldCheck, Flame, Users, Sparkles, CheckCircle2 } from 'lucide-react';

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
        setMessage('Account created! Please check your email to confirm, then sign in.');
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
      {/* BRAND HEADER */}
      <div className="auth-brand-wrap">
        <a className="brand" href="/" aria-label="Team Up Home">
          <div className="brand-icon-wrap">
            <svg width="26" height="26" viewBox="0 0 36 38" fill="none" aria-hidden="true">
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

      {/* AUTH CARD */}
      <section className="auth-card">
        {/* TOP SEGMENTED TOGGLE */}
        <div className="auth-tab-switch">
          <button
            type="button"
            className={`auth-tab-btn ${!signup ? 'active' : ''}`}
            onClick={() => {
              setSignup(false);
              setMessage('');
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            className={`auth-tab-btn ${signup ? 'active' : ''}`}
            onClick={() => {
              setSignup(true);
              setMessage('');
            }}
          >
            Create Account
          </button>
        </div>

        <div className="auth-header">
          <span className="eyebrow">
            <Flame size={14} /> ATOMIC ACCOUNTABILITY
          </span>
          <h1>{signup ? 'Start your circle.' : 'Welcome back.'}</h1>
          <p>
            {signup
              ? 'Create your free account to track daily habits and keep teammates accountable.'
              : 'Sign in to sync your habits, check in today, and cheer on your squad.'}
          </p>
        </div>

        {/* AUTH FORM */}
        <form className="auth-form" onSubmit={submit}>
          <div className="form-field">
            <label htmlFor="email" className="field-label">
              Email address
            </label>
            <div className="input-wrap">
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                maxLength={254}
                placeholder="you@domain.com"
                className="text-input"
              />
            </div>
          </div>

          <div className="form-field">
            <div className="field-label-row">
              <label htmlFor="password" className="field-label">
                Password
              </label>
            </div>
            <div className="input-wrap password-wrap">
              <input
                id="password"
                name="password"
                type={show ? 'text' : 'password'}
                autoComplete={signup ? 'new-password' : 'current-password'}
                minLength={8}
                maxLength={128}
                required
                placeholder="At least 8 characters"
                className="text-input password-input"
              />
              <button
                type="button"
                className="toggle-password-btn"
                aria-label={show ? 'Hide password' : 'Show password'}
                onClick={() => setShow(!show)}
              >
                {show ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {signup && (
              <span className="field-hint">
                <ShieldCheck size={13} /> Minimum 8 characters. End-to-end encrypted with Supabase.
              </span>
            )}
          </div>

          {message && (
            <div role="status" className="dialog-status auth-alert">
              {message}
            </div>
          )}

          <button className="button dark full auth-submit-btn" disabled={busy}>
            {busy ? 'Processing…' : signup ? 'Create Account & Join Squad' : 'Sign In'}
            <ArrowRight size={18} />
          </button>
        </form>

        {/* BOTTOM LINKS */}
        <div className="auth-links">
          <button
            type="button"
            className="auth-switch-link"
            onClick={() => {
              setSignup(!signup);
              setMessage('');
            }}
          >
            {signup ? 'Already have an account? Sign in' : 'New to Team Up? Create your account'}
          </button>

          <a className="auth-demo-link" href="/">
            ← Explore interactive demo
          </a>
        </div>

        {/* VALUE PROPS STRIP */}
        <div className="auth-features">
          <div className="feature-item">
            <div className="feature-icon sage">
              <Users size={16} />
            </div>
            <div className="feature-text">
              <strong>Teammate Live Tracking</strong>
              <span>See friends’ daily progress & send real-time nudges.</span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon peach">
              <Flame size={16} />
            </div>
            <div className="feature-text">
              <strong>Atomic Streaks</strong>
              <span>Never miss twice. Built on James Clear’s behavior laws.</span>
            </div>
          </div>

          <div className="feature-item">
            <div className="feature-icon lavender">
              <Sparkles size={16} />
            </div>
            <div className="feature-text">
              <strong>1% Better Together</strong>
              <span>Quiet accountability without toxic competition.</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
