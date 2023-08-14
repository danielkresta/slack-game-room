import { Game } from "./game.class";
import { GameState, GameMessage, GameType } from "./game.types";
import { SLACK_COMMANDS } from "../configs";

export class Chess extends Game {
    public readonly gameType = GameType.AtariPong;

    protected readonly _gameIcon = ":chess_pawn:";
    protected readonly _gameCommand = SLACK_COMMANDS.chess;
    
    constructor(
        creatorId: string,
        stateUpdate: (state: GameState, message: string) => void,
        timeout?: number,
    ) {
        super(
            {min: 2, max: 2},
            creatorId,
            stateUpdate,
            timeout,
        );
    }

    get messages(): GameMessage {
        return {
            ...this._baseMessages,
            players: this._getPlayersMessage(),
            ...this._getGameMessages(),
        }
    }

    private _getGameMessages() {
        return {
            created: `<@${this._creatorId}> wants to challenge anyone @here to a game of chess.`,
            finished: `${this._gameIcon} All the players for the game were found. You are ready to play some chess!`,
        }
    }
}