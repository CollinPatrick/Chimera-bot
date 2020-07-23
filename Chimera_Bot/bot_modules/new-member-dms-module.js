const cmdTools = require("../command-tools.js");
const EventHandler = require('../event-handler.js');

module.exports = {

    moduleHelp : "This module automatically DMs a user when they join the server. \n" +
                 "-- (Admin) Use '@me !setnewmembermessage [your message]' to set the DM new users recieve when joining the server. \n" +
                 "-- (Admin) Use '@me !debugnewmember' to send a test DM to yourself. \n" +
                 "-- (Admin) Use '@me !enablenewmembermessage [true/false]' to enable or disable DMs being automatically sent to new members. \n" + 
                 "-- (Admin) Use '@me !newmembermessagehelp' to get help for only this module. \n",    

    settings: 
    {
        moduleName : "New-Member-DMs",
        consoleChannel : "",
        messageToSend : "Welcome to my server!",
        enabled: false,

        commands : {
            adminOnly : false, //Applies to all commands in this module. If false, individual commands can override this
            roles : [], //Applies to all commands. Empty allows all roles, otherwise whitelist.
            
            "!newmemberdms.testnewmember" : {
                adminOnly : true, //Applies to only this command.
                roles : [], //stacks onto parent list for only this command
            },
            "!newmemberdms.setmessage" : {
                adminOnly : true,
                roles : [],
            },
            "!newmemberdms.enable" : {
                adminOnly : true,
                roles : [],
            },
            "!newmemberdms.help" : {
                adminOnly : false,
                roles : [],
            },
        }
    },


    /////////////Module Functions/////////////

    CheckForCommands: function(client, message)
    {
        let command = cmdTools.GetCommand(message);
        let permission = cmdTools.CheckPermissions(message, command, this.settings.commands);
        if(permission === 1)
        {
            if(message.channel.name === this.settings.consoleChannel)
            {
                if(message.content.includes("!newmemberdms.testnewmember"))
                {
                    this.DebugNewMember(message.author);
                }
                else if(message.content.includes("!newmemberdms.setmessage"))
                {
                    this.SetNewMemberMessage(message);
                }
                else if(message.content.includes("!newmemberdms.enable"))
                {
                    this.MessageToggle(message);
                }
                else if(message.content.includes("!newmemberdms.help"))
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

    NewMember: function (member) {

        member.send(this.settings.messageToSend);
    },

    Help: function(message)
    {
        message.channel.send({
            embed: {
                color: 3447003,
                author: {
                    name: "Help",
                    icon_url: 'attachment://thumbnail.png'
                },
                title: this.settings.moduleName,
                description: "This module automatically DMs a user when they join the server.",

                fields: [{
                    name: cmdTools.CheckAdmin("!newmemberdms.testnewmember", this.settings.commands) + "@me newmemberdms.testnewmember",
                    value: "Send a test DM to yourself.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!newmemberdms.testnewmember", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!newmemberdms.setmessage", this.settings.commands) + "@me !newmemberdms.setmessage [message]",
                    value: "Set the DM new users recieve when joining the server.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!newmemberdms.setmessage", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!newmemberdms.enable", this.settings.commands) + "@me !newmemberdms.enable [true/false]",
                    value: "Enable or disable DMs being automatically sent to new members.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!newmemberdms.enable", this.settings.commands)
                },
                {
                    name: cmdTools.CheckAdmin("!newmemberdms.help", this.settings.commands) + "@me !newmemberdms.help",
                    value: "Get help for only this module.\n" + 
                            "Required Roles: " + cmdTools.GetRequiredRoles("!newmemberdms.help", this.settings.commands)
                }],
            },
            files: [{
                attachment:'./bot_modules/images/helpIcon.png',
                name:'thumbnail.png'
              }]
        });
    },


    /////////////Command Functions/////////////

    //Sends the now member DM to a specified member.
    // @me newmemberdms.testnewmember
    DebugNewMember: function(member)
    { 
        this.NewMember(member);
    },

    //Sets the new member message to whatever the user defines
    //@me !newmemberdms.setmessage [message]
    SetNewMemberMessage: function(message)
    {
        let newMessage = cmdTools.StripMessage(message);
        this.settings.messageToSend = newMessage;
        EventHandler.commonEmitter.emit('SaveModules');
        cmdTools.SendCommandSuccessMessage(message, "Set message to: \n" + this.settings.messageToSend)

    },

    //Toggles if DMs are sent to new members
    //@me !newmemberdms.enable [true/false]
    MessageToggle: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        if(temp.includes("true"))
        {
            //enable
            this.settings.enabled = true;
            EventHandler.commonEmitter.emit('SaveModules');
            cmdTools.SendCommandSuccessMessage(message, "New member DMs are now enabled!");
        }
        else if(temp.includes("false"))
        {
            //disable
            this.settings.enabled = false;
            EventHandler.commonEmitter.emit('SaveModules');
            cmdTools.SendCommandSuccessMessage(message, "New member DMs are now disabled!");
        }
        else
        {
            //throw error if true/false not supplied
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
        }
    }


}
