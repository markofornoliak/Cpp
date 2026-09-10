import data from './curriculum.json';
import exerciseData from './exercises.json';
import projectData from './projects.json';
import type { Course, Module, Lesson, Exercise, Project } from '../types/learning';

export const course: Course = data.course;
export const modules: Module[] = data.modules;
export const lessons: Lesson[] = data.lessons;
export const exercises = exerciseData as Exercise[];
export const projects: Project[] = projectData;
function byId<T extends { id: string }>(items: T[]): Record<string, T> {
  const index = Object.fromEntries(items.map((item) => [item.id, item]));
  Object.setPrototypeOf(index, null);
  return index;
}
export const lessonById = byId(lessons);
export const exerciseById = byId(exercises);
export const moduleById = byId(modules);
export const projectById = byId(projects);
