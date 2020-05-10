// This example shows how to listen to a button click
// It uses slash commands and actions

import { App, MessageAction } from "@slack/bolt";
import { getFootballCommandHandler, getFootballJoinActionHandler, garbageCollector } from "./src/app-handlers";
import { GARBAGE_COLLECTION_INTERVAL_MS } from "./src/configs";

// Require the Bolt package (github.com/slackapi/bolt)
// const { App } = require("@slack/bolt");

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});


// Listen for a slash command invocation
app.command('/helloworld', getFootballCommandHandler(app));

// Listen for a button invocation with action_id `button_abc`
// You must set up a Request URL under Interactive Components on your app configuration page
app.action<MessageAction>('button_abc', getFootballJoinActionHandler(app));

(async () => {
    // Start your app
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');

    setInterval(garbageCollector, GARBAGE_COLLECTION_INTERVAL_MS);
})();

