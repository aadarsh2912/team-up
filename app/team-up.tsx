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
  MoreHorizontal,
  Sun,
  Moon,
  Coffee,
  Send,
  Copy,
  Link as LinkIcon,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Target,
  CircleHelp,
  Leaf,
  LogOut,
  Zap,
  MessageCircle,
  Share2,
  Smile,
  ShieldCheck,
  CheckCircle2,
  Clock,
  Layers,
} from 'lucide-react';
import {
  demoState,
  dateKey,
  shiftDay,
  streak,
  longestStreak,
  personOverallStreak,
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
      'True behavior change is identity change. You might start a habit because of motivation, but the only reason you stick with one is that it becomes part of your identity.\n\nThe goal is not to read a book, the goal is to become a reader.\nThe goal is not to run a marathon, the goal is to become a runner.\n\nEvery action you take is a vote for the type of person you wish to become. No single instance will transform your beliefs, but as the votes build up, the evidence of your new identity grows.',
  },
  {
    title: 'Never Miss Twice: The Golden Rule of Consistency',
    tag: 'ATOMIC RULE #4 · MAKE IT SATISFYING',
    body:
      'Missing once is an accident. Missing twice is the start of a new habit.\n\nAnyone can have a bad day or an emergency. When successful people make a mistake or miss a workout, they rebound quickly. The breaking of the habit doesn’t matter if the reclaiming of it is fast.\n\nShow up on your bad days. Even if you only do 10 pushups or write 1 sentence, maintaining the rhythm is what prevents your momentum from resetting.',
  },
];

function Avatar({ person, small = false, glow = false }: { person: Person; small?: boolean; glow?: boolean }) {
  return (
    <span
      className={`avatar ${person.color} ${small ? 'small' : ''} ${glow ? 'avatar-glow' : ''}`}
      aria-label={person.name}
    >
      {person.name.slice(0, 1)}
    </span>
  );
}

function Brand() {
  return (
    <div className="brand">
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
    </div>
  );
}

