import { useSyncExternalStore } from 'react';
import { progressStore } from '../lib/progress-store';
export const useProgress = () =>
  useSyncExternalStore(progressStore.subscribe, progressStore.getSnapshot);
