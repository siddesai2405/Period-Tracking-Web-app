"use client";

export interface AIStreamHandlers {
  onToken: (token: string) => void;
  onDone: (full: string) => void;
  onError: (err: Error) => void;
  signal?: AbortSignal;
}

export async function streamFromAI(
  url: string,
  body: object,
  handlers: AIStreamHandlers,
) {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: handlers.signal,
    });

    if (!res.ok || !res.body) {
      handlers.onError(new Error(`HTTP ${res.status}`));
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let full = "";
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      handlers.onToken(chunk);
    }
    handlers.onDone(full);
  } catch (err) {
    if ((err as Error).name !== "AbortError") {
      handlers.onError(err as Error);
    }
  }
}
