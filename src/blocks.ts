import { SectionBlock } from "@slack/types";
import { Game } from "./games/game.class";

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
                action_id: 'button_abc'
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

export const getFinishedGameBlock: (game: Game, timeout: boolean) => SectionBlock = (game, timeout) => {
    return {
        type: 'section',
        text: {
            type: 'mrkdwn',
            text: timeout ? game?.messages?.timeout : game?.messages?.finished,
        },
    }
}