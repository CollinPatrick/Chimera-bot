const cmdTools = require('./command-tools.js');

module.exports = {

    commands : {    
        "setconsolechannel" : {
            admin : true,
            roles : [], 
        },
        "setup" : {
            admin : false,
            roles : [], 
        },
        "setprefix" : {
            admin : true,
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

    settings : {
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
            case "setconsolechannel":
                return this.SetConsoleChannel(message, settings);

            case "setup":
                
                break;
            case "listmodules":
                return this.ListModules(message, settings);
            
            case "setprefix":
                return this.ListModules(message, settings);

            case "installmodule":
                
                break;
            case "uninstallmodule":
                
                break;
            case "setmoduleadmin":
                return this.SetModuleAdmin(message, settings);

            case "addmodulerole":
                return this.AddModuleRole(message, settings);

            case "removemodulerole":
                return this.RemoveModuleRole(message, settings);

            case "clearmoduleroles":
                   
                break;
            case "setcommandadmin":
                return this.SetCommandAdmin(message, settings);
                
            case "addcommandrole":
                return this.AddCommandRole(message, settings);

            case "removecommandrole":
                return this.RemoveCommandRole(message, settings);

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
        let groupId = settings.packages[this.package.moduleName].defGroup;
        message.channel.send(cmdTools.HelpBuilder(this.package,
                [
                    cmdTools.CreateWhitelistField(settings.settings[this.package.moduleName]),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setup`, "", "Get instructions to set me up on a new server."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setconsolechannel`, "[channel]", "Set my default commands channel. This channel is only intended for server admins and mods. All modules will have access to this channel.\n current console channel: " + settings.settings[this.package.moduleName].consoleChannel),
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

    //Command: setconsolechannel [channel]
    SetConsoleChannel: async function(message, settings){

        let channel = cmdTools.StripCommand(message);

        if(!message.guild.channels.find(c => c.name === channel))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified channel exists. \n\n You said: '" + channel + "'");
            return;
        }

        settings.settings[this.package.moduleName].consoleChannel = channel;

        cmdTools.SendCommandSuccessMessage(message, message.author + " Set the console channel to '" + channel + "'");

        return settings;
    },

    //Command: !listmodules
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

    //Command: setmoduleadmin [module] [true/false]
    SetModuleAdmin: async function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let module = temp.substring(0, temp.indexOf(" "));
        let toggle = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        //check if module exists
        let foundModule = false;
        for(let package in settings.packages){
            if(!foundModule && settings.packages[package].moduleName == module){
                foundModule = true;
            }
        }

        if(!foundModule){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the module exists. \n\n You said: '" + module + "'");
            return null;
        }
    
        //Check if true/false was supplied
        if(!(toggle === "true" || toggle === "false"))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
            return null;
        }


        //Set admin
        for(let command in settings.commands){
            if(settings.commands[command].parentModule === module){
                settings.commands[command].admin = (toggle === "true") ? true : false;
            }
        }

        cmdTools.SendCommandSuccessMessage(message, message.author + " The '" + module + "' module's admin permission was set to '" + toggle + "'");
        return settings;
    },

    //Command: setcommandadmin [command] [true/false]
    SetCommandAdmin: function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let command = temp.substring(0, temp.indexOf(" "));
        let toggle = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        //Check if true/false was supplied
        if(!(toggle == "true" || toggle == "false"))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
            return null;
        }

        //Set admin if command exists
        for(let cmd in settings.commands){
            if(cmd === command){
                settings.commands[command].admin = (toggle === "true") ? true : false;
                cmdTools.SendCommandSuccessMessage(message, message.author + " The '" + command + "' command's admin permission was set to '" + toggle + "'")
                return settings;
            }
        }

        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the command exists. \n\n You said: '" + command + "'");
        return null;  
    },

    //Command: addmodulerole [module] [role]
    AddModuleRole: function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let module = temp.substring(0, temp.indexOf(" "));
        let role = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(module === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return null;
        }

        //check if module exists
        for(let package in settings.packages){
            if(settings.packages[package].moduleName === module){
                //check if role exists
                if(!message.guild.roles.find(r => r.name === role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
                    return null;
                }

                //set module role
                for(let command in settings.commands){
                    if(settings.commands[command].parentModule === module){
                        if(!settings.commands[command].roles.includes(role)){
                            settings.commands[command].roles.push(role);
                        }
                    }
                }

                cmdTools.SendCommandSuccessMessage(message, message.author + "Added '" + role + "' to the " + module + " module's required roles");
                return settings;
            }
        }

        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
        return null;
    },

    //Command: removemodulerole [module] [role]
    RemoveModuleRole: function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let module = temp.substring(0, temp.indexOf(" "));
        let role = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(module === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return null;
        }

        //check if module exists
        for(let package in settings.packages){
            if(settings.packages[package].moduleName === module){
                //check if role exists
                if(!message.guild.roles.find(r => r.name === role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
                    return null;
                }

                //remove module role
                for(let command in settings.commands){
                    if(settings.commands[command].parentModule === module){
                        if(settings.commands[command].roles.includes(role)){
                            settings.commands[command].roles.splice(settings.commands[command].roles.indexOf(role), 1);
                        }
                    }
                }

                cmdTools.SendCommandSuccessMessage(message, message.author + "Removed '" + role + "' from the " + module + " module's required roles");
                return settings;
            }
        }

        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
        return null;
    },

    //Command: addcommandrole [command] [role]
    AddCommandRole: function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let command = temp.substring(0, temp.indexOf(" "));
        let role = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(command === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
            return null;
        }

        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }


        //Find command
        for(let cmd in settings.commands){

            if(command === cmd){
                if(settings.commands[cmd].roles.includes(role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role already exists in the " + command + " command's list of required roles.\n\n You said: '" + role + "'");
                    return null;
                }

                settings.commands[cmd].roles.push(role);
                cmdTools.SendCommandSuccessMessage(message, message.author + "Added '" + role + "' to the '" + command + "' command's list of required roles.")
                return settings;
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
        return null;
    },

    //@me !manager.removecommandrole [command] [role]
    RemoveCommandRole: function(message, settings)
    {
        let temp = cmdTools.StripCommand(message);

        let command = temp.substring(0, temp.indexOf(" "));
        let role = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(command === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
            return null;
        }

        //Check if role exists
        if(!message.guild.roles.find(r => r.name === role))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }


        //Find command
        for(let cmd in settings.commands){

            if(command === cmd){
                if(!settings.commands[cmd].roles.includes(role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role does not exist in the " + command + " command's list of required roles.\n\n You said: '" + role + "'");
                    return null;
                }

                settings.commands[cmd].roles.splice(settings.commands[cmd].roles.indexOf(role), 1);
                cmdTools.SendCommandSuccessMessage(message, message.author + " Removed '" + role + "' from the '" + command + "' command's list of required roles.")
                return settings;
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + command + "'");
        return null;
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

