import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs) { return twMerge(clsx(inputs)); }

export function speak(text, opts = {}) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text.replace(/[*_#`]/g, ""));
  u.rate = opts.rate ?? 1;
  u.pitch = opts.pitch ?? 1;
  u.lang = opts.lang ?? "en-IN";
  window.speechSynthesis.speak(u);
}

export function stopSpeak() {
  if ("speechSynthesis" in window) window.speechSynthesis.cancel();
}

export function downloadText(text, filename = "note.txt") {
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}
