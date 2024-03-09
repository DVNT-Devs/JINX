import { ActionRowBuilder, ButtonBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ButtonStyle, CommandInteraction, PermissionFlagsBits } from "discord.js";


type buttonColours = "Primary" | "Secondary" | "Success" | "Danger";
const defaultTexts: Record<string, [string, buttonColours, string]> = {
    "global:secret": ["Share a secret", "Danger", "Secret (Only if broken)"],
    "global:onboard": ["Get started", "Primary", "Onboard"],
    "global:rules": ["Read the rules", "Danger", "Rules"],
    "global:ticket.create:verify": ["Age Verification", "Primary", "Age Verification Ticket"],
    "global:ticket.create:report": ["Report", "Danger", "Report Ticket"],
    "global:ticket.close": ["Close ticket", "Danger", "Close Ticket"],
    "global:ticket.close:reason": ["Close with reason", "Danger", "Close with Reason"],
};


const buttons = new SlashCommandBuilder()
    .setName("buttons")
    .setDescription("Sends a button for users to press (Mod Only)")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of button to send")
        .addChoices(...Object.entries(defaultTexts).map(([key, [text]]) => ({ name: text, value: key })))
        .setRequired(true)
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


const callback = async (interaction: CommandInteraction) => {
    const type = interaction.options.get("type")?.value as keyof typeof defaultTexts;
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
    buttons as command,
    callback
};
