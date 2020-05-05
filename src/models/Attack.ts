import type { Attack as AttackData, Matched } from "urpg.js";

export class Attack {
    private name: any;
    private type: any;
    
    constructor(apiData: AttackData);
    constructor(apiData: Matched<AttackData>);
    constructor(apiData: any) {
        const data = apiData.value ? apiData.value : apiData;

        this.name = data.name;
        this.type = data.type;
    }

    public async info() {
        // const type = `Type: ${this.moveType}`;
        // const power = `Power: ${this.power ? this.power : "-"}`;
        // const acc = `Accuracy: ${this.accuracy ? this.accuracy : "-"}`;
        // const pp = `PP: ${this.pp}`;
        // const cat = `Category: ${this.category}`;
        // const contact = this.contact ? "Makes contact. " : "";
        // const sf = this.sheerForce ? "Boosted by Sheer Force. " : "";
        // const sub = this.substitute ? "Bypasses Substitute. " : "";
        // const snatch = this.snatch ? "Can be Snatched. " : "";
        // const mc = this.magicCoat ? "Can be reflected by Magic Coat. " : "";

        // const propString = stripIndents`| ${type} | ${power} | ${acc} | ${pp} | ${cat} |
    
        // ${this.desc}
    
        // ${contact}${sf}${sub}${snatch}${mc}`;

        // const embed = new MessageEmbed()
        //     .setTitle(this.moveName)
        //     .setDescription(propString)
        //     .setColor(await Color.getColorForType(this.moveType.toLowerCase()));

        // if (this.note) embed.addFields({ name: "**Note**", value: this.note });
        // if (this.additional) embed.addFields({ name: "**Additional note**", value: this.additional });
        // if (this.list && this.list.length !== 0) embed.addFields({ name: "**Helpful data**", value: this.list.join("\n") });
        // if (this.tm.number && this.tm.martPrice) {
        //     const tmNum = this.tm.number.toString().padStart(2, 0);
        //     const tmPrice = this.tm.martPrice.pokemart.toLocaleString();
        //     embed.addFields({ name: "**TM**", value: `Taught by TM${tmNum} ($${tmPrice})` });
        // }

        // if (this.zmove) embed.addFields({ name: "**Z-Move**", value: this.zmove });

        // return embed;
    }
}