import { Listener } from "discord-akairo";
import { Guild, User } from "discord.js";
import { wait } from "../../util";
import { stripIndents } from "common-tags";

export default class GuildBanAddListener extends Listener {
    constructor() {
        super("guildBanAdd", {
            emitter: "client",
            event: "guildBanAdd"
        });
    }

    public async exec(guild: Guild, user: User) {
        let loopCount = 0;
        const maxAge = Date.now() - 3000;

        const interval = this.client.setInterval(async () => {
            if (loopCount === 3) {
                this.client.clearInterval(interval);

                this.client.logger.info({
                    message: `${user.tag} (${user.id}) banned`,
                    embed: {
                        author: {
                            name: `Unknown executor`,
                        },
                        description: `**Member**: ${user.tag} (${user.id})\n**Action**: Ban`,
                        timestamp: Date.now(),
                        thumbnail: { url: user.displayAvatarURL({ format: "png" }) }
                    },
                    guild: guild.id
                });
            }

            const audit = await guild.fetchAuditLogs({
                limit: 1,
                type: "MEMBER_BAN_ADD",
                user
            });

            if (!audit.entries.size) return loopCount++;

            const entry = audit.entries.first()!
            if (entry.createdTimestamp < maxAge) return loopCount++;

            this.client.logger.info({
                message: `${user.tag} (${user.id}) banned by ${entry.executor.tag} (${entry.executor.id})`,
                embed: {
                    author: {
                        name: `${entry.executor.tag} (${entry.executor.id})`,
                        icon_url: entry.executor.displayAvatarURL({ format: "png" })
                    },
                    description: stripIndents`**Member**: ${user.tag} (${user.id})
                    **Action**: Ban`,
                    timestamp: entry.createdTimestamp,
                    thumbnail: { url: user.displayAvatarURL({ format: "png" }) }
                },
                guild: guild.id
            });
        }, 2000);
    }
}
