import { App, SlackCommandMiddlewareArgs, SlackActionMiddlewareArgs, BlockAction, Middleware, MessageAction, Context, SlashCommand } from "@slack/bolt";

import { ALLOWED_CHANNELS, DEFAULT_GAME_TIMEOUT_MS } from "./configs";
import { GameState, GameType } from "./games/game.types";
import { TableFootball } from "./games/football.class";
import { Game } from "./games/game.class";
import { getGameRequestBlock, getPlayersBlock, getFinishedGameBlock } from "./blocks";
import { AtariPong } from "./games/pong.class";

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
    
        const creatorId = payload.user_id;
        const comment = payload.text;
        const channelId = payload.channel_id;
    
        let game: Game;
        let gameId = "";
        const onStateChange = (state: GameState) => {
            switch (state) {
                case GameState.Finished:
                    console.log("Game finished")
                    sendFinishGameMessage(app, game, context.botToken, channelId, gameId, false);
                    break;
                case GameState.Timeout:
                    console.log("TIMEOUT");
                    sendFinishGameMessage(app, game, context.botToken, channelId, gameId, true);
            }
        }
    
        switch (gameType) {
            case GameType.Foosball:
                game = new TableFootball(
                    // "someID",
                    creatorId,
                    onStateChange,
                    DEFAULT_GAME_TIMEOUT_MS,
                );
                break;
            case GameType.AtariPong:
                game = new AtariPong(
                    // "someID",
                    creatorId,
                    onStateChange,
                    DEFAULT_GAME_TIMEOUT_MS,
                );
                break;
        }
    
        try {
            const result = await app.client.chat.postMessage({
                token: context.botToken,
                // Channel to send message to
                channel: payload.channel_id,
                // Include a button in the message (or whatever blocks you want!)
                blocks: [
                    getGameRequestBlock(game, true),
                    getPlayersBlock(game),
                    {
                        type: "divider"
                    },
                ],
                // Text in the notification
                text: 'New Relax room game request'
            });
            gameId = <string>result.ts;
            games[gameId] = game;
            // console.log(result);
        }
        catch (error) {
            console.error(error);
        }
    }
}

export const getFootballJoinActionHandler: (app: App) => Middleware<SlackActionMiddlewareArgs<MessageAction>> = app => {
    return async ({ ack, body, context }) => {
        // Acknowledge the button request
        ack();
        
        const joinedUserId = body.user.id;
        const gameId = body.message.ts;
        const game = games[gameId];

        if (game == null) {
            return;
        }
        game.addPlayer(joinedUserId);
      
        try {
            // Update the message
            const result = await app.client.chat.update({
                token: context.botToken,
                // ts of message to update
                ts: body.message.ts,
                // Channel of message
                channel: body.channel.id,
                blocks: [
                    getGameRequestBlock(game, true),
                    getPlayersBlock(game),
                    {
                        type: "divider"
                    },
                ],
                text: 'Relax room game request updated'
            });
            // console.log(result);
        }
        catch (error) {
            console.error(error);
        }
    }
}

const sendFinishGameMessage: (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    ts: string,
    timeout: boolean,
) => void = async (app, game, botToken, channelId, ts, timeout) => {
    setTimeout(async () => {
        try {
            const result = await app.client.chat.update({
                token: botToken,
                // ts of message to update
                ts,
                // Channel of message
                channel: channelId,
                blocks: [
                    getFinishedGameBlock(game, timeout),
                    // getGameRequestBlock(game, false),
                    getPlayersBlock(game),
                    {
                        type: "divider"
                    },
                ],
                text: 'Relax room game request ended'
            });
        }
        catch (error) {
            console.error(error);
        }
    }, 100);
}

export const garbageCollector = () => {
    Object.keys(games)
        .filter(id => games[id].state === GameState.Finished || games[id].state === GameState.Timeout)
        .forEach(id => {
            games[id] = null;
            delete games[id];
            console.log("Deleting game " + id + " remaining: " + Object.keys(games).length);
    })
}