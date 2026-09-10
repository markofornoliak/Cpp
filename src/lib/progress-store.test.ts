import { describe, expect, it } from 'vitest';
import {
  decodeProgress,
  emptyProgress,
  nextLesson,
  ProgressStore,
  STORAGE_KEY,
} from './progress-store';
function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (key: string) => data.get(key) ?? null,
    setItem: (key: string, value: string) => {
      data.set(key, value);
    },
  };
}
describe('local learning progress', () => {
  it('persists a solution, marks the related lesson complete, and resumes the next lesson', () => {
    const storage = memoryStorage(),
      store = new ProgressStore(storage);
    store.start();
    store.visit('first-program');
    store.saveDraft('practice-first-program', 'int main() {}');
    store.accept('practice-first-program');
    const reopened = new ProgressStore(storage).getSnapshot();
    expect(reopened.started).toBe(true);
    expect(reopened.completedLessons['first-program']).toBeTruthy();
    expect(reopened.drafts['practice-first-program']).toBe('int main() {}');
    expect(nextLesson(reopened).id).toBe('variables');
  });
  it('does not complete projects just because every milestone is checked', () => {
    const store = new ProgressStore(memoryStorage());
    [0, 1, 2].forEach((index) => store.toggleMilestone('calculator', index));
    expect(store.getSnapshot().completedProjects).toEqual({});
    store.accept('project-calculator');
    expect(store.getSnapshot().completedProjects.calculator).toBeTruthy();
    expect(store.getSnapshot().completedLessons).toEqual({});
  });
  it('recovers from malformed and unsupported data without crashing', () => {
    for (const raw of ['{', 'null', '{"version":0}', '{"version":999}']) {
      const storage = memoryStorage();
      storage.setItem(STORAGE_KEY, raw);
      const store = new ProgressStore(storage);
      expect(store.getSnapshot()).toEqual(emptyProgress());
      expect(store.getWarning()).toContain('could not be read');
    }
  });
  it('rejects unknown ids, invalid dates, prototype keys, oversized drafts, and invalid milestones', () => {
    const decoded = decodeProgress(
      JSON.stringify({
        version: 1,
        completedLessons: { bogus: '2025-01-01', variables: 'invalid', constructor: '2025-01-01' },
        recentLessons: ['bogus', 'variables', 'variables'],
        drafts: { 'practice-variables': 'x'.repeat(30001) },
        projectMilestones: { calculator: [-1, 0, 0, 100] },
      }),
    );
    expect(decoded.completedLessons).toEqual({});
    expect(decoded.recentLessons).toEqual(['variables']);
    expect(decoded.drafts).toEqual({});
    expect(decoded.projectMilestones.calculator).toEqual([0]);
  });
  it('keeps the session usable when browser storage is blocked', () => {
    const store = new ProgressStore({
      getItem: () => null,
      setItem: () => {
        throw new Error('Quota exceeded');
      },
    });
    store.accept('practice-variables');
    expect(store.getSnapshot().completedLessons.variables).toBeTruthy();
    expect(store.getWarning()).toContain('could not be saved');
  });
  it('reset removes learning and drafts while retaining editor preferences', () => {
    const store = new ProgressStore(memoryStorage());
    store.setPreferences({ editorFontSize: 18, wrapCode: true });
    store.accept('practice-variables');
    store.saveDraft('practice-variables', 'code');
    store.reset();
    expect(store.getSnapshot()).toEqual({
      ...emptyProgress(),
      started: true,
      preferences: { editorFontSize: 18, wrapCode: true },
    });
  });
  it('retains the current incomplete lesson when browsing out of order', () => {
    const store = new ProgressStore(memoryStorage());
    store.visit('smart-pointers');
    expect(nextLesson(store.getSnapshot()).id).toBe('smart-pointers');
  });
});
