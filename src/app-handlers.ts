import {
  App,
  SlackCommandMiddlewareArgs,
  SlackActionMiddlewareArgs,
  BlockAction,
  Middleware,
  ButtonAction,
} from "@slack/bolt";

import {
  ALLOWED_CHANNELS,
  DEFAULT_GAME_TIMEOUT_MS,
  DARTS_GAME_TIMEOUT_MS,
} from "./configs";
import { GameState, GameType } from "./games/game.types";
import { TableFootball } from "./games/football.class";
import { Game } from "./games/game.class";
import { AtariPong } from "./games/pong.class";
import {
  updateFinishGameMessage,
  sendNewGameMessage,
  sendEphemeralGameMessage,
  updateGameMessage,
  sendFinishedGameMessage,
} from "./messages";
import { Darts } from "./games/darts.class";
import { Chess } from "./games/chess.class";

let games: { [id: string]: Game } = {};

export const getGameCommandHandler: (
  app: App,
  gameType: GameType
) => Middleware<SlackCommandMiddlewareArgs> = (app, gameType) => {
  return async ({ ack, payload, context }) => {
    // Acknowledge the command request
    await ack();
    console.log(`Received a slash command for a new game of ${gameType}`);

    if (!ALLOWED_CHANNELS.includes(payload.channel_id)) {
      console.log(
        `Command for ${gameType} called from invalid channel ${payload.channel_name} by ${payload.user_name}`
      );
      return;
    }

    const botToken = context.botToken;
    const channelId = payload.channel_id;
    const creatorId = payload.user_id;
    const comment = payload.text;
    if (botToken == null) {
      console.log("Invalid bot token");
      return;
    }

    let game: Game;
    let gameId = "";
    const onStateChange = (state: GameState, message: string) => {
      switch (state) {
        case GameState.Finished:
          sendFinishedGameMessage(app, botToken, channelId, game.messages.go);
        case GameState.Timeout:
        case GameState.Empty:
          updateFinishGameMessage(
            app,
            game,
            botToken,
            channelId,
            gameId,
            message
          );
          break;
        case GameState.Ready:
        case GameState.Open:
          updateGameMessage(app, game, botToken, channelId, gameId);
          break;
      }
    };

    const existingGame = Object.entries(games).find(
      ([gameId, game]) =>
        game.gameType === gameType &&
        (game.state === GameState.Open || game.state === GameState.Ready)
    );
    if (existingGame != null) {
      [gameId, game] = existingGame;
      const isSuccessful = joinExistingGame(
        app,
        game,
        botToken,
        channelId,
        gameId,
        creatorId
      );
      if (isSuccessful) return;
    }

    game = createNewGame(gameType, onStateChange, creatorId);

    sendNewGameMessage(app, game, botToken, channelId).then((id) => {
      gameId = id;
      games[gameId] = game;
      sendEphemeralGameMessage(
        app,
        game,
        botToken,
        channelId,
        gameId,
        creatorId
      );
    });
  };
};

export const getJoinActionHandler = (
  app: App
): Middleware<SlackActionMiddlewareArgs<BlockAction>> => {
  return async ({ ack, body, context }) => {
    // Acknowledge the button request
    await ack();

    const botToken = context.botToken;
    const channelId = body.channel?.id;
    const userId = body.user.id;
    const gameId = body.message?.ts;
    if (channelId == null || gameId == null) {
      console.warn(
        `missing channel or message payload; channel: ${body.channel} , message: ${body.message}`
      );
      return;
    }
    const game = games[gameId];
    if (botToken == null) {
      console.warn("Invalid bot token");
      return;
    }

    if (game == null) {
      console.warn(`Received a join request for a game that does not exist`);
      return;
    }
    console.log(
      `Received a join request for a game of ${game.gameType} that is currently in a ${game.state} state`
    );

    joinExistingGame(app, game, botToken, channelId, gameId, userId);
  };
};

const createNewGame = (
  gameType: GameType,
  onStateChange: (state: GameState, message: string) => void,
  creatorId: string
) => {
  switch (gameType) {
    case GameType.Foosball:
      return new TableFootball(
        creatorId,
        onStateChange,
        DEFAULT_GAME_TIMEOUT_MS
      );

    case GameType.AtariPong:
      return new AtariPong(creatorId, onStateChange, DEFAULT_GAME_TIMEOUT_MS);

    case GameType.Darts:
      return new Darts(creatorId, onStateChange, DARTS_GAME_TIMEOUT_MS);

    case GameType.Chess:
      return new Chess(creatorId, onStateChange, DEFAULT_GAME_TIMEOUT_MS);
  }
};

const joinExistingGame = (
  app: App,
  game: Game,
  botToken: string,
  channelId: string,
  gameId: string,
  userId: string
): boolean => {
  if (game == null || !game.isJoinable) {
    game?.triggerStateCallback();
    return false;
  }
  const success = game.addPlayer(userId);

  if (success) {
    // TODO: update for darts game
    // updateGameMessage(app, game, botToken, channelId, gameId);
    sendEphemeralGameMessage(app, game, botToken, channelId, gameId, userId);
  }

  return success;
};

export const getLeaveActionHandler: (
  app: App
) => Middleware<SlackActionMiddlewareArgs<BlockAction<ButtonAction>>> = (
  app
) => {
  return async ({ ack, body, context, respond }) => {
    // Acknowledge the button request
    await ack();

    const botToken = context.botToken;
    const channelId = body?.channel?.id;
    const userId = body.user.id;
    const gameId = body.actions[0].value;
    const game = games[gameId];

    if (game == null) {
      return;
    }
    console.log(
      `Received a leave request for a new game of ${game.gameType} that is currently in a ${game.state} state`
    );
    game.removePlayer(userId);
    context.updateConversation();

    if (game.players.length) {
      // TODO: update for darts game
      // updateGameMessage(app, game, botToken, channelId, gameId);
    }

    // remove ephemeral message
    await respond({
      text: "",
      delete_original: true,
    });
  };
};

export const garbageCollector = () => {
  Object.keys(games)
    .filter(
      (id) =>
        games[id].state === GameState.Finished ||
        games[id].state === GameState.Timeout ||
        games[id].state === GameState.Empty
    )
    .forEach((id) => {
      games[id] = null as any;
      delete games[id];
      console.log(
        "Deleting game " + id + " remaining: " + Object.keys(games).length
      );
    });
};
