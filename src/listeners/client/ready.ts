import { Listener } from "discord-akairo";
import { Settings } from "../../models/settings";

export default class ReadyListener extends Listener {
    constructor() {
        super("ready", {
            emitter: "client",
            event: "ready"
        });
    }

    public async exec() {
        this.client.logger.info({ message: `Logged in as "${this.client.user!.username}"`, guild: "412130302958239745" });

        for (const [id, guild] of this.client.guilds.cache) {
            if (!this.client.settings?.has(id)) {
                const config = await Settings.create({ guild_id: id });
                this.client.settings?.set(id, config);
            }
        }

        // const ranks = await this.client.urpg.parkRank.list();

        // for(const rank of ranks.slice(1)) {
        //     const list = await this.client.urpg.species.fetchRank(rank);
        //     const pokemon = await Pokemon.find({ uniqueName: { $in: list }});

        //     for(const p of pokemon) {
        //         if(p.rank?.park !== rank) {
        //             //await p.update({ rank: { park: rank, art: rank }});
        //             console.log(`${p.uniqueName} updated from ${p.rank?.park} to ${rank}`)
        //         }
        //     }
        // }
    }
}
