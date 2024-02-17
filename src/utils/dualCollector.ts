import { ButtonInteraction, ChannelSelectMenuInteraction, CommandInteraction, MentionableSelectMenuInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuInteraction, UserSelectMenuInteraction } from "discord.js";

type InteractionType = ButtonInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction |
    MentionableSelectMenuInteraction | UserSelectMenuInteraction | RoleSelectMenuInteraction;

export { InteractionType };

const dualCollector = async (
    interaction: CommandInteraction | ButtonInteraction,
    interactionCheck?: (i: InteractionType) => boolean,
    modalCheck?: (i: ModalSubmitInteraction) => boolean
):Promise<ModalSubmitInteraction | InteractionType | null> => {
    interactionCheck = interactionCheck || (() => true);
    modalCheck = modalCheck || (() => true);
    return await new Promise((resolve) => {
        const messageCollector = interaction.channel!.createMessageComponentCollector({
            filter: (i) => i.user.id === interaction.user.id && interactionCheck!(i),
            time: 60000 * 5
        }).on("collect", async (i) => {
            if (i.isButton() || i.isStringSelectMenu() || i.isChannelSelectMenu()) { resolve(i); }
        });
        void interaction.awaitModalSubmit({
            filter: (i) => i.user.id === interaction.user.id && modalCheck!(i),
            time: 60000 * 5
        }).then((i) => {
            messageCollector.stop();
            resolve(i);
            return i;
        }).catch(() => null);
    }).catch(() => null) as ReturnType<typeof dualCollector>;
};

export default dualCollector;
