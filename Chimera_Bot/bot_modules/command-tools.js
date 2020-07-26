const { Message, MessageEmbedField, MessageEmbed, Channel } = require("discord.js");

const CharLimit = 2000;


/**
 * A collection of common tools used in command modules
 * @module cmdTools
 */
module.exports = {

    /**
     * Remove command from Discord message conetent
     * @param {Message} message 
     * @returns {string} Discord message content without !command
     */
    StripCommand: function(message){
        let temp = message.content;
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        return temp;
    },

    /**
     * Gets command from Discord message conetent
     * @param {Message} message 
     * @returns {string} Command
     */
    GetCommand: function(message){
        let command = message.content;

        if(command.indexOf(" ") !== -1)
        {
            command = command.substring(0, command.indexOf(" "));
        }
        return command;
    },

    /**
     * Checks if command requires admin
     * @param {command} command
     * @returns {string} Admin prefix for help builder 
     */
    CheckAdmin: function(command)
    {
        return (command.admin === true) ? "(Admin) " : "";
    },

    /**
     * Formats command roles into string
     * @param {command} command
     * @returns {string} Formatted string
     */
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

    /**
     * Sends embedded error message to recieved message channel
     * @param {Message} message 
     * @param {string} error 
     */
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

    /**
     * Sends embedded success message to recieved message channel
     * @param {Message} message
     * @param {string} description = The body of the message.
     */
    SendCommandSuccessMessage: function(message, description)
    {
        message.channel.send({
            embed: {
                color: 3066993,
                author: {
                    name: "Success",
                    icon_url: 'attachment://icon.png'
                },
                description: description,
            },
            files: [{
                attachment:'./bot_modules/images/successIcon.png',
                name:'icon.png'
              }]
        });
    },

    /**
     * Sends embedded info message to recieved message channel 
     * @param {Message} message 
     * @param {string} title 
     * @param {string} description - The body of the message.
     */
    SendInfoMessage: function(message, title, description)
    {
        message.channel.send({
            embed: {
                color: 12370112,
                author: {
                    name: "Info",
                    icon_url: 'attachment://icon.png'
                },
                title: title,
                description: description,
            },
            files: [{
                attachment:'./bot_modules/images/infoIcon.png',
                name:'icon.png'
              }]
        });
    },

    /**
     * Creates a new command embed field for {@link module:cmdTools#HelpBuilder} HelpBuilder()
     * @see {@link HelpBuilder}
     * @param {string} prefix 
     * @param {moduleSettings} settings 
     * @param {string} command - The command without the prefix
     * @param {string} params - Required parameters to run the command. Format: "[param1] [param2] ..." 
     * @param {string} description - Brief explation of what the command does
     * @returns {MessageEmbedField} Message embed field
     */
    CreateCommandField: function(prefix, settings, command, params, description)
    {
        return {
            name: `${this.CheckAdmin(settings.commands[command])}${prefix}${command} ${params}`,
            value: `${description}\nRequired roles: ${this.GetRequiredRoles(settings.commands[command])}`
        }
    },

    /**
     * Creates a new whitelist embed field for HelpBuilder()
     * @param {moduleSettings} settings 
     * @returns {MessageEmbedField} Message embed field
     */
    CreateWhitelistField: function(settings)
    {
        listType = settings.listType;
        channels = settings.listChannels;

        if(listType === "none"){
            listType = "Console Only:"
            channels = settings.consoleChannel;
        }
        else if(listType === "white"){
            listType = "Whitelist:"
        }
        else if(listType === "black"){
            listType = "Blacklist:"
        }

        return {
            name: listType,
            value: channels
        }
    },

    /**
     * Creates a standard embed field with a custom title and description
     * @param {string} title 
     * @param {string} description 
     * @param {boolean} inline
     * @returns {MessageEmbedField} Message embed field
     */
    CreateCustomField: function(title, description, inline)
    {
        return {
            name: title,
            value: description,
            inline: inline
        }
    },

    /**
     * Returns a custom embed for help messages
     * @param {package} package - A module info package
     * @param {Object[]} fields - An array of embed fields
     * @returns {MessageEmbed} Message embed
     */
    HelpBuilder: function(package, fields)
    {
        return {
            embed: {
                color: 3447003,
                author: {
                    name: `Help`,
                    icon_url: 'attachment://thumbnail.png'
                },
                title: package.moduleName,
                description: "By: " + package.author + " - v" + package.version + "\n" + package.description,
                fields: fields,
            },
            files: [{
                attachment:'./bot_modules/images/helpIcon.png',
                name:'thumbnail.png'
            }]
        };
    },

    /**
     * UNTESTED | Sends a long message as multiple to a channel
     * @param {string} text 
     * @param {Channel} channel 
     */
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