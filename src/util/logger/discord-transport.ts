import type { TextChannel } from "discord.js";
import Transport, { TransportStreamOptions } from "winston-transport";
import type KauriClient from "../../client/KauriClient";

export class DiscordTransport extends Transport {
    private client: KauriClient;

    constructor(options: TransportStreamOptions & { client: KauriClient }) {
        super(options);

        this.client = options.client;
    }

    async log(info: any, callback: () => void) {
        setImmediate(() => {
            this.emit('logged', info)
        })

        let channel;
        if (info.channel) {
            channel = this.client.channels.cache.get(info.channel) as TextChannel;
        } else if (info.guild) {
            const settings = this.client.settings?.get(info.guild);
            if (settings?.logs) {
                channel = this.client.channels.cache.get(settings.logs) as TextChannel;
            }
        } else {
            channel = this.client.channels.cache.get("705602919763935253") as TextChannel;
        }

        if (channel) channel.send(info.embed ? { embed: info.embed } : info.message);

        callback();
    }
}