import { GameState, PlayersLimit, GameMessage } from "./game.types";
import { DEFAULT_GAME_TIMEOUT_MS, SLACK_COMMANDS } from "../configs";

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
    protected _stateUpdateCallback: (state: GameState, game: Game) => void;
    protected _messages: GameMessage;
    protected _timeoutRef: NodeJS.Timeout;

    constructor(
        // id: string,
        playersLimit: PlayersLimit,
        creatorId: string,
        stateUpdate: (state: GameState, game: Game) => void,
        timeout = DEFAULT_GAME_TIMEOUT_MS,
    ) {
        // this._id = id;
        this._playersLimit = playersLimit;
        this._creatorId = creatorId;
        this._players.push(creatorId);
        this._state = GameState.Open;
        this._stateUpdateCallback = stateUpdate;

        if (timeout != null && timeout > 0) {
            this._timeoutRef = setTimeout(() => {
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
        return {
            ...this._getGameMessages(),
            players: this._getPlayersMessage(),
            timeout: `It has been some time since <@${this._creatorId}> created the request, but not enough players joined, or has just found the rest of the players offline.
                You can now create another game by typing ${SLACK_COMMANDS.football} in the channel.`,
        }
    }

    public addPlayer(playerId: string): void {
        if (/*this._players.includes(playerId) ||*/ this._state !== GameState.Open) return;
        this._players.push(playerId);
        this._checkPlayers();
    }

    protected _checkPlayers() {
        // if (this._players.length === this._playersLimit.min) {
        //     // ready?
        //     this._updateState(GameState.Ready);
        //     // handle ready
        // }
        if (this._players.length === this._playersLimit.max) {
            this._updateState(GameState.Finished);
            clearTimeout(this._timeoutRef);
            // close
        }
    }

    protected _updateState(state: GameState) {
        this._state = state;
        this._stateUpdateCallback(state, this);
    }

    protected abstract _getGameMessages(): GameMessage;

    private _getPlayersMessage(): string {
        return this._players.length
            ? this._players.reduce(
                (message, playerId) => message.concat(`<@${playerId}> `), 
                "Joined: ")
            : "";
    }
}