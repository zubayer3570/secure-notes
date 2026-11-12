import { createContext, useContext, type FormEvent } from 'react';
import type { User } from './types';

export type Run = (fn: () => unknown) => Promise<void>;

export const RunContext = createContext<Run>(async (fn) => void (await fn()));
export const MeContext = createContext<User | null>(null);

export const useRun = () => useContext(RunContext);

export function useMe() {
  const me = useContext(MeContext);
  if (!me) throw new Error('Not signed in');
  return me;
}

export function useSubmit() {
  const run = useRun();
  return (fn: (form: HTMLFormElement) => unknown) => (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = event.currentTarget;
    return run(() => fn(form));
  };
}
