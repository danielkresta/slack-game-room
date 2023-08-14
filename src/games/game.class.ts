import { GameState, PlayersLimit, GameMessage, GameType } from "./game.types";
import { DEFAULT_GAME_TIMEOUT_MS, TEST_MODE } from "../configs";

export abstract class Game {
  public readonly created = Date.now();
  public abstract readonly gameType: GameType;

  protected abstract readonly _gameIcon: string;
  protected abstract readonly _gameCommand: string;

  protected _state: GameState;
  protected _playersLimit: PlayersLimit;
  protected _creatorId: string;
  protected _players = <string[]>[];
  protected _stateUpdateCallback: (state: GameState, message: string) => void;
  protected _messages: GameMessage;
  protected _timeoutRef: NodeJS.Timeout;

  protected get _baseMessages() {
    return {
      timeout: `${this._gameIcon} It has been some time since <@${this._creatorId}> created the request, but not enough players joined, or they have just found the rest of the players offline.
You can now create another game by typing ${this._gameCommand} in the channel.`,
      ready: `Minimum number of players has joined the game, new ones can still join.`,
      joinButton: `${this._gameIcon} Join`,
      ephemeral: `You are currently queued for a game of ${this.gameType}`,
      leaveButton: `:x: Leave`,
      empty: `All the players have cancelled their requests. You can now create another game by typing ${this._gameCommand} in the channel.`,
      go: "Go!",
    };
  }

  constructor(
    playersLimit: PlayersLimit,
    creatorId: string,
    stateUpdate: (state: GameState, message: string) => void,
    timeout = DEFAULT_GAME_TIMEOUT_MS
  ) {
    this._playersLimit = playersLimit;
    this._creatorId = creatorId;
    this._players.push(creatorId);
    this._state = GameState.Open;
    this._stateUpdateCallback = stateUpdate;

    if (timeout != null && timeout > 0) {
      this._timeoutRef = setTimeout(() => {
        if (this._players.length < this._playersLimit.min) {
          console.log("TIMEOUT");
          this._updateState(GameState.Timeout, this.messages.timeout);
        } else {
          console.log("TIMEOUT, but enough players");
          this._updateState(GameState.Finished, this.messages.finished);
        }
      }, timeout);
    }
  }

  get state(): GameState {
    return this._state;
  }

  get players(): string[] {
    return this._players;
  }

  abstract get messages(): GameMessage;

  get isJoinable(): boolean {
    return this._state === GameState.Open || this._state === GameState.Ready;
  }

  public addPlayer(playerId: string): boolean {
    if (
      (this._players.includes(playerId) && process.env.STAGE === "prod") ||
      !this.isJoinable
    )
      return false;

    this._players.push(playerId);
    this._checkPlayers();
    return true;
  }

  public removePlayer(playerId: string): boolean {
    if (!this.isJoinable) return false;

    this._players = this._players.filter((id) => playerId !== id);
    this._checkPlayers();
    return true;
  }

  public triggerStateCallback() {
    switch (this._state) {
      case GameState.Empty:
        this._stateUpdateCallback(this._state, this._messages.empty);
        return;
      case GameState.Finished:
        this._stateUpdateCallback(this._state, this._messages.finished);
        return;
      case GameState.Open:
        this._stateUpdateCallback(this._state, this._messages.created);
        return;
      case GameState.Ready:
        this._stateUpdateCallback(this._state, this._messages.ready);
        return;
      case GameState.Timeout:
        this._stateUpdateCallback(this._state, this._messages.timeout);
        return;
    }
  }

  protected _checkPlayers() {
    if (this._players.length === this._playersLimit.max) {
      console.log("Game finished");
      this._updateState(GameState.Finished, this.messages.finished);
      clearTimeout(this._timeoutRef);
      return;
    }
    if (this._players.length < 1) {
      console.log("No players left");
      this._updateState(GameState.Empty, this.messages.empty);
      clearTimeout(this._timeoutRef);
      return;
    }
    if (this._players.length < this._playersLimit.min) {
      console.log("Game open");
      this._updateState(GameState.Open, this.messages.created);
      return;
    }
    if (this._players.length === this._playersLimit.min) {
      console.log("Game ready");
      this._updateState(GameState.Ready, this.messages.ready);
      return;
    }
  }

  protected _updateState(state: GameState, message: string) {
    this._state = state;
    this._stateUpdateCallback(state, message);
  }

  protected _getPlayersMessage(): string {
    return this._players.length
      ? this._players.reduce(
          (message, playerId) => message.concat(`<@${playerId}> `),
          "Players joined: "
        )
      : "No players";
  }
}
