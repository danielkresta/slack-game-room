import { SectionBlock } from "@slack/types";
import { Game } from "./games/game.class";
import { SLACK_ACTION_IDS } from "./configs";

export const getGameRequestBlock: (game: Game, addJoinButton: boolean) => SectionBlock = (game, addJoinButton) => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: game?.messages?.created,
        },
        accessory: addJoinButton ? 
            {
                type: 'button',
                text: {
                    type: "plain_text",
                    text: game?.messages?.joinButton,
                    emoji: true,
                },
                action_id: SLACK_ACTION_IDS.joinButton
            }
            : null,
    }
}

export const getPlayersBlock: (game: Game) => SectionBlock = (game) => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: game?.messages?.players
        },
    }
}

export const getFinishedGameBlock: (text: string) => SectionBlock = (text) => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text,
        },
    }
}