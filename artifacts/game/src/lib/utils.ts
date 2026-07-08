import { twMerge } from 'tailwind-merge';

import { clsx, type ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Best-effort touch/mobile device detection. This is a mobile-first game — any
 * keyboard-only hint (WASD, "[E]", "Press Space") must be gated behind this
 * returning false. Coarse pointer + touch points covers phones/tablets;
 * absence of hover covers most touch-primary browsers too.
 */
export function isTouchDevice(): boolean {
  if (typeof window === 'undefined') return false;
  const hasTouchPoints = navigator.maxTouchPoints > 0 || 'ontouchstart' in window;
  const coarsePointer = window.matchMedia?.('(pointer: coarse)').matches ?? false;
  return hasTouchPoints || coarsePointer;
}
