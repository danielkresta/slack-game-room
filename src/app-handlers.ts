import { App, SlackCommandMiddlewareArgs, SlackActionMiddlewareArgs, BlockAction, Middleware, MessageAction, ButtonAction } from "@slack/bolt";

import { ALLOWED_CHANNELS, DEFAULT_GAME_TIMEOUT_MS, DARTS_GAME_TIMEOUT_MS } from "./configs";
import { GameState, GameType } from "./games/game.types";
import { TableFootball } from "./games/football.class";
import { Game } from "./games/game.class";
import { AtariPong } from "./games/pong.class";
import { sendFinishGameMessage, sendNewGameMessage, sendEphemeralGameMessage, updateGameMessage } from "./messages";
import { Darts } from "./games/darts.class";


let games: {[id: string]: Game} = {};

export const getGameCommandHandler: (
    app: App,
    gameType: GameType
) => Middleware<SlackCommandMiddlewareArgs> = (app, gameType) => {
    return async ({ ack, payload, context }) => {
        // Acknowledge the command request
        ack();
    
        if (!ALLOWED_CHANNELS.includes(payload.channel_id)) {
            console.log(`Command for ${gameType} called from invalid channel ${payload.channel_name} by ${payload.user_name}`);
            return;
        }
    
        const botToken = context.botToken;
        const channelId = payload.channel_id;
        const creatorId = payload.user_id;
        const comment = payload.text;
    
        let game: Game;
        let gameId = "";
        const onStateChange = (state: GameState, message: string) => {
            switch (state) {
                case GameState.Finished:
                case GameState.Timeout:
                case GameState.Empty:
                    sendFinishGameMessage(app, game, botToken, channelId, gameId, message);
                    break;
                case GameState.Ready:
                case GameState.Open:
                    updateGameMessage(app, game, botToken, channelId, gameId);
                    break;

            }
        }

        const existingGame = Object.entries(games)
            .find(([gameId, game]) => (
                game.gameType === gameType &&
                (
                    game.state === GameState.Open ||
                    game.state === GameState.Ready
                )
            ));
        if (existingGame != null) {
            [gameId, game] = existingGame;
            const isSuccessful = joinExistingGame(app, game, botToken, channelId, gameId, creatorId);
            if (isSuccessful) return;
        }

        game = createNewGame(gameType, onStateChange, creatorId);
    
        sendNewGameMessage(app, game, botToken, channelId).then(id => {
            gameId = id;
            games[gameId] = game;
            sendEphemeralGameMessage(app, game, botToken, channelId, gameId, creatorId);
        });
    }
}

export const getJoinActionHandler = (app: App): Middleware<SlackActionMiddlewareArgs<MessageAction>> => {
    return async ({ ack, body, context }) => {
        // Acknowledge the button request
        ack();
        
        const botToken = context.botToken;
        const channelId = body.channel.id
        const userId = body.user.id;
        const gameId = body.message.ts;
        const game = games[gameId];

        joinExistingGame(app, game, botToken, channelId, gameId, userId);
    }
}

const createNewGame = (
    gameType: GameType,
    onStateChange: (state: GameState, message: string) => void,
    creatorId: string,
) => {
    switch (gameType) {
        case GameType.Foosball:
            return new TableFootball(
                creatorId,
                onStateChange,
                DEFAULT_GAME_TIMEOUT_MS,
            );

        case GameType.AtariPong:
            return new AtariPong(
                creatorId,
                onStateChange,
                DEFAULT_GAME_TIMEOUT_MS,
            );

        case GameType.Darts:
            return new Darts(
                creatorId,
                onStateChange,
                DARTS_GAME_TIMEOUT_MS,
            );
    }
}

const joinExistingGame = (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    gameId: string,
    userId: string,
): boolean => {
    if (game == null && !game.isJoinable) {
        game?.triggerStateCallback();
        return false;
    }
    game.addPlayer(userId);

    updateGameMessage(app, game, botToken, channelId, gameId);

    sendEphemeralGameMessage(app, game, botToken, channelId, gameId, userId);

    return true;
}

export const getLeaveActionHandler: (app: App) => Middleware<SlackActionMiddlewareArgs<BlockAction<ButtonAction>>> = (app) => {
    return async ({ ack, body, context, respond }) => {
        // Acknowledge the button request
        ack();
        
        const botToken = context.botToken;
        const channelId = body.channel.id;
        const userId = body.user.id;
        const gameId = body.actions[0].value;
        const game = games[gameId];

        if (game == null) {
            return;
        }
        game.removePlayer(userId);
        context.updateConversation();

        if (game.players.length) {
            updateGameMessage(app, game, botToken, channelId, gameId);
        }

        // remove ephemeral message
        respond({
            text: "",
            delete_original: true,
        })
    }
}

export const garbageCollector = () => {
    Object.keys(games)
        .filter(id => 
            games[id].state === GameState.Finished
            || games[id].state === GameState.Timeout
            || games[id].state === GameState.Empty
        )
        .forEach(id => {
            games[id] = null;
            delete games[id];
            console.log("Deleting game " + id + " remaining: " + Object.keys(games).length);
    })
}