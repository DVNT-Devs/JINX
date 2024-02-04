import { ButtonBuilder, EmbedBuilder, StringSelectMenuBuilder, StringSelectMenuOptionBuilder } from "@discordjs/builders";
import { APIMessageComponentEmoji, ActionRowBuilder, ButtonInteraction, ButtonStyle, CommandInteraction, GuildMemberRoleManager, StringSelectMenuInteraction, parseEmoji } from "discord.js";
import data from "../data";

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
        name: "Hello!",
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
    },
    {
        name: "Events and Extras",
        text: "Select some roles for things you're interested in!",
        roleOptions: [
            { name: "Programmer / Developer", roleId: data.roles.developer, emoji: "💻" },
            { name: "Game Nights", roleId: data.roles.events.game, emoji: "🎲" },
        ],
    },
    {
        name: "Onboarding complete!",
        text: "You're all set! Welcome to DVNT!"
    }
];

const callback = async (interaction: CommandInteraction | ButtonInteraction, skipWelcome: boolean) => {
    const memberList = await interaction.guild!.members.fetch();
    const localSteps = steps.map(x => x);
    if (skipWelcome) localSteps.shift();
    const memberRoles = (interaction.member!.roles as GuildMemberRoleManager).cache.map(r => r.id);
    // Find the first step where the user doesn't have any of the roles
    // If they have roles in every one, go to the last step
    // If they have none, go to the first step
    let step = 0;
    const roleInStep = localSteps.map(step => step.roleOptions?.some(r => memberRoles.includes(r.roleId)));
    step = roleInStep.indexOf(false);
    if (step === -1) step = localSteps.length - 2;
    const m = await interaction.reply({ embeds: [new EmbedBuilder()
        .setTitle("One moment...")
        .setColor(0xF27878)
    ], ephemeral: true, fetchReply: true });
    let closed = false;
    while (!closed) {
        const userRoleIDs = (interaction.member!.roles as GuildMemberRoleManager).cache.map(r => r.id);
        const stepData = localSteps[step]!;

        let roleDropdown = undefined;
        if (stepData.roleOptions) {
            roleDropdown = new StringSelectMenuBuilder()
                .setCustomId("roleDropdown")
                .setPlaceholder("Select a role")
                .setMinValues(1)
                .setMaxValues(stepData.maxRoles || stepData.roleOptions.length);
            for (const roleOption of stepData.roleOptions) {
                const hasRole = userRoleIDs.includes(roleOption.roleId);
                const membersWithRole = memberList.filter(m => m.roles.cache.has(roleOption.roleId)).size;
                const option = new StringSelectMenuOptionBuilder()
                    .setLabel(roleOption.name)
                    .setValue(roleOption.roleId || "unset")
                    .setDescription(hasRole ? `You and ${membersWithRole} others` : `${membersWithRole} members`)
                    .setDefault(hasRole)
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
                .setStyle(ButtonStyle.Danger)
                .setDisabled(step === 0),
            new ButtonBuilder()
                .setCustomId("pageIndicator")
                .setLabel(`Page ${step + 1}/${localSteps.length}`)
                .setStyle(ButtonStyle.Secondary)
                .setDisabled(true),
            new ButtonBuilder()
                .setCustomId("next")
                .setLabel("Next")
                .setStyle(ButtonStyle.Success)
                .setDisabled(step === localSteps.length - 1)
        ];

        const components = [];
        if (roleDropdown) components.push(new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(roleDropdown));
        components.push(new ActionRowBuilder<ButtonBuilder>().addComponents(controls));
        await interaction.editReply({ embeds: [new EmbedBuilder()
            .setTitle(stepData.name)
            .setDescription(stepData.text || "")
            .setColor(0xF27878)
        ], components: components });

        let i: StringSelectMenuInteraction | ButtonInteraction;
        try {
            i = await m.awaitMessageComponent({ filter: (i) =>
                i.user.id === interaction.user.id && m.id === i.message.id,
            time: 60000 }) as typeof i;
        } catch (e) {
            closed = true;
            break;
        }
        await i.deferUpdate();
        if (i.customId === "back") {
            step = Math.max(0, step - 1);
        } else if (i.customId === "next") {
            step = Math.min(localSteps.length - 1, step + 1);
        } else if (i.customId === "roleDropdown") {
            const select = i as StringSelectMenuInteraction;
            // Add every role they selected if they don't already have it
            const rolesToAdd = select.values.filter(v => !userRoleIDs.includes(v));
            // Then remove every role they didn't select if they have it
            const rolesToRemove = stepData.roleOptions!
                .map(r => r.roleId)
                .filter(r => !select.values.includes(r) && userRoleIDs.includes(r));

            await (interaction.member!.roles as GuildMemberRoleManager).add(rolesToAdd);
            await (interaction.member!.roles as GuildMemberRoleManager).remove(rolesToRemove);
        }
    }
};

export default callback;
