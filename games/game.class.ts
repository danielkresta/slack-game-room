import { GameState, PlayersLimit, GameMessage } from "./game.types";

export abstract class Game {
    public readonly created = Date.now();
    
    protected _state: GameState;
    protected _id: string;
    protected _playersLimit: PlayersLimit = {
        min: null,
        max: null,
    };
    protected _creatorId: string;
    protected _players = <string[]>[];
    protected _stateUpdateCallback: (GameState) => void;
    protected _messages: GameMessage;

    constructor(
        id: string,
        playersLimit: PlayersLimit,
        creatorId: string,
        stateUpdate: (state: GameState) => void,
        timeout?: number,
    ) {
        this._id = id;
        this._playersLimit = playersLimit;
        this._creatorId = creatorId;
        this._players.push(creatorId);
        this._state = GameState.Active;
        this._stateUpdateCallback = stateUpdate;

        if (timeout != null && timeout > 0) {
            setTimeout(() => {
                this._updateState(GameState.Timeout);
            }, timeout)
        }
    }

    get state(): GameState {
        return this._state;
    }

    get players(): string[] {
        return this._players;
    }

    get messages(): GameMessage {
        return this._getGameMessages();
    }

    public addPlayer(playerId: string): void {
        if (/*this._players.includes(playerId) ||*/ this._state === GameState.Finished) return;
        this._players.push(playerId);
        this._checkPlayers();
    }

    protected _checkPlayers() {
        if (this._players.length === this._playersLimit.min) {
            // ready?
            this._updateState(GameState.Ready);
            // handle ready
        }
        if (this._players.length === this._playersLimit.max) {
            this._updateState(GameState.Finished);
            // close
        }
    }

    protected _updateState(state: GameState) {
        this._state = state;
        this._stateUpdateCallback(state);
    }

    protected abstract _getGameMessages(): GameMessage;
}