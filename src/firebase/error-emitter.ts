'use client';

type ErrorListener = (error: any) => void;

class FirebaseErrorEmitter {
  private listeners: { [channel: string]: ErrorListener[] } = {};

  emit(channel: string, error: any) {
    if (this.listeners[channel]) {
      this.listeners[channel].forEach((listener) => listener(error));
    }
  }

  on(channel: string, listener: ErrorListener) {
    if (!this.listeners[channel]) {
      this.listeners[channel] = [];
    }
    this.listeners[channel].push(listener);
    return () => {
      this.listeners[channel] = this.listeners[channel].filter((l) => l !== listener);
    };
  }
}

export const errorEmitter = new FirebaseErrorEmitter();