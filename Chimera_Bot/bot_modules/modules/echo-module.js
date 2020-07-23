const cmdTools = require('../command-tools.js');
const EventHandler = require('../event-handler.js');
//var commonEmitter = EventHandler.commonEmitter;

module.exports = {

    commands : {
        "echo" : {
            admin : true, //Applies to only this command.
            roles : [], //stacks onto parent list for only this command
        },
        // "!echo.addchannel" : {
        //     adminOnly : true,
        //     roles : [],
        // },
        // "!echo.removechannel" : {
        //     adminOnly : true,
        //     roles : [],
        // },
        // "!echo.clearchannels" : {
        //     adminOnly : true,
        //     roles : [],
        // },
        // "!echo.listchannels" : {
        //     adminOnly : true,
        //     roles : [],
        // },
        // "!echo.help" : {
        //     adminOnly : false,
        //     roles : [],
        // },
    },

    settings : {
        moduleName : "Echo",
        allowedChannels : [], //leave blank for all
    },
    

    /////////////Module Functions/////////////


    CheckForCommands: function(client, message)
    {
        let command = cmdTools.GetCommand(message);
        let permission = cmdTools.CheckPermissions(message, command, this.settings.commands);
        if(permission === 1)
        {
            if(message.channel.name === this.settings.consoleChannel || this.CheckWhitelist(message.channel.name))
            {
                if(command === "!echo.help")
                {
                    this.Help(message);
                }
                else if(command === "!echo.addchannel")
                {
                    this.AddChannel(message);
                }
                else if(command === "!echo.removechannel")
                {
                    this.RemoveChannel(message);
                }
                else if(command === "!echo.clearchannels")
                {
                    this.ClearChannels(message);
                }
                else if(command === "!echo.listchannels")
                {
                    this.ListChannels(message);
                }
                else if(command === "!echo")
                {
                    this.Echo(client, message);
                }
            }
            else
            {
                cmdTools.SendCommandErrorMessage(message, message.author + ", I was unable to echo the message. Please make sure the specified channel is in my whitelist.")
            }
        }
        return permission;
    },

    Help: function(message){
        message.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: "Help",
                    icon_url: 'attachment://thumbnail.png'
                },
                title: this.settings.moduleName,
                description: "This module will make me say whatever you want in a specified channel.",

                fields: [{
                    name: cmdTools.CheckAdmin("!echo", this.settings.commands) + "@me !echo [channel] [message]",
                    value: "Makes me say something.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!echo.addchannel", this.settings.commands) + "@me !echo.addchannel [channel]",
                    value: "Add a channel to my whitelist of channels I can echo to.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo.addchannel", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!echo.removechannel", this.settings.commands) + "@me !echo.removechannel [channel]",
                    value: "Removes a channel to my whitelist of channels I can echo to.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo.removechannel", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!echo.clearchannels", this.settings.commands) + "@me !echo.clearchannels",
                    value: "Clear my whitelist of channels I can echo to. If my whitelist is empty, I can echo to all channels.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo.clearchannels", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!echo.listchannels", this.settings.commands) + "@me !echo.listchannels",
                    value: "View my whitelist of allowed channels.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo.listchannels", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!echo.help", this.settings.commands) + "@me !echo.help",
                    value: "Get help for only this module.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!echo.help", this.settings.commands)
                },
                {
                    name: "Important Info: ",
                    value: "Make sure I have server permissions to send messages in whatever channel I try to echo to!"
                },

                ],
            },
            files: [{
                attachment:'./bot_modules/images/helpIcon.png',
                name:'thumbnail.png'
              }]
        });
    },

    /////////////Command Functions/////////////

    //Says given message in a specified channel
    //@me !echo [channel] [message]
    Echo: function (client, message) {

        let temp = cmdTools.StripMessage(message);
        let channelName = temp.substring(0, temp.indexOf(" "));
        
        //check if channel exists
        if(!message.guild.channels.find(channel => channel.name === channelName))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I can't do that. The specified channel does not exist.\n\n You said '" + channelName + "'");
            return;
        }

        //Check if channel is on the modules whitelist
        if(!this.CheckWhitelist(channelName))
        {
            cmdTools.SendCommandErrorMessage(message, "I cannot echo to that channel. The specified channel is not on the " + this.settings.moduleName + " module's channel whitelist.\n\nYou said '" + channelName + "'");
            return;
        }

        //Remove channel from message
        temp = temp.replace(channelName + " ", "");
        let guildName = message.guild;

        //Trys to send message
        try{
            let guild = client.guilds.find(guild => guild === guildName);
            let channel = guild.channels.find(channel => channel.name === channelName);
            channel.send(temp)
        }
        catch(exception)
        {
            //send error if bot does not have server access to channel
            cmdTools.SendCommandErrorMessage(message, message.author + ", I was unable to echo the message! Make sure I have permission to send messages in the specified channel.")
        }
    },
    
    //Checks if a channel is in the module's channel whitelist
    CheckWhitelist: function(channelName)
    {
        //return true to whitelist is empty
        if(this.settings.allowedChannels === undefined || this.settings.allowedChannels == 0)
        {
            return true;
        }

        //return true if channel is in whitelist
        for(i=0; i<this.settings.allowedChannels.length; i++)
        {
            if(channelName === this.settings.allowedChannels[i])
            {
                return true;
            }
        }

        //return false if channel not in whitelist
        return false;
    },

    //Removes the specified channel to this module's whitelist
    //@me !echo.removechannel [channel]
    RemoveChannel: function(message){
        let channel = cmdTools.StripMessage(message);

        //check if channel exists
        if(!message.guild.channels.find(c => c.name === channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I can't do that. The specified channel does not exist.\n\n you said '" + channel + "'");
            return;
        }

        //Check if whitelist does not have channel
        if(!this.settings.allowedChannels.includes(channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I can't do that. The specified channel does not exist in the " + this.settings.moduleName + " module's channel whitelist.\n\n you said '" + channel + "'");
            return
        }

        //Add channel to whitelist
        let index = this.settings.allowedChannels.indexOf(channel);
        this.settings.allowedChannels.splice(index,1); 
        cmdTools.SendCommandSuccessMessage(message, "Removed '" + channel + "' from the " + this.settings.moduleName + " module's channel whitelist.");
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Adds the specified channel to this module's whitelist
    //@me !echo.addchannel [channel]
    AddChannel: function(message){
        let channel = cmdTools.StripMessage(message);

        //check if channel exists
        if(!message.guild.channels.find(c => c.name === channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I can't do that. The specified channel does not exist.\n\n you said '" + channel + "'");
            return;
        }

        //check if channel already exists in whitelist
        if(this.settings.allowedChannels.includes(channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I can't do that. The specified channel already exists in the " + this.settings.moduleName + " module's channel whitelist.\n\n you said '" + channel + "'");
            return
        }

        //Add channel to whitelist
        this.settings.allowedChannels.push(channel);
        cmdTools.SendCommandSuccessMessage(message, "Added '" + channel + "' to the " + this.settings.moduleName + " module's whitelist.");
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Removes all channels from this module's whitelist. An empty whitelist allows this module to interact with all channels
    //@me !echo.clearchannels
    ClearChannels: function(message){
        this.settings.allowedChannels = [];
        cmdTools.SendCommandSuccessMessage(message, "Cleared all channels from whitelist. I can now echo to any channel I have permissions to.")
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Lists all channels in this modules whitelist.
    //@me !echo.listchannels
    ListChannels: function(message)
    {   
        cmdTools.SendInfoMessage(message, "Channels I can echo to: ", (() => {
            let temp = "";
            (this.settings.allowedChannels.length === 0) ? temp += "All Channels" : this.settings.allowedChannels.forEach(channel => temp += "#" + channel + "\n");
            return temp;
        })());
    },
}

