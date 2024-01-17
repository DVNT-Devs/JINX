import { ButtonBuilder, EmbedBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji, ActionRowBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, GuildMemberRoleManager, StringSelectMenuInteraction, parseEmoji } from "discord.js";
import data from "../data";


const onboard = new SlashCommandBuilder()
    .setName("onboard")
    .setDescription("Walks you through the roles in the server");


interface RoleOption {
    name: string;
    description?: string;
    roleId: string;
    emoji: string;
}

interface Steps {
    name: string;
    text: string;
    roleOptions?: RoleOption[];
    maxRoles?: number
}

const steps: Steps[] = [
    {
        name: "Welcome",
        text: "Welcome to DVNT!" // TODO
    },
    {
        name: "Your Role",
        text: "Which of the following roles best describes you? You can pick more than one!",
        roleOptions: [
            { name: "Dominant", roleId: data.roles.dom, emoji: "😈" },
            { name: "Submissive", roleId: data.roles.sub, emoji: "❤️" },
            { name: "Switch", roleId: data.roles.switch, emoji: "🙃" },
            { name: "Exploring", roleId: data.roles.exploring, emoji: "🗺️" }
        ]
    },
    {
        name: "DMs",
        text: "Would you like to receive DMs from other members?",
        roleOptions: [
            { name: "Anyone can message", roleId: data.roles.dms.open, emoji: "✅" },
            { name: "Ask me first", roleId: data.roles.dms.ask, emoji: "⚠️" },
            { name: "No DMs", roleId: data.roles.dms.closed, emoji: "❌" }
        ],
        maxRoles: 1
    },
    {
        name: "Relationships",
        text: "What kind of relationship are you looking for? You can pick more than one!",
        roleOptions: [
            { name: "Play partner", roleId: data.roles.relationships.play, emoji: "🤙" },
            { name: "Intimate Partner", roleId: data.roles.relationships.intimate, emoji: "🫶" },
            { name: "Friends", roleId: data.roles.relationships.friends, emoji: "🤘" }
        ]
    },
    {
        name: "Flirting",
        text: "How do you feel about flirting?",
        roleOptions: [
            { name: "Fine by me!", roleId: data.roles.flirting.yes, emoji: "🥰" },
            { name: "No thanks", roleId: data.roles.flirting.no, emoji: "💔" }
        ],
        maxRoles: 1
    }
];


const callback = async (interaction: CommandInteraction) => {
    let step = 0;
    const m = await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("One moment...")
        .setColor(0xF27878)
    ], ephemeral: true });
    let closed = false;
    while (!closed) {
        const userRoleIDs = (interaction.member!.roles as GuildMemberRoleManager).cache.map(r => r.id);
        const stepData = steps[step]!;

        let roleDropdown = undefined;
        if (stepData.roleOptions) {
            roleDropdown = new StringSelectMenuBuilder()
                .setCustomId("roleDropdown")
                .setPlaceholder("Select a role")
                .setMinValues(1)
                .setMaxValues(stepData.maxRoles || stepData.roleOptions.length);
            for (const roleOption of stepData.roleOptions) {
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(roleOption.name)
                    .setValue(roleOption.roleId)
                    .setDefault(userRoleIDs.includes(roleOption.roleId))
                    .setEmoji(parseEmoji(roleOption.emoji)! as APIMessageComponentEmoji);
                if (roleOption.description) option
                    .setDescription(roleOption.description);
                roleDropdown.addOptions(option);
            }
        }

        const controls = [
            new ButtonBuilder()
                .setCustomId("back")
                .setLabel("Back")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(step === 0),
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(step === steps.length - 1)
        ];

        const components = [];
        if (roleDropdown) components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleDropdown));
        components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(controls));

        await m.edit({ embeds: [new EmbedBuilder()
            .setTitle(stepData.name)
            .setDescription(stepData.text || "")
            .setColor(0xF27878)
        ], components: components });

        let i: StringSelectMenuInteraction | ButtonInteraction;
        try {
            i = await m.awaitMessageComponent({ filter: (i) =>
                i.user.id === interaction.user.id,
            time: 60000 }) as typeof i;
        } catch (e) {
            closed = true;
            break;
        }
        await i.deferUpdate();
        if (i.customId === "back") {
            step = Math.max(0, step - 1);
        } else if (i.customId === "next") {
            step = Math.min(steps.length - 1, step + 1);
        } else if (i.customId === "roleDropdown") {
            const select = i as StringSelectMenuInteraction;
            const rolesToAdd = select.values.filter(v => !userRoleIDs.includes(v));
            const rolesToRemove = userRoleIDs.filter(v => !select.values.includes(v));

            await (interaction.member!.roles as GuildMemberRoleManager).add(rolesToAdd);
            await (interaction.member!.roles as GuildMemberRoleManager).remove(rolesToRemove);
        }
    }
};


export {
    onboard as command,
    callback
};
