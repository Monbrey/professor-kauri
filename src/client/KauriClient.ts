// Dependencies
import { stripIndent } from "common-tags";
import { AkairoClient, CommandHandler, InhibitorHandler, ListenerHandler } from "discord-akairo";
import { ClientOptions, Collection, Message } from "discord.js";
import { Connection } from "mongoose";
import queue from "p-queue";
import { join } from "path";
import { Client as UrpgClient } from "urpg.js";
import { Logger } from "winston";
import { KauriCommand } from "../lib/commands/KauriCommand";
// Models
import { IRoleConfig, RoleConfig } from "../models/roleConfig";
import { ISettings, Settings } from "../models/settings";
// Utilities
import { db, instanceDB } from "../util/db";
import { createCustomLogger } from "../util/logger";

interface IKauriClient {
    commandHandler: CommandHandler;
    inhibitorHandler: InhibitorHandler;
    listenerHandler: ListenerHandler;
    logger: Logger;
    prefix: (m: Message) => string;
    reactionQueue: queue;
    roleConfigs?: Collection<string, IRoleConfig>;
    settings?: Collection<string, ISettings>;
    urpg: UrpgClient;

    db: {
        main: Connection;
        instance: Connection;
    };
}

declare module "discord-akairo" {
    interface AkairoClient extends IKauriClient { }
}

export default class KauriClient extends AkairoClient {
    public logger: Logger;
    public reactionQueue: queue;
    public roleConfigs?: Collection<string, IRoleConfig>;
    public settings?: Collection<string, ISettings>;

    public commandHandler: CommandHandler;
    public inhibitorHandler: InhibitorHandler;
    public listenerHandler: ListenerHandler;

    public urpg: UrpgClient;

    constructor(options: ClientOptions = {}) {
        super({ ownerID: "122157285790187530", fetchAllMembers: true }, options);

        this.logger = createCustomLogger(this);
        this.urpg = new UrpgClient({ nullHandling: true });

        this.db = {
            main: db,
            instance: instanceDB
        };

        this.reactionQueue = new queue({
            concurrency: 1,
            autoStart: true,
            intervalCap: 1,
            interval: 100
        });

        this.commandHandler = new CommandHandler(this, {
            argumentDefaults: { prompt: { time: 60000, cancel: "Command cancelled" } },
            directory: join(__dirname, "..", "commands"),
            commandUtil: true,
            commandUtilLifetime: 60000,
            fetchMembers: true,
            handleEdits: true,
            prefix: message => message.guild ? this.settings?.get(message.guild?.id)?.prefix || "!" : "!",
            storeMessages: true,
        })

        this.commandHandler.resolver
            .addType("ability", async (message: Message, phrase: string) => {
                if (!phrase) return;
                const response = await this.urpg.ability.fetchClosest(phrase);
                if (response) return response;
            })
            .addType("attack", async (message: Message, phrase: string) => {
                if (!phrase) return;
                const response = await this.urpg.attack.fetchClosest(phrase);
                if (response) return response;
            })
            .addType("pokemon", async (message: Message, phrase: string) => {
                if (!phrase) return;

                phrase = phrase.replace(/-G$/gi, "-Galar").replace(/-A/gi, "-Alola");
                console.log(phrase);
                const response = await this.urpg.species.fetchClosest(phrase);
                if (response) return response;
            })
            .addType("pokemonTeam", (message: Message, phrase: string) => {
                if (!phrase) return;
                return phrase.split(/,\s+?/).map(p => this.commandHandler.resolver.type("pokemon")(message, phrase));
            });

        this.commandHandler.on("commandFinished", (message, command, args) => {
            const logMessage = stripIndent`
            ${message.author.tag} (${message.author.id}) ran ${command.id} in #${message.channel.type === "dm" ? "DM" : message.channel.name}
                args : ${JSON.stringify(args)}
                url  : ${message.url}`;

            if (!command.logToDiscord) return this.logger.info(logMessage);

            const embed = {
                author: {
                    name: `${message.author.tag} (${message.author.id})`,
                    icon_url: message.author.displayAvatarURL({ format: "png" })
                },
                description: stripIndent`
                Ran command "${command.id}" in #${message.channel.type === "dm" ? "DM" : message.channel.name}
                args: \`${JSON.stringify(args)}\`
                url: ${message.deleted ? "Message deleted" : `[Go to Message](${message.url})`}`,
                timestamp: Date.now(),
            }

            return this.logger.info({ message: logMessage, embed, guild: message.guild?.id });

        })

        this.inhibitorHandler = new InhibitorHandler(this, {
            directory: join(__dirname, "..", "inhibitors"),
        });

        this.listenerHandler = new ListenerHandler(this, {
            directory: join(__dirname, "..", "listeners"),
        });
    }

    public async start() {
        await this.init();
        return this.login(process.env.KAURI_TOKEN).catch(e => this.logger.error(e));
    }

    private async init() {
        this.settings = new Collection((await Settings.find()).map(s => [s.guild_id, s]));
        this.roleConfigs = new Collection((await RoleConfig.find()).map(r => [r.role_id, r]));

        this.commandHandler.useInhibitorHandler(this.inhibitorHandler);
        this.commandHandler.useListenerHandler(this.listenerHandler);

        this.listenerHandler.setEmitters({
            commandHandler: this.commandHandler
        });

        this.commandHandler.loadAll();
        this.inhibitorHandler.loadAll();
        this.listenerHandler.loadAll();
    }

    public getTypeEmoji(type?: string, reverse: boolean = false) {
        console.log(type);
        if (!type) return;
        return this.emojis.cache.find(x => x.name === `type_${type.toLowerCase()}${reverse ? "_rev" : ""}`);
    }
}
