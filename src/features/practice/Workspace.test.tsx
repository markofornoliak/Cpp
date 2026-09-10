import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import Workspace from './Workspace';
import { executionService } from '../../services/execution';
import { progressStore } from '../../lib/progress-store';
vi.mock('./CodeEditor', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string) => void }) => (
    <textarea
      aria-label="C++ source code"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));
beforeEach(() => {
  progressStore.reset();
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});
it('saves an edited solution, submits all tests, records completion, and offers the next lesson', async () => {
  const run = vi.spyOn(executionService, 'execute').mockResolvedValue({
    status: 'success',
    stdout: 'Hello, C++!',
    stderr: '',
    results: [{ stdout: 'Hello, C++!', stderr: '', exitCode: 0 }],
  });
  render(
    <MemoryRouter initialEntries={['/practice/practice-first-program']}>
      <Routes>
        <Route path="/practice/:exerciseId" element={<Workspace />} />
      </Routes>
    </MemoryRouter>,
  );
  const user = userEvent.setup(),
    editor = screen.getByRole('textbox', { name: 'C++ source code' });
  await user.clear(editor);
  await user.type(editor, 'solution');
  expect(progressStore.getSnapshot().drafts['practice-first-program']).toBe('solution');
  await user.click(screen.getByRole('button', { name: 'Submit solution' }));
  expect(await screen.findByRole('heading', { name: 'Accepted' })).toBeVisible();
  expect(screen.getByRole('link', { name: 'Next lesson' })).toHaveAttribute(
    'href',
    '/lesson/variables',
  );
  expect(progressStore.getSnapshot().completedLessons['first-program']).toBeTruthy();
  expect(run.mock.calls[0][1]).toEqual(['']);
});
it('does not mark completion when Run succeeds, and reports a compiler error from Submit', async () => {
  vi.spyOn(executionService, 'execute')
    .mockResolvedValueOnce({
      status: 'success',
      stdout: 'Hello, C++!',
      stderr: '',
      results: [{ stdout: 'Hello, C++!', stderr: '', exitCode: 0 }],
    })
    .mockResolvedValueOnce({
      status: 'compiler-error',
      stdout: '',
      stderr: "main.cpp:3:1: error: expected ';'",
      results: [],
    });
  render(
    <MemoryRouter initialEntries={['/practice/practice-first-program']}>
      <Routes>
        <Route path="/practice/:exerciseId" element={<Workspace />} />
      </Routes>
    </MemoryRouter>,
  );
  const user = userEvent.setup();
  await user.click(screen.getByRole('button', { name: /^Run$/ }));
  expect(await screen.findByRole('heading', { name: 'Program finished' })).toBeVisible();
  expect(progressStore.getSnapshot().completedLessons).toEqual({});
  await user.click(screen.getByRole('button', { name: 'Submit solution' }));
  expect(await screen.findByText("Line 3: expected ';'")).toBeVisible();
  expect(progressStore.getSnapshot().completedLessons).toEqual({});
});
