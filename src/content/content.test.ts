import { describe, expect, it } from 'vitest';
import {
  lessons,
  modules,
  exercises,
  projects,
  lessonById,
  exerciseById,
  moduleById,
} from './index';
describe('curriculum integrity', () => {
  it('has unique, complete, navigable lessons with real exercises', () => {
    expect(new Set(lessons.map((l) => l.id)).size).toBe(lessons.length);
    lessons.forEach((lesson, i) => {
      expect(moduleById[lesson.moduleId].lessonIds).toContain(lesson.id);
      expect(lesson.previousId).toBe(lessons[i - 1]?.id);
      expect(lesson.nextId).toBe(lessons[i + 1]?.id);
      expect(lesson.blocks.map((b) => b.body).join(' ').length).toBeGreaterThan(500);
      expect(lesson.blocks.some((b) => b.code?.includes('int main'))).toBe(true);
      expect(lesson.exerciseIds.length).toBeGreaterThan(0);
      lesson.exerciseIds.forEach((id) => expect(exerciseById[id].lessonId).toBe(lesson.id));
    });
    expect(modules.flatMap((m) => m.lessonIds)).toEqual(lessons.map((l) => l.id));
  });
  it('has executable tasks, samples, edge cases, and project acceptance tests', () => {
    expect(new Set(exercises.map((e) => e.id)).size).toBe(exercises.length);
    exercises.forEach((e) => {
      expect(lessonById[e.lessonId]).toBeDefined();
      expect(e.starterCode).toContain('int main');
      expect(e.tests[0]).toMatchObject({
        input: e.sampleInput,
        output: e.sampleOutput,
        hidden: false,
      });
      expect(e.tests.length).toBeGreaterThanOrEqual(e.id === 'practice-first-program' ? 1 : 3);
      expect(e.hints.length).toBeGreaterThan(0);
    });
    projects.forEach((p) => {
      expect(exerciseById[p.exerciseId].projectId).toBe(p.id);
      expect(p.milestones.length).toBeGreaterThan(1);
    });
  });
  it('does not interpret built-in object names as routes', () => {
    expect(lessonById.constructor).toBeUndefined();
    expect(exerciseById.toString).toBeUndefined();
  });
});
