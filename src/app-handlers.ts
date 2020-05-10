import { App, SlackCommandMiddlewareArgs, SlackActionMiddlewareArgs, BlockAction, Middleware, MessageAction, ButtonAction } from "@slack/bolt";

import { ALLOWED_CHANNELS, DEFAULT_GAME_TIMEOUT_MS } from "./configs";
import { GameState, GameType } from "./games/game.types";
import { TableFootball } from "./games/football.class";
import { Game } from "./games/game.class";
import { AtariPong } from "./games/pong.class";
import { sendFinishGameMessage, sendNewGameMessage, sendEphemeralGameMessage, updateGameMessage } from "./messages";


let games: {[id: string]: Game} = {};

export const getGameCommandHandler: (
    app: App,
    gameType: GameType
) => Middleware<SlackCommandMiddlewareArgs> = (app, gameType) => {
    return async ({ ack, payload, context }) => {
        // Acknowledge the command request
        ack();
    
        if (!ALLOWED_CHANNELS.includes(payload.channel_id)) {
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
                    console.log("Game finished")
                    sendFinishGameMessage(app, game, botToken, channelId, gameId, message);
                    break;

                case GameState.Timeout:
                    console.log("TIMEOUT");
                    sendFinishGameMessage(app, game, botToken, channelId, gameId, message);
                    break;
                
                case GameState.Empty:
                    console.log("No players left");
                    sendFinishGameMessage(app, game, botToken, channelId, gameId, message);
                    break;
            }
        }
    
        switch (gameType) {
            case GameType.Foosball:
                game = new TableFootball(
                    creatorId,
                    onStateChange,
                    DEFAULT_GAME_TIMEOUT_MS,
                );
                break;

            case GameType.AtariPong:
                game = new AtariPong(
                    creatorId,
                    onStateChange,
                    DEFAULT_GAME_TIMEOUT_MS,
                );
                break;
        }
    
        sendNewGameMessage(app, game, botToken, channelId, creatorId).then(id => {
            gameId = id;
            games[gameId] = game;
            sendEphemeralGameMessage(app, game, botToken, channelId, gameId, creatorId);
        });
    }
}

export const getJoinActionHandler: (app: App) => Middleware<SlackActionMiddlewareArgs<MessageAction>> = (app) => {
    return async ({ ack, body, context }) => {
        // Acknowledge the button request
        ack();
        
        const botToken = context.botToken;
        const channelId = body.channel.id
        const userId = body.user.id;
        const gameId = body.message.ts;
        const game = games[gameId];

        if (game == null) {
            return;
        }
        game.addPlayer(userId);

        updateGameMessage(app, game, botToken, channelId, gameId);

        sendEphemeralGameMessage(app, game, botToken, channelId, gameId, userId);
    }
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