export default function TeamUp() {
  const [data, setData] = useState<State>(() => demoState());
  const [demo, setDemo] = useState(true);
  const [account, setAccount] = useState<{ id: string; name: string } | null>(null);
  const [view, setView] = useState<View>('Today');
  const [subTab, setSubTab] = useState<SubTab>('my-habits');
  const [modal, setModal] = useState<Modal>(null);
  const [toast, setToast] = useState('');
  const [busy, setBusy] = useState(false);
  const [loadError, setLoadError] = useState('');
  const [darkMode, setDarkMode] = useState(false);

  const [today, setToday] = useState(dateKey());
  const [selectedDay, setSelectedDay] = useState(dateKey());
  const [weekOffset, setWeekOffset] = useState(0);
  const [filter, setFilter] = useState('All');
  const [progressTab, setProgressTab] = useState('Overview');
  const [libraryTab, setLibraryTab] = useState('Library');
  const [saved, setSaved] = useState<number[]>([]);
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
  const mounted = useRef(false);

  function notify(message: string) {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 4500);
  }

  async function refresh() {
    try {
      const r = await fetch('/api/team');
      const value = (await r.json()) as State & { error?: string; user?: Person };
      if (!r.ok) throw new Error(value.error);
      if (value.user) {
        setAccount(value.user);
      }
      if (value.team) {
        setData(value);
        setDemo(false);
      }
      setLoadError('');
      return value;
    } catch (e) {
      // In demo mode or offline, keep working seamlessly
      return null;
    }
  }

  useEffect(() => {
    mounted.current = true;
    try {
      const localTheme = localStorage.getItem('team-up-theme');
      if (localTheme === 'dark') {
        setDarkMode(true);
        document.documentElement.classList.add('dark');
      }
      const local = localStorage.getItem('team-up-state-v2');
      if (local) {
        const parsed = JSON.parse(local);
        if (parsed.day === dateKey()) setData(parsed.data);
      }
      setSaved(JSON.parse(localStorage.getItem('team-up-saved-lessons') || '[]'));
    } catch {}

    const token = new URLSearchParams(location.search).get('invite');
    if (token) {
      setJoinToken(token);
      setModal({ kind: 'join' });
    } else if (new URLSearchParams(location.search).has('start')) {
      setModal({ kind: 'create' });
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
    if (mounted.current && demo) {
      localStorage.setItem('team-up-state-v2', JSON.stringify({ day: today, data }));
    }
  }, [data, demo, today]);

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
        notify('⚡ Focus session complete! Small habits, compound results.');
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
  const done = (h: Habit, day = selectedDay) =>
    data.checkins.some((c) => c.habitId === h.id && c.day === day);
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
    const value = (await response.json()) as { error?: string; token?: string };
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
      if (demo) {
        setData((d) => ({
          ...d,
          checkins: exists
            ? d.checkins.filter((c) => !(c.habitId === h.id && c.day === today))
            : [...d.checkins, { habitId: h.id, day: today, created: new Date().toISOString() }],
        }));
      } else {
        await api({
          action: 'toggle',
          id: h.id,
          day: today,
          done: !exists,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        });
        await refresh();
      }
      notify(
        exists
          ? 'Check-in undone.'
          : `⚡ Repetition logged! 1% better every day.${demo ? ' (Saved locally)' : ''}`
      );
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
    setInviteLink(`${location.origin}/?invite=${data.team.code || 'GROWTH-7X'}`);
    setModal({ kind: 'invite' });
    if (demo) return;
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
        const newHabit: Habit = {
          id: modal.habit?.id || 'h_' + Date.now(),
          userId: data.user.id,
          name: String(fields.name).trim(),
          identity: String(fields.identity).trim(),
          target: String(fields.target).trim(),
          category: (fields.category as HabitCategory) || 'mind',
          time: (fields.time as HabitTime) || 'Morning',
          stackAfter: String(fields.stackAfter || '').trim(),
          twoMinuteStarter: String(fields.twoMinuteStarter || '').trim(),
          created: new Date().toISOString(),
        };

        if (demo) {
          setData((d) => ({
            ...d,
            habits: modal.habit ? d.habits.map((x) => (x.id === newHabit.id ? newHabit : x)) : [...d.habits, newHabit],
          }));
        } else {
          await api({
            ...fields,
            action: modal.habit ? 'edit_habit' : 'add_habit',
            id: modal.habit?.id,
          });
          await refresh();
        }
        notify(modal.habit ? 'Habit refined. Consistency is king.' : '🌱 New atomic habit planted!');
      } else if (modal?.kind === 'create' || modal?.kind === 'join') {
        if (demo && !account) {
          // If in demo, allow immediate local switch or prompt sign-in
          setData((d) => ({
            ...d,
            user: { ...d.user, name: String(fields.displayName) || 'You' },
            team: {
              id: 'local_' + Date.now(),
              name: String(fields.name) || 'My Accountability Circle',
              code: 'TEAM-' + Math.random().toString(36).substring(2, 6).toUpperCase(),
            },
          }));
          notify('Welcome to your circle! Ready for your team.');
        } else {
          await api({
            ...fields,
            action: modal.kind === 'join' ? 'join_team' : 'create_team',
            token: joinToken,
          });
          await refresh();
          history.replaceState(null, '', location.pathname);
          notify('Welcome to your circle! Let’s grow together.');
        }
      } else if (modal?.kind === 'nudge' || modal?.kind === 'encourage' || modal?.kind === 'reflect') {
        const msg = String(fields.message);
        const newNote: Note = {
          id: 'n_' + Date.now(),
          userId: data.user.id,
          recipient: modal.person?.id || null,
          habitId: modal.habitId || null,
          kind: modal.kind,
          message: msg,
          created: new Date().toISOString(),
        };

        if (demo) {
          setData((d) => ({
            ...d,
            notes: [newNote, ...d.notes],
          }));
        } else {
          await api({
            action: modal.kind === 'reflect' ? 'reflect' : 'encourage',
            recipient: modal.person?.id,
            message: msg,
          });
          await refresh();
        }
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
      if (demo) {
        setData((d) => ({
          ...d,
          habits: d.habits.filter((x) => x.id !== h.id),
          checkins: d.checkins.filter((c) => c.habitId !== h.id),
        }));
      } else {
        await api({ action: 'delete_habit', id: h.id });
        await refresh();
      }
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
      { name: 'First Little Step', icon: Sprout, desc: 'Logged first habit rep', yes: reps >= 1 },
      { name: '7-Day Rhythm', icon: Flame, desc: 'Built a 7-day streak', yes: longest >= 7 },
      { name: 'Habit Stacker', icon: Layers, desc: 'Connected habits with clear cues', yes: reps >= 15 },
      { name: '21-Day Transformation', icon: Sparkles, desc: 'Formed a lasting neural pathway', yes: longest >= 21 },
      { name: 'Century Club (100 Wins)', icon: Trophy, desc: '100 repetitions completed', yes: reps >= 100 },
    ].filter((b) => b.yes);
  }

  const week = Array.from({ length: 7 }, (_, i) => shiftDay(today, -6 + i + weekOffset * 7));

  return (
    <div className={`app-shell ${darkMode ? 'dark-theme' : ''}`}>
      {/* SIDEBAR NAVIGATION */}
      <aside className="sidebar">
        <button className="brand-button" onClick={() => changeView('Today')} aria-label="Team Up home">
          <Brand />
        </button>

        <div className="workspace-label">ACCOUNTABILITY CIRCLE</div>

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
            <strong>{data.team.name}</strong>
            <small>
              {data.members.length} teammates · {squadStreak}d squad streak 🔥
            </small>
          </span>
        </div>

        <button className="invite-side" onClick={openInvite}>
          <Plus size={16} /> Invite a teammate
        </button>

        {/* BOTTOM SECTION */}
        <div className="sidebar-bottom">
          <div className="sidebar-quote">
            <Sprout size={20} />
            <p>
              &ldquo;You do not rise to the level of your goals. You fall to the level of your systems.&rdquo;
            </p>
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
              <small>{demo ? 'Exploring demo · Connect cloud' : 'Syncing with Supabase'}</small>
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
            Your circle <span>/</span> <strong>{view}</strong>
          </div>

          <div className="top-actions">
            {demo ? (
              <button className="demo-pill" onClick={() => setModal({ kind: 'create' })}>
                <span /> Demo mode <ArrowUpRight size={13} />
              </button>
            ) : (
              <span className="live-pill">
                <span /> Connected
              </span>
            )}

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
          {loadError && (
            <div className="error-banner">
              {loadError} <button onClick={() => refresh()}>Retry connection</button>
            </div>
          )}

          {/* VIEW: TODAY */}
          {view === 'Today' && (
            <>
              {/* TOP HERO MOTIVATION BANNER */}
              <section className="greeting">
                <div>
                  <div className="eyebrow">
                    <Flame size={15} className="flame-icon" /> ATOMIC MOMENTUM · 1% BETTER TOGETHER
                  </div>
                  <h1>
                    Small habits. <em>Remarkable team.</em>
                  </h1>
                  <p>Check in for today, cheer on your friends, and never miss twice.</p>
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

              {/* SQUAD PULSE / ACCOUNTABILITY BANNER */}
              <section className="squad-pulse-card">
                <div className="pulse-info">
                  <span className="eyebrow-accent">
                    <Zap size={14} /> LIVE SQUAD ACCOUNTABILITY
                  </span>
                  <h2>{teamRatio}% of team habits completed today</h2>
                  <p>
                    {teamDoneToday} of {allTeamHabits.length} habits checked off across{' '}
                    <strong>{data.members.length} teammates</strong>.
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

              {/* VIEW SWITCHER SUB-TABS */}
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
                  <span className="live-badge">Live</span>
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

                    {/* HABIT CARDS */}
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

                      {mine.filter((h) => filter === 'All' || h.time === filter).length === 0 && (
                        <div className="empty-state">
                          <Sprout size={36} />
                          <h3>No habits in this window yet.</h3>
                          <p>Start with one tiny atomic habit. Make it so easy you can’t say no.</p>
                          <button className="button light" onClick={() => setModal({ kind: 'habit' })}>
                            <Plus size={16} /> Add a habit
                          </button>
                        </div>
                      )}
                    </div>

                    <button className="add-habit-row" onClick={() => setModal({ kind: 'habit' })}>
                      <Plus size={16} /> Plant the seed for a new habit
                    </button>
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
                          <span className="tiny-label">CURRENT RHYTHM</span>
                          <h4>
                            {todayDone === mine.length && mine.length
                              ? 'All habits complete! 🔥'
                              : todayDone
                              ? 'Building momentum.'
                              : 'Ready for today.'}
                          </h4>
                          <p>
                            {todayDone === mine.length && mine.length
                              ? 'Every promise to yourself kept today.'
                              : 'One small win creates the spark.'}
                          </p>
                          <span className="warm-tag">
                            <Flame size={12} /> {bestStreak}-day best streak
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* LIVE ACCOUNTABILITY HIGHLIGHT */}
                    <section className="circle-card">
                      <div className="section-title">
                        <h3>Teammates activity</h3>
                        <button className="text-button" onClick={() => setSubTab('team-tracker')}>
                          Full board <ArrowUpRight size={14} />
                        </button>
                      </div>
                      <p className="section-subtitle">Keep each other accountable today.</p>

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
                                  title={`Nudge ${p.name} to finish habits`}
                                >
                                  <Zap size={15} />
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      <button className="invite-box-btn" onClick={openInvite}>
                        <Share2 size={15} /> Invite more accountability partners
                      </button>
                    </section>

                    {/* PERSPECTIVE LESSON CARD */}
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

              {/* SUBTAB: TEAMMATES LIVE TRACKER */}
              {subTab === 'team-tracker' && (
                <div className="team-tracker-view">
                  <div className="tracker-header">
                    <div>
                      <h2>Teammates Daily Tracker & Accountability</h2>
                      <p>
                        See what your friends are working on today. If they haven’t completed their
                        habits, give them a friendly nudge!
                      </p>
                    </div>
                    <button className="button dark" onClick={openInvite}>
                      <Plus size={16} /> Add a teammate
                    </button>
                  </div>

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
                            <div className="board-badges">
                              <span className="streak-badge active">
                                <Flame size={14} />
                                <strong>{stats.streak}</strong>
                                <small>days</small>
                              </span>
                            </div>
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

                          {/* LIST OF HABITS */}
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
                                        title={`Nudge ${p.name} on this habit`}
                                      >
                                        <Zap size={13} /> Nudge
                                      </button>
                                    )}
                                  </div>
                                </div>
                              );
                            })}

                            {!stats.hs.length && (
                              <p className="no-habits-note">No habits added yet.</p>
                            )}
                          </div>

                          <div className="board-card-footer">
                            <button
                              className="text-button"
                              onClick={() => setModal({ kind: 'person', person: p })}
                            >
                              View profile & badges <ArrowUpRight size={14} />
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
                  <h1>
                    Better together. <em>Never alone.</em>
                  </h1>
                  <p>When friends check in together, consistency multiplies by 3x.</p>
                </div>
                <button className="button dark" onClick={openInvite}>
                  <Plus size={17} /> Invite teammate
                </button>
              </section>

              {/* OVERVIEW STATS */}
              <section className="circle-overview">
                <div>
                  <span className="eyebrow">{data.team.name}</span>
                  <h2>
                    {teamRatio}% of today’s promises, kept.
                  </h2>
                  <p>
                    {teamDoneToday} habits completed across your circle today. {squadStreak}-day
                    continuous squad streak!
                  </p>
                </div>
                <div className="big-avatars">
                  {data.members.map((p) => (
                    <Avatar person={p} key={p.id} />
                  ))}
                </div>
                <div className="circle-overview-stat">
                  <strong>{data.members.length}</strong>
                  <span>growing together</span>
                </div>
              </section>

              {/* MEMBERS LIST */}
              <div className="section-title spacious">
                <h2>The people in your corner</h2>
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

                      <div className="shared-achievements">
                        <Trophy size={13} />
                        {earned(p).length} milestones earned
                      </div>

                      <div className="person-card-actions">
                        <button
                          className="text-button"
                          onClick={() => setModal({ kind: 'person', person: p })}
                        >
                          View journey <ArrowUpRight size={14} />
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
                  <p>
                    Invite a close friend or colleague to keep you honest.
                  </p>
                  <strong>Invite a teammate <ArrowUpRight size={14} /></strong>
                </button>
              </div>

              {/* RECENT ACTIVITY & REFLECTIONS */}
              <div className="circle-bottom">
                <section className="panel">
                  <div className="section-title">
                    <h2>Live activity & kind words</h2>
                    <button className="text-button" onClick={() => setModal({ kind: 'reflect' })}>
                      <PenLine size={15} /> Share a win
                    </button>
                  </div>

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
                              })}{' '}
                              · {note.kind === 'reflect' ? 'Reflection' : isNudge ? 'Nudge' : 'Cheer'}
                            </small>
                          </div>
                          {isNudge ? (
                            <Zap size={15} className="note-zap" />
                          ) : (
                            <Heart size={15} className="note-heart" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </section>

                <section className="circle-principles">
                  <Sprout size={28} />
                  <h2>Atomic Circle Principles</h2>
                  <p>
                    We celebrate effort over perfection. We encourage gently. We never miss twice.
                  </p>
                  <div>
                    <Check size={15} /> Show up as you are, even for 2 minutes
                  </div>
                  <div>
                    <Check size={15} /> Celebrate the tiny daily wins
                  </div>
                  <div>
                    <Check size={15} /> Give an empowering nudge, never guilt
                  </div>
                </section>
              </div>
            </>
          )}

          {/* VIEW: PROGRESS */}
          {view === 'Progress' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow">
                    <ChartNoAxesCombined size={15} /> COMPOUND RESULTS
                  </div>
                  <h1>
                    Small steps. <em>Real growth.</em>
                  </h1>
                  <p>Consistency is not a talent. It is an accumulation of choices.</p>
                </div>
                <button className="button light" onClick={() => setModal({ kind: 'reflect' })}>
                  <PenLine size={16} /> Add reflection
                </button>
              </section>

              <div className="segmented">
                {['Overview', 'Milestones'].map((t) => (
                  <button
                    key={t}
                    className={progressTab === t ? 'selected' : ''}
                    onClick={() => setProgressTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {progressTab === 'Overview' ? (
                <>
                  <div className="stats-grid">
                    <div className="stat-card">
                      <BookOpen size={21} />
                      <span>Total repetitions</span>
                      <strong>{totalChecks}</strong>
                      <p>Small votes for your desired identity</p>
                    </div>
                    <div className="stat-card sage">
                      <Flame size={21} />
                      <span>Best current streak</span>
                      <strong>
                        {bestStreak}
                        <em> days</em>
                      </strong>
                      <p>Unbroken daily cadence</p>
                    </div>
                    <div className="stat-card lavender">
                      <Target size={21} />
                      <span>Today&apos;s consistency</span>
                      <strong>
                        {mine.length ? Math.round((todayDone / mine.length) * 100) : 0}
                        <em>%</em>
                      </strong>
                      <p>
                        {todayDone} of {mine.length} daily habits complete
                      </p>
                    </div>
                  </div>

                  {/* HEATMAP */}
                  <section className="panel activity-panel">
                    <div className="section-title">
                      <div>
                        <h2>Consistency Calendar (12 Weeks)</h2>
                        <p className="section-subtitle">
                          Every filled block is a promise kept to yourself.
                        </p>
                      </div>
                      <span className="quiet-caption">{totalChecks} total check-ins</span>
                    </div>

                    <div className="heatmap">
                      {Array.from({ length: 84 }, (_, i) => {
                        const day = shiftDay(today, i - 83);
                        const count = data.checkins.filter(
                          (c) => c.day === day && mine.some((h) => h.id === c.habitId)
                        ).length;
                        return (
                          <div
                            key={day}
                            tabIndex={0}
                            title={`${day}: ${count} habits complete`}
                            aria-label={`${day}: ${count} habits complete`}
                            className={`heat heat-${Math.min(count, 4)}`}
                          />
                        );
                      })}
                    </div>
                    <div className="heatmap-key">
                      <span>Less</span>
                      {[0, 1, 2, 3, 4].map((i) => (
                        <i key={i} className={`heat heat-${i}`} />
                      ))}
                      <span>More</span>
                    </div>
                  </section>

                  {/* HABIT BREAKDOWN */}
                  <section className="panel">
                    <h2>Habit Breakdown & Repetitions</h2>
                    <div className="habit-breakdown">
                      {mine.map((h) => {
                        const count = data.checkins.filter((c) => c.habitId === h.id).length;
                        return (
                          <div key={h.id}>
                            <div>
                              <strong>{h.name}</strong>
                              <span>{count} repetitions</span>
                            </div>
                            <div className="progress-track">
                              <i
                                className={categoryInfo[h.category]?.color || 'sand'}
                                style={{
                                  width: `${totalChecks ? (count / totalChecks) * 100 : 0}%`,
                                }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </section>
                </>
              ) : (
                <div className="milestone-grid">
                  {[
                    { n: 1, title: 'The First Little Step', copy: 'Complete your first habit.', icon: Sprout, met: totalChecks >= 1 },
                    { n: 7, title: 'A Week of Showing Up', copy: 'Build a 7-day habit streak.', icon: Flame, met: bestEver >= 7 },
                    { n: 15, title: 'Habit Stacking Master', copy: 'Complete 15 anchored habits.', icon: Layers, met: totalChecks >= 15 },
                    { n: 21, title: 'Finding Your Rhythm', copy: 'Build a 21-day habit streak.', icon: Sparkles, met: bestEver >= 21 },
                    { n: 30, title: 'Thirty Promises Kept', copy: 'Complete 30 habit repetitions.', icon: Trophy, met: totalChecks >= 30 },
                    { n: 100, title: 'The Century Club', copy: 'Complete 100 habit repetitions.', icon: Heart, met: totalChecks >= 100 },
                  ].map((m) => (
                    <article className={`milestone ${m.met ? 'unlocked' : ''}`} key={m.title}>
                      <span className="medal">
                        <m.icon size={28} />
                      </span>
                      <span className="tiny-label">{m.met ? 'ACHIEVED' : 'IN PROGRESS'}</span>
                      <h2>{m.title}</h2>
                      <p>{m.copy}</p>
                      <span className="milestone-status">
                        {m.met ? (
                          <>
                            <Check size={14} /> Unlocked & Celebrated
                          </>
                        ) : (
                          <>
                            <Sprout size={14} /> Keep building daily
                          </>
                        )}
                      </span>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}

          {/* VIEW: MINDSET */}
          {view === 'Mindset' && (
            <>
              <section className="greeting">
                <div>
                  <div className="eyebrow">
                    <Sprout size={15} /> ATOMIC HABITS SYSTEM
                  </div>
                  <h1>
                    Master your <em>habits.</em>
                  </h1>
                  <p>Principles from James Clear to help you build systems that last.</p>
                </div>
              </section>

              <div className="lesson-grid">
                {lessons.map((l, i) => (
                  <article className={`library-card ${['sand', 'sage', 'lavender', 'peach'][i]}`} key={l.title}>
                    <span className="eyebrow">{l.tag}</span>
                    <h2>{l.title}</h2>
                    <p>{l.body.split('\n')[0]}</p>
                    <div className="library-card-foot">
                      <button
                        className="text-button"
                        onClick={() => setModal({ kind: 'lesson', title: l.title, body: l.body })}
                      >
                        Read lesson <ArrowUpRight size={15} />
                      </button>
                      <button
                        className={`save-lesson ${saved.includes(i) ? 'saved' : ''}`}
                        aria-label="Save lesson"
                        onClick={() => {
                          const next = saved.includes(i) ? saved.filter((s) => s !== i) : [...saved, i];
                          setSaved(next);
                          localStorage.setItem('team-up-saved-lessons', JSON.stringify(next));
                          notify(saved.includes(i) ? 'Removed from saved.' : 'Saved to favorites.');
                        }}
                      >
                        <Heart size={17} fill={saved.includes(i) ? 'currentColor' : 'none'} />
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
                  <div className="eyebrow">
                    <Timer size={15} /> DEEP WORK & INTENTION
                  </div>
                  <h1>
                    A little room <em>to focus.</em>
                  </h1>
                  <p>Put your distractions away. Settle into the present moment.</p>
                </div>
                <span className="warm-tag">
                  {sessions} {sessions === 1 ? 'session' : 'sessions'} completed
                </span>
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
                    <span className="eyebrow">
                      {endsAt ? 'DEEP IN THE FLOW' : 'MAKE A PROMISE TO THIS MOMENT'}
                    </span>
                    <div className="timer-digits">
                      {String(Math.floor(seconds / 60)).padStart(2, '0')}
                      <span>:</span>
                      {String(seconds % 60).padStart(2, '0')}
                    </div>
                    <p>
                      {seconds === 0
                        ? 'Promise kept. Take a deep breath.'
                        : endsAt
                        ? 'One moment at a time.'
                        : 'Select duration and begin.'}
                    </p>

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
                        {endsAt ? 'Pause' : seconds < duration * 60 && seconds > 0 ? 'Continue' : 'Begin Focus'}
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
                    <p className="section-subtitle">
                      Automatically log your habit check-in when timer completes.
                    </p>

                    <label>
                      Habit to log:
                      <select
                        value={focusHabit}
                        onChange={(e) => setFocusHabit(e.target.value)}
                        disabled={!!endsAt}
                      >
                        <option value="">Just pure focus</option>
                        {mine.map((h) => (
                          <option key={h.id} value={h.id}>
                            {h.name} ({h.target})
                          </option>
                        ))}
                      </select>
                    </label>

                    <label className="switch-label">
                      <span>
                        Auto-complete habit on timer finish
                        <small>Never forget to mark your daily win.</small>
                      </span>
                      <input
                        type="checkbox"
                        checked={autoLog}
                        onChange={(e) => setAutoLog(e.target.checked)}
                        disabled={!focusHabit || !!endsAt}
                      />
                    </label>
                  </section>
                </aside>
              </div>
            </>
          )}

          <footer>
            <Brand />
            <span>Small habits. Remarkable results. Growing together.</span>
            <button onClick={() => setModal({ kind: 'about' })}>
              About Team Up <ArrowUpRight size={12} />
            </button>
          </footer>
        </main>
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-nav">
        {nav.map(({ name, icon: Icon }) => (
          <button
            className={view === name ? 'active' : ''}
            key={name}
            onClick={() => changeView(name)}
          >
            <Icon size={20} />
            <span>{name === 'My circle' ? 'Circle' : name}</span>
          </button>
        ))}
      </nav>

      {/* MODALS */}
      <dialog
        ref={dialog}
        className={`modal ${modal?.kind === 'lesson' ? 'reading-modal' : ''}`}
        onCancel={() => setModal(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setModal(null);
        }}
      >
        <div className="modal-content" key={modal?.kind + (modal?.habit?.id || '')}>
          {toast && <div className="dialog-status" role="status">{toast}</div>}
          <button
            className="modal-close icon-button"
            aria-label="Close dialog"
            onClick={() => setModal(null)}
          >
            <X size={20} />
          </button>

          {/* MODAL: ADD / EDIT HABIT WITH ATOMIC HABITS SYSTEM */}
          {modal?.kind === 'habit' && (
            <>
              <span className="modal-symbol peach">
                <Sprout size={25} />
              </span>
              <span className="eyebrow">ATOMIC HABIT FORMULA</span>
              <h2>{modal.habit ? 'Shape your habit.' : 'Plant an atomic habit.'}</h2>
              <p className="modal-intro">
                Clear cue. Tiny beginning. Compounding consistency.
              </p>

              {/* TEMPLATES SHORTCUTS */}
              {!modal.habit && (
                <div className="template-strip">
                  <span className="tiny-label">POPULAR STARTERS:</span>
                  <div className="template-pills">
                    {ATOMIC_HABIT_TEMPLATES.slice(0, 3).map((tpl) => (
                      <button
                        type="button"
                        key={tpl.name}
                        onClick={() => {
                          const form = dialog.current?.querySelector('form') as HTMLFormElement;
                          if (form) {
                            (form.elements.namedItem('name') as HTMLInputElement).value = tpl.name;
                            (form.elements.namedItem('identity') as HTMLInputElement).value = tpl.identity;
                            (form.elements.namedItem('target') as HTMLInputElement).value = tpl.target;
                            (form.elements.namedItem('category') as HTMLSelectElement).value = tpl.category;
                            (form.elements.namedItem('time') as HTMLSelectElement).value = tpl.time;
                            (form.elements.namedItem('stackAfter') as HTMLInputElement).value = tpl.stackAfter;
                            (form.elements.namedItem('twoMinuteStarter') as HTMLInputElement).value = tpl.twoMinuteStarter;
                          }
                        }}
                      >
                        + {tpl.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={submit}>
                <label>
                  1. What would you like to do?
                  <input
                    name="name"
                    placeholder="e.g. Read 10 pages, Workout, Code"
                    maxLength={70}
                    defaultValue={modal.habit?.name}
                    required
                    autoFocus
                  />
                </label>

                <label>
                  2. I am becoming someone who… (Identity)
                  <input
                    name="identity"
                    placeholder="e.g. is a lifelong learner, an athletic builder"
                    maxLength={100}
                    defaultValue={modal.habit?.identity}
                    required
                  />
                </label>

                <label>
                  3. My daily target
                  <input
                    name="target"
                    placeholder="e.g. 10 pages, 30 minutes, 1 problem"
                    maxLength={70}
                    defaultValue={modal.habit?.target}
                    required
                  />
                </label>

                <div className="form-row">
                  <label>
                    Area of growth
                    <select name="category" defaultValue={modal.habit?.category || 'mind'}>
                      {Object.entries(categoryInfo).map(([k, v]) => (
                        <option key={k} value={k}>
                          {v.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label>
                    When feels right?
                    <select name="time" defaultValue={modal.habit?.time || 'Morning'}>
                      {['Morning', 'Afternoon', 'Evening', 'Anytime'].map((t) => (
                        <option key={t}>{t}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="atomic-helper-box">
                  <label>
                    <Layers size={14} /> Habit Stacking (Cue)
                    <input
                      name="stackAfter"
                      placeholder="After I [e.g. pour my morning coffee], I will..."
                      maxLength={80}
                      defaultValue={modal.habit?.stackAfter}
                    />
                  </label>

                  <label>
                    <Clock size={14} /> Two-Minute Rule Starter
                    <input
                      name="twoMinuteStarter"
                      placeholder="Make it effortless: e.g. Read just 1 page"
                      maxLength={80}
                      defaultValue={modal.habit?.twoMinuteStarter}
                    />
                  </label>
                </div>

                <p className="form-hint">
                  <Users size={14} /> Visible to your teammates for shared accountability.
                </p>

                <button className="button dark full" disabled={busy}>
                  {busy ? 'Saving…' : modal.habit ? 'Save changes' : 'Plant this habit'}
                  <ArrowRight size={16} />
                </button>

                {modal.habit && (
                  <button
                    className="danger-link"
                    type="button"
                    onClick={() => setModal({ kind: 'delete', habit: modal.habit })}
                  >
                    Remove this habit
                  </button>
                )}
              </form>
            </>
          )}

          {/* MODAL: NUDGE TEAMMATE (KEY ACCOUNTABILITY FEATURE) */}
          {modal?.kind === 'nudge' && (
            <>
              <div className="modal-symbol sage">
                <Zap size={25} />
              </div>
              <span className="eyebrow">ACCOUNTABILITY PARTNER</span>
              <h2>Nudge {modal.person?.name}</h2>
              <p className="modal-intro">
                {modal.habit
                  ? `Give ${modal.person?.name} a gentle reminder to finish "${modal.habit.name}".`
                  : `Remind ${modal.person?.name} that there’s still time to show up today!`}
              </p>

              <form onSubmit={submit}>
                <label>
                  Quick Nudge Presets:
                  <div className="nudge-presets">
                    {[
                      `⚡ You’ve got this, ${modal.person?.name}! Still plenty of time today!`,
                      `🔥 Don’t break the streak! Even 2 minutes counts!`,
                      `🏃‍♂️ Time to show up! Just open the habit and do step one!`,
                      `🙌 Rooting for you! Let’s crush our goals together today!`,
                    ].map((msg) => (
                      <button
                        type="button"
                        key={msg}
                        className="preset-btn"
                        onClick={() => {
                          const ta = document.getElementById('nudge-msg') as HTMLTextAreaElement;
                          if (ta) ta.value = msg;
                        }}
                      >
                        {msg}
                      </button>
                    ))}
                  </div>
                </label>

                <label>
                  Your message:
                  <textarea
                    id="nudge-msg"
                    name="message"
                    maxLength={400}
                    rows={3}
                    required
                    defaultValue={`⚡ You’ve got this, ${modal.person?.name}! Still plenty of time today!`}
                  />
                </label>

                <button className="button dark full" disabled={busy}>
                  <Zap size={16} /> Send Nudge to {modal.person?.name}
                </button>
              </form>
            </>
          )}

          {/* MODAL: CHEER TEAMMATE */}
          {modal?.kind === 'encourage' && (
            <>
              <div className="modal-symbol peach">
                <Heart size={25} />
              </div>
              <span className="eyebrow">CELEBRATE WINS</span>
              <h2>Cheer on {modal.person?.name}</h2>
              <p className="modal-intro">
                Celebrate their consistency and reinforce their positive identity.
              </p>

              <form onSubmit={submit}>
                <label>
                  Your words of cheer:
                  <textarea
                    id="cheer-msg"
                    name="message"
                    maxLength={400}
                    rows={3}
                    required
                    defaultValue="🙌 Proud of your consistency today! Keep compounding!"
                  />
                </label>

                <div className="nudge-presets">
                  {[
                    '🙌 Proud of your consistency today! Keep compounding!',
                    '🔥 That streak is looking unstoppable! Well done!',
                    '✨ Small habits, massive results. Inspiring work!',
                  ].map((m) => (
                    <button
                      type="button"
                      key={m}
                      className="preset-btn"
                      onClick={() => {
                        const el = document.getElementById('cheer-msg') as HTMLTextAreaElement;
                        if (el) el.value = m;
                      }}
                    >
                      {m}
                    </button>
                  ))}
                </div>

                <button className="button dark full" disabled={busy}>
                  <Heart size={16} /> Send Cheer
                </button>
              </form>
            </>
          )}

          {/* MODAL: INVITE TEAMMATE (SUPER POLISHED) */}
          {modal?.kind === 'invite' && (
            <>
              <div className="modal-symbol lavender">
                <Users size={25} />
              </div>
              <span className="eyebrow">EXPAND YOUR CIRCLE</span>
              <h2>Invite Your Accountability Partners</h2>
              <p className="modal-intro">
                Invite friends, gym buddies, or study partners. When you show up together,
                habits stick.
              </p>

              <div className="invite-box-card">
                <label>Shareable Invitation Link</label>
                <div className="copy-link-row">
                  <input readOnly value={inviteLink} onFocus={(e) => e.target.select()} />
                  <button
                    className="button dark"
                    type="button"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(inviteLink);
                        notify('⚡ Invitation link copied! Send it to your friend.');
                      } catch {
                        notify('Copy the link manually from the box.');
                      }
                    }}
                  >
                    <Copy size={16} /> Copy
                  </button>
                </div>

                <div className="share-buttons-row">
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
                </div>

                <div className="circle-code-pill">
                  Circle Code: <strong>{data.team.code || 'GROWTH-7X'}</strong>
                </div>
              </div>

              <div className="privacy-note">
                <ShieldCheck size={18} />
                <p>
                  Teammates will see your daily check-in streaks and habits so you can nudge each
                  other every day.
                </p>
              </div>
            </>
          )}

          {/* MODAL: PERSON JOURNEY PROFILE */}
          {modal?.kind === 'person' && modal.person && (
            <>
              <div className="person-modal-header">
                <Avatar person={modal.person} glow />
                <div>
                  <h2>{modal.person.name}’s Journey</h2>
                  <span className="handle-tag">
                    {modal.person.handle || `@${modal.person.name.toLowerCase()}`}
                  </span>
                </div>
              </div>

              <p className="modal-intro">
                {personStats(modal.person).n} of {personStats(modal.person).hs.length} habits complete
                today · {personStats(modal.person).streak}-day best streak 🔥
              </p>

              <div className="earned-badges">
                {earned(modal.person).map((b) => (
                  <span key={b.name} title={b.desc}>
                    <b.icon size={13} /> {b.name}
                  </span>
                ))}
              </div>

              <div className="profile-habits">
                {personStats(modal.person).hs.map((h) => {
                  const meta = categoryInfo[h.category] || categoryInfo.mind;
                  const Icon = meta.icon;
                  const isDone = done(h, today);
                  return (
                    <div key={h.id} className="profile-habit-item">
                      <span className={`habit-icon ${meta.color}`}>
                        <Icon size={18} />
                      </span>
                      <div>
                        <strong>{h.name}</strong>
                        <small>
                          {h.target} · Becoming {h.identity}
                        </small>
                      </div>
                      <span className={`tiny-check ${isDone ? 'yes' : ''}`}>
                        {isDone && <Check size={12} />}
                      </span>
                    </div>
                  );
                })}
              </div>

              {modal.person.id !== data.user.id && (
                <div className="person-modal-actions">
                  <button
                    className="button dark full"
                    onClick={() => setModal({ kind: 'nudge', person: modal.person })}
                  >
                    <Zap size={16} /> Nudge {modal.person.name}
                  </button>
                  <button
                    className="button light full"
                    onClick={() => setModal({ kind: 'encourage', person: modal.person })}
                  >
                    <Heart size={16} /> Cheer on
                  </button>
                </div>
              )}
            </>
          )}

          {/* MODAL: DELETE CONFIRMATION */}
          {modal?.kind === 'delete' && (
            <>
              <h2>Remove this habit?</h2>
              <p className="modal-intro">
                Remove &ldquo;{modal.habit?.name}&rdquo; and its check-in records? This cannot be
                undone.
              </p>
              <button
                className="button dark full"
                disabled={busy}
                onClick={() => deleteHabit(modal.habit!)}
              >
                Yes, remove habit
              </button>
              <button className="button light full" onClick={() => setModal(null)}>
                Keep growing
              </button>
            </>
          )}

          {/* MODAL: CREATE OR JOIN CIRCLE */}
          {(modal?.kind === 'create' || modal?.kind === 'join') && (
            <>
              <div className="modal-symbol sage">
                <Users size={25} />
              </div>
              <span className="eyebrow">YOUR NEXT CHAPTER</span>
              <h2>{modal.kind === 'join' ? 'Find your squad.' : 'Start an Accountability Circle.'}</h2>
              <p className="modal-intro">
                {modal.kind === 'join'
                  ? 'Join your friend’s circle and start compounding habits together.'
                  : 'Create a private accountability circle for you and your teammates.'}
              </p>

              {!account && !demo ? (
                <>
                  <a
                    className="button dark full"
                    href={`/login?return_to=${encodeURIComponent(
                      joinToken ? '/?invite=' + joinToken : '/?start=1'
                    )}`}
                  >
                    Sign in to continue <ArrowUpRight size={16} />
                  </a>
                  <p className="form-hint">Sign in with email to keep habits synced in real-time.</p>
                </>
              ) : (
                <form onSubmit={submit}>
                  <label>
                    Your Display Name
                    <input
                      name="displayName"
                      defaultValue={account?.name || data.user.name}
                      maxLength={40}
                      required
                      autoFocus
                    />
                  </label>

                  {modal.kind === 'create' && (
                    <label>
                      Circle Name
                      <input
                        name="name"
                        placeholder="e.g. 5AM Club, Founder Circle, Gym Bros"
                        maxLength={60}
                        required
                      />
                    </label>
                  )}

                  <div className="privacy-note">
                    <Users size={18} />
                    <p>
                      Teammates will be able to view habits and cheer each other on in real-time.
                    </p>
                  </div>

                  <button className="button dark full" disabled={busy}>
                    {busy
                      ? 'Creating…'
                      : modal.kind === 'join'
                      ? 'Join the Circle'
                      : 'Create My Circle'}
                    <ArrowRight size={16} />
                  </button>
                </form>
              )}
            </>
          )}

          {/* MODAL: LESSON READER */}
          {modal?.kind === 'lesson' && (
            <>
              <div className="modal-symbol sand">
                <Sprout size={26} />
              </div>
              <span className="eyebrow">ATOMIC WISDOM · 2 MIN READ</span>
              <h2>{modal.title}</h2>
              <div className="lesson-body">
                {modal.body?.split('\n\n').map((p) => (
                  <p key={p}>{p}</p>
                ))}
              </div>
              <button
                className="button dark full"
                onClick={() => {
                  setModal(null);
                  changeView('Today');
                }}
              >
                Apply this today <ArrowRight size={16} />
              </button>
            </>
          )}

          {/* MODAL: SHARE REFLECTION */}
          {modal?.kind === 'reflect' && (
            <>
              <div className="modal-symbol sand">
                <PenLine size={25} />
              </div>
              <span className="eyebrow">NOTICE YOUR GROWTH</span>
              <h2>Share a reflection or win</h2>
              <p className="modal-intro">
                What felt good today? What did you learn? Inspire your teammates.
              </p>
              <form onSubmit={submit}>
                <label>
                  Your reflection
                  <textarea
                    name="message"
                    maxLength={400}
                    rows={4}
                    placeholder="Today I realized that stacking my habit after coffee made starting so much easier..."
                    required
                    autoFocus
                  />
                </label>
                <button className="button dark full" disabled={busy}>
                  Share reflection with circle <ArrowUpRight size={16} />
                </button>
              </form>
            </>
          )}

          {/* MODAL: SETTINGS */}
          {modal?.kind === 'settings' && (
            <>
              <Avatar person={data.user} />
              <h2>Your Corner</h2>
              <p className="modal-intro">
                {data.team.name} · {data.members.length} members
              </p>

              <div className="privacy-note">
                <Users size={18} />
                <p>
                  Your habits and check-ins are visible to teammates for accountability.
                </p>
              </div>

              {demo ? (
                <div className="demo-corner-box">
                  <p>
                    You are exploring in demo mode. Create an account to invite real teammates
                    across different phones and laptops.
                  </p>
                  <a className="button dark full" href="/login">
                    Sign in or Create Free Account <ArrowUpRight size={16} />
                  </a>
                </div>
              ) : (
                <button
                  className="button light full"
                  onClick={async () => {
                    const r = await fetch('/api/auth', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'signout' }),
                    });
                    if (r.ok) location.assign('/');
                    else notify('Could not sign out.');
                  }}
                >
                  <LogOut size={16} /> Sign out
                </button>
              )}
            </>
          )}

          {/* MODAL: NOTIFICATIONS / ACTIVITY */}
          {modal?.kind === 'notifications' && (
            <>
              <span className="eyebrow">CIRCLE UPDATES</span>
              <h2>Team Nudges & Cheers</h2>
              <div className="activity-note-list modal-notes">
                {data.notes.map((note) => {
                  const author = data.members.find((p) => p.id === note.userId) || data.user;
                  const to = data.members.find((p) => p.id === note.recipient);
                  return (
                    <div className="note" key={note.id}>
                      <Avatar person={author} small />
                      <div>
                        <p>
                          <strong>{author.name}</strong>
                          {to && <> cheered on <strong>{to.name}</strong></>}
                        </p>
                        <p className="note-body">{note.message}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* MODAL: ABOUT */}
          {modal?.kind === 'about' && (
            <>
              <Brand />
              <h2>A little better, together.</h2>
              <p className="modal-intro">
                Team Up is an accountability habit tracker inspired by James Clear’s Atomic
                Habits and the Atoms app.
              </p>
              <div className="privacy-note">
                <Heart size={20} />
                <p>
                  Built for the younger generation to stay consistent, avoid burnout, and lift each
                  other up.
                </p>
              </div>
            </>
          )}
        </div>
      </dialog>

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className="toast" role="status">
          <CheckCircle2 size={17} />
          <span>{toast}</span>
          <button aria-label="Dismiss" onClick={() => setToast('')}>
            <X size={15} />
          </button>
        </div>
      )}
    </div>
  );
}
