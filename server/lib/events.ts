type Listener = (event: string, data: unknown) => void;

/** Minimal per-session pub/sub backing the teacher's live attendance feed. */
export class EventHub {
  #listeners = new Map<string, Set<Listener>>();

  subscribe(sessionId: string, listener: Listener): () => void {
    let set = this.#listeners.get(sessionId);
    if (!set) {
      set = new Set();
      this.#listeners.set(sessionId, set);
    }
    set.add(listener);
    return () => {
      set.delete(listener);
      if (set.size === 0) this.#listeners.delete(sessionId);
    };
  }

  publish(sessionId: string, event: string, data: unknown): void {
    for (const listener of this.#listeners.get(sessionId) ?? []) {
      try {
        listener(event, data);
      } catch {
        // A dead connection must not stop the others from being notified.
      }
    }
  }
}

export const events = new EventHub();
