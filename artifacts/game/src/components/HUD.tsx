import type { GameState } from '../game/types';
import { SPRINT_MAX } from '../game/types';
import { NEWS_HEADLINES } from '../data/ticker';
import { CHARACTERS } from '../data/characters';

interface HUDProps {
  state: GameState;
}

export default function HUD({ state }: HUDProps) {
  const localPlayer = state.players.find(p => p.id === state.localPlayerId);
  if (!localPlayer) return null;

  const isSlivshchik = localPlayer.role === 'slivshchik';
  const aliveSlivshchiki = state.players.filter(p => p.isAlive && p.role === 'slivshchik').length;
  const aliveKhozaeva = state.players.filter(p => p.isAlive && p.role === 'khozain').length;
  const staminaPct = (localPlayer.stamina / SPRINT_MAX) * 100;

  return (
    <div style={{
      position: 'absolute', top: 0, left: 0, right: 0,
      pointerEvents: 'none', zIndex: 10,
    }}>
      {/* ── Top bar ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '8px 12px', gap: 8,
      }}>

        {/* Unity meter */}
        <div style={{ flex: 1, maxWidth: 220 }}>
          <div style={{ fontSize: 10, color: '#aaa', marginBottom: 3, textShadow: '0 1px 2px #000' }}>
            🤝 ЕДИНСТВО ДВОРА
          </div>
          <div style={{
            height: 14, background: 'rgba(0,0,0,0.55)', borderRadius: 7,
            border: '1px solid rgba(255,255,255,0.15)', overflow: 'hidden',
          }}>
            <div style={{
              height: '100%',
              width: `${state.unityMeter}%`,
              background: 'linear-gradient(90deg, #4CAF50, #8BC34A)',
              borderRadius: 7, transition: 'width 0.3s',
            }} />
          </div>
          <div style={{ fontSize: 9, color: '#8BC34A', marginTop: 1, textShadow: '0 1px 2px #000' }}>
            {Math.round(state.unityMeter)}% / 100%
          </div>
        </div>

        {/* Center: role badge + phase clock */}
        <div style={{ textAlign: 'center' }}>
          <div style={{
            display: 'inline-block',
            padding: '4px 10px',
            borderRadius: 20,
            background: isSlivshchik ? 'rgba(183,28,28,0.85)' : 'rgba(21,101,192,0.85)',
            border: `1px solid ${isSlivshchik ? '#E53935' : '#1565C0'}`,
            fontSize: 12, fontWeight: 'bold', color: '#fff',
            textShadow: '0 1px 2px rgba(0,0,0,0.8)',
          }}>
            {isSlivshchik ? '🪣 СЛИВЩИК' : '🏠 ХОЗЯИН'}
          </div>
          <div style={{ fontSize: 9, color: '#ccc', marginTop: 2, textShadow: '0 1px 2px #000' }}>
            {Math.floor(state.time / 60).toString().padStart(2,'0')}:{Math.floor(state.time % 60).toString().padStart(2,'0')}
          </div>
        </div>

        {/* Car fuel bars */}
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 9, color: '#aaa', marginBottom: 3, textShadow: '0 1px 2px #000' }}>
            🚗 БАКИ
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {state.cars.map(car => {
              const fuelPct = car.fuel;
              const color = fuelPct > 40 ? '#4CAF50' : fuelPct > 20 ? '#FF9800' : '#F44336';
              return (
                <div key={car.id} style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end' }}>
                  <div style={{ fontSize: 9, color: '#ccc', minWidth: 24 }}>
                    {Math.round(fuelPct)}%
                  </div>
                  <div style={{
                    width: 60, height: 7,
                    background: 'rgba(0,0,0,0.55)', borderRadius: 4,
                    border: '1px solid rgba(255,255,255,0.12)', overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', width: `${fuelPct}%`,
                      background: color, borderRadius: 4, transition: 'width 0.2s',
                    }} />
                  </div>
                  {car.siphonPhase === 2 && (
                    <span style={{ fontSize: 10, animation: 'none', color: '#FF1744' }}>🪣</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Stamina bar (below top bar, only when relevant) ── */}
      {(localPlayer.isSprinting || localPlayer.stamina < SPRINT_MAX - 0.1) && (
        <div style={{ padding: '0 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ fontSize: 10, color: localPlayer.isSprinting ? '#FFD700' : '#aaa' }}>
              {localPlayer.isSprinting ? '🏃 СПРИНТ' : '😮‍💨 УСТАЛОСТЬ'}
            </span>
            <div style={{
              flex: 1, maxWidth: 120, height: 6,
              background: 'rgba(0,0,0,0.5)', borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <div style={{
                height: '100%', width: `${staminaPct}%`,
                background: localPlayer.isSprinting ? '#FFD700' : '#81D4FA',
                borderRadius: 3, transition: 'width 0.1s',
              }} />
            </div>
          </div>
        </div>
      )}

      {/* ── Prompt ── */}
      {state.promptText && (
        <div style={{
          textAlign: 'center', padding: '6px 0',
        }}>
          <div style={{
            display: 'inline-block',
            background: 'rgba(0,0,0,0.75)',
            padding: '6px 16px', borderRadius: 20,
            border: '1px solid rgba(255,255,255,0.2)',
            color: '#fff', fontSize: 13, fontWeight: 500,
            textShadow: '0 1px 3px rgba(0,0,0,0.8)',
          }}>
            {state.promptText}
          </div>
        </div>
      )}

      {/* ── Alive counters (slivshchik sees both, khozain sees team + total) ── */}
      <div style={{ position: 'absolute', top: 70, left: 12 }}>
        <div style={{
          background: 'rgba(0,0,0,0.6)', borderRadius: 8,
          padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)',
          fontSize: 11, color: '#ccc',
        }}>
          🏠 {aliveKhozaeva} {isSlivshchik && <span style={{ color: '#FF5252' }}>🪣 {aliveSlivshchiki}</span>}
          {!isSlivshchik && <span style={{ color: '#aaa' }}> (из {state.players.length})</span>}
        </div>
      </div>

      {/* ── Bodies found indicator ── */}
      {state.bodies.length > 0 && (
        <div style={{ position: 'absolute', top: 70, right: 12 }}>
          <div style={{
            background: 'rgba(183,28,28,0.75)', borderRadius: 8,
            padding: '4px 10px', border: '1px solid rgba(255,255,255,0.1)',
            fontSize: 11, color: '#fff',
          }}>
            💀 {state.bodies.length} тел
          </div>
        </div>
      )}

      {/* ── Player list ── */}
      <div style={{
        position: 'absolute', top: 100, left: 12,
        display: 'flex', flexDirection: 'column', gap: 3,
        maxHeight: 220, overflowY: 'hidden',
      }}>
        {state.players.map(p => {
          const charDef = CHARACTERS[p.character];
          const isLocal = p.id === state.localPlayerId;
          const showAsSlivshchik = isLocal || (isSlivshchik && p.role === 'slivshchik');
          return (
            <div
              key={p.id}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: p.isAlive ? 1 : 0.4,
              }}
            >
              <div style={{
                width: 10, height: 10, borderRadius: '50%',
                background: charDef.color,
                border: isLocal ? '2px solid #FFD700' : '1px solid rgba(255,255,255,0.3)',
                flexShrink: 0,
              }} />
              <div style={{
                fontSize: 9,
                color: p.isAlive ? (isLocal ? '#FFD700' : '#ccc') : '#666',
                textShadow: '0 1px 2px rgba(0,0,0,0.9)',
                textDecoration: p.isAlive ? 'none' : 'line-through',
              }}>
                {p.name}
                {!p.isAlive && ' 💀'}
                {showAsSlivshchik && p.role === 'slivshchik' && (
                  <span style={{ color: '#FF5252', marginLeft: 3 }}>🪣</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── News ticker ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: 'rgba(0,0,0,0.7)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        padding: '4px 12px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div style={{
          flexShrink: 0,
          background: '#D32F2F', color: '#fff',
          fontSize: 8, fontWeight: 'bold', padding: '1px 5px', borderRadius: 2,
        }}>
          АИ-95 ₽{state.ai95Price}/л
        </div>
        <div style={{
          flex: 1, overflow: 'hidden',
          fontSize: 10, color: '#ddd',
          whiteSpace: 'nowrap', textOverflow: 'ellipsis',
        }}>
          {NEWS_HEADLINES[state.tickerIndex]}
        </div>
      </div>

      {/* ── Meeting cooldown indicator ── */}
      {state.meetingCooldown > 0 && (
        <div style={{
          position: 'absolute', bottom: 28, right: 12,
          background: 'rgba(0,0,0,0.6)', borderRadius: 6,
          padding: '2px 8px', fontSize: 9, color: '#aaa',
        }}>
          🔔 сходка через {Math.ceil(state.meetingCooldown)}с
        </div>
      )}
    </div>
  );
}
