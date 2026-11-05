'use client';
import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  House,
  Users,
  ChartNoAxesCombined,
  Sprout,
  Timer,
  Plus,
  ArrowUpRight,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Check,
  Flame,
  BookOpen,
  Footprints,
  PenLine,
  Sparkles,
  Bell,
  Settings2,
  Heart,
  X,
  Sun,
  Moon,
  Copy,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Target,
  LogOut,
  Zap,
  MessageCircle,
  Share2,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
  UserPlus,
  Compass,
} from 'lucide-react';
import {
  emptyState,
  dateKey,
  shiftDay,
  streak,
  longestStreak,
  teamActiveStreak,
  ATOMIC_HABIT_TEMPLATES,
  type State,
  type Habit,
  type Person,
  type HabitCategory,
  type HabitTime,
  type Note,
} from './data';

type View = 'Today' | 'My circle' | 'Progress' | 'Mindset' | 'Focus';
type SubTab = 'my-habits' | 'team-tracker';
type Modal =
  | {
      kind: string;
      person?: Person;
      habit?: Habit;
      title?: string;
      body?: string;
      habitId?: string;
    }
  | null;

const categoryInfo: Record<HabitCategory, { icon: typeof BookOpen; color: string; label: string }> = {
  mind: { icon: BookOpen, color: 'sand', label: 'Mind' },
  body: { icon: Footprints, color: 'sage', label: 'Body' },
  calm: { icon: PenLine, color: 'lavender', label: 'Mindfulness' },
  growth: { icon: Sparkles, color: 'peach', label: 'Craft & Growth' },
};

const nav = [
  { name: 'Today', icon: House },
  { name: 'My circle', icon: Users },
  { name: 'Progress', icon: ChartNoAxesCombined },
  { name: 'Mindset', icon: Sprout },
  { name: 'Focus', icon: Timer },
] as const;

const lessons = [
  {
    title: 'The Two-Minute Rule: How to Stop Procrastinating',
    tag: 'ATOMIC RULE #1 · MAKE IT EASY',
    body:
      'When you start a new habit, it should take less than two minutes to do.\n\nNearly any habit can be scaled down into a two-minute version:\n• "Read before bed" becomes "Read one page."\n• "Do 30 minutes of yoga" becomes "Unroll my yoga mat."\n• "Run three miles" becomes "Tie my running shoes."\n\nThe point is not to do one thing. The point is to master the art of showing up. A habit must be established before it can be improved.',
  },
  {
    title: 'Habit Stacking: The Secret to Effortless Cues',
    tag: 'ATOMIC RULE #2 · MAKE IT OBVIOUS',
    body:
      'The best way to build a new habit is to identify a current habit you already do each day, then stack your new behavior on top.\n\nThe formula is simple:\n"After [CURRENT HABIT], I will [NEW HABIT]."\n\nExamples:\n• After I pour my morning coffee, I will meditate for two minutes.\n• After I close my laptop for the day, I will immediately change into workout clothes.\n• After I sit down to dinner, I will say one thing I’m grateful for today.',
  },
  {
    title: 'Identity-Based Habits: Who You Are Becoming',
    tag: 'ATOMIC RULE #3 · MAKE IT ATTRACTIVE',
    body:
      'True behavior change is identity change. You might start a habit because of motivation, but the only reason you stick with one is that it becomes part of your identity.\n\nThe goal is not to read a book, the goal is to become a reader.\nThe goal is not to run a marathon, the goal is to become a runner.\n\nEvery action you take is a vote for the type of person you wish to become.',
  },
  {
    title: 'Never Miss Twice: The Golden Rule of Consistency',
    tag: 'ATOMIC RULE #4 · MAKE IT SATISFYING',
    body:
      'Missing once is an accident. Missing twice is the start of a new habit.\n\nAnyone can have a bad day or an emergency. When successful people make a mistake, they rebound quickly. The breaking of the habit doesn’t matter if the reclaiming of it is fast.\n\nShow up on your bad days. Even if you only do 10 pushups or write 1 sentence, maintaining the rhythm is what prevents your momentum from resetting.',
  },
];

function Avatar({ person, small = false, glow = false }: { person?: Person | null; small?: boolean; glow?: boolean }) {
  const name = person?.name || 'You';
  const color = person?.color || 'peach';
  return (
    <span className={`avatar ${color} ${small ? 'small' : ''} ${glow ? 'avatar-glow' : ''}`} aria-label={name}>
      {name.slice(0, 1).toUpperCase()}
    </span>
  );
}

function Brand() {
  return (
    <div className="brand">
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
    </div>
  );
}

