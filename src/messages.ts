import { App } from "@slack/bolt";
import { Game } from "./games/game.class";
import {
  getGameRequestBlock,
  getPlayersBlock,
  getFinishedGameBlock,
} from "./blocks";
import { SLACK_ACTION_IDS } from "./configs";

export const sendNewGameMessage = async (
  app: App,
  game: Game,
  botToken: string,
  channelId: string
): Promise<string> => {
  try {
    const result = await app.client.chat.postMessage({
      token: botToken,
      channel: channelId,
      blocks: [
        getGameRequestBlock(game, true),
        getPlayersBlock(game),
        {
          type: "divider",
        },
      ],
      // Text in the notification
      text: "New Relax room game request",
    });
    const gameId = <string>result.ts;
    // console.log(result);
    return gameId;
  } catch (error) {
    console.error(error);
  }
};

export const updateGameMessage = async (
  app: App,
  game: Game,
  botToken: string,
  channelId: string,
  ts: string
) => {
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
          type: "divider",
        },
      ],
      text: "Relax room game request updated",
    });
    // console.log(result);
  } catch (error) {
    console.error(error);
  }
};

export const updateFinishGameMessage = async (
  app: App,
  game: Game,
  botToken: string,
  channelId: string,
  ts: string,
  message: string
) => {
  setTimeout(async () => {
    try {
      const result = await app.client.chat.update({
        token: botToken,
        // timestamp of message to update
        ts,
        channel: channelId,
        blocks: [getFinishedGameBlock(message), getPlayersBlock(game)],
        text: "Relax room game request ended",
      });
    } catch (error) {
      console.error(error);
    }
  }, 100);
};

export const sendFinishedGameMessage = async (
  app: App,
  botToken: string,
  channelId: string,
  message: string
): Promise<string> => {
  try {
    const result = await app.client.chat.postMessage({
      token: botToken,
      channel: channelId,
      blocks: [
        getFinishedGameBlock(message),
        {
          type: "divider",
        },
      ],
      // Text in the notification
      text: "Relax room game ready!",
    });
    const gameId = <string>result.ts;
    return gameId;
  } catch (error) {
    console.error(error);
  }
};

export const sendEphemeralGameMessage = async (
  app: App,
  game: Game,
  botToken: string,
  channelId: string,
  ts: string,
  userId: string
) => {
  try {
    const result = await app.client.chat.postEphemeral({
      token: botToken,
      channel: channelId,
      user: userId,
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: game?.messages?.ephemeral ?? "",
          },
          accessory: {
            type: "button",
            text: {
              type: "plain_text",
              text: game?.messages?.leaveButton ?? "",
              emoji: true,
            },
            action_id: SLACK_ACTION_IDS.leaveButton,
            value: ts,
          },
        },
      ],
      text: "Relax room game request updated",
    });
  } catch (error) {
    console.error(error);
  }
};
