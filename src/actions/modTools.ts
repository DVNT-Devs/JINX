import { APIMessageComponentEmoji, ButtonInteraction, ButtonStyle, ModalSubmitInteraction, TextInputStyle, UserContextMenuCommandInteraction, parseEmoji } from "discord.js";
import DB from "../database/drizzle";
import { flags } from "../database/schema";
import { eq } from "drizzle-orm";
import { ActionRowBuilder, ButtonBuilder, EmbedBuilder, ModalBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextInputBuilder } from "@discordjs/builders";
import { Colours } from "../data";
import dualCollector from "../utils/dualCollector";

const flagBits: {name: string, description: string, emoji: string}[] = [
    {name: "Creepy Behavior", description: "The user is exhibiting creepy behavior", emoji: "👀"},
    {name: "Unwanted DMs", description: "The user is sending unwanted DMs", emoji: "📩"},
    {name: "Spam", description: "The user is spamming", emoji: "🚫"},
    {name: "Wrong Channels", description: "The user is posting in the wrong channels", emoji: "🔇"},
    {name: "Watchlist", description: "The user is on the watchlist", emoji: "🕵️"}
];

const integerToBooleanArray = (num: number) => {
    const arr = num.toString(2).split("").reverse();
    // Always return an array of the same length as bitFlags
    const sameLength = arr.map((bit) => bit === "1").concat(new Array(flagBits.length - arr.length).fill(false));
    return sameLength;
};
const indexArrayToInteger = (arr: number[]) => {
    let out = 0;
    for (const i of arr) { out |= 1 << i; }
    return out;
};


const userContextCallback = async (interaction: UserContextMenuCommandInteraction) => {
    const m = await interaction.deferReply({ ephemeral: true });
    const db = await DB;
    const breakOut = false;
    const defaultData = {
        member: interaction.targetUser.id,
        flags: 0,
        note: ""
    };

    // Fetch the user's data from the database
    const data = await db.select().from(flags).where(eq(flags.member, interaction.targetUser.id));
    let userData;
    let dbEntry: boolean = data.length > 0;
    do {
        userData = userData || data[0] || defaultData;
        const flagArray = integerToBooleanArray(userData.flags);
        let updateDB = false;

        const select = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(new StringSelectMenuBuilder()
            .setCustomId("flagSelect")
            .setPlaceholder("Select a flag")
            .setMaxValues(flagBits.length)
            .setMinValues(0)
            .addOptions(flagBits.map((flag, index) => new StringSelectMenuOptionBuilder()
                .setLabel(flag.name)
                .setDescription(flag.description)
                .setEmoji(parseEmoji(flag.emoji) as APIMessageComponentEmoji)
                .setValue(index.toString())
                .setDefault(flagArray[index])
            ))
        );
        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder()
            .setCustomId("note")
            .setLabel(userData.note ? "Edit Note" : "Add Note")
            .setStyle(ButtonStyle.Primary)
        );

        const formatNote = (note: string) => note.split("\n").map((line) => `> ${line}`).join("\n");

        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle("Mod Tools")
            .setDescription(
                `**Member:** <@${interaction.targetUser.id}>\n\n` +
                ("**User note:**" + (userData.note ? `\n${formatNote(userData.note)}` : " *None set*")) +
                `\n\n**Flags:** ${flagArray.filter(flag => flag).length}`
            )
            .setColor(Colours.Success)
        ], components: [select, buttons] });

        const i = await dualCollector(
            interaction,
            (i) => i.message.id === m.id
        );

        if (!i) { break; }
        const customId = i.customId;
        if (i.isStringSelectMenu()) {
            await i.deferUpdate();
            userData.flags = indexArrayToInteger(i.values.map((v) => parseInt(v)));
            updateDB = true;
        } else if (customId === "note") {
            await (i as ButtonInteraction).showModal(new ModalBuilder()
                .setTitle("Add a note")
                .setCustomId("modToolsModal")
                .addComponents(new ActionRowBuilder<TextInputBuilder>().addComponents(new TextInputBuilder()
                    .setCustomId("noteValue")
                    .setPlaceholder("Enter a note")
                    .setLabel("Note")
                    .setMaxLength(2000)
                    .setRequired(false)
                    .setStyle(TextInputStyle.Paragraph)
                    .setValue(userData.note || "")
                ))
            );
        } else if (i.isModalSubmit()) {
            let note = (i as ModalSubmitInteraction).fields.getField("noteValue")?.value;
            await i.deferUpdate();
            // Strip whitespace
            note = note?.trim() || "";
            userData.note = note;
            updateDB = true;
        }
        if (!updateDB) { continue; }
        if (dbEntry) {
            await db.update(flags).set(userData).where(eq(flags.member, interaction.targetUser.id));
        } else {
            await db.insert(flags).values(userData);
            dbEntry = true;
        }
    } while (!breakOut);
};

export { userContextCallback, flagBits };
