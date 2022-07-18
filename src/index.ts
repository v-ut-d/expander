import { Client, GatewayIntentBits } from 'discord.js';
import env from './env';
import expand from './expand';

const { BOT_TOKEN } = env;

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
});

const regurl =
    /https:\/\/(ptb\.|canary\.)?discord(app)?\.com\/channels\/(?<guild>\d{18})\/(?<channel>\d{18})\/(?<message>\d{18})/g;

client.on('ready', (client) => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.on('messageCreate', (message) => {
    if (message.author.bot) return;
    let urls = [...message.content.matchAll(regurl)];
    if (urls.length === 0) return;

    urls.forEach(expand(client, message));
});

client.on('threadCreate', (channel) => {
    channel.join().catch(console.error);
});

client.login(BOT_TOKEN);
