import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, SlashCommandBuilder } from "@discordjs/builders";
import { ButtonInteraction, ButtonStyle, CommandInteraction, GuildTextBasedChannel } from "discord.js";
import { Colours, rules } from "../utils/data";
import emojis from "../data/emojis.json";
import { promises as fs } from "fs";
import { join } from "path";


const suggest = new SlashCommandBuilder()
    .setName("suggest")
    .setDescription("Suggest a phrase to be added to the bot")
    .addStringOption(option => option
        .setName("type")
        .setDescription("The type of phrase you're suggesting")
        .addChoices(
            { name: "Praise", value: "praise" },
            { name: "Degradation", value: "degrade" },
            { name: "Mean", value: "mean" }
        ).setRequired(true)
    )
    .addStringOption(option => option
        .setName("targets")
        .setDescription("Should this phrase be for doms, subs, or everyone?")
        .addChoices(
            { name: "Doms", value: "dom" },
            { name: "Subs", value: "sub" },
            { name: "Everyone", value: "everyone" }
        ).setRequired(true)
    )
    .addStringOption(option => option
        .setName("phrase")
        .setDescription("The phrase you're suggesting")
        .setMaxLength(280)
        .setRequired(true)
    );

const suggestionsPath = join(__dirname, "..", "..", "globals", "suggestions.json");
// If the file doesn't exist, create it
type categories = "praise" | "degrade" | "mean";
type targets = "dom" | "sub" | "everyone";
type data = Record<categories, Record<targets, string[]>>
const emptyData: data = {
    praise: {
        dom: [],
        sub: [],
        everyone: []
    },
    degrade: {
        dom: [],
        sub: [],
        everyone: []
    },
    mean: {
        dom: [],
        sub: [],
        everyone: []
    }
};

fs.access(suggestionsPath).catch(() => fs.writeFile(suggestionsPath, JSON.stringify(emptyData, null, 2)));
// Check if any keys are missing
void fs.readFile(suggestionsPath, "utf-8").then(data => {
    const suggestions = JSON.parse(data) as typeof emptyData;
    for (const category of Object.keys(emptyData)) {
        for (const target of Object.keys(emptyData[category as categories])) {
            if (!suggestions[category as categories][target as targets]) {
                suggestions[category as categories][target as targets] = [];
            }
        }
    }
    void fs.writeFile(suggestionsPath, JSON.stringify(suggestions, null, 2));
});

async function logSuggestion(
    suggestion: string,
    type: keyof typeof emptyData,
    targets: keyof typeof emptyData.praise
): Promise<void> {
    const data = JSON.parse(await fs.readFile(suggestionsPath, "utf-8") || "{}") as typeof emptyData;
    data[type][targets].push(suggestion);
    await fs.writeFile(suggestionsPath, JSON.stringify(data, null, 2));
}

const formatted = {
    praise: "Praise",
    degrade: "Degradation",
    mean: "Mean",
    dom: "Doms",
    sub: "Subs",
    everyone: "Everyone"
};

const backFormat = (value: string) => {
    // Find which key has the value provided
    for (const key of Object.keys(formatted)) {
        if (formatted[key as keyof typeof formatted].toLowerCase() === value.toLowerCase()) {
            return key;
        }
    }
    return value;
};

export async function approveSuggestion(interaction: ButtonInteraction): Promise<void> {
    const embed = interaction.message.embeds[0]!;
    const fields = embed.fields;
    const type = backFormat(fields[0]!.value.toLowerCase()) as categories;
    const targets = backFormat(fields[1]!.value.toLowerCase()) as targets;
    const phrase = fields[2]!.value;

    await logSuggestion(phrase, type, targets);

    await interaction.message.edit({ embeds: [new EmbedBuilder()
        .setTitle("Suggestion approved")
        .setDescription(embed.description + `\nApproved by <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`)
        .setColor(Colours.Success)
        .addFields(...embed.fields)
    ], components: [] });
}
export async function denySuggestion(interaction: ButtonInteraction): Promise<void> {
    const embed = interaction.message.embeds[0]!;
    await interaction.message.edit({ embeds: [new EmbedBuilder()
        .setTitle("Suggestion denied")
        .setDescription(embed.description + `\nDenied by <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`)
        .setColor(Colours.Danger)
        .setFields(embed.fields)
    ], components: [] });
}

const callback = async (interaction: CommandInteraction) => {
    const type = interaction.options.get("type")?.value as "praise" | "degrade" | "mean";
    const targets = interaction.options.get("targets")?.value as "dom" | "sub" | "everyone";
    const phrase = interaction.options.get("phrase")?.value as string;

    // Check if the phrase is already in the list
    const data = JSON.parse(await fs.readFile(suggestionsPath, "utf-8") || "{}") as typeof emptyData;
    const alreadyExists = data[type][targets].includes(phrase);
    if (alreadyExists) {
        await interaction.reply({ embeds: [new EmbedBuilder()
            .setTitle("Phrase already exists")
            .setDescription("That phrase is already in the list!")
            .setColor(Colours.Danger)
        ], ephemeral: true});
        return;
    }
    // It's a new suggestion! In this case we need to send it to the moderators for approval
    const approvalChannel = interaction.guild!.channels.cache.get(rules.channels.suggestions) as GuildTextBasedChannel;
    const roleName = emojis.roles[targets.replace("everyone", "switch") as keyof typeof emojis.roles] as string;
    await approvalChannel.send({ embeds: [new EmbedBuilder()
        .setTitle(`<:role:${roleName}> New suggestion`)
        .setDescription(
            `Suggested by <@${interaction.user.id}> <t:${Math.floor(Date.now() / 1000)}:R>`
        )
        .addFields(
            { name: "Type of Phrase", value: formatted[type], inline: true },
            { name: "Targets", value: `${formatted[targets]}`, inline: true },
            { name: "Phrase", value: phrase }
        )
        .setColor(Colours.Warning)
    ], components: [new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
            .setCustomId("global:mod/approve")
            .setLabel("Approve")
            .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId("global:mod/deny")
            .setLabel("Deny")
            .setStyle(ButtonStyle.Danger)
    )] });
    void interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("Suggestion sent")
        .setDescription("Your suggestion has been sent to the moderators for approval!")
        .setColor(Colours.Success)
    ], ephemeral: true});
};

export { suggest as command, callback };
