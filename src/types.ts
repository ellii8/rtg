export enum GamePhase {
  LOBBY = 'LOBBY',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  GRADING = 'GRADING',
  LEADERBOARD = 'LEADERBOARD',
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  currentAnswer: string | null;
  submittedAt: number | null; // Timestamp for tie-breaking
  isOnline: boolean;
}

export interface Question {
  text: string;
  timeLimit: number; // in seconds
  endTime: number | null; // timestamp when question ends
}

// The "Truth" state managed by Admin
export interface GameState {
  phase: GamePhase;
  players: Player[];
  currentQuestion: Question | null;
}

// Events sent via BroadcastChannel
export type ChannelEvent =
  | { type: 'ADMIN_UPDATE_STATE'; payload: GameState } // Server -> Client
  | { type: 'PLAYER_JOIN'; payload: { id: string; nickname: string } } // Client -> Server
  | { type: 'PLAYER_SUBMIT'; payload: { id: string; answer: string } } // Client -> Server
  | { type: 'PLAYER_HEARTBEAT'; payload: { id: string } }; // Client -> Server