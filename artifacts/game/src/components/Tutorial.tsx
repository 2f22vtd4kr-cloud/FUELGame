// ─── §12.4 First-Time Interactive Tutorial ────────────────────────────────────
// 4-step onboarding shown once to new players before their first game.

import React, { useState } from 'react';
import { saveProfile, loadProfile } from '../game/profile';
import { isTouchDevice } from '../lib/utils';

interface Props {
  onComplete: () => void;
}

interface Step {
  emoji: string;
  title: string;
  body: React.ReactNode;
  hint?: string;
}

const STEPS: Step[] = [
  {
    emoji: '🏠',
    title: 'Добро пожаловать в ЖК «Цветочные Поляны»',
    body: (
      <>
        <p>Лето 2026. АИ-95 стоит <strong style={{ color: '#FFD700' }}>87₽/л</strong> и продолжает расти.</p>
        <p>Кто-то из соседей <strong style={{ color: '#EF5350' }}>сливает бензин</strong> из машин по ночам. Кто это?</p>
        <p>Твоя задача — вычислить сливщика или остаться незамеченным.</p>
      </>
    ),
    hint: '5–10 минут на матч. Успеешь между делами.',
  },
  {
    emoji: '🏠 vs 🪣',
    title: 'Две роли — одна цель',
    body: (
      <>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, margin: '8px 0' }}>
          <div style={{
            background: 'rgba(0,230,118,0.1)', border: '1px solid rgba(0,230,118,0.3)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🏠</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#69F0AE', marginBottom: 4 }}>Хозяин</div>
            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
              Выполняй задачи. Заполни метр единства до 100%. Вычисли и выгони Сливщика.
            </div>
          </div>
          <div style={{
            background: 'rgba(255,23,68,0.1)', border: '1px solid rgba(255,23,68,0.3)',
            borderRadius: 10, padding: '10px 12px',
          }}>
            <div style={{ fontSize: 22, marginBottom: 4 }}>🪣</div>
            <div style={{ fontSize: 13, fontWeight: 'bold', color: '#FF5252', marginBottom: 4 }}>Сливщик</div>
            <div style={{ fontSize: 11, color: '#aaa', lineHeight: 1.6 }}>
              Сливай бензин из всех машин. Устраняй свидетелей. Не попадись на сходке.
            </div>
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: '8px 0 0' }}>
          Роль назначается случайно. Ты узнаешь свою роль в начале матча.
        </p>
      </>
    ),
  },
  {
    emoji: '🕹️',
    title: 'Управление',
    body: (
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        {(isTouchDevice() ? [
          ['🕹️', 'Джойстик', 'Движение'],
          ['⚡', 'Двойной тап ⚡', 'Спринт'],
          ['🦆', 'Удержать ⚡', 'Присесть (стелс)'],
          ['🔔', 'Тап ⚡', 'Взаимодействие'],
          ['📢', 'Тап ⚡ у арки', 'Созвать сходку'],
          ['😂', 'Свайп вверх ↑', 'Колесо эмоций'],
        ] : [
          ['🕹️', 'WASD / стрелки', 'Движение'],
          ['⚡', 'Shift', 'Спринт (переключатель)'],
          ['🦆', 'Ctrl / Z', 'Пригнуться (стелс)'],
          ['🔔', 'E', 'Взаимодействие / слив'],
          ['📢', 'Пробел', 'Созвать сходку (у арки)'],
          ['😂', 'Q', 'Колесо эмоций'],
        ]).map(([icon, key, desc]) => (
          <div key={key} style={{
            background: 'rgba(255,255,255,0.05)',
            borderRadius: 8, padding: '8px 10px',
            display: 'flex', alignItems: 'flex-start', gap: 8,
          }}>
            <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
            <div>
              <div style={{ fontSize: 11, fontWeight: 'bold', color: '#FFD700' }}>{key}</div>
              <div style={{ fontSize: 10, color: '#aaa' }}>{desc}</div>
            </div>
          </div>
        ))}
      </div>
    ),
    hint: 'На мобильном — виртуальный джойстик (левая рука) и тап (правая рука).',
  },
  {
    emoji: '⚖️',
    title: 'Сходка — сердце игры',
    body: (
      <>
        <p>Когда находят тело или пустой бак — <strong style={{ color: '#FF8A65' }}>созывают сходку</strong>.</p>
        <p>Все собираются у арки. 60 секунд обсуждения, потом — голосование.</p>
        <div style={{
          background: 'rgba(255,87,34,0.1)', border: '1px solid rgba(255,87,34,0.3)',
          borderRadius: 10, padding: '10px 12px', margin: '10px 0',
        }}>
          <div style={{ fontSize: 12, color: '#FF8A65', fontWeight: 'bold', marginBottom: 4 }}>💡 Совет</div>
          <div style={{ fontSize: 11, color: '#ccc', lineHeight: 1.6 }}>
            Следи, кто был рядом с пустыми машинами. Кто слишком тихо ведёт себя? Кто обвиняет раньше, чем ему задали вопрос?
          </div>
        </div>
        <p style={{ fontSize: 12, color: '#888', margin: 0 }}>
          Большинство голосов — и подозреваемый летит в мусоропровод. Правильно ли?
        </p>
      </>
    ),
    hint: 'Получи +100 бабок за первый матч!',
  },
];

