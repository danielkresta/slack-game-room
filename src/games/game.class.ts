import { GameState, PlayersLimit, GameMessage, GameType } from "./game.types";
import { DEFAULT_GAME_TIMEOUT_MS } from "../configs";

export abstract class Game {
    public readonly created = Date.now();
    public abstract readonly gameType: GameType;
    
    protected abstract readonly _gameIcon: string;
    protected abstract readonly _gameCommand: string;

    protected _state: GameState;
    protected _playersLimit: PlayersLimit = {
        min: null,
        max: null,
    };
    protected _creatorId: string;
    protected _players = <string[]>[];
    protected _stateUpdateCallback: (state: GameState, message: string) => void;
    protected _messages: GameMessage;
    protected _timeoutRef: NodeJS.Timeout;

    constructor(
        playersLimit: PlayersLimit,
        creatorId: string,
        stateUpdate: (state: GameState, message: string) => void,
        timeout = DEFAULT_GAME_TIMEOUT_MS,
    ) {
        this._playersLimit = playersLimit;
        this._creatorId = creatorId;
        this._players.push(creatorId);
        this._state = GameState.Open;
        this._stateUpdateCallback = stateUpdate;

        if (timeout != null && timeout > 0) {
            this._timeoutRef = setTimeout(() => {
                this._updateState(GameState.Timeout, this.messages.timeout);
            }, timeout);
        }
    }

    get state(): GameState {
        return this._state;
    }

    get players(): string[] {
        return this._players;
    }

    get messages(): GameMessage {
        return {
            ...this._getGameMessages(),
            players: this._getPlayersMessage(),
            timeout: `${this._gameIcon} It has been some time since <@${this._creatorId}> created the request, but not enough players joined, or they have just found the rest of the players offline.
You can now create another game by typing ${this._gameCommand} in the channel.`,
            joinButton: `${this._gameIcon} Join`,
            ephemeral: `You are currently queued for a game of ${this.gameType}`,
            leaveButton: `:x: Leave`,
            empty: `All the players have cancelled their requests. You can now create another game by typing ${this._gameCommand} in the channel.`
        }
    }

    public addPlayer(playerId: string): void {
        if (/*this._players.includes(playerId) ||*/ this._state !== GameState.Open) return;
        this._players.push(playerId);
        this._checkPlayers();
    }

    public removePlayer(playerId: string) {
        if (/*this._players.includes(playerId) ||*/ this._state !== GameState.Open) return;
        this._players = this._players.filter(id => playerId !== id);
        this._checkPlayers();
    }

    protected _checkPlayers() {
        // if (this._players.length === this._playersLimit.min) {
        //     // ready?
        //     this._updateState(GameState.Ready);
        //     // handle ready
        // }
        if (this._players.length === this._playersLimit.max) {
            this._updateState(GameState.Finished, this.messages.finished);
            clearTimeout(this._timeoutRef);
        }
        if (this._players.length < 1) {
            this._updateState(GameState.Empty, this.messages.empty);
            clearTimeout(this._timeoutRef);
        }
    }

    protected _updateState(state: GameState, message: string) {
        this._state = state;
        this._stateUpdateCallback(state, message);
    }

    protected abstract _getGameMessages(): GameMessage;

    private _getPlayersMessage(): string {
        return this._players.length
            ? this._players.reduce(
                (message, playerId) => message.concat(`<@${playerId}> `), 
                "Players joined: ")
            : "No players";
    }
}