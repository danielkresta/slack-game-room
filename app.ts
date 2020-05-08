// This example shows how to listen to a button click
// It uses slash commands and actions

import { TableFootball } from "./games/football.class";
import { Game } from "./games/game.class";
import { GameState } from "./games/game.types";
import { App, SlackCommandMiddlewareArgs, SlackActionMiddlewareArgs, BlockAction, Middleware, MessageAction } from "@slack/bolt";

// Require the Bolt package (github.com/slackapi/bolt)
// const { App } = require("@slack/bolt");

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

const ALLOWED_CHANNELS = [
  "G013AEBN8FL",
];

let games: {[id: string]: Game} = {};

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET
});

// Listen for a slash command invocation
app.command('/helloworld', async ({ ack, payload, context }) => {
  // Acknowledge the command request
  ack();

  if (!ALLOWED_CHANNELS.includes(payload.channel_id)) {
    return;
  }

  const creatorId = payload.user_id;
  const comment = payload.text;

  const onStateChange = state => {
    if (state === GameState.Timeout) {
      console.log("TIMEOUT");
    }
  };

  const game = new TableFootball(
    "someID",
    creatorId,
    onStateChange,
    100000,
  );

  try {
    const result = await app.client.chat.postMessage({
      token: context.botToken,
      // Channel to send message to
      channel: payload.channel_id,
      // Include a button in the message (or whatever blocks you want!)
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: game?.messages?.created,
          },
          accessory: {
            type: 'button',
            text: {
              type: "plain_text",
              text: ":soccer: Join",
              emoji: true,
            },
            action_id: 'button_abc'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: game?.messages?.players
          },
        },
      ],
      // Text in the notification
      text: 'Message from Test App'
    });
    const gameId = <string>result.ts;
    games[gameId] = game;
    // console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});

// Listen for a button invocation with action_id `button_abc`
// You must set up a Request URL under Interactive Components on your app configuration page
app.action<MessageAction>('button_abc', async ({ ack, body, context }) => {
  // Acknowledge the button request
  ack();

  console.log(body.message);
  
  const joinedUserId = body.user.id;
  const gameId = body.message.ts;
  const game = games[gameId];
  game?.addPlayer(joinedUserId);

  try {
    // Update the message
    const result = await app.client.chat.update({
      token: context.botToken,
      // ts of message to update
      ts: body.message.ts,
      // Channel of message
      channel: body.channel.id,
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: game?.messages?.created
          },
          accessory: {
            type: 'button',
            text: {
              type: "plain_text",
              text: ":soccer: Join",
              emoji: true,
            },
            action_id: 'button_abc'
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: game?.messages?.players
          },
        },
      ],
      text: 'Message from Test App'
    });
    console.log(result);
  }
  catch (error) {
    console.error(error);
  }
});

(async () => {
  // Start your app
  await app.start(process.env.PORT || 3000);

  console.log('⚡️ Bolt app is running!');

  setInterval(garbageCollector, 200000);
})();


const garbageCollector = () => {
  Object.keys(games)
    .filter((id) => games[id].state === GameState.Finished || games[id].state === GameState.Timeout)
    .forEach(id => {
      games[id] = null;
      delete games[id];
      console.log("Deleting game " + id + " remaining: " + Object.keys(games).length);
    })
}