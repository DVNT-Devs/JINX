import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction, PermissionFlagsBits } from "discord.js";


const praise = new SlashCommandBuilder()
    .setName("buttons")
    .setDescription("Sends a button for users to press (Mod Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of button to send")
        .addChoices(
            { name: "Secret (Only if broken)", value: "global:secret" },
            { name: "Onboard", value: "global:onboard" },
            { name: "Rules", value: "global:rules" }
        ).setRequired(true)
    )
    .addStringOption(option => option
        .setName("colour")
        .setDescription("The colour of the button (optional)")
        .addChoices(
            { name: "Blue", value: "Primary" },
            { name: "Grey", value: "Secondary" },
            { name: "Green", value: "Success" },
            { name: "Red", value: "Danger" }
        )
        .setRequired(false)
    )
    .addStringOption(option => option
        .setName("text")
        .setDescription("The text to show on the button (optional)")
        .setMaxLength(50)
        .setRequired(false)
    );


type buttonColours = "Primary" | "Secondary" | "Success" | "Danger";
const defaultTexts: Record<string, [string, buttonColours]> = {
    "global:secret": ["Share a secret", "Danger"],
    "global:onboard": ["Get started", "Primary"],
    "global:rules": ["Read the rules", "Danger"]
};


const callback = async (interaction: CommandInteraction) => {
    const type = interaction.options.get("type")?.value as "global:secret" | "global:onboard" | "global:rules";
    const text = (interaction.options.get("text")?.value || defaultTexts[type as keyof typeof defaultTexts]![0]) as string;
    const colour = interaction.options.get("colour")?.value as buttonColours | undefined;
    const defaultColour = defaultTexts[type as keyof typeof defaultTexts]![1];
    const style = colour ? ButtonStyle[colour] : ButtonStyle[defaultColour];

    await interaction.reply({ content: "Sending...", ephemeral: true });
    await interaction.channel!.send({components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder().setCustomId(type).setLabel(text).setStyle(style)
    )]});
    await interaction.deleteReply();
};


export {
    praise as command,
    callback
};
