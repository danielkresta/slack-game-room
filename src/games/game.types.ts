export interface PlayersLimit {
    max: number;
    min: number;
}

export interface GameMessage {
    created: string,
    joinButton: string,
    players?: string,
    timeout?: string,
    finished: string,
}

export enum GameState {
    Open,
    Ready,
    Finished,
    Timeout,
}

export enum AvailableGame {
    Foosball,
    AtariPong,
    // Darts,
}