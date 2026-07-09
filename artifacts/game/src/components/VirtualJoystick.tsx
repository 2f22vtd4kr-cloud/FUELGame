import React, { useRef, useEffect, useCallback, useState } from 'react';
import { gs } from '../game/state';

interface Props {
  onMove: (dx: number, dy: number) => void;
  onInteract: (pressed: boolean) => void;
  onSprintToggle?: () => void;   // §2.2 double-tap right = sprint toggle
  onEmoteOpen?: () => void;      // §2.2 swipe-up = emote wheel
  visible: boolean;
}

const JOYSTICK_RADIUS = 52;
const KNOB_RADIUS = 26;
const JOYSTICK_RIGHT = 24;   // fixed right offset from viewport edge
const JOYSTICK_BOTTOM = 24;  // fixed bottom offset from viewport edge
/** Seconds the joystick stays fully visible at game start before fading */
const JOYSTICK_HINT_DURATION = 3;
const JOYSTICK_DIM_OPACITY = 0.12;
const JOYSTICK_ACTIVE_OPACITY = 0.88;

export default function VirtualJoystick({ onMove, onInteract, onSprintToggle, onEmoteOpen, visible }: Props) {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const touchIdRef = useRef<number | null>(null);
  const basePositionRef = useRef<{ x: number; y: number } | null>(null);
  const lastInteractTapRef = useRef<number>(0);
  const leftTouchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintOpacity, setHintOpacity] = useState(JOYSTICK_ACTIVE_OPACITY);
  const [interactPressed, setInteractPressed] = useState(false);

  // Start hint-fade timer when visible
  useEffect(() => {
    if (!visible) return;
    setHintOpacity(JOYSTICK_ACTIVE_OPACITY);
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setHintOpacity(JOYSTICK_DIM_OPACITY);
    }, JOYSTICK_HINT_DURATION * 1000);
    return () => {
      if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    };
  }, [visible]);

  /** Show joystick at full opacity; never schedules a fade — call scheduleFade() after touch release. */
  const showJoystick = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    setHintOpacity(JOYSTICK_ACTIVE_OPACITY);
  }, []);

  /** Start fading the joystick dim after a delay. Call on touch end only. */
  const scheduleFade = useCallback(() => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    fadeTimerRef.current = setTimeout(() => {
      setHintOpacity(JOYSTICK_DIM_OPACITY);
    }, 1200);
  }, []);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    // Don't intercept touches when a minigame modal is open — let panel buttons receive them
    if (gs.activeMiniGame) return;
    e.preventDefault();
    if (touchIdRef.current !== null) return;
    const touch = e.changedTouches[0];
    touchIdRef.current = touch.identifier;
    showJoystick(); // full opacity while touching — fade is deferred until touch end

    // Fixed joystick: anchored at bottom-right
    const centerX = window.innerWidth - JOYSTICK_RIGHT - JOYSTICK_RADIUS;
    const centerY = window.innerHeight - JOYSTICK_BOTTOM - JOYSTICK_RADIUS;
    basePositionRef.current = { x: centerX, y: centerY };

    if (knobRef.current) {
      knobRef.current.style.transform = 'translate(-50%, -50%)';
    }
  }, [showJoystick]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    e.preventDefault();
    if (touchIdRef.current === null || !basePositionRef.current) return;

    let touch: Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        touch = e.changedTouches[i];
        break;
      }
    }
    if (!touch) return;

    const dx = touch.clientX - basePositionRef.current.x;
    const dy = touch.clientY - basePositionRef.current.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    const maxLen = JOYSTICK_RADIUS;
    const clampedLen = Math.min(len, maxLen);
    const nx = len > 0 ? dx / len : 0;
    const ny = len > 0 ? dy / len : 0;

    if (knobRef.current) {
      knobRef.current.style.transform = `translate(calc(-50% + ${nx * clampedLen}px), calc(-50% + ${ny * clampedLen}px))`;
    }
    onMove(nx * (clampedLen / maxLen), ny * (clampedLen / maxLen));
  }, [onMove]);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    e.preventDefault();
    let found = false;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === touchIdRef.current) {
        found = true;
        break;
      }
    }
    if (!found) return;
    touchIdRef.current = null;
    basePositionRef.current = null;
    if (knobRef.current) knobRef.current.style.transform = 'translate(-50%, -50%)';
    onMove(0, 0);
    scheduleFade(); // only fade after finger lifts, never mid-drag
  }, [onMove, scheduleFade]);

  useEffect(() => {
    const zone = document.getElementById('joystick-zone');
    if (!zone) return;
    zone.addEventListener('touchstart', handleTouchStart, { passive: false });
    zone.addEventListener('touchmove', handleTouchMove, { passive: false });
    zone.addEventListener('touchend', handleTouchEnd, { passive: false });
    zone.addEventListener('touchcancel', handleTouchEnd, { passive: false });
    return () => {
      zone.removeEventListener('touchstart', handleTouchStart);
      zone.removeEventListener('touchmove', handleTouchMove);
      zone.removeEventListener('touchend', handleTouchEnd);
      zone.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchMove, handleTouchEnd, showJoystick, scheduleFade]);

  if (!visible) return null;

  return (
    <>
      {/* Joystick zone — right portion of screen */}
      <div
        id="joystick-zone"
        style={{
          position: 'fixed',
          right: 0,
          bottom: 0,
          width: '42%',
          height: '46%',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 20,
        }}
      />

      {/* Left zone: swipe-up for emote wheel */}
      <div
        style={{
          position: 'fixed', left: 0, bottom: 0,
          width: '58%', height: '46%',
          touchAction: 'none', userSelect: 'none',
          zIndex: 19,
        }}
        onTouchStart={(e) => {
          if (gs.activeMiniGame) return; // let minigame panels handle touches
          const t = e.changedTouches[0];
          leftTouchStartRef.current = { x: t.clientX, y: t.clientY, time: Date.now() };
        }}
        onTouchEnd={(e) => {
          if (!leftTouchStartRef.current) return;
          const t = e.changedTouches[0];
          const swipeUp = leftTouchStartRef.current.y - t.clientY;
          const swipeHoriz = Math.abs(t.clientX - leftTouchStartRef.current.x);
          const elapsed = Date.now() - leftTouchStartRef.current.time;
          if (swipeUp >= 40 && elapsed < 400 && swipeHoriz < swipeUp) {
            onEmoteOpen?.();
          }
          leftTouchStartRef.current = null;
        }}
      />

      {/* Joystick visual — anchored at bottom-right, fades after hint */}
      <div
        ref={baseRef}
        style={{
          position: 'fixed',
          width: JOYSTICK_RADIUS * 2,
          height: JOYSTICK_RADIUS * 2,
          right: JOYSTICK_RIGHT,
          bottom: JOYSTICK_BOTTOM,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.14)',
          border: '2.5px solid rgba(255,255,255,0.55)',
          boxShadow: '0 2px 12px rgba(0,0,0,0.35)',
          opacity: hintOpacity,
          pointerEvents: 'none',
          zIndex: 21,
          transition: 'opacity 0.8s ease',
          backdropFilter: 'blur(2px)',
        }}
      >
        {/* Cardinal direction marks */}
        {[0, 90, 180, 270].map(deg => (
          <div key={deg} style={{
            position: 'absolute',
            left: '50%', top: '50%',
            width: 4, height: 4,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.6)',
            transform: `translate(-50%, -50%) translate(${Math.round(Math.cos(deg * Math.PI / 180) * (JOYSTICK_RADIUS - 10))}px, ${Math.round(Math.sin(deg * Math.PI / 180) * (JOYSTICK_RADIUS - 10))}px)`,
          }} />
        ))}
        <div
          ref={knobRef}
          style={{
            position: 'absolute',
            left: '50%',
            top: '50%',
            width: KNOB_RADIUS * 2,
            height: KNOB_RADIUS * 2,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.88)',
            border: '2px solid rgba(255,255,255,0.6)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
            transform: 'translate(-50%, -50%)',
            transition: 'transform 0.05s',
          }}
        />
      </div>

      {/* Interact button — touch-native, no keyboard hints */}
      <button
        onTouchStart={(e) => {
          e.preventDefault();
          setInteractPressed(true);
          const now = Date.now();
          // §2.2 Double-tap = sprint toggle
          if (now - lastInteractTapRef.current < 300) {
            onSprintToggle?.();
            lastInteractTapRef.current = 0;
          } else {
            lastInteractTapRef.current = now;
          }
          onInteract(true);
        }}
        onTouchEnd={(e) => { e.preventDefault(); setInteractPressed(false); onInteract(false); }}
        onTouchCancel={(e) => { e.preventDefault(); setInteractPressed(false); onInteract(false); }}
        onMouseDown={() => { setInteractPressed(true); onInteract(true); }}
        onMouseUp={() => { setInteractPressed(false); onInteract(false); }}
        onMouseLeave={() => { setInteractPressed(false); onInteract(false); }}
        style={{
          position: 'fixed',
          right: JOYSTICK_RIGHT + JOYSTICK_RADIUS * 2 + 18,
          bottom: JOYSTICK_BOTTOM + JOYSTICK_RADIUS - 32,
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: interactPressed ? 'rgba(180,125,5,0.97)' : 'rgba(229,165,10,0.92)',
          border: '3px solid rgba(26,26,26,0.85)',
          fontSize: 28,
          fontWeight: 'bold',
          color: '#1A1A1A',
          cursor: 'pointer',
          touchAction: 'none',
          userSelect: 'none',
          zIndex: 21,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: interactPressed ? '1px 1px 0 rgba(0,0,0,0.6)' : '3px 3px 0 rgba(0,0,0,0.6)',
          transform: interactPressed ? 'scale(0.91) translate(1px, 1px)' : 'scale(1)',
          transition: 'transform 0.05s, box-shadow 0.05s, background 0.05s',
        }}
      >
        ⚡
      </button>
    </>
  );
}
