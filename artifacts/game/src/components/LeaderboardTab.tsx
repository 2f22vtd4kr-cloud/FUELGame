// §9.3 Leaderboard Tab
import React, { useEffect, useState } from 'react';
import { CHARACTERS } from '../data/characters';

interface LeaderboardEntry {
  id: number;
  playerName: string;
  character: string | null;
  babki: number;
  wins: number;
  matches: number;
  deviceId: string | null;
}

interface Props {
  myDeviceId: string;
}

export default function LeaderboardTab({ myDeviceId }: Props) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    fetch('/api/leaderboard')
      .then(r => r.json())
      .then(data => {
        setEntries(data.entries ?? []);
        setLoading(false);
      })
      .catch(() => {
        setError('Нет соединения с сервером');
        setLoading(false);
      });
  }, []);

  const myRank = entries.findIndex(e => e.deviceId === myDeviceId);

  return (
    <div style={{ width: '100%', maxWidth: 380 }}>
      <div style={{
        fontSize: 11, color: '#9E9E9E', letterSpacing: 1,
        marginBottom: 12, textAlign: 'center',
      }}>
        🏆 ТОП ЖИЛЬЦОВ ЖК
      </div>

      {loading && (
        <div style={{ textAlign: 'center', color: '#607D8B', fontSize: 13, padding: 24 }}>
          Загрузка...
        </div>
      )}
      {error && (
        <div style={{ textAlign: 'center', color: '#EF5350', fontSize: 12, padding: 16 }}>
          {error}
        </div>
      )}

      {!loading && !error && entries.length === 0 && (
        <div style={{ textAlign: 'center', color: '#607D8B', fontSize: 12, padding: 24, lineHeight: 1.6 }}>
          Рейтинг пуст.<br/>Сыграй матч, чтобы попасть в список!
        </div>
      )}

      {entries.map((entry, i) => {
        const isMe = entry.deviceId === myDeviceId;
        const charKey = entry.character as keyof typeof CHARACTERS;
        const charEmoji = CHARACTERS[charKey]?.emoji ?? '👤';
        const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;

        return (
          <div key={entry.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '8px 10px', marginBottom: 4,
            background: isMe
              ? 'rgba(255,215,0,0.12)'
              : i < 3
                ? 'rgba(255,255,255,0.06)'
                : 'rgba(255,255,255,0.03)',
            border: isMe
              ? '1px solid rgba(255,215,0,0.35)'
              : '1px solid rgba(255,255,255,0.06)',
            borderRadius: 10,
          }}>
            <div style={{
              fontSize: i < 3 ? 18 : 13,
              width: 28, textAlign: 'center', flexShrink: 0,
              color: i < 3 ? '#FFF' : '#616161',
              fontWeight: 'bold',
            }}>
              {medal}
            </div>
            <div style={{ fontSize: 22, flexShrink: 0 }}>{charEmoji}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: 12, color: isMe ? '#FFD700' : '#FFF',
                fontWeight: isMe ? 'bold' : 'normal',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {entry.playerName}{isMe ? ' (ты)' : ''}
              </div>
              <div style={{ fontSize: 9, color: '#757575', marginTop: 2 }}>
                {entry.matches} матч{entry.matches === 1 ? '' : entry.matches < 5 ? 'а' : 'ей'} •{' '}
                {entry.wins} побед{entry.wins === 1 ? 'а' : entry.wins < 5 ? 'ы' : ''}
              </div>
            </div>
            <div style={{
              fontSize: 13, fontWeight: 'bold',
              color: i === 0 ? '#FFD700' : i === 1 ? '#E0E0E0' : i === 2 ? '#CD7F32' : '#FFF',
              flexShrink: 0,
            }}>
              💰{entry.babki}
            </div>
          </div>
        );
      })}

      {myRank === -1 && entries.length > 0 && (
        <div style={{
          marginTop: 10, padding: '8px 10px',
          background: 'rgba(255,87,34,0.08)',
          border: '1px solid rgba(255,87,34,0.2)',
          borderRadius: 10, fontSize: 11, color: '#FF8A65', textAlign: 'center',
        }}>
          Сыграй матч, чтобы попасть в рейтинг!
        </div>
      )}
    </div>
  );
}
