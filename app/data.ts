export type Person = {
  id: string;
  name: string;
  color: 'peach' | 'lavender' | 'sage' | 'sand';
  avatar?: string;
  handle?: string;
};

export type HabitCategory = 'mind' | 'body' | 'growth' | 'calm';
export type HabitTime = 'Morning' | 'Afternoon' | 'Evening' | 'Anytime';

export type Habit = {
  id: string;
  userId: string;
  name: string;
  identity: string;
  target: string;
  category: HabitCategory;
  time: HabitTime;
  stackAfter?: string;
  twoMinuteStarter?: string;
  created: string;
};

export type Checkin = {
  habitId: string;
  day: string;
  created: string;
};

export type NoteKind = 'encourage' | 'reflect' | 'nudge' | 'cheer';

export type Note = {
  id: string;
  userId: string;
  recipient?: string | null;
  habitId?: string | null;
  kind: NoteKind | string;
  message: string;
  created: string;
};

export type State = {
  user: Person;
  team: { id: string; name: string; code?: string };
  members: Person[];
  habits: Habit[];
  checkins: Checkin[];
  notes: Note[];
};

export const dateKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function shiftDay(day: string, n: number) {
  const d = new Date(day + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return dateKey(d);
}

export function streak(habitId: string, checks: Checkin[], today: string) {
  const days = new Set(checks.filter((c) => c.habitId === habitId).map((c) => c.day));
  let day = days.has(today) ? today : shiftDay(today, -1);
  let n = 0;
  while (days.has(day)) {
    n++;
    day = shiftDay(day, -1);
  }
  return n;
}

export function longestStreak(habitId: string, checks: Checkin[]) {
  const days = [...new Set(checks.filter((c) => c.habitId === habitId).map((c) => c.day))].sort();
  let best = 0,
    current = 0,
    last = '';
  for (const day of days) {
    current = last && shiftDay(last, 1) === day ? current + 1 : 1;
    best = Math.max(best, current);
    last = day;
  }
  return best;
}

export function personOverallStreak(userId: string, habits: Habit[], checks: Checkin[], today: string) {
  const userHabits = habits.filter((h) => h.userId === userId);
  if (!userHabits.length) return 0;
  return Math.max(0, ...userHabits.map((h) => streak(h.id, checks, today)));
}

export function teamActiveStreak(habits: Habit[], checks: Checkin[], today: string) {
  if (!habits.length) return 0;
  let day = today;
  let count = 0;
  while (true) {
    const hasAny = checks.some((c) => c.day === day);
    if (!hasAny) {
      if (day === today) {
        day = shiftDay(today, -1);
        continue;
      }
      break;
    }
    count++;
    day = shiftDay(day, -1);
  }
  return count;
}

export const ATOMIC_HABIT_TEMPLATES = [
  {
    name: 'Read 10 pages',
    identity: 'a lifelong learner',
    target: '10 pages of a book',
    category: 'mind' as HabitCategory,
    time: 'Morning' as HabitTime,
    stackAfter: 'After morning coffee or tea',
    twoMinuteStarter: 'Read just 1 page',
  },
  {
    name: 'Gym & Movement',
    identity: 'an energized, athletic person',
    target: '40 minutes workout or run',
    category: 'body' as HabitCategory,
    time: 'Morning' as HabitTime,
    stackAfter: 'After putting on workout shoes',
    twoMinuteStarter: 'Do 10 bodyweight squats',
  },
  {
    name: 'Deep coding / Problem solving',
    identity: 'a world-class engineer',
    target: '1 challenge or 30m focused code',
    category: 'growth' as HabitCategory,
    time: 'Afternoon' as HabitTime,
    stackAfter: 'After sitting down at workspace',
    twoMinuteStarter: 'Open terminal and read the task',
  },
  {
    name: '10-minute mindfulness',
    identity: 'a calm and centered person',
    target: '10 minutes box breathing',
    category: 'calm' as HabitCategory,
    time: 'Evening' as HabitTime,
    stackAfter: 'After closing laptop for the day',
    twoMinuteStarter: 'Take 3 deep conscious breaths',
  },
  {
    name: 'Drink 2.5L water',
    identity: 'someone who fuels their body with care',
    target: '4 full water bottles',
    category: 'body' as HabitCategory,
    time: 'Anytime' as HabitTime,
    stackAfter: 'Right after waking up',
    twoMinuteStarter: 'Drink 1 full glass immediately',
  },
  {
    name: 'Evening reflection',
    identity: 'a mindful, intentional thinker',
    target: '3 wins from today',
    category: 'mind' as HabitCategory,
    time: 'Evening' as HabitTime,
    stackAfter: 'Before bed',
    twoMinuteStarter: 'Write down just 1 good thing',
  },
];

export function initialUserState(user?: Person | null, teamName?: string): State {
  const defaultUser: Person = user || {
    id: 'user_main',
    name: 'You',
    color: 'peach',
  };
  return {
    user: defaultUser,
    team: {
      id: 'team_main',
      name: teamName || (user ? `${user.name}’s Squad` : 'Accountability Circle'),
      code: 'CIRCLE-7X',
    },
    members: [defaultUser],
    habits: user
      ? []
      : [
          {
            id: 'h_starter_1',
            userId: defaultUser.id,
            name: 'Read 10 pages of a book',
            identity: 'a lifelong learner',
            target: '10 pages daily',
            category: 'mind',
            time: 'Morning',
            stackAfter: 'After pouring morning coffee',
            twoMinuteStarter: 'Read just 1 page',
            created: new Date().toISOString(),
          },
          {
            id: 'h_starter_2',
            userId: defaultUser.id,
            name: '20-minute workout or movement',
            identity: 'someone who takes care of their health',
            target: '20 mins',
            category: 'body',
            time: 'Morning',
            stackAfter: 'After putting on workout shoes',
            twoMinuteStarter: 'Do 5 pushups or 30s stretch',
            created: new Date().toISOString(),
          },
        ],
    checkins: [],
    notes: [],
  };
}
