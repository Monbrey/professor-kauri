import { stripIndents } from "common-tags";
import { GuildMember, Message, Role } from "discord.js";
import { KauriCommand } from "../../lib/commands/KauriCommand";
import { RoleConfig } from "../../models/roleConfig";

interface ICommandArgs {
    role: Role;
    member: GuildMember;
}

export default class AddRoleCommand extends KauriCommand {
    constructor() {
        super("manageRoles", {
            aliases: ["addRole", "removeRole", "role"],
            category: "Admin",
            description: "Grants roles to URPG members",
            channel: "guild",
            clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS", "MANAGE_ROLES"],
        });
    }

    public *args() {
        const role = yield {
            type: "role",
            unordered: true
        };

        const member = yield {
            type: "member",
            unordered: true
        };

        return { role, member };
    }

    private async addRole(message: Message, role: Role, member: GuildMember) {
        try {
            await member.roles.add(role);
            return message.util!.embed("success", `${role} added to ${member}`);
        } catch (e) {
            return message.util!.embed("error", { title: "Error adding role", description: e.message });
        }
    }

    private async removeRole(message: Message, role: Role, member: GuildMember) {
        try {
            await member.roles.remove(role);
            return message.util!.embed("success", `${role} removed from ${member}`);
        } catch (e) {
            return message.util!.embed("error", { title: "Error removing role", description: e.message });
        }
    }

    public async exec(message: Message, { role, member }: ICommandArgs) {
        const alias = message.util?.parsed?.alias;

        if (!alias) return;
        if (!role) return;

        const config = await RoleConfig.findOne({ role_id: role.id });
        if (!config) return message.util!.embed("warn", stripIndents`${role} is not managed by this command.
            If you think this is an error, please open an issue on [GitHub](url)`);;

        const roleFunc = this[alias as keyof this] || member?.roles.has(role.id) || message.member?.roles.has(role.id) ? this.removeRole : this.addRole;

        if (!member) {
            if (!config.self) return;
            return roleFunc(message, role, message.member!);
        }


        if (message.author.id === this.client.ownerID || config.parents?.some(p => message.member?.roles.has(p)))
            return roleFunc(message, role, member);

        return message.util!.embed("warn", stripIndents`Your roles do not grant permission to manage ${role}.
            If you think this is an error, please open an issue on [GitHub](url)`);
    }
}