export type StateValue = number | string | boolean | null;

/**
 * One typed store per figure: controls write keys, views subscribe to keys,
 * and every panel renders as a pure function of the store (the Distill
 * shared-store pattern, declaratively wired by the runtime).
 */
export class FigureState {
  private readonly values = new Map<string, StateValue>();
  private readonly listeners = new Map<string, Set<(value: StateValue) => void>>();

  constructor(initial: Record<string, StateValue> = {}) {
    for (const [key, value] of Object.entries(initial)) this.values.set(key, value);
  }

  get<T extends StateValue>(key: string): T {
    return this.values.get(key) as T;
  }

  set(key: string, value: StateValue): void {
    if (this.values.get(key) === value) return;
    this.values.set(key, value);
    this.listeners.get(key)?.forEach((listener) => listener(value));
  }

  subscribe(key: string, listener: (value: StateValue) => void): () => void {
    const set = this.listeners.get(key) ?? new Set();
    set.add(listener);
    this.listeners.set(key, set);
    return () => set.delete(listener);
  }
}
