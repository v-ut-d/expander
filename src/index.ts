import { Client, Intents } from 'discord.js';
import env from './env';
import expand from './expand';

const { BOT_TOKEN } = env;

const client = new Client({
    intents: [Intents.FLAGS.GUILD_MESSAGES, Intents.FLAGS.GUILDS],
});

const regurl =
    /https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/channels\/(?<guild>\d{18,19})\/(?<channel>\d{18,19})\/(?<message>\d{18,19})/g;

client.on('ready', (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    let urls = [...message.content.matchAll(regurl)];
    if (!urls) return;

    urls.forEach(expand(client, message));
});

client.on('threadCreate', (channel) => {
    channel.join().catch(console.error);
});

client.login(BOT_TOKEN);
