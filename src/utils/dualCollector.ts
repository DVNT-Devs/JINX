import { ButtonBuilder, ChannelSelectMenuBuilder, RoleSelectMenuBuilder, UserSelectMenuBuilder } from "@discordjs/builders";
import { ButtonInteraction, ChannelSelectMenuInteraction, CommandInteraction, MentionableSelectMenuBuilder, MentionableSelectMenuInteraction, ModalSubmitInteraction, RoleSelectMenuInteraction, StringSelectMenuBuilder, StringSelectMenuInteraction, UserSelectMenuInteraction } from "discord.js";

type InteractionType = ButtonInteraction | StringSelectMenuInteraction | ChannelSelectMenuInteraction |
    MentionableSelectMenuInteraction | UserSelectMenuInteraction | RoleSelectMenuInteraction;
type BuilderType = ButtonBuilder | StringSelectMenuBuilder | ChannelSelectMenuBuilder |
    MentionableSelectMenuBuilder | UserSelectMenuBuilder | RoleSelectMenuBuilder;

export { InteractionType, BuilderType };

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
    }).catch((e) => console.log(e)) as ReturnType<typeof dualCollector>;
};

export default dualCollector;
