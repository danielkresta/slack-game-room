import { App, BlockAction, BlockButtonAction, SlackAction } from "@slack/bolt";
import {
  getGameCommandHandler,
  getJoinActionHandler,
  garbageCollector,
  getLeaveActionHandler,
} from "./src/app-handlers";
import {
  GARBAGE_COLLECTION_INTERVAL_MS,
  SLACK_COMMANDS,
  SLACK_ACTION_IDS,
} from "./src/configs";
import { GameType } from "./src/games/game.types";
import { healthCheck, helloThereHealthCheck } from "./src/health-check";

if (process.env.NODE_ENV !== "prod") {
  require("dotenv").config();
}

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  customRoutes: [healthCheck, helloThereHealthCheck],
});

// Listen for slash command invocations
app.command(
  SLACK_COMMANDS.football,
  getGameCommandHandler(app, GameType.Foosball)
);
app.command(
  SLACK_COMMANDS.pong,
  getGameCommandHandler(app, GameType.AtariPong)
);
app.command(SLACK_COMMANDS.chess, getGameCommandHandler(app, GameType.Chess));
// app.command(SLACK_COMMANDS.darts, getGameCommandHandler(app, GameType.Darts));

// Test environment commands
if (process.env.STAGE === "test") {
  app.command(
    SLACK_COMMANDS.footballTest,
    getGameCommandHandler(app, GameType.Foosball)
  );
}

// Listen for actions
app.action<BlockAction>(SLACK_ACTION_IDS.joinButton, getJoinActionHandler(app));
app.action<BlockButtonAction>(
  SLACK_ACTION_IDS.leaveButton,
  getLeaveActionHandler(app)
);

(async () => {
  const port = process.env.PORT || 3000;
  await app.start(port);

  console.log(`⚡️ Bolt app is running at port ${port}!`);

  setInterval(garbageCollector, GARBAGE_COLLECTION_INTERVAL_MS);
})();
