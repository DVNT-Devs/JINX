import { ContextMenuCommandBuilder, PermissionFlagsBits } from "discord.js";
import { userContextCallback } from "../../actions/modTools";


const command = new ContextMenuCommandBuilder()
    .setName("Mod Tools")
    .setDMPermission(false)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages);

const callback = userContextCallback;

export { command, callback };
