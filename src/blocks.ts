import { SectionBlock } from "@slack/types";
import { Game } from "./games/game.class";
import { SLACK_ACTION_IDS } from "./configs";
import { GameState } from "./games/game.types";

export const getGameRequestBlock = (game: Game, addJoinButton: boolean): SectionBlock => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: game.state === GameState.Ready ? game.messages.ready : game.messages.created,
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

export const getPlayersBlock = (game: Game): SectionBlock => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: game?.messages?.players
        },
    }
}

export const getFinishedGameBlock = (text: string): SectionBlock => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text,
        },
    }
}