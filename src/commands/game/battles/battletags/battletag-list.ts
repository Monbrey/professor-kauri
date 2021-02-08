import { MessageEmbed } from "discord.js";
import { KauriCommand } from "../../../../lib/commands/KauriCommand";
import { KauriMessage } from "../../../../lib/structures/KauriMessage";
import { BattleTag } from "../../../../models/mongo/battletag";

export default class extends KauriCommand {
  constructor() {
    super("battletag-list", {
      aliases: ["battletag-list"],
      category: "Battles",
      description: "Lists battle tags",
      clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
    });
  }

  public async interact(message: KauriMessage, args: Map<string, any>) {
    const tags = await BattleTag.find({}).sort({ tag: 1 });

    const embed = new MessageEmbed()
      .setTitle("Battle Tag Current Standings")
      .setDescription(tags.map(t => {
        let line = `**${t.tag}**: <@${t.user}>`;
        if(t.schedule.user && t.schedule.time) {
          line += `\nIn challenge with <@${t.schedule.user}> since ${new Date(t.schedule.time).toISOString().slice(0, 16).replace("T", " ")}`;
        }
        return line;
      }).join("\n"));

    // @ts-ignore
    await this.client.api.interactions(message.id)(message.interaction.token).callback.post({
      data: {
        type: 4,
        data: {
          embeds: [embed.toJSON()]
        }
      }
    });
  }
}