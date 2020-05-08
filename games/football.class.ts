import { Game } from "./game.class";
import { GameState, GameMessage } from "./game.types";

export class TableFootball extends Game {
    
    constructor(
        id: string,
        creatorId: string,
        stateUpdate: (state: GameState) => void,
        timeout?: number,
    ) {
        super(
            id,
            {min: 4, max: 4},
            creatorId,
            stateUpdate,
            timeout,
        );
    }

    protected _getGameMessages(): GameMessage {
        return {
            created: `<@${this._creatorId}> wants to challenge anyone @here to a game of table football.`,
            players: this._getPlayersMessage(),
            timeout: "",
            finished: "",
        }
    }

    private _getPlayersMessage(): string {
        return this._players.length
            ? this._players.reduce(
                (message, playerId) => message.concat(`<@${playerId}> `), 
                "Joined: ")
            : "";
    }
}