export interface PlayersLimit {
    max: number;
    min: number;
}

export interface GameMessage {
    created?: string,
    joinButton?: string,
    ephemeral?: string,
    leaveButton?: string,
    players?: string,
    timeout?: string,
    finished?: string,
    empty?: string,
}

export enum GameState {
    Open,
    Ready,
    Finished,
    Timeout,
    Empty,
}

export enum GameType {
    Foosball = "foosball",
    AtariPong = "pong",
    // Darts = "darts",
}
