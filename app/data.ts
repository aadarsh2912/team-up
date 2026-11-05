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
  // Check if at least one team member checked in per day
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
    target: '10 pages of a non-fiction book',
    category: 'mind' as HabitCategory,
    time: 'Morning' as HabitTime,
    stackAfter: 'After pouring morning coffee',
    twoMinuteStarter: 'Read just 1 page',
  },
  {
    name: 'Hit the gym / lift',
    identity: 'someone in peak physical form',
    target: '45 minutes workout',
    category: 'body' as HabitCategory,
    time: 'Morning' as HabitTime,
    stackAfter: 'After putting on workout shoes',
    twoMinuteStarter: 'Do 10 bodyweight squats',
  },
  {
    name: 'Daily LeetCode / Build project',
    identity: 'a master software engineer',
    target: '1 problem or 30m deep work',
    category: 'growth' as HabitCategory,
    time: 'Afternoon' as HabitTime,
    stackAfter: 'After sitting at work desk',
    twoMinuteStarter: 'Open IDE and read problem description',
  },
  {
    name: '10-minute mindfulness',
    identity: 'a calm and grounded thinker',
    target: '10 minutes box breathing',
    category: 'calm' as HabitCategory,
    time: 'Evening' as HabitTime,
    stackAfter: 'After closing laptop for the day',
    twoMinuteStarter: 'Take 3 deep conscious breaths',
  },
  {
    name: 'Drink 2.5L of water',
    identity: 'someone who fuels their body with care',
    target: '4 full water bottles',
    category: 'body' as HabitCategory,
    time: 'Anytime' as HabitTime,
    stackAfter: 'After waking up',
    twoMinuteStarter: 'Drink 1 full glass immediately',
  },
  {
    name: 'Evening reflection & planning',
    identity: 'an intentional architect of my time',
    target: '3 wins & tomorrow top 3 priorities',
    category: 'mind' as HabitCategory,
    time: 'Evening' as HabitTime,
    stackAfter: 'After dinner',
    twoMinuteStarter: 'Write down just 1 win from today',
  },
];

