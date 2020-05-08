export interface PlayersLimit {
    max: number;
    min: number;
}

export interface GameMessage {
    created: string,
    players: string,
    timeout: string,
    finished: string,
}

export enum GameState {
    Active,
    Ready,
    Finished,
    Timeout,
}