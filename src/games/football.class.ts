import { Game } from "./game.class";
import { GameState, GameMessage } from "./game.types";

export class TableFootball extends Game {
    
    constructor(
        // id: string,
        creatorId: string,
        stateUpdate: (state: GameState, game: TableFootball) => void,
        timeout?: number,
    ) {
        super(
            // id,
            {min: 4, max: 4},
            creatorId,
            stateUpdate,
            timeout,
        );
    }

    protected _getGameMessages(): GameMessage {
        return {
            created: `<@${this._creatorId}> wants to challenge anyone @here to a game of table football.`,
            joinButton: ":soccer: Join",
            finished: "All the players for the game were found. You are ready to play some football!",
        }
    }
}