export function demoState(): State {
  const today = dateKey();
  const created = new Date().toISOString();
  const members: Person[] = [
    { id: 'you', name: 'Aadarsh', color: 'peach', handle: '@aadarsh' },
    { id: 'maya', name: 'Maya', color: 'lavender', handle: '@maya' },
    { id: 'arjun', name: 'Arjun', color: 'sage', handle: '@arjun' },
    { id: 'zoe', name: 'Zoë', color: 'sand', handle: '@zoe' },
  ];

  const habits: Habit[] = [
    // Your habits
    {
      id: 'read',
      userId: 'you',
      name: 'Read 10 pages',
      identity: 'a lifelong learner',
      target: '10 pages',
      category: 'mind',
      time: 'Morning',
      stackAfter: 'After my morning tea',
      twoMinuteStarter: 'Read 1 page',
      created,
    },
    {
      id: 'move',
      userId: 'you',
      name: 'Gym & Movement',
      identity: 'an athletic, energized person',
      target: '40 minutes',
      category: 'body',
      time: 'Morning',
      stackAfter: 'After putting on workout shoes',
      twoMinuteStarter: 'Do 5 stretch reps',
      created,
    },
    {
      id: 'write',
      userId: 'you',
      name: 'Evening reflection',
      identity: 'a mindful, intentional thinker',
      target: '5 minutes journaling',
      category: 'calm',
      time: 'Evening',
      stackAfter: 'After closing laptop',
      twoMinuteStarter: 'Write 1 win from today',
      created,
    },
    {
      id: 'learn',
      userId: 'you',
      name: 'Deep coding session',
      identity: 'a world-class builder',
      target: '30 minutes focused coding',
      category: 'growth',
      time: 'Afternoon',
      stackAfter: 'After lunch break',
      twoMinuteStarter: 'Open terminal and review commit',
      created,
    },

    // Maya's habits
    {
      id: 'maya-read',
      userId: 'maya',
      name: 'Read 15 pages',
      identity: 'a deep thinker',
      target: '15 pages of philosophy',
      category: 'mind',
      time: 'Morning',
      stackAfter: 'After waking up',
      twoMinuteStarter: 'Open book on bedside table',
      created,
    },
    {
      id: 'maya-walk',
      userId: 'maya',
      name: 'Morning 5K walk',
      identity: 'an active explorer',
      target: '30 minutes outside',
      category: 'body',
      time: 'Morning',
      stackAfter: 'After water glass',
      twoMinuteStarter: 'Step outside front door',
      created,
    },
    {
      id: 'maya-write',
      userId: 'maya',
      name: 'Gratitude journal',
      identity: 'a grateful, present soul',
      target: '3 moments of joy',
      category: 'calm',
      time: 'Evening',
      stackAfter: 'Before turning off lights',
      twoMinuteStarter: 'Write 1 nice thing that happened',
      created,
    },

    // Arjun's habits
    {
      id: 'arjun-code',
      userId: 'arjun',
      name: 'Algorithm challenge',
      identity: 'a sharp problem solver',
      target: '1 hard problem',
      category: 'growth',
      time: 'Afternoon',
      stackAfter: 'After setting phone to DND',
      twoMinuteStarter: 'Solve first test case',
      created,
    },
    {
      id: 'arjun-move',
      userId: 'arjun',
      name: 'Zone 2 Cardio / Run',
      identity: 'an endurance athlete',
      target: '30 minutes running',
      category: 'body',
      time: 'Evening',
      stackAfter: 'After finishing workday',
      twoMinuteStarter: 'Lace up running sneakers',
      created,
    },
    {
      id: 'arjun-read',
      userId: 'arjun',
      name: 'Read non-fiction',
      identity: 'a continuous learner',
      target: '1 chapter',
      category: 'mind',
      time: 'Evening',
      stackAfter: 'After shower',
      twoMinuteStarter: 'Read 2 paragraphs',
      created,
    },

    // Zoe's habits
    {
      id: 'zoe-calm',
      userId: 'zoe',
      name: 'Box breathing meditation',
      identity: 'an unshakable, calm person',
      target: '12 minutes silent breath',
      category: 'calm',
      time: 'Morning',
      stackAfter: 'Before opening phone',
      twoMinuteStarter: 'Sit upright and take 3 breaths',
      created,
    },
    {
      id: 'zoe-design',
      userId: 'zoe',
      name: 'Daily UI exploration',
      identity: 'an inspiring digital creator',
      target: '1 creative concept',
      category: 'growth',
      time: 'Afternoon',
      stackAfter: 'After afternoon tea',
      twoMinuteStarter: 'Sketch 1 wireframe frame',
      created,
    },
  ];

  const checkins: Checkin[] = [];
  // Populate realistic streak histories
  habits.forEach((h, i) => {
    const count = [14, 8, 5, 4, 22, 11, 8, 16, 6, 4, 12, 7][i] || 5;
    for (let n = 1; n <= count; n++) {
      checkins.push({
        habitId: h.id,
        day: shiftDay(today, -n),
        created: shiftDay(today, -n) + 'T09:00:00',
      });
    }
  });

  // Checkins for today (Leave some incomplete for Arjun and Maya so user can NUDGE them!)
  ['read', 'move', 'maya-read', 'maya-walk', 'zoe-calm'].forEach((id) =>
    checkins.push({ habitId: id, day: today, created })
  );

  const notes: Note[] = [
    {
      id: 'n1',
      userId: 'maya',
      recipient: 'arjun',
      kind: 'nudge',
      message: "⚡ Don't forget your Zone 2 run today, Arjun! Let's keep that 6-day streak burning 🔥",
      created: new Date(Date.now() - 35 * 60 * 1000).toISOString(),
    },
    {
      id: 'n2',
      userId: 'zoe',
      recipient: 'you',
      kind: 'cheer',
      message: '🙌 High five on finishing your morning read! That consistency is inspiring.',
      created: new Date(Date.now() - 90 * 60 * 1000).toISOString(),
    },
    {
      id: 'n3',
      userId: 'arjun',
      kind: 'reflect',
      message: '💡 Realized that stacking my coding session right after coffee made starting 10x easier. 2-minute rule really works!',
      created: new Date(Date.now() - 180 * 60 * 1000).toISOString(),
    },
  ];

  return {
    user: members[0],
    team: { id: 'demo', name: 'The Growth Circle', code: 'GROWTH-7X' },
    members,
    habits,
    checkins,
    notes,
  };
}
