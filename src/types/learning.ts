export interface Course {
  id: string;
  title: string;
  description: string;
  moduleIds: string[];
}
export interface Module {
  id: string;
  title: string;
  description: string;
  number: number;
  lessonIds: string[];
}
export interface TheoryBlock {
  title: string;
  body: string;
  code?: string;
}
export interface Lesson {
  id: string;
  title: string;
  description: string;
  moduleId: string;
  duration: number;
  objectives: string[];
  blocks: TheoryBlock[];
  takeaway: string;
  exerciseIds: string[];
  previousId?: string;
  nextId?: string;
}
export interface TestCase {
  input: string;
  output: string;
  hidden?: boolean;
}
export interface Exercise {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Intermediate';
  description: string;
  starterCode: string;
  sampleInput: string;
  sampleOutput: string;
  tests: TestCase[];
  hints: string[];
  concepts: string[];
  lessonId: string;
  projectId?: string;
}
export interface Project {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: string;
  requirements: string[];
  milestones: string[];
  concepts: string[];
  exerciseId: string;
}
export type ExecutionStatus =
  'success' | 'compiler-error' | 'runtime-error' | 'timeout' | 'unavailable' | 'cancelled';
export interface ExecutionResult {
  status: ExecutionStatus;
  stdout: string;
  stderr: string;
  results: { stdout: string; stderr: string; exitCode: number }[];
}
export interface ExerciseResult {
  status: 'accepted' | 'wrong-answer' | ExecutionStatus;
  passed: number;
  total: number;
  output: ExecutionResult;
}
export interface UserProgress {
  version: 1;
  started: boolean;
  completedLessons: Record<string, string>;
  completedExercises: Record<string, string>;
  currentLessonId: string;
  recentLessons: string[];
  drafts: Record<string, string>;
  projectMilestones: Record<string, number[]>;
  completedProjects: Record<string, string>;
  preferences: { editorFontSize: number; wrapCode: boolean };
}
