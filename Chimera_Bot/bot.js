//Use "pkg package.json --targets node10-win-x64" in terminal to build .exe 

require('dotenv').config();


const Discord = require('discord.js');
const ModuleManager = require("./bot_modules/module-manager.js");
const EventHandler = require('./bot_modules/event-handler.js');
const DataBus = require('./bot_modules/databus.js');
const client = new Discord.Client();
const CommandManager = require('./bot_modules/command-manager.js');
const commandManager = require('./bot_modules/command-manager.js');
const SecretToken = process.env.SECRET_TOKEN;
const AllowedPrefix = process.env.ALLOWED_PREFIX;
require('./dash/endpoint/index.js');

DataBus.Connect();
CommandManager.PopulateModuleLibrary();
DataBus.moduleLibrary = commandManager.moduleLibrary;

EventHandler.commonEmitter.on('SaveGuildSettings', function (settings) {
	DataBus.SaveGuildSettings(settings);
});

client.on('error', console.error);

client.on('ready', () => {
	//ModuleManager.LoadModules(client);

    // List servers the bot is connected to
    console.log("Servers:")
    client.guilds.forEach((guild) => {
        console.log(" - " + guild.name)

        // List all channels
        guild.channels.forEach((channel) => {
            console.log(` -- ${channel.name} (${channel.type}) - ${channel.id}`)
        })
    })
})

client.on('message', async recievedMessage => {

	// Prevent bot from responding to its own messages
	if (recievedMessage.author == client.user) { 
		return;
	}

	// Prevent processing message if not prefixed
	if(!AllowedPrefix.includes(recievedMessage.content[0])){
		return;
	}

	CommandManager.ReadMessage(client, recievedMessage);

	//Message Moduels
	//ModuleManager.ReadMessage(client, recievedMessage);
})

client.on('guildMemberAdd', member => {
	console.log(member.username + "joined the server!");

	//New member modules
	ModuleManager.NewMember(member);
});

//joined a server
client.on("guildCreate", guild => {
    console.log("Joined a new guild: " + guild.name);
    CommandManager.JoinGuild(guild.id);
})

//removed from a server
client.on("guildDelete", guild => {
	console.log("Left a guild: " + guild.name);
	CommandManager.LeaveGuild(guild.id);
})

function setRolesManual(message, user, recievedMessage)
{
	let keys = findKeys(recievedMessage);
	let roles = getRoles(keys)
	let member = recievedMessage.guild.member(user)
	setRoles(roles, member, recievedMessage);
	recievedMessage.channel.send("set " + user + "'s roles to:  " + roles);
	
}

client.login(SecretToken)