export default function Tutorial({ onComplete }: Props) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  function finish() {
    const profile = loadProfile();
    profile.seenTutorial = true;
    saveProfile(profile);
    onComplete();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 100,
      background: 'rgba(0,0,0,0.96)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: 'sans-serif', padding: '24px 20px',
    }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            width: i === step ? 24 : 8, height: 8, borderRadius: 4,
            background: i === step ? '#FF5722' : i < step ? '#4CAF50' : 'rgba(255,255,255,0.15)',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>

      {/* Card */}
      <div style={{
        width: '100%', maxWidth: 360,
        background: 'linear-gradient(180deg, #0D1B2A 0%, #1B2838 100%)',
        border: '1.5px solid rgba(255,87,34,0.35)',
        borderRadius: 20, padding: '24px 22px',
        boxShadow: '0 0 80px rgba(255,87,34,0.15)',
      }}>
        <div style={{ fontSize: 40, textAlign: 'center', marginBottom: 12 }}>{current.emoji}</div>
        <div style={{
          fontSize: 18, fontWeight: 900, color: '#FFF',
          textAlign: 'center', marginBottom: 14, letterSpacing: 0.5,
        }}>
          {current.title}
        </div>
        <div style={{ fontSize: 13, color: '#ccc', lineHeight: 1.7, marginBottom: 14 }}>
          {current.body}
        </div>
        {current.hint && (
          <div style={{
            fontSize: 11, color: '#888', fontStyle: 'italic',
            textAlign: 'center', padding: '6px 0',
            borderTop: '1px solid rgba(255,255,255,0.06)',
          }}>
            {current.hint}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: 12, marginTop: 20, width: '100%', maxWidth: 360 }}>
        {step > 0 && (
          <button
            onClick={() => setStep(s => s - 1)}
            style={{
              flex: 1, padding: '12px',
              background: 'rgba(255,255,255,0.07)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: 10, fontSize: 13, color: '#aaa', cursor: 'pointer',
            }}
          >
            ← Назад
          </button>
        )}
        <button
          onClick={isLast ? finish : () => setStep(s => s + 1)}
          style={{
            flex: 2, padding: '14px',
            background: isLast
              ? 'linear-gradient(135deg, #4CAF50, #81C784)'
              : 'linear-gradient(135deg, #FF5722, #FF8A65)',
            border: 'none', borderRadius: 10,
            fontSize: 15, fontWeight: 900, color: '#FFF',
            cursor: 'pointer', letterSpacing: 1,
            boxShadow: isLast
              ? '0 4px 20px rgba(76,175,80,0.4)'
              : '0 4px 20px rgba(255,87,34,0.4)',
          }}
        >
          {isLast ? '🎮 Играть!' : 'Дальше →'}
        </button>
      </div>

      {/* Skip */}
      <button
        onClick={finish}
        style={{
          marginTop: 14, background: 'none', border: 'none',
          color: '#424242', fontSize: 11, cursor: 'pointer', letterSpacing: 1,
        }}
      >
        Пропустить обучение
      </button>
    </div>
  );
}
