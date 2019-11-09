import { Message } from "discord.js";
import { GuildMember } from "discord.js";
import { MessageEmbed } from "discord.js";
import { KauriCommand } from "../../../lib/commands/KauriCommand";

interface CommandArgs {
    member: GuildMember;
    amount: number;
    currency: string;
    reason: string;
}

export default class DeductCommand extends KauriCommand {
    constructor() {
        super("deduct", {
            aliases: ["deduct"],
            category: "Game",
            description: "Removes money from a user's account",
            channel: "guild",
            defaults: { disabled: true }
        });
    }

    public *args() {
        const member = yield {
            type: "member",
            prompt: {
                start: "Which URPG member are you deducting?",
                retry: new MessageEmbed().setDescription("Please mention someone, or provide their name (case-sensitive)").setFooter(`Reply with "cancel" to end the command`),
                retries: 3
            }
        };

        const [amount, currency] = yield {
            id: "amount",
            type: "currency",
            prompt: {
                start: `How much is ${member} getting deducted?`,
                retry: new MessageEmbed().setDescription("Please provide a valid integer > 0").setFooter(`Reply with "cancel" to end the command`),
                retries: 3
            }
        };

        const reason = yield {
            match: "rest",
            prompt: {
                start: "What's the reason for this deduction?",
            }
        };

        return { member, amount, currency, reason };
    }

    public async exec(message: Message, { member, amount, currency, reason }: CommandArgs) {
        if (!member.trainer) {
            return message.channel.embed(
                "warn",
                `Could not find a Trainer profile for ${member}`
            );
        }

        const currencyString = currency === "$" ? `$${amount.toLocaleString()}` : `${amount.toLocaleString()} CC`;

        const embed = new MessageEmbed()
            .setTitle(`Deduction from ${member.displayName} (Pending)`)
            .setDescription(reason)
            .addField("Amount", `${currencyString}`, true)
            .setFooter("React to confirm that this deduction is correct");

        try {
            const prompt = await message.channel.send(embed);

            if (await prompt.reactConfirm(message.author!.id)) {
                prompt.reactions.removeAll();

                try {
                    if (currency === "$") await member.trainer.modifyBalances({ cash: amount });
                    else await member.trainer.modifyBalances({ cc: amount });

                } catch (e) {
                    this.client.logger.parseError(e);
                }

                embed
                    .setTitle(`Deduction from ${member.displayName}`)
                    .addField("Updated Balance", member.trainer.balance);

                prompt.edit(embed);
                return this.client.logger.pay(message, prompt);
            }
        } catch (e) {
            this.client.logger.parseError(e);
        }
    }
}
