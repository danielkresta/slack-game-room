import { App } from "@slack/bolt";
import { Game } from "./games/game.class";
import { getGameRequestBlock, getPlayersBlock, getFinishedGameBlock } from "./blocks";
import { SLACK_ACTION_IDS } from "./configs";


export const sendNewGameMessage: (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    userId: string,
) => Promise<string> = async (app, game, botToken, channelId, userId) => {
    try {
        const result = await app.client.chat.postMessage({
            token: botToken,
            channel: channelId,
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
        const gameId = <string>result.ts;
        // console.log(result);
        return gameId;
    }
    catch (error) {
        console.error(error);
    }
}

export const updateGameMessage: (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    ts: string,
) => void = async (app, game, botToken, channelId, ts) => {
    try {
        // Update the message
        const result = await app.client.chat.update({
            token: botToken,
            // timestamp of message to update
            ts,
            channel: channelId,
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

export const sendFinishGameMessage: (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    ts: string,
    message: string,
) => void = async (app, game, botToken, channelId, ts, message) => {
    setTimeout(async () => {
        try {
            const result = await app.client.chat.update({
                token: botToken,
                // timestamp of message to update
                ts,
                channel: channelId,
                blocks: [
                    getFinishedGameBlock(message),
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

export const sendEphemeralGameMessage: (
    app: App,
    game: Game,
    botToken: string,
    channelId: string,
    ts: string,
    userId: string,
) => void = async (app, game, botToken, channelId, ts, userId) => {
    try {
        const result = await app.client.chat.postEphemeral({
            token: botToken,
            channel: channelId,
            user: userId,
            blocks: [
                {
                    type: 'section',
                    text: {
                        type: 'mrkdwn',
                        text: game?.messages?.ephemeral
                    },
                    accessory: {
                        type: 'button',
                        text: {
                            type: "plain_text",
                            text: game?.messages?.leaveButton,
                            emoji: true,
                        },
                        action_id: SLACK_ACTION_IDS.leaveButton,
                        value: ts,
                    },
                }
            ],
            text: 'Relax room game request updated'
        });
    }
    catch (error) {
        console.error(error);
    }
}