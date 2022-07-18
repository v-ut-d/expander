import {
    APIEmbed,
    Client,
    GuildTextBasedChannel,
    Message,
    PermissionFlagsBits,
} from 'discord.js';

function isProperMatch(match: RegExpMatchArray): match is {
    groups: {
        guild: string;
        channel: string;
        message: string;
    };
} & RegExpMatchArray {
    return (
        !!match.groups &&
        !!match.groups.guild &&
        !!match.groups.channel &&
        !!match.groups.message
    );
}

export default function expand(client: Client<true>, message: Message) {
    async function getMessage(
        match: RegExpMatchArray
    ): Promise<[GuildTextBasedChannel, Message]> {
        if (!isProperMatch(match)) throw new Error('not proper match');
        if (match.groups.guild != message.guild?.id)
            throw new Error(
                `\`${match[0]}\`\nis not from this server. I could not expand it.`
            );

        let channel = await message.guild.channels.fetch(match.groups.channel);
        if (!channel)
            throw new Error(`channel <#${match.groups.channel}> not found.`);

        if (!channel.isTextBased())
            throw new Error(`\`${channel}\` is not a text channel.`);

        let allowed = channel
            .permissionsFor(client.user)
            ?.has(PermissionFlagsBits.ReadMessageHistory);
        if (!allowed)
            throw new Error(
                `I didn't have permission to see \n\`${match[0]}\`.\nI could not expand it.`
            );

        return [channel, await channel.messages.fetch(match.groups.message)];
    }

    function createEmbeds([
        channel,
        { member, author, content, createdAt, attachments, embeds },
    ]: [GuildTextBasedChannel, Message]) {
        let embed: APIEmbed = {
            author: {
                name: member ? member.displayName : author.username,
                icon_url: (member ?? author).displayAvatarURL(),
            },
            description: `${content}${
                embeds.length > 0
                    ? `\n(${embeds.length} ${
                          embeds.length == 1
                              ? 'embed follows.'
                              : 'embeds follow.'
                      })`
                    : ''
            }`,
            timestamp: createdAt.toISOString(),
            footer: {
                text:
                    (channel.parent?.parent
                        ? `${channel.parent.parent.name} > `
                        : '') +
                    (channel.parent ? `${channel.parent?.name} > ` : '') +
                    channel.name,
                icon_url: message.guild?.iconURL() ?? undefined,
            },
            image: attachments.find((att) => !!att.width)?.url
                ? {
                    // The above condition ensures url to be string
                    url: attachments.find((att) => !!att.width)?.url!,
                }
                : undefined,
        };

        return [embed, ...embeds];
    }

    return (match: RegExpMatchArray) =>
        getMessage(match)
            .then(createEmbeds)
            .then((embeds) => message.channel.send({
                embeds,
                allowedMentions: {
                    repliedUser: false
                },
                reply: {
                    messageReference: message,
                    failIfNotExists: false
                }
            }))
            .catch((error) => message.channel.send(`${error as Error}`))
            .catch(console.error);
}
