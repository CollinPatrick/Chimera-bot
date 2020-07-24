const cmdTools = require('./command-tools.js');
const { cond } = require('lodash');

module.exports = {

    //TO-DO: Create way to set admin and roles for entire module. Will remove override functionality

    //This object is used for testing user permissions and passing the required module to the command bus
    commands : {    
        "forcesave" : {
            admin : true, //Applies to only this command.
            roles : [], //stacks onto parent list for only this command
        },
        "setconsolechannel" : {
            admin : true,
            roles : [], 
        },
        "setup" : {
            admin : false,
            roles : [], 
        },
        "listmodules" : {
            admin : false,
            roles : [], 
        },
        "installmodule" : {
            admin : true,
            roles : [], 
        },
        "uninstallmodule" : {
            admin : true,
            roles : [], 
        },
        "setmoduleadmin": {
            admin : true,
            roles : [], 
        },
        "setcommandadmin": {
            admin : true,
            roles : [], 
        },
        "addmodulerole": {
            admin : true,
            roles : [], 
        },
        "removemodulerole": {
            admin : true,
            roles : [], 
        },
        "clearmoduleroles": {
            admin : true,
            roles : [], 
        },
        "addcommandrole": {
            admin : true,
            roles : [], 
        },
        "removecommandrole": {
            admin : true,
            roles : [], 
        },
        "clearcommandroles": {
            admin : true,
            roles : [], 
        },
        "help" : {
            admin : false,
            roles : [], 
        },
        "helpall" : {
            admin : true,
            roles : [], 
        },
    },

    //This objet is used for saving module specific data
    settings : {
        //moduleName: "Manager",
        consoleChannel: "bot-console",
    },

    package : {
        moduleName: "Manager",
        version: "1.0.0",
        author: "Collin Patrick",   
        description: "This module contains my core commands and utility setup.",
        defGroup: "mgr",
        whatsNew: ""
    },

    /////////////Module Functions/////////////
    Run: async function(message, command, settings)
    {
        cmd = command.substring(command.indexOf(".")+1, command.length)
        switch (cmd) {
            case "forcesave":
                
                break;
            case "setconsolechannel":
                
                break;
            case "setup":
                
                break;
            case "listmodules":
                return this.ListModules(message, settings);
            case "installmodule":
                
                break;
            case "uninstallmodule":
                
                break;
            case "setmoduleadmin":
                
                break;
            case "addmodulerole":
                
                break;
            case "removemodulerole":
                   
                break;
            case "clearmoduleroles":
                   
                break;
            case "addcommandrole":
                
                break;
            case "removecommandrole":
                
                break;
            case "clearcommandroles":
                
                break;
            case "help":
                return this.Help(message, settings);
            case "helpall":
                return this.HelpAll(message, settings);
        }
    },

    //This is called in the main bot script in the "client.on('guildMemberAdd', member => {}" function
    /*NewMember: function(member){
        this.modules.forEach(module => {
            if(typeof module.NewMember === 'function')
            {
                module.NewMember(member);
            }

        });
    },*/

    Help: async function(message, settings)
    {
        let commands = settings.commands;
        let groupId = settings.packages[this.package.moduleName].defGroup;
        message.channel.send(cmdTools.HelpBuilder(this.package,
                [
                    cmdTools.CreateWhitelistField(settings.settings[this.package.moduleName]),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setup`, "", "Get instructions to set me up on a new server."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setconsolechannel`, "[channel]", "Set my default commands channel. This channel is only intended for server admins and mods. All modules will have access to this channel."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.listmodules`, "", "See the full list of my installed modules."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.installmodule`, "[module]", "Install a new module for access to more commands."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.uninstallmodule`, "[module]", "Uninstall a module. This will delete any saved data for this module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setmoduleadmin`, "[module] [true/false]", "Set required admin permissions for all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setcommandadmin`, "[true/false]", "Set required admin permissions for an individual command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.addmodulerole`, "[module] [role]", "Add a required role to use all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.removemodulerole`, "[module] [role]", "Remove a required role to use all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.clearmoduleroles`, "[module]", "Clears all required roles for all commands within a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.addcommandrole`, "[role]", "Add a required role to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.removecommandrole`, "[role]", "Remove a required role to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.clearcommandroles`, "[command]", "Clears all required roles to to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.help`, "", "Get help for this module."),

                ]
            ));

        return null;
    },

    //may be obsolete
    HelpAll: async function(message, settings)
    {
        //message.channel.send("HELP!");
        this.Help(message, settings);
        // this.modules.forEach(element => {
        //     element.Help(message);
        // });  
        return null;
    },

    /////////////Command Functions/////////////

    //@me !setconsolechannel [channel]
    SetConsoleChannel: async function(message){

        let channel = cmdTools.StripMessage(message);

        if(!message.guild.channels.find(c => c.name === channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified channel exists. \n\n You said: '" + channel + "'");
            return;
        }

        let settings = await DataBus.GetGuildSettings(message.guild);;

        settings.forEach(module => {
            module.consoleChannel = channel;
        });

        DataBus.SaveModuleSettings(message.guild, settings);
        cmdTools.SendCommandSuccessMessage(message, message.author + " Set the console channel to '" + channel + "'");


    },

    //@me !listmodules
    ListModules: async function(message, settings)
    {
        cmdTools.SendInfoMessage(message, "Installed modules", (() => {
            let temp = "";
            //let temp =  + this.settings.moduleName + "\n";
            for(let package in settings.packages){
                temp += "• " + settings.packages[package].moduleName + " (" + settings.packages[package].defGroup + ")" + "\n";
            }
            return temp;
        })());
        return null;
    },

    //@me !manager.setmoduleadmin [module] [true/false]
    SetModuleAdmin: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove module from message
        let module = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Remove command from Message
        let toggle = temp;

        //Check if true/false was supplied
        if(!(toggle == "true" || toggle == "false"))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
            return;
        }

        //check if module exists
        if(!this.commands[module])
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the module exists. \n\n You said: '" + module + "'");
            return;
        }

        this.commands[module].adminOnly = ((toggle === "true") ?  true : false);
        this.SaveModuleSettings(message.guild);

        cmdTools.SendCommandSuccessMessage(message, message.author + " The '" + module + "' module's admin permission was set to '" + toggle + "'");
    },

    //@me !manager.setcommandadmin [command] [true/false]
    SetCommandAdmin: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove command from message
        let command = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Remove command from Message
        let toggle = temp;

        //Check if true/false was supplied
        if(!(toggle == "true" || toggle == "false"))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
            return;
        }

        //check if command exists
        for(let mod in this.commands){
            if(this.commands[mod][command])
            {
                this.commands[mod][command].adminOnly = ((toggle === "true") ?  true : false);
                this.SaveModuleSettings(message.guild);
                //console.log(this.commands[module][command].adminOnly);
                cmdTools.SendCommandSuccessMessage(message, message.author + " The '" + command + "' command's admin permission was set to '" + toggle + "'")
                return;
            }
        }

        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the command exists. \n\n You said: '" + command + "'");
        return;

        //console.log((toggle === "true") ?  true : false);
        
    },

    //@me !manager.addmodulerole [module] [role]
    AddModuleRole: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove module from message
        let module = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Remove command from Message
        let role = temp;

        //check if module exists
        if(!this.commands[module])
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return;
        }
        
        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return;
        }

        //Check if module already has role
        if(this.commands[module].roles.includes(role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role already exists in the " + module + " module's list of required roles.\n\n You said: '" + role + "'");
            return;
        }

        this.commands[module].roles.push(role);
        this.SaveModuleSettings(message.guild);

        cmdTools.SendCommandSuccessMessage(message, message.author + "Added '" + role + "' to the " + module + " module's required roles");
    },

    //@me !manager.removemodulerole [module] [role]
    RemoveModuleRole: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove module from message
        let module = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Remove command from Message
        let role = temp;

        //check if module exists
        if(!this.commands[module])
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return;
        }
        
        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return;
        }

        //Check if module does not have role
        if(!this.commands[module].roles.includes(role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role does not exist in the " + module + " module's list of required roles.\n\n You said: '" + role + "'");
            return;
        }

        let index = this.commands[module].roles.indexOf(role);
        this.commands[module].roles.splice(index,1);
        this.SaveModuleSettings(message.guild);

        cmdTools.SendCommandSuccessMessage(message, message.author + "Removed '" + role + "' from the " + module + " module's required roles");
    },

    //@me !manager.addcommandrole [command] [role]
    AddCommandRole: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove command from message
        let command = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //get role from message
        let role = temp;

        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return;
        }

        //Find command
        for(let module in this.commands){
            if(this.commands[module][command])
            {
                //Check if command already has role
                if(this.commands[module][command].roles.includes(role))
                {
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role already exists in the " + command + " command's list of required roles.\n\n You said: '" + role + "'");
                    return;
                }
                else
                {
                    //Add role to command
                    this.commands[module][command].roles.push(role);
                    this.SaveModuleSettings(message.guild);
                    cmdTools.SendCommandSuccessMessage(message, message.author + "Added '" + role + "' to the '" + command + "' command's list of required roles.")
                    return;
                }
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
    },

    //@me !manager.removecommandrole [command] [role]
    RemoveCommandRole: function(message)
    {
        let temp = cmdTools.StripMessage(message);

        //Get and remove command from message
        let command = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        //Get role from message
        let role = temp;

        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return;
        }

        //Find command
        for(let module in this.commands){
            if(this.commands[module][command])
            {
                //Check if command does not have role
                if(!this.commands[module][command].roles.includes(role))
                {
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role does not exist in the " + command + " command's list of required roles.\n\n You said: '" + role + "'");
                    return;
                }
                else
                {
                    //Add role to command
                    let index = this.commands[module][command].roles.indexOf(role);
                    this.commands[module][command].roles.splice(index,1);
                    this.SaveModuleSettings(message.guild);
                    cmdTools.SendCommandSuccessMessage(message, message.author + "removed '" + role + "' from the '" + command + "' command's list of required roles.")
                    return;
                }
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
    },

    //@me !manager.clearcommandroles [command]
    ClearCommandRoles: function(message)
    {
        let command = cmdTools.StripMessage(message);

        //Find command
        for(let module in this.commands){
            if(this.commands[module][command])
            {
                //Clear roles
                this.commands[module][command].roles = [];
                this.SaveModuleSettings(message.guild);
                cmdTools.SendCommandSuccessMessage(message, message.author + " Cleared all roles from the '" + command + "' command's list of required roles.")
                return;
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
    },
}

