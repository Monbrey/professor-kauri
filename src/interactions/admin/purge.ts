import { CommandInteraction, DMChannel, GuildMember } from 'discord.js';
import { KauriSlashCommand } from '../../lib/commands/KauriSlashCommand';

interface CommandArgs {
  count: number;
  user: GuildMember;
}

export default class extends KauriSlashCommand {
  constructor() {
    super({
      name: 'purge',
      description: 'Bulk deletes messages from the channel',
      options: [
        {
          name: 'amount',
          description: 'Number of messages to remove [default/max 100]',
          type: 'INTEGER',
        },
        {
          name: 'reset',
          description: 'Fully reset the channel',
          type: 'BOOLEAN',
        },
      ],
      guild: true,
      defaultPermission: false,
      permissions: [
        {
          type: 'USER',
          id: '122157285790187530',
          permission: true,
        },
      ],
    });
  }

  public async exec(interaction: CommandInteraction, { amount = 100, reset }: Record<string, number>): Promise<void> {
    if (!interaction.channel || !interaction.channel.isText() || !interaction.guild) {
      return interaction.reply({ content: 'No channel detected to delete messages from', ephemeral: true });
    }

    if (interaction.channel instanceof DMChannel) {
      return interaction.reply({ content: 'This command cannot be used in DMs', ephemeral: true });
    }

    try {
      if (reset) {
        await interaction.channel.clone();
        await interaction.channel.delete();
        return undefined;
      } else {
        const deleted = await interaction.channel.bulkDelete(amount, true);
        return this.client.logger.info({
          message: 'Messages pruned',
          server: { id: interaction.guild.id, name: interaction.guild.name },
          channel: { id: interaction.channel.id, name: interaction.channel.name },
          deleted: deleted.size,
          key: 'prune',
        });
      }
    } catch (e) {
      return this.client.logger.parseError(e);
    }
  }
}
