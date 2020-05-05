import { stripIndents } from "common-tags";
import { Message } from "discord.js";
import { findBestMatch } from "string-similarity";
import { KauriCommand } from "../../lib/commands/KauriCommand";
import { Pokemon } from "../../models/Pokemon";

const sRanks = [
    { name: "easiest", min: 3000, max: 5000 },
    { name: "simple", min: 5000, max: 10000 },
    { name: "medium", min: 10000, max: 20000 },
    { name: "hard", min: 20000, max: 30000 },
    { name: "complex", min: 30000, max: 40000 },
    { name: "demanding", min: 40000, max: 55000 },
    { name: "merciless", min: 55000, max: 65000 },
    { name: "stupefying", min: 65000, max: 75000 }
];

const pRanks = [
    { name: "common", mcr: 8000 },
    { name: "uncommon", mcr: 16000 },
    { name: "rare", mcr: 25000 },
    { name: "legendary" }
];

const rankNames = ["easiest", "simple", "medium", "hard", "complex", "demanding", "merciless", "stupefying",
    "common", "uncommon", "rare", "legendary"];

interface CommandArgs {
    query: string;
}

export default class RankCommand extends KauriCommand {
    public constructor() {
        super("Rank Lookup", {
            aliases: ["rank"],
            category: "Info",
            clientPermissions: ["SEND_MESSAGES", "EMBED_LINKS"],
            description: "View all Pokemon of a specified rank",
            requiresDatabase: true,
            usage: ["rank <pokemon>", "rank <rank name>", "rank <park location>"]
        });
    }

    public *args() {
        const query = yield {
            type: "string",
            match: "text",
            prompt: {
                start: "> Please provide the name of a Rank or Pokemon to lookup"
            }
        };

        return { query };
    }

    public async exec(message: Message, { query }: CommandArgs) {
        try {
            const { bestMatchIndex } = findBestMatch(query, rankNames)
            const match = rankNames[bestMatchIndex]

            const rankList = await this.client.urpg.species.fetchRank(match);

            if (rankList.length === 0)
                return message.util?.send(`**No results found for "${query}"**`);

            const sRank = sRanks.find(s => s.name === match);
            const pRank = pRanks.find(p => p.name === match);

            const list = rankList.join(", ");

            const title = sRank ? `${match.toTitleCase()} Story/Art Rank Pokemon` : `${match.toTitleCase()} Park Rank Pokemon`;

            const content = stripIndents`**${title}**
                Rank Requirements: ${sRank ? `${sRank.min.toLocaleString()} - ${sRank.max.toLocaleString()} characters` : `${pRank!.mcr} characters`}
                
                ${list}`;

            message.channel.send(content, { split: { char: "," } });
        } catch (e) {
            message.channel.send(`Error executing API query for rank "${query}"`);
        }
    }
}
