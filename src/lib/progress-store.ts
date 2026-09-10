import { exerciseById, lessonById, lessons, projectById } from '../content';
import type { UserProgress } from '../types/learning';
export const STORAGE_KEY = 'learn-cpp.progress';
export const emptyProgress = (): UserProgress => ({
  version: 1,
  started: false,
  completedLessons: {},
  completedExercises: {},
  currentLessonId: lessons[0].id,
  recentLessons: [],
  drafts: {},
  projectMilestones: {},
  completedProjects: {},
  preferences: { editorFontSize: 14, wrapCode: false },
});
const record = (v: unknown): v is Record<string, unknown> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);
const dates = (v: unknown, known: Record<string, unknown>) =>
  record(v)
    ? (Object.fromEntries(
        Object.entries(v).filter(
          ([key, date]) =>
            key in known && typeof date === 'string' && Number.isFinite(Date.parse(date)),
        ),
      ) as Record<string, string>)
    : {};
export function decodeProgress(raw: string | null): UserProgress {
  if (!raw) return emptyProgress();
  const v: unknown = JSON.parse(raw);
  if (!record(v) || v.version !== 1) throw new Error('Unsupported progress');
  const s = emptyProgress();
  s.started = v.started === true;
  s.completedLessons = dates(v.completedLessons, lessonById);
  s.completedExercises = dates(v.completedExercises, exerciseById);
  s.completedProjects = dates(v.completedProjects, projectById);
  if (typeof v.currentLessonId === 'string' && v.currentLessonId in lessonById)
    s.currentLessonId = v.currentLessonId;
  if (Array.isArray(v.recentLessons))
    s.recentLessons = [
      ...new Set(
        v.recentLessons.filter((id): id is string => typeof id === 'string' && id in lessonById),
      ),
    ].slice(0, 6);
  if (record(v.drafts))
    s.drafts = Object.fromEntries(
      Object.entries(v.drafts).filter(
        ([id, code]) => id in exerciseById && typeof code === 'string' && code.length <= 30000,
      ),
    ) as Record<string, string>;
  if (record(v.projectMilestones))
    for (const [id, milestones] of Object.entries(v.projectMilestones)) {
      if (id in projectById && Array.isArray(milestones))
        s.projectMilestones[id] = [
          ...new Set(
            milestones.filter(
              (n): n is number =>
                Number.isInteger(n) && n >= 0 && n < projectById[id].milestones.length,
            ),
          ),
        ];
    }
  if (record(v.preferences)) {
    if ([14, 16, 18].includes(Number(v.preferences.editorFontSize)))
      s.preferences.editorFontSize = Number(v.preferences.editorFontSize);
    s.preferences.wrapCode = v.preferences.wrapCode === true;
  }
  return s;
}
export class ProgressStore {
  private state: UserProgress;
  private listeners = new Set<() => void>();
  private warning = '';
  constructor(private storage?: Pick<Storage, 'getItem' | 'setItem'>) {
    try {
      this.state = decodeProgress(storage?.getItem(STORAGE_KEY) ?? null);
    } catch {
      this.state = emptyProgress();
      this.warning =
        'Saved progress could not be read. You can keep learning; new progress will replace the unreadable data on this device.';
    }
    if (!storage)
      this.warning =
        'Browser storage is unavailable. Your progress will last only for this session.';
  }
  getSnapshot = () => this.state;
  getWarning = () => this.warning;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(next: UserProgress) {
    this.state = next;
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      this.warning =
        'Progress could not be saved. Browser storage may be full or disabled. Keep this tab open to retain this session.';
    }
    this.listeners.forEach((listener) => listener());
  }
  start = () => this.update({ ...this.state, started: true });
  visit = (id: string) => {
    if (
      !(id in lessonById) ||
      (this.state.currentLessonId === id && this.state.recentLessons[0] === id)
    )
      return;
    this.update({
      ...this.state,
      started: true,
      currentLessonId: id,
      recentLessons: [id, ...this.state.recentLessons.filter((item) => item !== id)].slice(0, 6),
    });
  };
  saveDraft = (id: string, code: string) => {
    if (!(id in exerciseById) || code.length > 30000 || this.state.drafts[id] === code) return;
    this.update({ ...this.state, drafts: { ...this.state.drafts, [id]: code } });
  };
  accept = (id: string) => {
    const exercise = exerciseById[id];
    if (!exercise) return;
    const date = new Date().toISOString();
    const next = {
      ...this.state,
      started: true,
      completedExercises: { ...this.state.completedExercises, [id]: date },
    };
    if (exercise.projectId)
      next.completedProjects = { ...next.completedProjects, [exercise.projectId]: date };
    else {
      const lesson = lessonById[exercise.lessonId];
      if (lesson.exerciseIds.every((eid) => eid in next.completedExercises))
        next.completedLessons = { ...next.completedLessons, [lesson.id]: date };
      next.currentLessonId = lessons.find((l) => !(l.id in next.completedLessons))?.id ?? lesson.id;
    }
    this.update(next);
  };
  toggleMilestone = (id: string, index: number) => {
    if (!(id in projectById) || index < 0 || index >= projectById[id].milestones.length) return;
    const current = this.state.projectMilestones[id] ?? [];
    this.update({
      ...this.state,
      projectMilestones: {
        ...this.state.projectMilestones,
        [id]: current.includes(index) ? current.filter((n) => n !== index) : [...current, index],
      },
    });
  };
  setPreferences = (preferences: Partial<UserProgress['preferences']>) =>
    this.update({ ...this.state, preferences: { ...this.state.preferences, ...preferences } });
  reset = () => {
    this.warning = '';
    this.update({ ...emptyProgress(), started: true, preferences: this.state.preferences });
  };
  receive = (raw: string | null) => {
    try {
      this.state = decodeProgress(raw);
      this.listeners.forEach((listener) => listener());
    } catch {
      /* Ignore invalid data from another tab. */
    }
  };
}
let storage: Storage | undefined;
try {
  storage = window.localStorage;
} catch {
  /* Storage may be blocked. */
}
export const progressStore = new ProgressStore(storage);
if (typeof window !== 'undefined')
  window.addEventListener('storage', (e) => {
    if (e.key === STORAGE_KEY) progressStore.receive(e.newValue);
  });
export function nextLesson(p: UserProgress) {
  const current = lessonById[p.currentLessonId];
  if (current && !(current.id in p.completedLessons)) return current;
  return lessons.find((lesson) => !(lesson.id in p.completedLessons)) ?? lessons[0];
}