export default function TeamUp() {
  const [authLoading, setAuthLoading] = useState(true);
  const [account, setAccount] = useState<Person | null>(null);
  const [data, setData] = useState<State>(() => emptyState());
  const [view, setView] = useState<View>('Today');
  const [subTab, setSubTab] = useState<SubTab>('my-habits');
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const [today, setToday] = useState(dateKey());
  const [selectedDay, setSelectedDay] = useState(dateKey());
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState('All');
  const [progressTab, setProgressTab] = useState('Overview');
  const [joinToken, setJoinToken] = useState('');
  const [inviteLink, setInviteLink] = useState('');

  // Focus Timer
  const [duration, setDuration] = useState(25);
  const [seconds, setSeconds] = useState(25 * 60);
  const [endsAt, setEndsAt] = useState<number | null>(null);
  const [focusHabit, setFocusHabit] = useState('');
  const [autoLog, setAutoLog] = useState(true);
  const [sessions, setSessions] = useState(0);

  const dialog = useRef<HTMLDialogElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }

  async function refresh() {
    try {
      const r = await fetch('/api/team');
      const value = (await r.json()) as (State & { user?: Person; team?: { id: string; name: string } | null }) | { error?: string };
      if (!r.ok) throw new Error((value as { error?: string }).error || 'Could not load circle.');

      const stateVal = value as State & { user?: Person; team?: { id: string; name: string } | null };
      if (stateVal.user) {
        setAccount(stateVal.user);
        if (stateVal.team) {
          setData(stateVal);
        } else {
          setData(emptyState(stateVal.user));
        }
      } else {
        setAccount(null);
        setData(emptyState());
      }
    } catch {
      setAccount(null);
    } finally {
      setAuthLoading(false);
    }
  }

  useEffect(() => {
    // Purge legacy demo mock data from browser storage
    try {
      localStorage.removeItem('team-up-demo-v1');
      localStorage.removeItem('team-up-state-v2');
      const localTheme = localStorage.getItem('team-up-theme');
      if (localTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
    } catch {}

    const token = new URLSearchParams(location.search).get('invite');
    if (token) {
      setJoinToken(token);
      setModal({ kind: 'join' });
    }

    refresh();
    const timer = setInterval(() => {
      setToday(dateKey());
      refresh();
    }, 30000);

    return () => {
      clearInterval(timer);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  useEffect(() => {
    if (modal && !dialog.current?.open) dialog.current?.showModal();
    else if (!modal && dialog.current?.open) dialog.current?.close();
  }, [modal]);

  useEffect(() => {
    if (!endsAt) return;
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endsAt - Date.now()) / 1000));
      setSeconds(remaining);
      if (remaining === 0) {
        setEndsAt(null);
        setSessions((s) => s + 1);
        notify('⚡ Focus session completed! Small habits compound.');
        if (autoLog && focusHabit) {
          const h = data.habits.find((h) => h.id === focusHabit);
          if (h && !data.checkins.some((c) => c.habitId === h.id && c.day === dateKey())) {
            void toggleHabit(h, true);
          }
        }
      }
    }, 250);
    return () => clearInterval(timer);
  }, [endsAt, autoLog, focusHabit, data]);

  const toggleTheme = () => {
    const next = !darkMode;
    setDarkMode(next);
    if (next) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('team-up-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('team-up-theme', 'light');
    }
  };

  const mine = data.habits.filter((h) => h.userId === data.user.id);
  const done = (h: Habit, day = selectedDay) => data.checkins.some((c) => c.habitId === h.id && c.day === day);
  const completed = mine.filter((h) => done(h)).length;
  const todayDone = mine.filter((h) => done(h, today)).length;

  const bestStreak = Math.max(0, ...mine.map((h) => streak(h.id, data.checkins, today)));
  const bestEver = Math.max(0, ...mine.map((h) => longestStreak(h.id, data.checkins)));
  const totalChecks = data.checkins.filter((c) => mine.some((h) => h.id === c.habitId)).length;

  const teammates = data.members.filter((p) => p.id !== data.user.id);
  const allTeamHabits = data.habits;
  const teamDoneToday = allTeamHabits.filter((h) => done(h, today)).length;
  const teamRatio = allTeamHabits.length ? Math.round((teamDoneToday / allTeamHabits.length) * 100) : 0;
  const squadStreak = teamActiveStreak(allTeamHabits, data.checkins, today);

  async function api(payload: Record<string, unknown>) {
    const response = await fetch('/api/team', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const value = (await response.json()) as { error?: string; token?: string; ok?: boolean };
    if (!response.ok) throw new Error(value.error || 'Something went wrong. Please try again.');
    return value;
  }

  async function toggleHabit(h: Habit, fromTimer = false) {
    if (busy) return;
    if (selectedDay !== today && !fromTimer) {
      notify('Past days are for reflection. Check in for today.');
      return;
    }
    const exists = done(h, today);
    setBusy(true);
    try {
      await api({
        action: 'toggle',
        id: h.id,
        day: today,
        done: !exists,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      });
      await refresh();
      notify(exists ? 'Check-in undone.' : '⚡ Habit logged! 1% better every day.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function changeView(next: View) {
    setView(next);
    setSelectedDay(today);
    setWeekOffset(0);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function openInvite() {
    setInviteLink('');
    setModal({ kind: 'invite' });
    setBusy(true);
    try {
      const result = await api({ action: 'invite' });
      if (result.token) {
        setInviteLink(`${location.origin}/?invite=${result.token}`);
      }
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const fields = Object.fromEntries(form);
    setBusy(true);

    try {
      if (modal?.kind === 'habit') {
        await api({
          ...fields,
          action: modal.habit ? 'edit_habit' : 'add_habit',
          id: modal.habit?.id,
        });
        await refresh();
        notify(modal.habit ? 'Habit updated.' : '🌱 Atomic habit planted!');
      } else if (modal?.kind === 'create' || modal?.kind === 'join') {
        await api({
          ...fields,
          action: modal.kind === 'join' ? 'join_team' : 'create_team',
          token: joinToken || String(fields.token || ''),
        });
        await refresh();
        history.replaceState(null, '', location.pathname);
        notify('Circle ready! Let’s build momentum together.');
      } else if (modal?.kind === 'nudge' || modal?.kind === 'encourage' || modal?.kind === 'reflect') {
        const msg = String(fields.message);
        await api({
          action: modal.kind === 'reflect' ? 'reflect' : 'encourage',
          recipient: modal.person?.id,
          message: msg,
        });
        await refresh();
        notify(
          modal.kind === 'nudge'
            ? `⚡ Nudge sent to ${modal.person?.name}!`
            : modal.kind === 'encourage'
            ? `🙌 Cheer sent to ${modal.person?.name}!`
            : 'Reflection shared with your circle.'
        );
      }
      setModal(null);
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function deleteHabit(h: Habit) {
    setBusy(true);
    try {
      await api({ action: 'delete_habit', id: h.id });
      await refresh();
      setModal(null);
      notify('Habit removed.');
    } catch (e) {
      notify((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function personStats(p: Person) {
    const hs = data.habits.filter((h) => h.userId === p.id);
    const n = hs.filter((h) => done(h, today)).length;
    const s = Math.max(0, ...hs.map((h) => streak(h.id, data.checkins, today)));
    const pending = hs.filter((h) => !done(h, today));
    return { hs, n, streak: s, pending };
  }

  function earned(p: Person) {
    const hs = data.habits.filter((h) => h.userId === p.id);
    const reps = data.checkins.filter((c) => hs.some((h) => h.id === c.habitId)).length;
    const longest = Math.max(0, ...hs.map((h) => longestStreak(h.id, data.checkins)));
    return [
      { name: 'First Step', icon: Sprout, desc: 'Logged first habit rep', yes: reps >= 1 },
      { name: '7-Day Rhythm', icon: Flame, desc: 'Built a 7-day streak', yes: longest >= 7 },
      { name: 'Habit Stacker', icon: Layers, desc: 'Connected habits with clear cues', yes: reps >= 15 },
      { name: '21-Day Transformation', icon: Sparkles, desc: 'Formed a lasting neural pathway', yes: longest >= 21 },
      { name: 'Century Club (100 Wins)', icon: Trophy, desc: '100 repetitions completed', yes: reps >= 100 },
    ].filter((b) => b.yes);
  }

  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, -6 + i + weekOffset * 7));

  // 1. LOADING SCREEN
  if (authLoading) {
    return (
      <div className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
        <main className="loading-screen">
          <Brand />
          <p className="loading-text">Connecting to your circle…</p>
        </main>
      </div>
    );
  }

  // 2. UNLOGGED LANDING PAGE (NO FAKE USER DATA)
  if (!account) {
    return (
      <div className={`landing-shell ${darkMode ? 'dark-theme' : ''}`}>
        <header className="landing-topbar">
          <Brand />
          <div className="landing-nav-actions">
            <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <a className="button light" href="/login">
              Sign In
            </a>
            <a className="button dark" href="/login">
              Get Started <ArrowRight size={15} />
            </a>
          </div>
        </header>

        <main className="landing-content">
          <section className="landing-hero">
            <span className="eyebrow">
              <Flame size={14} /> ATOMIC HABITS FOR TEAMS
            </span>
            <h1>
              Build habits with your squad.<br />
              <em>1% better every day.</em>
            </h1>
            <p className="landing-subtitle">
              The accountability partner app inspired by James Clear’s Atomic Habits.
              Track daily streaks, see friends’ habits in real time, and give gentle nudges so no one misses twice.
            </p>

            <div className="landing-cta-row">
              <a className="button dark hero-btn" href="/login">
                Create Your Free Account <ArrowRight size={18} />
              </a>
              <button className="button light hero-btn" onClick={() => setModal({ kind: 'join' })}>
                Enter Circle Invite Code
              </button>
            </div>

            <div className="landing-quote-card">
              <p>&ldquo;You do not rise to the level of your goals. You fall to the level of your systems.&rdquo;</p>
              <span>JAMES CLEAR · ATOMIC HABITS</span>
            </div>
          </section>

          {/* 3 VALUE PILLARS */}
          <section className="landing-pillars">
            <div className="pillar-card">
              <div className="pillar-icon sage">
                <Users size={22} />
              </div>
              <h3>Teammates Live Tracker</h3>
              <p>
                See your friends’ daily habits and completion progress. If a teammate hasn’t finished their habit, send a 1-tap friendly nudge!
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon peach">
                <Flame size={22} />
              </div>
              <h3>Atomic Streaks</h3>
              <p>
                Track individual and shared squad streaks. Built on the 4 Laws of Behavior Change: Make it Obvious, Attractive, Easy, and Satisfying.
              </p>
            </div>

            <div className="pillar-card">
              <div className="pillar-icon lavender">
                <Sparkles size={22} />
              </div>
              <h3>Habit Stacking & 2-Min Rule</h3>
              <p>
                Anchor new habits to existing daily routines. Start with 2-minute effortless starter actions so you never burn out.
              </p>
            </div>
          </section>
        </main>

        {/* JOIN MODAL FOR GUESTS */}
        <dialog ref={dialog} className="modal" onCancel={() => setModal(null)} onClick={(e) => { if (e.target === dialog.current) setModal(null); }}>
          <div className="modal-content">
            <button className="modal-close icon-button" onClick={() => setModal(null)}><X size={20} /></button>
            <div className="modal-symbol sage"><Users size={25} /></div>
            <h2>Join with Circle Invite</h2>
            <p className="modal-intro">Have an invite code from a teammate? Sign in or create an account to enter their circle.</p>
            <a className="button dark full" href="/login">Sign in or Create Account <ArrowRight size={16} /></a>
          </div>
        </dialog>
      </div>
    );
  }

  // 3. LOGGED IN BUT NO CIRCLE YET (CLEAN ONBOARDING)
  if (!data.team) {
    return (
      <div className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
        <main className="circle-setup-page">
          <Brand />
          <div className="setup-card">
            <Avatar person={account} />
            <span className="eyebrow">STEP 1 · ACCOUNTABILITY CIRCLE</span>
            <h1>Welcome, {account.name}!</h1>
            <p className="modal-intro">
              Create your private accountability circle to start planting habits and inviting your teammates.
            </p>

            <form onSubmit={submit} className="setup-form">
              <label>
                Your Display Name
                <input name="displayName" defaultValue={account.name} maxLength={40} required autoFocus />
              </label>

              <label>
                Circle Name
                <input name="name" placeholder="e.g. Focus Squad, 5AM Club, Gym Partners" maxLength={60} required />
              </label>

              <button className="button dark full" disabled={busy}>
                {busy ? 'Creating circle…' : 'Create Circle & Start Tracking'} <ArrowRight size={16} />
              </button>
            </form>

            <div className="setup-divider"><span>OR JOIN WITH CODE</span></div>

            <button className="button light full" onClick={() => setModal({ kind: 'join' })}>
              Join Friend’s Circle with Invite Code
            </button>
          </div>

          <dialog ref={dialog} className="modal" onCancel={() => setModal(null)} onClick={(e) => { if (e.target === dialog.current) setModal(null); }}>
            <div className="modal-content">
              <button className="modal-close icon-button" onClick={() => setModal(null)}><X size={20} /></button>
              <h2>Join an Existing Circle</h2>
              <p className="modal-intro">Enter the invitation token or code provided by your teammate.</p>
              <form onSubmit={submit}>
                <label>
                  Your Display Name
                  <input name="displayName" defaultValue={account.name} maxLength={40} required />
                </label>
                <label>
                  Invite Code / Token
                  <input name="token" defaultValue={joinToken} placeholder="Paste invite token here" required />
                </label>
                <button className="button dark full" disabled={busy}>
                  {busy ? 'Joining…' : 'Join Circle'} <ArrowRight size={16} />
                </button>
              </form>
            </div>
          </dialog>
        </main>
      </div>
    );
  }

  const currentTeam = data.team;

  // 4. ACTIVE LOGGED-IN DASHBOARD (REAL USER DATA ONLY)
  return (
    <div className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <button className="brand-button" onClick={() => changeView('Today')} aria-label="Team Up home">
          <Brand />
        </button>

        <div className="workspace-label">ACCOUNTABILITY SQUAD</div>

        <nav>
          {nav.map(({ name, icon: Icon }) => (
            <button
              key={name}
              className={`nav-item ${view === name ? 'active' : ''}`}
              onClick={() => changeView(name)}
            >
              <Icon size={19} strokeWidth={1.8} />
              <span>{name}</span>
              {name === 'My circle' && <span className="nav-count">{data.members.length}</span>}
              {view === name && <span className="nav-active-dot" />}
            </button>
          ))}
        </nav>

        {/* TEAM BADGE */}
        <div className="sidebar-circle">
          <div className="circle-mark">
            <Users size={18} />
          </div>
          <span>
            <strong>{currentTeam.name}</strong>
            <small>
              {data.members.length} {data.members.length === 1 ? 'member' : 'members'} · {squadStreak}d squad streak 🔥
            </small>
          </span>
        </div>

        <button className="invite-side" onClick={openInvite}>
          <UserPlus size={16} /> Invite teammates
        </button>

        {/* BOTTOM SECTION */}
        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <Sprout size={20} />
            <p>&ldquo;Every action you take is a vote for the type of person you wish to become.&rdquo;</p>
            <span>JAMES CLEAR · ATOMIC HABITS</span>
          </div>

          <div className="theme-toggle-row">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle dark mode">
              {darkMode ? <Sun size={16} /> : <Moon size={16} />}
              <span>{darkMode ? 'Light palette' : 'Dark aesthetic'}</span>
            </button>
          </div>

          <button className="profile" onClick={() => setModal({ kind: 'settings' })}>
            <Avatar person={data.user} />
            <span>
              <strong>{data.user.name}</strong>
              <small>{currentTeam.name}</small>
            </span>
            <Settings2 size={17} />
          </button>
        </div>
      </aside>

      {/* MAIN SHELL */}
      <div className="main-shell">
        <header className="topbar">
          <button className="mobile-brand" onClick={() => changeView('Today')} aria-label="Team Up home">
            <Brand />
          </button>

          <div className="breadcrumb">
            {currentTeam.name} <span>/</span> <strong>{view}</strong>
          </div>

          <div className="top-actions">
            <button className="theme-icon-btn" onClick={toggleTheme} aria-label="Toggle theme">
              {darkMode ? <Sun size={17} /> : <Moon size={17} />}
            </button>

            <span className="top-date">
              {new Date(today + 'T12:00:00').toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>

            <button
              className="icon-button notification"
              aria-label="Open circle activity"
              onClick={() => setModal({ kind: 'notifications' })}
            >
              <Bell size={19} />
              {data.notes.length > 0 && <i />}
            </button>

            <button
              className="avatar-button"
              onClick={() => setModal({ kind: 'settings' })}
              aria-label="Your profile"
            >
              <Avatar person={data.user} small />
            </button>
          </div>
        </header>

        <main>
          {/* VIEW: TODAY */}
          {view === 'Today' && (
            <>
              {/* TOP HERO */}
              <section className="greeting">
                <div>
                  <div className="eyebrow">
                    <Flame size={15} className="flame-icon" /> 1% BETTER TODAY
                  </div>
                  <h1>
                    Welcome back, <em>{data.user.name}.</em>
                  </h1>
                  <p>Check in for today, keep your squad accountable, and never miss twice.</p>
                </div>
                <div className="greeting-actions">
                  <button className="button dark" onClick={() => setModal({ kind: 'habit' })}>
                    <Plus size={17} /> New habit
                  </button>
                  <button className="button light" onClick={openInvite}>
                    <Share2 size={16} /> Invite teammate
                  </button>
                </div>
              </section>

              {/* SQUAD PULSE BANNER */}
              <section className="squad-pulse-card">
                <div className="pulse-info">
                  <span className="eyebrow-accent">
                    <Zap size={14} /> SQUAD PULSE
                  </span>
                  <h2>{teamRatio}% of team habits completed today</h2>
                  <p>
                    {teamDoneToday} of {allTeamHabits.length} habits logged across{' '}
                    <strong>{data.members.length} {data.members.length === 1 ? 'member' : 'members'}</strong>.
                  </p>
                  <div className="pulse-members">
                    <div className="avatar-stack">
                      {data.members.map((p) => (
                        <Avatar key={p.id} person={p} small />
                      ))}
                    </div>
                    <span className="pulse-streak">
                      <Flame size={14} /> {squadStreak}-day squad streak
                    </span>
                  </div>
                </div>
                <div className="pulse-progress-wrap">
                  <div
                    className="progress-ring-large"
                    style={{ '--progress': `${teamRatio}%` } as React.CSSProperties}
                  >
                    <div>
                      <strong>{teamRatio}%</strong>
                      <small>squad done</small>
                    </div>
                  </div>
                </div>
              </section>

              {/* SUBTAB BAR */}
              <div className="subtab-bar">
                <button
                  className={`subtab-btn ${subTab === 'my-habits' ? 'active' : ''}`}
                  onClick={() => setSubTab('my-habits')}
                >
                  <Target size={16} /> My Daily Habits ({completed}/{mine.length})
                </button>
                <button
                  className={`subtab-btn ${subTab === 'team-tracker' ? 'active' : ''}`}
                  onClick={() => setSubTab('team-tracker')}
                >
                  <Users size={16} /> Teammates Live Tracker ({teammates.length})
                  {teammates.length > 0 && <span className="live-badge">Live</span>}
                </button>
              </div>

              {/* SUBTAB: MY HABITS */}
              {subTab === 'my-habits' && (
                <div className="dashboard-grid">
                  <section className="habits-section">
                    <div className="section-title">
                      <h2>
                        Your habits <span className="count-pill">{mine.length}</span>
                      </h2>
                      <span className="quiet-caption">Identity-driven daily practices</span>
                    </div>

                    {/* WEEK STRIP */}
                    <div className="week-strip">
                      <button
                        className="week-arrow"
                        onClick={() => {
                          setWeekOffset((w) => w - 1);
                          setSelectedDay(shiftDay(today, (weekOffset - 1) * 7));
                        }}
                        aria-label="Previous week"
                      >
                        <ChevronLeft size={17} />
                      </button>
                      {week.map((day) => (
                        <button
                          key={day}
                          className={`day ${selectedDay === day ? 'selected' : ''}`}
                          onClick={() => setSelectedDay(day)}
                        >
                          <span>
                            {day === today
                              ? 'Today'
                              : new Date(day + 'T12:00:00').toLocaleDateString('en-US', {
                                  weekday: 'short',
                                })}
                          </span>
                          <strong>{Number(day.slice(-2))}</strong>
                          <i
                            className={
                              data.checkins.some(
                                (c) => c.day === day && mine.some((h) => h.id === c.habitId)
                              )
                                ? 'has-check'
                                : ''
                            }
                          />
                        </button>
                      ))}
                      <button
                        className="week-arrow"
                        disabled={weekOffset === 0}
                        onClick={() => {
                          setWeekOffset((w) => w + 1);
                          setSelectedDay(shiftDay(today, (weekOffset + 1) * 7));
                        }}
                        aria-label="Next week"
                      >
                        <ChevronRight size={17} />
                      </button>
                    </div>

                    {/* FILTERS */}
                    <div className="habit-toolbar">
                      <div className="filters">
                        {['All', 'Morning', 'Afternoon', 'Evening'].map((f) => (
                          <button
                            className={filter === f ? 'selected' : ''}
                            key={f}
                            onClick={() => setFilter(f)}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <span className="completion-tag">
                        {completed}/{mine.length} complete today
                      </span>
                    </div>

                    {/* HABIT LIST */}
                    <div className="habit-list">
                      {mine
                        .filter((h) => filter === 'All' || h.time === filter)
                        .map((h) => {
                          const meta = categoryInfo[h.category] || categoryInfo.mind;
                          const Icon = meta.icon;
                          const checked = done(h);
                          const currentStreak = streak(h.id, data.checkins, today);

                          return (
                            <article
                              className={`habit-card ${checked ? 'completed' : ''}`}
                              key={h.id}
                            >
                              <span className={`habit-icon ${meta.color}`}>
                                <Icon size={22} strokeWidth={1.8} />
                              </span>

                              <div className="habit-info">
                                <div className="habit-top-row">
                                  <span className="category-pill">{meta.label}</span>
                                  {h.time && <span className="time-pill">{h.time}</span>}
                                </div>
                                <h3>
                                  <button
                                    onClick={() => setModal({ kind: 'habit', habit: h })}
                                    aria-label={`Details for ${h.name}`}
                                  >
                                    {h.name}
                                  </button>
                                </h3>
                                <p className="habit-target">
                                  Target: <strong>{h.target}</strong>
                                </p>
                                <div className="habit-identity">
                                  <Sparkles size={12} /> Becoming <em>{h.identity}</em>
                                </div>
                                {h.stackAfter && (
                                  <div className="habit-stack-hint">
                                    <Layers size={12} /> Anchor: {h.stackAfter}
                                  </div>
                                )}
                                {h.twoMinuteStarter && (
                                  <div className="habit-2min-hint">
                                    <Clock size={12} /> 2-min rule: {h.twoMinuteStarter}
                                  </div>
                                )}
                              </div>

                              <div className="habit-end">
                                <span className={`streak-badge ${currentStreak > 0 ? 'active' : ''}`}>
                                  <Flame size={14} />
                                  <strong>{currentStreak}</strong>
                                  <small>days</small>
                                </span>
                                <button
                                  aria-label={`${checked ? 'Undo' : 'Complete'} ${h.name}`}
                                  aria-pressed={checked}
                                  disabled={busy || selectedDay !== today}
                                  className={`check-button ${checked ? 'checked' : ''}`}
                                  onClick={() => toggleHabit(h)}
                                >
                                  {checked ? <Check size={20} strokeWidth={2.6} /> : <Plus size={19} />}
                                </button>
                              </div>
                            </article>
                          );
                        })}

                      {/* CLEAN EMPTY STATE WITH 1-CLICK ATOMIC STARTERS */}
                      {mine.length === 0 && (
                        <div className="empty-state-card">
                          <Sprout size={40} className="empty-sprout" />
                          <h3>Plant your first atomic habit</h3>
                          <p>
                            &ldquo;You do not rise to the level of your goals. You fall to the level of your systems.&rdquo;
                            Pick a proven habit starter below or create your custom one.
                          </p>

                          <div className="empty-templates-grid">
                            {ATOMIC_HABIT_TEMPLATES.map((tpl) => (
                              <button
                                key={tpl.name}
                                className="empty-tpl-btn"
                                onClick={async () => {
                                  setBusy(true);
                                  try {
                                    await api({
                                      action: 'add_habit',
                                      name: tpl.name,
                                      identity: tpl.identity,
                                      target: tpl.target,
                                      category: tpl.category,
                                      time: tpl.time,
                                      stackAfter: tpl.stackAfter,
                                      twoMinuteStarter: tpl.twoMinuteStarter,
                                    });
                                    await refresh();
                                    notify(`🌱 "${tpl.name}" planted!`);
                                  } catch (e) {
                                    notify((e as Error).message);
                                  } finally {
                                    setBusy(false);
                                  }
                                }}
                              >
                                <span className={`tpl-cat-dot ${tpl.category}`} />
                                <div>
                                  <strong>+ {tpl.name}</strong>
                                  <small>{tpl.target}</small>
                                </div>
                              </button>
                            ))}
                          </div>

                          <button className="button dark" onClick={() => setModal({ kind: 'habit' })}>
                            <Plus size={16} /> Create Custom Habit
                          </button>
                        </div>
                      )}
                    </div>

                    {mine.length > 0 && (
                      <button className="add-habit-row" onClick={() => setModal({ kind: 'habit' })}>
                        <Plus size={16} /> Plant another habit
                      </button>
                    )}
                  </section>

                  {/* RIGHT COLUMN */}
                  <aside className="right-column">
                    {/* PERSONAL MOMENTUM */}
                    <section className="daily-card">
                      <div className="section-title">
                        <h3>Your daily momentum</h3>
                        <Sun size={18} />
                      </div>
                      <div className="daily-body">
                        <div
                          className="progress-ring"
                          style={
                            {
                              '--progress': `${mine.length ? (todayDone / mine.length) * 100 : 0}%`,
                            } as React.CSSProperties
                          }
                        >
                          <div>
                            <strong>
                              {todayDone}
                              <span>/{mine.length}</span>
                            </strong>
                            <small>today</small>
                          </div>
                        </div>
                        <div>
                          <span className="tiny-label">DAILY RHYTHM</span>
                          <h4>
                            {todayDone === mine.length && mine.length
                              ? 'All habits complete! 🔥'
                              : todayDone
                              ? 'Building momentum.'
                              : 'Ready for today.'}
                          </h4>
                          <p>
                            {todayDone === mine.length && mine.length
                              ? 'Every promise kept today.'
                              : 'One small win creates the spark.'}
                          </p>
                          <span className="warm-tag">
                            <Flame size={12} /> {bestStreak}-day best streak
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* SQUAD HIGHLIGHT */}
                    <section className="circle-card">
                      <div className="section-title">
                        <h3>Your squad</h3>
                        <button className="text-button" onClick={() => setSubTab('team-tracker')}>
                          View all <ArrowUpRight size={14} />
                        </button>
                      </div>

                      {teammates.length === 0 ? (
                        <div className="empty-squad-mini">
                          <p>You’re the first in this circle!</p>
                          <small>Invite your friends to track each other’s habits.</small>
                          <button className="button light full" onClick={openInvite}>
                            <UserPlus size={15} /> Invite Teammates
                          </button>
                        </div>
                      ) : (
                        <div className="mini-member-list">
                          {teammates.slice(0, 3).map((p) => {
                            const stats = personStats(p);
                            const isAllDone = stats.n === stats.hs.length && stats.hs.length > 0;
                            return (
                              <div className="member-row" key={p.id}>
                                <button
                                  className="member-main"
                                  onClick={() => setModal({ kind: 'person', person: p })}
                                >
                                  <Avatar person={p} small />
                                  <span>
                                    <strong>{p.name}</strong>
                                    <small>
                                      {isAllDone
                                        ? 'All habits finished ✨'
                                        : `${stats.n}/${stats.hs.length} habits done`}
                                    </small>
                                  </span>
                                </button>
                                <span className="mini-streak">
                                  <Flame size={13} />
                                  {stats.streak}
                                </span>
                                {isAllDone ? (
                                  <button
                                    className="nudge celebrate"
                                    onClick={() => setModal({ kind: 'encourage', person: p })}
                                    title={`Cheer on ${p.name}`}
                                  >
                                    <Heart size={15} />
                                  </button>
                                ) : (
                                  <button
                                    className="nudge"
                                    onClick={() => setModal({ kind: 'nudge', person: p })}
                                    title={`Nudge ${p.name}`}
                                  >
                                    <Zap size={15} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </section>

                    {/* ATOMIC PERSPECTIVE */}
                    <button
                      className="lesson-card"
                      onClick={() =>
                        setModal({ kind: 'lesson', title: lessons[0].title, body: lessons[0].body })
                      }
                    >
                      <span className="eyebrow">
                        <Sparkles size={14} /> 2-MINUTE WISDOM
                      </span>
                      <h3>Make the first step smaller.</h3>
                      <div>
                        <span>Read James Clear insight</span>
                        <span className="round-arrow">
                          <ArrowUpRight size={18} />
                        </span>
                      </div>
                    </button>
                  </aside>
                </div>
              )}

              {/* SUBTAB: TEAMMATES TRACKER */}
              {subTab === 'team-tracker' && (
                <div className="team-tracker-view">
                  <div className="tracker-header">
                    <div>
                      <h2>Teammates Daily Tracker & Accountability</h2>
                      <p>See what your friends are working on today. Nudge them if pending!</p>
                    </div>
                    <button className="button dark" onClick={openInvite}>
                      <UserPlus size={16} /> Invite teammates
                    </button>
                  </div>

                  {teammates.length === 0 ? (
                    <div className="empty-squad-big">
                      <div className="empty-squad-icon">
                        <Users size={36} />
                      </div>
                      <h3>No teammates in your circle yet</h3>
                      <p>
                        Accountability multiplies habit consistency by 3x. Share your circle link or code with your gym buddies, co-workers, or friends.
                      </p>
                      <button className="button dark" onClick={openInvite}>
                        <Share2 size={16} /> Invite Teammates Now
                      </button>
                    </div>
                  ) : (
                    <div className="teammates-full-grid">
                      {teammates.map((p) => {
                        const stats = personStats(p);
                        const isAllDone = stats.n === stats.hs.length && stats.hs.length > 0;
                        return (
                          <article className="teammate-board-card" key={p.id}>
                            <div className="board-card-top">
                              <div className="board-person-meta">
                                <Avatar person={p} glow={isAllDone} />
                                <div>
                                  <h3>{p.name}</h3>
                                  <span className="handle-tag">{p.handle || `@${p.name.toLowerCase()}`}</span>
                                </div>
                              </div>
                              <span className="streak-badge active">
                                <Flame size={14} />
                                <strong>{stats.streak}</strong>
                                <small>days</small>
                              </span>
                            </div>

                            <div className="board-progress-bar">
                              <div className="bar-labels">
                                <span>Today’s Progress</span>
                                <strong>
                                  {stats.n} of {stats.hs.length} completed
                                </strong>
                              </div>
                              <div className="bar-track">
                                <div
                                  className="bar-fill"
                                  style={{
                                    width: `${stats.hs.length ? (stats.n / stats.hs.length) * 100 : 0}%`,
                                  }}
                                />
                              </div>
                            </div>

                            <div className="teammate-habit-checklist">
                              {stats.hs.map((h) => {
                                const isHabitDone = done(h, today);
                                const meta = categoryInfo[h.category] || categoryInfo.mind;
                                const Icon = meta.icon;

                                return (
                                  <div
                                    key={h.id}
                                    className={`teammate-habit-row ${isHabitDone ? 'done' : 'pending'}`}
                                  >
                                    <div className="th-left">
                                      <span className={`th-icon ${meta.color}`}>
                                        <Icon size={14} />
                                      </span>
                                      <div>
                                        <div className="th-name">{h.name}</div>
                                        <small className="th-identity">Becoming {h.identity}</small>
                                      </div>
                                    </div>
                                    <div className="th-right">
                                      {isHabitDone ? (
                                        <span className="th-done-badge">
                                          <Check size={13} strokeWidth={2.4} /> Done
                                        </span>
                                      ) : (
                                        <button
                                          className="th-nudge-btn"
                                          onClick={() =>
                                            setModal({
                                              kind: 'nudge',
                                              person: p,
                                              habit: h,
                                              habitId: h.id,
                                            })
                                          }
                                        >
                                          <Zap size={13} /> Nudge
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}

                              {!stats.hs.length && (
                                <p className="no-habits-note">No habits added by this teammate yet.</p>
                              )}
                            </div>

                            <div className="board-card-footer">
                              <button
                                className="text-button"
                                onClick={() => setModal({ kind: 'person', person: p })}
                              >
                                View profile <ArrowUpRight size={14} />
                              </button>
                              {isAllDone ? (
                                <button
                                  className="button light cheer-btn"
                                  onClick={() => setModal({ kind: 'encourage', person: p })}
                                >
                                  <Heart size={15} /> Cheer on 🎉
                                </button>
                              ) : (
                                <button
                                  className="button dark nudge-all-btn"
                                  onClick={() => setModal({ kind: 'nudge', person: p })}
                                >
                                  <Zap size={15} /> Nudge teammate ⚡
                                </button>
                              )}
                            </div>
                          </article>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* VIEW: MY CIRCLE */}
          {view === 'My circle' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow">
                    <Users size={15} /> YOUR ACCOUNTABILITY SQUAD
                  </div>
                  <h1>{currentTeam.name}</h1>
                  <p>When friends check in together, consistency multiplies.</p>
                </div>
                <button className="button dark" onClick={openInvite}>
                  <UserPlus size={17} /> Invite teammate
                </button>
              </section>

              <section className="circle-overview">
                <div>
                  <span className="eyebrow">{currentTeam.name}</span>
                  <h2>{teamRatio}% of today’s promises, kept.</h2>
                  <p>
                    {teamDoneToday} habits completed across your circle today. {squadStreak}-day squad streak!
                  </p>
                </div>
                <div className="big-avatars">
                  {data.members.map((p) => (
                    <Avatar person={p} key={p.id} />
                  ))}
                </div>
                <div className="circle-overview-stat">
                  <strong>{data.members.length}</strong>
                  <span>{data.members.length === 1 ? 'member' : 'members'}</span>
                </div>
              </section>

              <div className="section-title spacious">
                <h2>Members in your circle</h2>
                <span className="quiet-caption">Encouragement over comparison</span>
              </div>

              <div className="people-grid">
                {data.members.map((p) => {
                  const stats = personStats(p);
                  return (
                    <article className="person-card" key={p.id}>
                      <div className="person-card-top">
                        <Avatar person={p} />
                        <span className="warm-tag">
                          <Flame size={13} /> {stats.streak} days
                        </span>
                      </div>
                      <h3>
                        {p.name}
                        {p.id === data.user.id && <small> (you)</small>}
                      </h3>
                      <p>
                        {stats.n} of {stats.hs.length} habits complete today
                      </p>

                      <div className="person-habits">
                        {stats.hs.slice(0, 3).map((h) => (
                          <div key={h.id}>
                            <span className={`tiny-check ${done(h, today) ? 'yes' : ''}`}>
                              {done(h, today) && <Check size={11} />}
                            </span>
                            {h.name}
                          </div>
                        ))}
                      </div>

                      <div className="person-card-actions">
                        <button
                          className="text-button"
                          onClick={() => setModal({ kind: 'person', person: p })}
                        >
                          View profile <ArrowUpRight size={14} />
                        </button>
                        {p.id !== data.user.id && (
                          <button
                            className="button light small-button"
                            onClick={() => setModal({ kind: 'nudge', person: p })}
                          >
                            <Zap size={14} /> Nudge
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}

                <button className="invite-card" onClick={openInvite}>
                  <span>
                    <Plus size={26} />
                  </span>
                  <h3>Make room for one more.</h3>
                  <p>Invite a friend to keep you accountable.</p>
                  <strong>Invite a teammate <ArrowUpRight size={14} /></strong>
                </button>
              </div>

              {/* RECENT ACTIVITY */}
              <div className="circle-bottom">
                <section className="panel">
                  <div className="section-title">
                    <h2>Live activity & nudges</h2>
                    <button className="text-button" onClick={() => setModal({ kind: 'reflect' })}>
                      <PenLine size={15} /> Share a win
                    </button>
                  </div>

                  {data.notes.length === 0 ? (
                    <div className="empty-notes-box">
                      <p>No activity notes yet. Send a nudge or share your first daily win!</p>
                    </div>
                  ) : (
                    <div className="activity-note-list">
                      {data.notes.map((note) => {
                        const author = data.members.find((p) => p.id === note.userId) || data.user;
                        const to = data.members.find((p) => p.id === note.recipient);
                        const isNudge = note.kind === 'nudge';
                        const isCheer = note.kind === 'cheer';

                        return (
                          <div className="note" key={note.id}>
                            <Avatar person={author} small />
                            <div className="note-content">
                              <p>
                                <strong>{author.name}</strong>
                                {to && (
                                  <>
                                    {' '}
                                    <span className="muted">
                                      {isNudge ? 'nudged ⚡' : isCheer ? 'cheered on 🎉' : 'cheered on'}
                                    </span>{' '}
                                    <strong>{to.name}</strong>
                                  </>
                                )}
                              </p>
                              <p className="note-body">{note.message}</p>
                              <small>
                                {new Date(note.created).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </small>
                            </div>
                            {isNudge ? <Zap size={15} className="note-zap" /> : <Heart size={15} className="note-heart" />}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </section>

                <section className="circle-principles">
                  <Sprout size={28} />
                  <h2>Atomic Circle Principles</h2>
                  <p>We celebrate effort. We encourage gently. We never miss twice.</p>
                  <div><Check size={15} /> Show up as you are, even for 2 minutes</div>
                  <div><Check size={15} /> Celebrate the tiny daily wins</div>
                  <div><Check size={15} /> Give an empowering nudge, never guilt</div>
                </section>
              </div>
            </>
          )}

          {/* VIEW: PROGRESS */}
          {view === 'Progress' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow"><ChartNoAxesCombined size={15} /> COMPOUND RESULTS</div>
                  <h1>Small steps. <em>Real growth.</em></h1>
                  <p>Consistency is an accumulation of daily votes for your future self.</p>
                </div>
              </section>

              <div className="stats-grid">
                <div className="stat-card">
                  <BookOpen size={21} />
                  <span>Total repetitions</span>
                  <strong>{totalChecks}</strong>
                  <p>Repetitions completed</p>
                </div>
                <div className="stat-card sage">
                  <Flame size={21} />
                  <span>Best current streak</span>
                  <strong>{bestStreak}<em> days</em></strong>
                  <p>Unbroken daily cadence</p>
                </div>
                <div className="stat-card lavender">
                  <Target size={21} />
                  <span>Today’s consistency</span>
                  <strong>{mine.length ? Math.round((todayDone / mine.length) * 100) : 0}<em>%</em></strong>
                  <p>{todayDone} of {mine.length} daily habits complete</p>
                </div>
              </div>

              <section className="panel activity-panel">
                <div className="section-title">
                  <div>
                    <h2>Consistency Calendar (12 Weeks)</h2>
                    <p className="section-subtitle">Every filled block is a promise kept.</p>
                  </div>
                  <span className="quiet-caption">{totalChecks} total check-ins</span>
                </div>

                <div className="heatmap">
                  {Array.from({ length: 84 }, (_, i) => {
                    const day = shiftDay(today, i - 83);
                    const count = data.checkins.filter((c) => c.day === day && mine.some((h) => h.id === c.habitId)).length;
                    return (
                      <div
                        key={day}
                        tabIndex={0}
                        title={`${day}: ${count} habits complete`}
                        className={`heat heat-${Math.min(count, 4)}`}
                      />
                    );
                  })}
                </div>
              </section>
            </>
          )}

          {/* VIEW: MINDSET */}
          {view === 'Mindset' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow"><Sprout size={15} /> ATOMIC HABITS SYSTEM</div>
                  <h1>Master your <em>habits.</em></h1>
                  <p>Core principles from James Clear to help you build systems that last.</p>
                </div>
              </section>

              <div className="lesson-grid">
                {lessons.map((l, i) => (
                  <article className={`library-card ${['sand', 'sage', 'lavender', 'peach'][i]}`} key={l.title}>
                    <span className="eyebrow">{l.tag}</span>
                    <h2>{l.title}</h2>
                    <p>{l.body.split('\n')[0]}</p>
                    <div className="library-card-foot">
                      <button className="text-button" onClick={() => setModal({ kind: 'lesson', title: l.title, body: l.body })}>
                        Read lesson <ArrowUpRight size={15} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </>
          )}

          {/* VIEW: FOCUS TIMER */}
          {view === 'Focus' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow"><Timer size={15} /> FOCUS SESSION</div>
                  <h1>A little room <em>to focus.</em></h1>
                  <p>Put your phone away. Settle into the present moment.</p>
                </div>
                <span className="warm-tag">{sessions} sessions completed</span>
              </section>

              <div className="focus-layout">
                <section className="focus-panel">
                  <div className="focus-presets">
                    {[5, 15, 25, 50].map((n) => (
                      <button
                        key={n}
                        className={duration === n ? 'selected' : ''}
                        disabled={!!endsAt}
                        onClick={() => {
                          setDuration(n);
                          setSeconds(n * 60);
                        }}
                      >
                        {n} min
                      </button>
                    ))}
                  </div>

                  <div className={`timer-pebble ${endsAt ? 'running' : ''}`}>
                    <span className="eyebrow">{endsAt ? 'IN THE FLOW' : 'MAKE A PROMISE TO THIS MOMENT'}</span>
                    <div className="timer-digits">
                      {String(Math.floor(seconds / 60)).padStart(2, '0')}<span>:</span>{String(seconds % 60).padStart(2, '0')}
                    </div>

                    <div className="timer-buttons">
                      <button
                        className="button dark"
                        onClick={() => {
                          if (endsAt) {
                            setSeconds(Math.max(0, Math.ceil((endsAt - Date.now()) / 1000)));
                            setEndsAt(null);
                          } else {
                            const s = seconds || duration * 60;
                            setSeconds(s);
                            setEndsAt(Date.now() + s * 1000);
                          }
                        }}
                      >
                        {endsAt ? <Pause size={17} /> : <Play size={17} />}
                        {endsAt ? 'Pause' : 'Begin Focus'}
                      </button>
                      <button
                        className="icon-button reset"
                        aria-label="Reset timer"
                        onClick={() => {
                          setEndsAt(null);
                          setSeconds(duration * 60);
                        }}
                      >
                        <RotateCcw size={18} />
                      </button>
                    </div>
                  </div>
                </section>

                <aside>
                  <section className="panel focus-settings">
                    <h2>Anchor to a Habit</h2>
                    <label>
                      Habit to log:
                      <select value={focusHabit} onChange={(e) => setFocusHabit(e.target.value)} disabled={!!endsAt}>
                        <option value="">Just pure focus</option>
                        {mine.map((h) => (
                          <option key={h.id} value={h.id}>{h.name}</option>
                        ))}
                      </select>
                    </label>
                  </section>
                </aside>
              </div>
            </>
          )}

          <footer>
            <Brand />
            <span>Small habits. Remarkable results. Growing together.</span>
          </footer>
        </main>
      </div>

      {/* MOBILE NAV */}
      <nav className="mobile-nav">
        {nav.map(({ name, icon: Icon }) => (
          <button className={view === name ? 'active' : ''} key={name} onClick={() => changeView(name)}>
            <Icon size={20} />
            <span>{name === 'My circle' ? 'Circle' : name}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <dialog
        ref={dialog}
        className="modal"
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="modal-content">
          {toast && <div className="dialog-status">{toast}</div>}
          <button className="modal-close icon-button" onClick={() => setModal(null)}>
            <X size={20} />
          </button>

          {/* MODAL: ADD / EDIT HABIT */}
          {modal?.kind === 'habit' && (
            <>
              <div className="modal-symbol peach"><Sprout size={25} /></div>
              <span className="eyebrow">ATOMIC HABIT FORMULA</span>
              <h2>{modal.habit ? 'Edit your habit.' : 'Plant an atomic habit.'}</h2>
              <form onSubmit={submit}>
                <label>
                  Habit Name
                  <input name="name" placeholder="e.g. Read 10 pages, Gym workout" defaultValue={modal.habit?.name} required autoFocus />
                </label>
                <label>
                  Who are you becoming? (Identity)
                  <input name="identity" placeholder="e.g. a lifelong learner" defaultValue={modal.habit?.identity} required />
                </label>
                <label>
                  Daily Target
                  <input name="target" placeholder="e.g. 10 pages, 30 minutes" defaultValue={modal.habit?.target} required />
                </label>
                <div className="form-row">
                  <label>
                    Category
                    <select name="category" defaultValue={modal.habit?.category || 'mind'}>
                      {Object.entries(categoryInfo).map(([k, v]) => (
                        <option key={k} value={k}>{v.label}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Time of day
                    <select name="time" defaultValue={modal.habit?.time || 'Morning'}>
                      {['Morning', 'Afternoon', 'Evening', 'Anytime'].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="atomic-helper-box">
                  <label>
                    <Layers size={14} /> Habit Stacking (Anchor)
                    <input name="stackAfter" placeholder="After I [e.g. pour morning coffee], I will..." defaultValue={modal.habit?.stackAfter} />
                  </label>
                  <label>
                    <Clock size={14} /> Two-Minute Rule Starter
                    <input name="twoMinuteStarter" placeholder="Effortless start: e.g. Read just 1 page" defaultValue={modal.habit?.twoMinuteStarter} />
                  </label>
                </div>
                <button className="button dark full" disabled={busy}>
                  {busy ? 'Saving…' : modal.habit ? 'Save changes' : 'Plant this habit'} <ArrowRight size={16} />
                </button>
                {modal.habit && (
                  <button className="danger-link" type="button" onClick={() => deleteHabit(modal.habit!)}>
                    Remove this habit
                  </button>
                )}
              </form>
            </>
          )}

          {/* MODAL: NUDGE TEAMMATE */}
          {modal?.kind === 'nudge' && (
            <>
              <div className="modal-symbol sage"><Zap size={25} /></div>
              <span className="eyebrow">ACCOUNTABILITY PARTNER</span>
              <h2>Nudge {modal.person?.name}</h2>
              <p className="modal-intro">
                {modal.habit
                  ? `Give ${modal.person?.name} a gentle nudge on "${modal.habit.name}".`
                  : `Remind ${modal.person?.name} to finish today's habits!`}
              </p>
              <form onSubmit={submit}>
                <div className="nudge-presets">
                  {[
                    `⚡ You’ve got this, ${modal.person?.name}! Still plenty of time today!`,
                    `🔥 Don’t break that streak! Even 2 minutes counts!`,
                    `🏃‍♂️ Time to show up! Just open the habit and take step 1!`,
                  ].map((msg) => (
                    <button
                      type="button"
                      key={msg}
                      className="preset-btn"
                      onClick={() => {
                        const el = document.getElementById('nudge-msg') as HTMLTextAreaElement;
                        if (el) el.value = msg;
                      }}
                    >
                      {msg}
                    </button>
                  ))}
                </div>
                <textarea id="nudge-msg" name="message" maxLength={400} rows={3} required defaultValue={`⚡ You’ve got this, ${modal.person?.name}! Still plenty of time today!`} />
                <button className="button dark full" disabled={busy}>
                  <Zap size={16} /> Send Nudge
                </button>
              </form>
            </>
          )}

          {/* MODAL: CHEER TEAMMATE */}
          {modal?.kind === 'encourage' && (
            <>
              <div className="modal-symbol peach"><Heart size={25} /></div>
              <h2>Cheer on {modal.person?.name}</h2>
              <form onSubmit={submit}>
                <textarea name="message" maxLength={400} rows={3} required defaultValue="🙌 Proud of your consistency today! Keep compounding!" />
                <button className="button dark full" disabled={busy}>
                  <Heart size={16} /> Send Cheer
                </button>
              </form>
            </>
          )}

          {/* MODAL: INVITE TEAMMATES */}
          {modal?.kind === 'invite' && (
            <>
              <div className="modal-symbol lavender"><Users size={25} /></div>
              <span className="eyebrow">INVITE TEAMMATES</span>
              <h2>Expand your circle</h2>
              <p className="modal-intro">Share this link with your friends to track habits together.</p>
              <div className="invite-box-card">
                <div className="copy-link-row">
                  <input readOnly value={inviteLink || 'Generating your invitation link…'} onFocus={(e) => e.target.select()} />
                  <button
                    className="button dark"
                    type="button"
                    disabled={!inviteLink}
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        notify('⚡ Invitation link copied!');
                      } catch {
                        notify('Copy the link from the input.');
                      }
                    }}
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>
                {inviteLink && (
                  <a
                    className="button whatsapp-btn"
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(
                      `Hey! Join my accountability circle on Team Up so we can track our daily habits and keep each other consistent: ${inviteLink}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <MessageCircle size={16} /> Share on WhatsApp
                  </a>
                )}
              </div>
            </>
          )}

          {/* MODAL: SETTINGS */}
          {modal?.kind === 'settings' && (
            <>
              <Avatar person={data.user} />
              <h2>{data.user.name}</h2>
              <p className="modal-intro">
                Circle: <strong>{currentTeam.name}</strong> · {data.members.length} {data.members.length === 1 ? 'member' : 'members'}
              </p>
              <button
                className="button light full"
                onClick={async () => {
                  const r = await fetch('/api/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action: 'signout' }),
                  });
                  if (r.ok) location.assign('/');
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            </>
          )}

          {/* MODAL: LESSON */}
          {modal?.kind === 'lesson' && (
            <>
              <div className="modal-symbol sand"><Sprout size={26} /></div>
              <h2>{modal.title}</h2>
              <div className="lesson-body">
                {modal.body?.split('\n\n').map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <button className="button dark full" onClick={() => setModal(null)}>
                Got it <ArrowRight size={16} />
              </button>
            </>
          )}
        </div>
      </dialog>

      {/* TOAST */}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
          <button onClick={() => setToast('')}><X size={15} /></button>
        </div>
      )}
    </div>
  );
}
