import { Attachment, ChatInputCommandInteraction, PermissionFlagsBits, SlashCommandBuilder } from "discord.js";
import { Colours } from "../utils/data";
import { EmbedBuilder } from "@discordjs/builders";


const embed = new SlashCommandBuilder()
    .setName("embed")
    .setDescription("Sends an embed as Jinx (Mod Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option
        .setName("title")
        .setDescription("The title of the embed")
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName("description")
        .setDescription("The description of the embed - type '\n' for a new line")
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName("colour")
        .setDescription("The colour of the button (optional)")
        .addChoices(
            { name: "Red", value: "Danger" },
            { name: "Yellow", value: "Warning" },
            { name: "Green", value: "Success" }
        )
        .setRequired(false)
    )
    .addAttachmentOption(option => option
        .setName("image-1")
        .setDescription("The first embed image (shown above the embed)")
        .setRequired(false)
    )
    .addAttachmentOption(option => option
        .setName("image-2")
        .setDescription("The second embed image")
        .setRequired(false)
    )
    .addAttachmentOption(option => option
        .setName("image-3")
        .setDescription("The third embed image")
        .setRequired(false)
    );

const callback = async (interaction: ChatInputCommandInteraction) => {
    const title = interaction.options.getString("title") as string | undefined;
    const description = interaction.options.getString("description") as string | undefined;
    const colour = interaction.options.getString("colour") as string | undefined;
    const image1 = interaction.options.getAttachment("image-1");
    const image2 = interaction.options.getAttachment("image-2");
    const image3 = interaction.options.getAttachment("image-3");

    const embed = new EmbedBuilder()
        .setColor(Colours[colour as keyof typeof Colours] || Colours.Success);

    if (title) embed.setTitle(title);
    if (description) embed.setDescription(description.replace(/\\n/g, "\n"));

    const attachments: Attachment[] = [];
    for (const image of [image1, image2, image3]) {
        if (image) { attachments.push(image); }
    }

    // const files = [image1, image2, image3].filter(Boolean) as string[];
    // Images will be added under the embed
    if (!title && !description && !attachments.length) {
        return await interaction.reply({ content: "You need to provide at least one of the following: title, description, or an image", ephemeral: true });
    }

    await interaction.deferReply();
    await interaction.channel?.send({
        embeds: (title || description) ? [embed] : [],
        files: attachments
    });
    await interaction.deleteReply();
};

export { embed as command, callback };
