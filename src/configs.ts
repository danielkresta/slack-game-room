export const ALLOWED_CHANNELS = [
  "G013AEBN8FL", // gr-test
  "GKB7VCTGV", // brno_offline_gaming
];

export const GARBAGE_COLLECTION_INTERVAL_MS = 1000 * 60 * 60;

export const DEFAULT_GAME_TIMEOUT_MS = 1000 * 60 * 60;
export const DARTS_GAME_TIMEOUT_MS = 1000 * 60 * 10;

export const SLACK_COMMANDS = {
  football: "/football",
  pong: "/atari",
  darts: "/darts",
  chess: "/chess",
  /**
   * Test commands
   */
  footballTest: "/fusball",
};

export const SLACK_ACTION_IDS = {
  joinButton: "game_join",
  leaveButton: "game_leave",
};

export const TEST_MODE = false;
