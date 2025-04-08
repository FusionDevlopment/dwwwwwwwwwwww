require('dotenv').config();
const { Client, GatewayIntentBits, Partials, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Create a new client instance
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers
    ],
    partials: [Partials.Channel, Partials.Message]
});

// Create collections for commands
client.commands = new Collection();
client.buttons = new Collection();

// Create a Map to store ticket data for transcripts
client.ticketData = new Map();

// Create a counter for tickets
client.ticketCount = 0;

// Load commands
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}

// Load event handlers
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args, client));
    }
}

// Load button handlers
const handlersPath = path.join(__dirname, 'handlers');
const buttonHandler = require(path.join(handlersPath, 'buttonHandler.js'));
buttonHandler.loadButtons(client);

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
    
    // Imposta lo stato del bot con il contatore dei ticket
    updateBotStatus(client);
    
    // Aggiorna lo stato ogni 5 minuti
    setInterval(() => updateBotStatus(client), 5 * 60 * 1000);
});

// Funzione per aggiornare lo stato del bot
function updateBotStatus(client) {
    client.user.setActivity(`${client.ticketCount} Tickets`, { type: 2 }); // type: 3 è WATCHING in Discord.js v14
}

// Legacy command handling for !panel
client.on('messageCreate', async (message) => {
    if (!message.content.startsWith('!') || message.author.bot) return;

    const args = message.content.slice(1).trim().split(/ +/);
    const commandName = args.shift().toLowerCase();

    if (commandName === 'panel') {
        const command = client.commands.get('panel');
        
        if (!command) {
            console.error('Panel command not found!');
            return;
        }
        
        try {
            await command.execute(message, args, client);
        } catch (error) {
            console.error(error);
            await message.reply({ content: 'There was an error executing that command!', ephemeral: true });
        }
    }
});

// Login to Discord with your token
client.login(process.env.DISCORD_TOKEN);
