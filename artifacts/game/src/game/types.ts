// ─── Core Types ───────────────────────────────────────────────────────────────

export type Phase = 'lobby' | 'play' | 'meeting' | 'results';
export type Role = 'khozain' | 'slivshchik';
export type BotBehavior = 'idle' | 'moving' | 'interacting' | 'fleeing' | 'at_meeting' | 'fake_task';

export interface Vec2 { x: number; y: number; }

// ─── Map ──────────────────────────────────────────────────────────────────────

export const MAP_W = 1200;
export const MAP_H = 900;

// ─── Characters ───────────────────────────────────────────────────────────────

export type CharacterKey =
  | 'denis' | 'anya' | 'vova' | 'uncle_seryozha'
  | 'petrovich' | 'marina' | 'akhmet' | 'oleg' | 'lena' | 'barsik';

export interface CharacterDef {
  key: CharacterKey;
  name: string;
  emoji: string;
  color: string;
  description: string;
  voiceLines: string[];
}

// ─── Tasks ────────────────────────────────────────────────────────────────────

export type TaskDefKey =
  | 'shawarma' | 'intercom' | 'trash' | 'window' | 'grandma'
  | 'mailbox' | 'pigeons' | 'flowers' | 'kvass' | 'sweep';

export interface TaskDef {
  key: TaskDefKey;
  label: string;
  emoji: string;
  duration: number;    // seconds to complete
  unityReward: number; // % added to unity meter on complete
  color: string;
}

export interface TaskInstance {
  id: string;
  defKey: TaskDefKey;
  pos: Vec2;
  progress: number;    // 0-1
  isComplete: boolean;
  completedBy: string | null;
  doer: string | null;
  respawnTimer: number;
}

// ─── Cars ─────────────────────────────────────────────────────────────────────

export interface Car {
  id: string;
  pos: Vec2;
  fuel: number;        // 0-100
  color: string;
  siphoner: string | null;   // player id currently siphoning
  siphonPhase: number;       // 0=none, 1=setup(0-3s), 2=active draining
  siphonTimer: number;       // elapsed seconds in current phase
  hasImmunity: boolean;
  immunityTimer: number;
}

// ─── Players ──────────────────────────────────────────────────────────────────

export interface Player {
  id: string;
  name: string;
  character: CharacterKey;
  role: Role;
  isHuman: boolean;
  isAlive: boolean;
  pos: Vec2;
  vel: Vec2;
  speed: number;
  facingAngle: number;        // radians, 0=right, PI/2=down
  // Movement modifiers
  stamina: number;            // 0–SPRINT_MAX seconds
  isSprinting: boolean;
  isCrouching: boolean;
  // Combat
  ambushTarget: string | null;
  ambushChargeTimer: number;  // charge up to AMBUSH_CHARGE_TIME
  ambushCooldown: number;
  // Items
  isCarryingCanister: boolean;
  // Visual
  emote: string | null;
  emoteTimer: number;
  suspectedTimer: number;     // red outline when ambush interrupted
  // Bot AI
  botState: BotBehavior;
  botTarget: Vec2 | null;
  botTaskId: string | null;
  botCarId: string | null;
  botCooldown: number;
}

// ─── Bodies (left behind by ambushed players) ─────────────────────────────────

export interface Body {
  id: string;
  playerId: string;
  character: CharacterKey;
  name: string;
  pos: Vec2;
  reportedBy: string | null;
}

// ─── Canisters (evidence dropped when siphon interrupted) ─────────────────────

export interface Canister {
  id: string;
  pos: Vec2;
  ownerId: string;    // who dropped it
  isFull: boolean;
}

// ─── Meeting ──────────────────────────────────────────────────────────────────

export interface VoteRecord {
  voterId: string;
  targetId: string | null;  // null = skip
}

export type MeetingPhase = 'discussion' | 'voting' | 'reveal';
export type MeetingReason = 'alarm' | 'body' | 'drained_car';

export interface MeetingState {
  meetingId: number;   // increments each new meeting; used to reset UI state
  phase: MeetingPhase;
  callerId: string;
  reason: MeetingReason;
  timer: number;
  votes: VoteRecord[];
  ejectedId: string | null;
  ejectionText: string | null;
  chatMessages: ChatMessage[];
}

export interface ChatMessage {
  playerId: string;
  playerName: string;
  text: string;
  timestamp: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

export const INTERACT_RADIUS    = 65;
export const SIPHON_RADIUS      = 70;
export const ALARM_RADIUS       = 80;
export const BODY_RADIUS        = 75;
export const CANISTER_RADIUS    = 60;
export const AMBUSH_RADIUS      = 55;        // tight range to trigger ambush
export const AMBUSH_LONE_RADIUS = 480;       // no other player within this
export const SIPHON_RATE        = 4;         // fuel % per second active drain
export const SIPHON_SETUP_TIME  = 3;         // seconds for setup phase
export const AMBUSH_CHARGE_TIME = 1.5;       // hold time to kill
export const AMBUSH_COOLDOWN    = 25;
export const BOT_FLEE_RADIUS    = 220;
export const TASK_RESPAWN_TIME  = 35;
export const MEETING_COOLDOWN   = 30;

// Sprint / crouch
export const SPRINT_SPEED_MULT  = 1.55;      // ~5.4 m/s from 3.5 base
export const CROUCH_SPEED_MULT  = 0.52;      // ~1.8 m/s from 3.5 base
export const SPRINT_MAX         = 5;         // seconds of sprint
export const SPRINT_DRAIN_RATE  = 1;         // stamina per second sprinting
export const SPRINT_REGEN_RATE  = 0.625;     // stamina per second resting (8s to full)
export const CANISTER_SLOW_MULT = 0.8;       // speed × 0.8 when carrying canister

// ─── Top-level Game State ─────────────────────────────────────────────────────

export interface GameState {
  phase: Phase;
  players: Player[];
  cars: Car[];
  tasks: TaskInstance[];
  bodies: Body[];
  canisters: Canister[];
  meeting: MeetingState | null;
  unityMeter: number;
  winner: 'khozaeva' | 'slivshchiki' | null;
  winReason: string;
  localPlayerId: string;
  selectedCharacter: CharacterKey;
  time: number;
  meetingCooldown: number;
  tickerIndex: number;
  tickerTimer: number;
  ai95Price: number;
  promptText: string | null;
  promptTimer: number;
}

// ─── Input ────────────────────────────────────────────────────────────────────

export interface InputState {
  dx: number;
  dy: number;
  interact: boolean;
  prevInteract: boolean;
  sprint: boolean;
  crouch: boolean;
  emoteIndex: number | null;  // 0–3
}
