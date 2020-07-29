const cmdTools = require('../../command-tools.js');

module.exports = {

    commands : require('./commands.json'),

    settings : require('./settings.json'),

    package : require('./package.json'),

    //This is called in the main bot script in the "client.on('guildMemberAdd', member => {}" function
    /*NewMember: function(member){
        this.modules.forEach(module => {
            if(typeof module.NewMember === 'function')
            {
                module.NewMember(member);
            }

        });
    },*/

    Help: async function(message, params, settings)
    {
        let groupId = settings.packages[this.package.moduleName].defGroup;
        message.channel.send(cmdTools.HelpBuilder(this.package,
                [
                    cmdTools.CreateWhitelistField(settings.settings[this.package.moduleName]),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setup`, "", "Get instructions to set me up on a new server."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setconsolechannel`, "-channel", "Set my default commands channel. This channel is only intended for server admins and mods. All modules will have access to this channel.\n current console channel: " + settings.settings[this.package.moduleName].consoleChannel),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.listmodules`, "", "See the full list of my installed modules."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.installmodule`, "-module", "Install a new module for access to more commands."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.uninstallmodule`, "-module", "Uninstall a module. This will delete any saved data for this module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setmoduleadmin`, "-module -true/false", "Set required admin permissions for all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.setcommandadmin`, "-true/false", "Set required admin permissions for an individual command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.addmodulerole`, "-module -role", "Add a required role to use all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.removemodulerole`, "-module -role", "Remove a required role to use all commands in a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.clearmoduleroles`, "-module", "Clears all required roles for all commands within a module."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.addcommandrole`, "-command -role", "Add a required role to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.removecommandrole`, "-command -role", "Remove a required role to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.clearcommandroles`, "-command", "Clears all required roles to to use a command."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${groupId}.help`, "", "Get help for this module."),

                ]
            ));

        return null;
    },

    //may be obsolete
    HelpAll: async function(message, params, settings)
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
    SetConsoleChannel: async function(message, params, settings){

        let channel = params["channel"];

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
    ListModules: async function(message, params, settings)
    {
        cmdTools.SendInfoMessage(message, "Installed modules", (() => {
            let temp = "";
            //let temp =  + this.settings.moduleName + "\n";
            for(let pkg in settings.packages){
                temp += "• " + settings.packages[pkg].moduleName + " (" + settings.packages[pkg].defGroup + ")" + "\n";
            }
            return temp;
        })());
        return null;
    },

    //Command: setmoduleadmin [module] [true/false]
    SetModuleAdmin: async function(message, params, settings)
    {
        let module = params["module"];
        let toggle = params["true/false"];

        //check if module exists
        let foundModule = false;
        for(let pkg in settings.packages){
            if(!foundModule && settings.packages[pkg].moduleName == module){
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
    SetCommandAdmin: function(message, params, settings)
    {
        let commandToSet = params["command"];
        let toggle = params["true/false"];

        //Check if true/false was supplied
        if(!(toggle == "true" || toggle == "false"))
        {
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure you specify either true or false. \n\n You said: '" + toggle + "'");
            return null;
        }

        //Set admin if command exists
        for(let cmd in settings.commands){
            if(cmd === commandToSet){
                settings.commands[commandToSet].admin = (toggle === "true") ? true : false;
                cmdTools.SendCommandSuccessMessage(message, message.author + " The '" + commandToSet + "' command's admin permission was set to '" + toggle + "'")
                return settings;
            }
        }

        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the command exists. \n\n You said: '" + commandToSet + "'");
        return null;  
    },

    //Command: addmodulerole [module] [role]
    AddModuleRole: function(message, params, settings)
    {
        let module = params["module"];
        let role = params["role"];

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(module === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return null;
        }

        //check if module exists
        for(let pkg in settings.packages){
            if(settings.packages[pkg].moduleName === module){
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
    RemoveModuleRole: function(message, params, settings)
    {
        let module = params["module"];
        let role = params["role"];

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(module === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified module exists. \n\n You said: '" + module + "'");
            return null;
        }

        //check if module exists
        for(let pkg in settings.packages){
            if(settings.packages[pkg].moduleName === module){
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

    ClearModuleRoles: function(message, params, settings){

    },

    //Command: addcommandrole [command] [role]
    AddCommandRole: function(message, params, settings){

        let commandToAdd = params["command"];
        let role = params["role"];

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(commandToAdd === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + commandToAdd + "'");
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

            if(commandToAdd === cmd){
                if(settings.commands[cmd].roles.includes(role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role already exists in the " + commandToAdd + " command's list of required roles.\n\n You said: '" + role + "'");
                    return null;
                }

                settings.commands[cmd].roles.push(role);
                cmdTools.SendCommandSuccessMessage(message, message.author + "Added '" + role + "' to the '" + commandToAdd + "' command's list of required roles.")
                return settings;
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + commandToAdd + "'");
        return null;
    },

    //@me !manager.removecommandrole [command] [role]
    RemoveCommandRole: function(message, params, settings)
    {
        let commandToRemove = params["command"];
        let role = params["role"];

        if(role === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified role exists. \n\n You said: '" + role + "'");
            return null;
        }

        if(commandToRemove === ""){
            cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + commandToRemove + "'");
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

            if(commandToRemove === cmd){
                if(!settings.commands[cmd].roles.includes(role)){
                    cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. The specified role does not exist in the " + commandToRemove + " command's list of required roles.\n\n You said: '" + role + "'");
                    return null;
                }

                settings.commands[cmd].roles.splice(settings.commands[cmd].roles.indexOf(role), 1);
                cmdTools.SendCommandSuccessMessage(message, message.author + " Removed '" + role + "' from the '" + commandToRemove + "' command's list of required roles.")
                return settings;
            }
        }

        //Could not find command
        cmdTools.SendCommandErrorMessage(message, message.author + " I was unable to do that. Please make sure the specified command exists. \n\n You said: '" + commandToRemove + "'");
        return null;
    },

    //@me !manager.clearcommandroles [command]
    ClearCommandRoles: function(message, params, settings)
    {
        let cmd = params["command"];

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

