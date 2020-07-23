const CharLimit = 2000;

module.exports = {

    //Input: message, Output: string
    //Removes @ mention and ! command from message and returns the message string
    StripMessage: function(message){
        let temp = message.content;
        //Remove @ mention from message
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Remove command from Message
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        return temp;
    },

    GetCommand: function(message){
        let command = message.content;

        //Remove @ mention from message
        command = command.replace(command.substring(0, command.indexOf(" ")+1), "");

        if(command.indexOf(" ") !== -1)
        {
            command = command.substring(0, command.indexOf(" "));
        }
        return command;
    },


    //Returns 0, 1, or -1
    //0: Command not found
    //1: Found and processed command
    //-1: Found but could not process command
    CheckPermissions: function(message, command, commands){

        //Check if this module has requested command
        if(commands[command])
        {
            //(Module is not admin only or module is admin only and user is admin) and has required roles for module
            if((!commands.adminOnly || (commands.adminOnly && message.member.permissions.has('ADMINISTRATOR')))
                && (!commands.roles.length > 0 || message.member.roles.some(role=>commands.roles.includes(role.name))))
            {
                //(command is not admin only or command is admin only and user is admin) and has required roles for command
                if((!commands[command].adminOnly || (commands[command].adminOnly && message.member.permissions.has('ADMINISTRATOR')))
                && (!commands[command].roles.length > 0 || message.member.roles.some(role=>commands[command].roles.includes(role.name))))
                {
                    //Exit complete
                    return 1;
                }
                else
                {
                    //Exit error
                    this.SendCommandErrorMessage(message, "Sorry " + message.author + "! I can't do that. You don't have permissions to use that command. \n" + 
                    "You are either missing admin privilages or one of these roles: " + commands[command].roles);
                    return -1;
                }
            }
            else
            {
                //Exit error
                this.SendCommandErrorMessage(message, "Sorry " + message.author + "! I can't do that. You don't have permissions to use that command. \n" + 
                "You are either missing admin privilages or one of these roles: [" + commands.roles + "]");
                return -1;
            }
        }
        else
        {
            //Exit continue
            return 0;
        }
    },

    CheckAdmin: function(command)
    {
        return (command.admin === true) ? "(Admin) " : "";
        //if(command.admin === true) return "(Admin) ";
        //return (commands[command].adminOnly) ? "(Admin) " : " ";
    },

    //Move to command tools
    GetRequiredRoles: function(command)
    {
        let temp = "";

        command.roles.forEach(role => {
            temp += role + ", ";
        });

        if(temp === "")
        {
            temp += "none";
        }
        else
        {
            //Remove tail ','
            temp = temp.substr(0, temp.length-2);
        }
        return temp;
    },

    SendCommandErrorMessage: function(message, error)
    {
        message.channel.send({
            embed: {
                color: 15158332,
                author: {
                    name: "Error",
                    icon_url: 'attachment://icon.png'
                },
                title: "Unable to process command",
                description: error,
            },
            files: [{
                attachment:'./bot_modules/images/errorIcon.png',
                name:'icon.png'
              }]
        });
    },

    SendCommandSuccessMessage: function(message, success)
    {
        message.channel.send({
            embed: {
                color: 3066993,
                author: {
                    name: "Success",
                    icon_url: 'attachment://icon.png'
                },
                description: success,
            },
            files: [{
                attachment:'./bot_modules/images/successIcon.png',
                name:'icon.png'
              }]
        });
    },

    SendInfoMessage: function(message, title, info)
    {
        message.channel.send({
            embed: {
                color: 12370112,
                author: {
                    name: "Info",
                    icon_url: 'attachment://icon.png'
                },
                title: title,
                description: info,
            },
            files: [{
                attachment:'./bot_modules/images/infoIcon.png',
                name:'icon.png'
              }]
        });
    },

    CreateCommandField: function(prefix, settings, command, params, description)
    {
        return {
            name: `${this.CheckAdmin(settings.commands[command])}${prefix}${command} ${params}`,
            value: `${description}\nRequired roles: ${this.GetRequiredRoles(settings.commands[command])}`
        }
    },

    CreateCustomField: function(title, description)
    {
        return {
            name: title,
            value: description
        }
    },

    HelpBuilder: function(moduleName, description, fields)
    {
        return {
            embed: {
                color: 3447003,
                author: {
                    name: moduleName,
                    icon_url: 'attachment://thumbnail.png'
                },
                title: moduleName,
                description: description,
                fields: fields,
            },
            files: [{
                attachment:'./bot_modules/images/helpIcon.png',
                name:'thumbnail.png'
            }]
        };
    },

    //Untested
    SendLongMessage(text, channel)
    {
        let chars = text.length;
        if(temp <= CharLimit)
        {
            channel.send(text);
        }
        else
        {
            let startIndex = 0;
            let curIndex = CharLimit;
            while(curIndex !== chars){

                if(text[curIndex] !== " ") //Prevent words from being cut between messages
                {
                    curIndex--;
                }
                else
                {
                    channel.send(text.substring(startIndex, curIndex));
                    startIndex = curIndex + 1; //Update start index for next message
                    curIndex += CharLimit;
                    
                    if(chars - startIndex > CharLimit) //Check if last message. Remaining text is less than message character limit
                    {
                        channel.send(text.substring(startIndex, chars)); //Send remainder of text
                        curIndex = chars; // set current index to last index to exit loop
                    }
                }
            }
        }
    }

}