import { App, MessageAction, BlockAction, ButtonAction } from "@slack/bolt";
import { getGameCommandHandler, getJoinActionHandler, garbageCollector, getLeaveActionHandler } from "./src/app-handlers";
import { GARBAGE_COLLECTION_INTERVAL_MS, SLACK_COMMANDS, SLACK_ACTION_IDS } from "./src/configs";
import { GameType } from "./src/games/game.types";

if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

const app = new App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET
});


// Listen for slash command invocations
app.command(SLACK_COMMANDS.football, getGameCommandHandler(app, GameType.Foosball));
app.command(SLACK_COMMANDS.pong, getGameCommandHandler(app, GameType.AtariPong));
// app.command(SLACK_COMMANDS.darts, getGameCommandHandler(app, GameType.Darts));

// Listen for actions
app.action<MessageAction>(SLACK_ACTION_IDS.joinButton, getJoinActionHandler(app));
app.action<BlockAction<ButtonAction>>(SLACK_ACTION_IDS.leaveButton, getLeaveActionHandler(app));

(async () => {
    await app.start(process.env.PORT || 3000);

    console.log('⚡️ Bolt app is running!');

    setInterval(garbageCollector, GARBAGE_COLLECTION_INTERVAL_MS);
})();
