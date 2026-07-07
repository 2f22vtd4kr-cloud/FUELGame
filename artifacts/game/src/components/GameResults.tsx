import React, { useRef } from 'react';
import type { GameState } from '../game/types';
import { CHARACTERS } from '../data/characters';
import { resetGameState } from '../game/state';

interface Props {
  gs: GameState;
  onPlayAgain: () => void;
}

export default function GameResults({ gs, onPlayAgain }: Props) {
  const shareCanvasRef = useRef<HTMLCanvasElement>(null);
  const localPlayer = gs.players.find(p => p.id === gs.localPlayerId);
  const myRole = localPlayer?.role ?? 'khozain';
  const iWon = (gs.winner === 'khozaeva' && myRole === 'khozain') ||
               (gs.winner === 'slivshchiki' && myRole === 'slivshchik');

  const slivshchiki = gs.players.filter(p => p.role === 'slivshchik');

  const totalFuelStolen = gs.cars.reduce((acc, c) => acc + (100 - c.fuel), 0);
  const totalTasksDone = gs.tasks.filter(t => t.isComplete).length;
  const aliveTime = Math.floor(gs.time);

  // §9.1 Share card generation
  function generateShareCard() {
    const canvas = document.createElement('canvas');
    canvas.width = 1080; canvas.height = 1080;
    const ctx = canvas.getContext('2d')!;

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, 0, 1080);
    grad.addColorStop(0, iWon ? '#1B5E20' : '#B71C1C');
    grad.addColorStop(1, '#0A0A0A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1080);

    // Title
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 72px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('95-Й БАКСТАБ', 540, 120);

    // Result
    ctx.fillStyle = '#FFF';
    ctx.font = 'bold 96px sans-serif';
    ctx.fillText(iWon ? '🏆 ПОБЕДА!' : '💀 ПОРАЖЕНИЕ', 540, 240);

    // Win reason
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.font = '36px sans-serif';
    ctx.fillText(gs.winReason, 540, 320);

    // Stats
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.roundRect(80, 370, 920, 200, 20);
    ctx.fill();

    const statPairs = [
      ['Время игры', `${Math.floor(aliveTime / 60)}:${(aliveTime % 60).toString().padStart(2, '0')}`],
      ['Единство', `${Math.round(gs.unityMeter)}%`],
      ['Задач', `${totalTasksDone}`],
      ['Слито топлива', `${Math.round(totalFuelStolen)}%`],
    ];
    statPairs.forEach(([label, val], i) => {
      const x = 180 + i * 220;
      ctx.fillStyle = '#FFF';
      ctx.font = 'bold 48px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(val, x, 460);
      ctx.fillStyle = 'rgba(255,255,255,0.5)';
      ctx.font = '28px sans-serif';
      ctx.fillText(label, x, 510);
    });

    // My stats (if local player)
    if (localPlayer) {
      ctx.fillStyle = 'rgba(255,255,255,0.1)';
      ctx.beginPath();
      ctx.roundRect(80, 590, 920, 140, 20);
      ctx.fill();
      ctx.fillStyle = '#FFD700';
      ctx.font = 'bold 32px sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(`${localPlayer.name} — ${localPlayer.role === 'slivshchik' ? '🪣 Сливщик' : '🏠 Хозяин'}`, 120, 660);
      ctx.fillStyle = '#ccc';
      ctx.font = '28px sans-serif';
      ctx.fillText(`Топлива слито: ${Math.round(localPlayer.fuelSiphoned)}% | Задач: ${localPlayer.tasksCompleted}`, 120, 710);
    }

    // CTA
    ctx.fillStyle = '#FFD700';
    ctx.font = 'bold 48px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('→ @fuel_fuel_fuel_bot', 540, 880);
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = '32px sans-serif';
    ctx.fillText('Играй в 95-Й Бакстаб | АИ-95 уже 87₽', 540, 940);

    // Download
    const link = document.createElement('a');
    link.download = '95-backstab-result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 60,
      background: iWon
        ? 'linear-gradient(180deg, #1B5E20 0%, #0A0A0A 100%)'
        : 'linear-gradient(180deg, #B71C1C 0%, #0A0A0A 100%)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      overflowY: 'auto', fontFamily: 'sans-serif', padding: '24px 16px',
    }}>
      {/* Result headline */}
      <div style={{ fontSize: 60, marginBottom: 8 }}>
        {iWon ? '🏆' : '💀'}
      </div>
      <div style={{
        fontSize: 26, fontWeight: 'bold', color: '#FFF',
        letterSpacing: 2, textAlign: 'center', marginBottom: 4,
      }}>
        {iWon ? 'ПОБЕДА!' : 'ПОРАЖЕНИЕ'}
      </div>
      <div style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', textAlign: 'center', marginBottom: 4 }}>
        {gs.winner === 'khozaeva' ? '🏠 Хозяева победили' : '🪣 Сливщики победили'}
      </div>
      <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', textAlign: 'center', marginBottom: 20, fontStyle: 'italic' }}>
        {gs.winReason}
      </div>

      {/* Match stats */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'rgba(255,255,255,0.08)', borderRadius: 14,
        padding: '14px 16px', marginBottom: 16,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
      }}>
        <Stat label="Время игры" value={`${Math.floor(aliveTime / 60)}:${(aliveTime % 60).toString().padStart(2, '0')}`} />
        <Stat label="Единство" value={`${Math.round(gs.unityMeter)}%`} />
        <Stat label="Задач выполнено" value={`${totalTasksDone}`} />
        <Stat label="Топлива слито" value={`${Math.round(totalFuelStolen)}%`} />
      </div>

      {/* §9.1 Per-player breakdown */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'rgba(255,255,255,0.05)', borderRadius: 14,
        padding: '12px 14px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', marginBottom: 10, textAlign: 'center', letterSpacing: 1 }}>
          СТАТИСТИКА ИГРОКОВ
        </div>
        {gs.players.map(p => {
          const charDef = CHARACTERS[p.character];
          const isSlivy = p.role === 'slivshchik';
          const isMe = p.id === gs.localPlayerId;
          return (
            <div key={p.id} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '5px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
              opacity: p.isAlive ? 1 : 0.6,
            }}>
              <div style={{
                width: 24, height: 24, borderRadius: '50%',
                background: charDef.color,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 12, flexShrink: 0,
                border: isMe ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.2)',
              }}>
                {charDef.emoji}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{
                  fontSize: 11, fontWeight: isMe ? 'bold' : 'normal',
                  color: isMe ? '#FFD700' : '#ddd',
                }}>
                  {p.name} {isSlivy ? '🪣' : '🏠'}{p.neutralRole === 'barsik' ? '😺' : p.neutralRole === 'policeman' ? '🕵️' : p.neutralRole === 'janitor' ? '🧹' : ''}
                  {!p.isAlive && ' 💀'}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: 9, color: '#999', lineHeight: 1.5 }}>
                {isSlivy
                  ? <span style={{ color: '#EF9A9A' }}>⛽{Math.round(p.fuelSiphoned)}%</span>
                  : <span style={{ color: '#A5D6A7' }}>✅{p.tasksCompleted}</span>
                }
              </div>
            </div>
          );
        })}
      </div>

      {/* Role reveal */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: 'rgba(255,255,255,0.05)', borderRadius: 14,
        padding: '14px 16px', marginBottom: 16,
      }}>
        <div style={{ fontSize: 11, color: '#9E9E9E', marginBottom: 10, textAlign: 'center' }}>
          СЛИВЩИКИ БЫЛИ:
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, justifyContent: 'center' }}>
          {slivshchiki.map(p => (
            <div key={p.id} style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            }}>
              <div style={{ fontSize: 28 }}>{CHARACTERS[p.character].emoji}</div>
              <div style={{ fontSize: 10, color: '#EF5350', fontWeight: 'bold' }}>
                {p.name}
              </div>
              <div style={{ fontSize: 9, color: '#9E9E9E' }}>
                {p.isAlive ? '(выжил)' : '(выброшен)'}
              </div>
              <div style={{ fontSize: 9, color: '#FF8A80' }}>
                слито: {Math.round(p.fuelSiphoned)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CTA (fuel bot integration per design doc) */}
      <div style={{
        width: '100%', maxWidth: 340,
        background: iWon
          ? 'rgba(76,175,80,0.15)'
          : 'rgba(244,67,54,0.15)',
        border: `1.5px solid ${iWon ? 'rgba(76,175,80,0.4)' : 'rgba(244,67,54,0.4)'}`,
        borderRadius: 14, padding: '14px 16px', marginBottom: 16, textAlign: 'center',
      }}>
        <div style={{ fontSize: 12, color: '#FFF', lineHeight: 1.5, marginBottom: 6 }}>
          {iWon
            ? '🛡️ Вы защитили двор! А в реальности?\nАИ-95 уже 87₽. Зафиксируй цену на 3 месяца:'
            : '⛽ Ваш бак пуст. Не будь жертвой сифонеров — купи талоны по старой цене:'}
        </div>
        <div style={{
          fontSize: 15, fontWeight: 'bold', color: '#FFD700',
          fontFamily: 'monospace', letterSpacing: 1,
        }}>
          → @fuel_fuel_fuel_bot
        </div>
      </div>

      {/* §9.1 Share card button */}
      <button
        onClick={generateShareCard}
        style={{
          width: '100%', maxWidth: 340, marginBottom: 12,
          padding: '12px',
          background: 'rgba(255,215,0,0.15)',
          border: '1.5px solid rgba(255,215,0,0.5)',
          borderRadius: 14, fontSize: 13, fontWeight: 'bold',
          color: '#FFD700', cursor: 'pointer',
        }}
      >
        📸 Скачать карточку результата (PNG)
      </button>

      {/* Play again */}
      <button
        onClick={onPlayAgain}
        style={{
          width: '100%', maxWidth: 340,
          padding: '16px',
          background: 'linear-gradient(135deg, #FF5722, #FF8A65)',
          border: 'none', borderRadius: 14,
          fontSize: 16, fontWeight: 'bold', color: '#FFF',
          cursor: 'pointer', letterSpacing: 1,
          boxShadow: '0 4px 20px rgba(255,87,34,0.4)',
        }}
      >
        🎮 СЫГРАТЬ ЕЩЁ
      </button>

      {/* Hidden share canvas */}
      <canvas ref={shareCanvasRef} style={{ display: 'none' }} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 18, fontWeight: 'bold', color: '#FFF' }}>{value}</div>
      <div style={{ fontSize: 9, color: '#9E9E9E', marginTop: 2 }}>{label}</div>
    </div>
  );
}
