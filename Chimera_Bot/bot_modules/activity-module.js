const cmdTools = require('../command-tools.js');
const EventHandler = require('../event-handler.js');

const botStatuses = ["online", "idle", "dnd", "invisible"];
const activityTypes = ["PLAYING", "WATCHING", "STREAMING", "LISTENING"];

module.exports = {

    moduleHelp :   "This module is used to customize my status and displayed activity. \n" +
    "-- (Admin) Use '@me !activitysetstatus [" + botStatuses.toString() + "]' to set my status. \n" +
    "-- (Admin) Use '@me !activitysetname [activity name]' to set my activity. It can be anything you want! \n" +
    "-- (Admin) Use '@me !activitysettype [" + activityTypes.toString ()+ "]' to set the type of activity I am doing. This is listed before the activity name, \n" +
    "-- (Admin) Use '@me !activityseturl [url]' to set my activity URL (Shows when the type is set to streaming) \n" +
    "-- (Admin) Use '@me !activityclear' to reset my activity to default. \n" +
    "-- (Admin) Use '@me !activityhelp'  to get help for only this module. \n",

    

    settings : {
        moduleName : "Activities",
        consoleChannel : "",
        botStatus: "online",
        game: {
            name: "the world burn.",
            type: "WATCHING",
            url: "https://discord.com"
        },

        commands : {
            adminOnly : false, //Applies to all commands in this module. If false, individual commands can override this
            roles : [], //Applies to all commands. Empty allows all roles, otherwise whitelist.
            
            "!activity.setstatus" : {
                adminOnly : true, //Applies to only this command.
                roles : [], //stacks onto parent list for only this command
            },
            "!activity.setname" : {
                adminOnly : true,
                roles : [],
            },
            "!activity.settype" : {
                adminOnly : true,
                roles : [],
            },
            "!activity.seturl" : {
                adminOnly : true,
                roles : [],
            },
            "!activity.clear" : {
                adminOnly : true,
                roles : [],
            },
            "!activity.help" : {
                adminOnly : false,
                roles : [],
            },
        }
    },

    StartUp: function(client)
    { 
        this.SetPresence(client);
    },

    CheckForCommands: function(client, message)
    {
        let command = cmdTools.GetCommand(message);
        let permission = cmdTools.CheckPermissions(message, command, this.settings.commands);
        if(permission === 1)
        {
            if(message.channel.name === this.settings.consoleChannel)
            {
            
                if(message.content.includes("!activity.setstatus"))
                {
                    this.SetStatus(client, message);
                }
                else if(message.content.includes("!activity.settype"))
                {
                    this.SetActivityType(client, message);
                }
                else if(message.content.includes("!activity.setname"))
                {
                    this.SetActivityName(client, message);
                }
                else if(message.content.includes("!activity.seturl"))
                {
                    this.SetURL(client, message);
                }
                else if(message.content.includes("!activity.clear"))
                {
                    this.ClearPresence(client, message);
                }
                else if(message.content.includes("!activity.help"))
                {
                    this.Help(message);
                }
            }
            else
            {
                cmdTools.SendCommandErrorMessage(message, message.author + ", I was unable to do that. Please make sure you run the command in the console channel: #" + this.settings.consoleChannel);
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
                description: "This module is used to customize my status and displayed activity.",

                fields: [{
                    name: cmdTools.CheckAdmin("!activity.setstatus", this.settings.commands) + "@me !activity.setstatus [" + botStatuses.toString() + "]",
                    value: "Set my status.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.setstatus", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!activity.setname", this.settings.commands) + "@me !activity.setname [activity name]",
                    value: "Set my activity. It can be anything you want!\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.setname", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!activity.settype", this.settings.commands) + "@me !activity.settype [" + activityTypes.toString ()+ "]",
                    value: "Set the type of activity I am doing. This is listed before the activity name.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.settype", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!activity.seturl", this.settings.commands) + "@me !activity.seturl [URL]",
                    value: "Set my activity URL (Shows when the type is set to streaming).\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.seturl", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!activity.clear", this.settings.commands) + "@me !activity.clear",
                    value: "Reset my activity to default.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.clear", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!activity.help", this.settings.commands) + "@me !activity.help",
                    value: "Get help for only this module.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!activity.help", this.settings.commands)
                },

                ],
            },
            files: [{
                attachment:'./bot_modules/images/helpIcon.png',
                name:'thumbnail.png'
              }]
        });
    },

    SetPresence: function(client){
        client.user.setPresence({
            status: this.settings.botStatus,
            game: this.settings.game

        });
    },

    SetStatus: function(client, message){
        let status = cmdTools.StripMessage(message);

        //check if supplied status is valid
        if(botStatuses.includes(status))
        {
            //set status
            this.settings.botStatus = status;
            EventHandler.commonEmitter.emit("SaveModules");
            this.SetPresence(client);
            cmdTools.SendCommandSuccessMessage(message, "Set status to:" + status);
        }
        else
        {
            //throw error is invalid
            cmdTools.SendCommandErrorMessage(message, "Unable to set status to: " + status + "\n Please specify one of these options: " + botStatuses.toString());
        }
    },

    SetActivityName: function(client, message){
        let name = cmdTools.StripMessage(message);

        this.settings.game.name = name;
        EventHandler.commonEmitter.emit("SaveModules");
        this.SetPresence(client);
        cmdTools.SendCommandSuccessMessage(message, "Set my activity to: " + name);
    },

    SetActivityType: function(client, message){
        let type = cmdTools.StripMessage(message);
        type = type.toUpperCase();

        //check if supplied activity type is valid
        if(activityTypes.includes(type))
        {
            this.settings.game.type = type;
            EventHandler.commonEmitter.emit("SaveModules");
            this.SetPresence(client);
            cmdTools.SendCommandSuccessMessage(message, "Set activity type to: " + type);
        }
        else
        {
            //throw error if invalid
            cmdTools.SendCommandErrorMessage(message, "Unable to set activity type to: " + type + "\n Please specify one of these options: " + activityTypes.toString());
        }

    },

    SetURL: function(client, message){
        let url = cmdTools.StripMessage(message);

        this.settings.game.url = url;
        EventHandler.commonEmitter.emit("SaveModules");
        this.SetPresence(client);
        cmdTools.SendCommandSuccessMessage(message, message.author + " Set my activity URL to: " + url);
    },

    ClearPresence: function(client, message){
        this.settings.botStatus = "online";
        this.settings.game.name = "";
        this.settings.game.type = "PLAYING";
        this.settings.game.url = "https://discord.com";
        EventHandler.commonEmitter.emit("SaveModules");
        this.SetPresence(client);
        cmdTools.SendCommandSuccessMessage(message, message.author + " Cleared my presence and set it to default." )
    },

}