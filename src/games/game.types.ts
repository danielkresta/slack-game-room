export interface PlayersLimit {
  max: number;
  min: number;
}

export interface GameMessage {
  created: string;
  joinButton?: string;
  ephemeral?: string;
  leaveButton?: string;
  players: string;
  ready: string;
  timeout: string;
  finished: string;
  empty: string;
  go: string;
}

export enum GameState {
  Open = "open",
  Ready = "ready",
  Finished = "finished",
  Timeout = "timeout",
  Empty = "empty",
}

export enum GameType {
  Foosball = "foosball",
  AtariPong = "pong",
  Darts = "darts",
  Chess = "chess",
}
