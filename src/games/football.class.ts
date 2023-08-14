import { Game } from "./game.class";
import { GameState, GameMessage, GameType } from "./game.types";
import { SLACK_COMMANDS } from "../configs";

export class TableFootball extends Game {
  public readonly gameType = GameType.Foosball;

  protected readonly _gameIcon = ":soccer:";
  protected readonly _gameCommand = SLACK_COMMANDS.football;

  constructor(
    creatorId: string,
    stateUpdate: (state: GameState, message: string) => void,
    timeout?: number
  ) {
    super({ min: 4, max: 4 }, creatorId, stateUpdate, timeout);
  }

  get messages(): GameMessage {
    return {
      ...this._baseMessages,
      players: this._getPlayersMessage(),
      ...this._getGameMessages(),
    };
  }

  private _getGameMessages() {
    return {
      created: `<@${this._creatorId}> wants to challenge anyone @here to a game of table football.`,
      finished: `${this._gameIcon} All the players for the game were found. You are ready to play some football!`,
    };
  }
}
