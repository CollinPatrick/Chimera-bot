/*
MySQL table 
Guild ID, settings, commands, modules, prefix

GuildSettings{
    settings:{
        //installed module settings
        "ModuleName":{
            //settings
        },
    }
    commands:{
        //installed module commands
        "command" : {
            moduleAdmin: boolean,
            admin: boolean,
            moduleRoles: [string]
            roles: [string],
            parentModule: string
        },
    }
    modules:[
        //list of installed modules
        "ModuleName",
        "ModuleName",
    ],
    prefix : "!",
}*/ 
const ModuleManager = require("./module-manager.js");
const DataBus = require("./databus.js");
const cmdTools = require("./command-tools.js");
const fs = require('fs');
const EventHandler = require("./event-handler.js");

module.exports = {

    moduleLibrary: [],

    //populate module library
    PopulateModuleLibrary: function() {
        this.moduleLibrary = [];
        this.moduleLibrary.push(ModuleManager); //Move manager to module folder
        let normalizedPath = require("path").join(__dirname, "modules");

        fs.readdirSync(normalizedPath).forEach(file =>{
            let module = require("./modules/" + file);
            this.moduleLibrary.push(module);
        });

        console.log((() => {
            var temp = "Module Library:\n";
            this.moduleLibrary.forEach(module =>{
                temp += `> ${module.package.moduleName}\n`;
            });
            return temp;
        })());
    },

    GetModuleLibrary: function(){
        moduleLibrary = [];
        moduleLibrary.push(ModuleManager); //Move manager to module folder
        let normalizedPath = require("path").join(__dirname, "modules");

        fs.readdirSync(normalizedPath).forEach(file =>{
            let module = require("./modules/" + file);
            moduleLibrary.push(module);
        });

        console.log((() => {
            var temp = "Module Library:\n";
            moduleLibrary.forEach(module =>{
                temp += `> ${module.package.moduleName}\n`;
            });
            return temp;
        })());

        return moduleLibrary;
    },

    ReadMessage: async function(client, message)
    {
        let badPrefix = false;
        let prefix = message.content[0];

        let guildSettings = await DataBus.GetGuildSettings(message.guild.id, prefix)
        .catch(reject =>{
            console.log(reject);
            badPrefix = true;
        });
        if(badPrefix){
            return;
        }

        let command = message.content;
        //remove prefix from command
        command = command.slice(1);
        //Isolate command
        if(command.indexOf(" ") !== -1){
            command = command.substring(0, command.indexOf(" "));
        }

        let moduleToExecute = null;

        for(let cmd in guildSettings.commands)
        {
            //Find command
            if(cmd === command)
            {
                //Check admin permissions
                if(cmd.admin === true)
                {
                    if(!message.member.permissions.has('ADMINISTRATOR')){
                        cmdTools.SendCommandErrorMessage(message, "Sorry " + message.author + "! I can't do that. You don't have admin permissions to use that command");
                        return;
                    }
                }

                //Check role permissions
                if(!guildSettings.commands[cmd].roles.every(role => message.member.roles.find(r => r.name === role)))
                {
                    cmdTools.SendCommandErrorMessage(message, "Sorry " + message.author + "! I can't do that. You don't have one or more of the required roles for this command.\n Required roles: " + guildSettings.commands[cmd].roles);
                    return;
                }
                moduleToExecute = guildSettings.commands[cmd].parentModule;
            }
        }

        //command not found
        if(moduleToExecute === null)
        {
            return;
        }

        //Check module's channel white/black list
        let messageChannel = message.channel.name;
        if(messageChannel !== guildSettings.settings["Manager"].consoleChannel){
            let listType = guildSettings.settings[moduleToExecute].listType;
            let channelList = guildSettings.settings[moduleToExecute].channelList
            let allowed = false;
            switch(listType){
                case "none":
                    return;

                case "white":
                    for(channel in channelList){
                        if(channelList[channel] === messageChannel){
                            allowed = true;
                        }
                    }
                    if(allowed) break;

                    return;

                case "black":
                    allowed = true;
                    for(channel in channelList){
                        if(channelList[channel] === messageChannel){
                            allowed = false;
                        }
                    }
                    if(allowed) break;

                    return;
                
                default:
                    return;
            }
        }

        //Get command module
        let module = this.GetModule(moduleToExecute);

        //Get module commands //could merge with earlier loop through commands for efficientcy
        var commands = {};
        for(let command in guildSettings.commands)
        {
            if(guildSettings.commands[command].parentModule === moduleToExecute)
            {
                //commandName = command.substring(command.indexOf(".")+1, command.length);
                commands[command] = guildSettings.commands[command];
            }
        }

        //Not manager - run command with module settings
        if(moduleToExecute !== ModuleManager.package.moduleName)
        {
            //Build module specific settings
            let moduleSettings = {
                settings: guildSettings.settings[moduleToExecute],
                commands: commands,
                defGroup: guildSettings.packages[moduleToExecute].defGroup,
                prefix: guildSettings.prefix
            }

            //Run command - return object or null
            let updatedSettings = await module.Run(message, command, moduleSettings);
            //Changes returned from module
            if(updatedSettings !== null)
            {
                //Only module settings get saved. Command and prefix settings are changed using the manager module
                //This is to prevent modules from overwriting guild settings or other module settings
                guildSettings.settings[moduleToExecute] = updatedSettings.settings;
                DataBus.SaveGuildSettings(guildSettings);
            }
        }
        else //Is manager - run command with full guild settings
        {
            //Run command
            let updatedSettings = await module.Run(message, command, guildSettings);
            //Changes returned from module
            if(!updatedSettings === null)
            {
                database.SaveGuildSettings(updatedSettings);
            }
        }


    },

    JoinGuild: async function(guildID)
    {   
        //Get default manager settings
        let settings = {};
        settings[ModuleManager.package.moduleName] = ModuleManager.settings;
        //Add whitelist options to settings
        settings[ModuleManager.package.moduleName]["listType"] = "none"; //List types "white", "black", "none"
        settings[ModuleManager.package.moduleName]["channelList"] = [];
        settings = JSON.stringify(settings);

        //Get manager commands and set their parent module
        var commands = ModuleManager.commands;
        var genCommands = {};
        for(let command in commands)
        {
            let commandName = `${ModuleManager.package.defGroup}.${command}`;
            genCommands[commandName] = commands[command];
            //console.log(command);
            genCommands[commandName]["parentModule"] = ModuleManager.package.moduleName;
        }
        genCommands = JSON.stringify(genCommands);
        
        //Create and add manager to module list
        let packages = {};
        packages[ModuleManager.package.moduleName] = ModuleManager.package;
        packages = JSON.stringify(packages);

        //Set defualt prefix
        let prefix = '!';

        //Create guild settings entry for guild
        DataBus.database.query(`INSERT INTO guildSettings(id, settings, commands, packages, prefix) VALUES('${guildID}', '${settings}', '${genCommands}', '${packages}', '${prefix}')`);

        let guildSettings = await DataBus.GetGuildSettings(guildID);

        this.InstallModule("Template", guildSettings);
        //guildSettings.settings["Echo"].allowedChannels.push("general");
        //EventHandler.commonEmitter.emit("SaveGuildSettings", guildSettings);
        //this.UninstallModule("Echo", guildSettings);
        //this.InstallModule("Echo", guildSettings);
    },

    LeaveGuild: function (guildID)
    {
        //remove guild settings entry for guild
        DataBus.database.query(`DELETE FROM guildSettings WHERE id = '${guildID}'`);
    },

    GetModuleCopy: function(moduleName)
    {
        for(let i = 0; i < this.moduleLibrary.length; i++) //always returns null without normal for loop. Don't know why
        {
            //Check if supplied module name matches library module
            if(this.moduleLibrary[i].package.moduleName === moduleName)
            {
                //return deep copy of module without functions
                return JSON.parse(JSON.stringify(this.moduleLibrary[i]));
            }
        }

        return null;
    },

    GetModule: function(moduleName)
    {
        for(let i = 0; i < this.moduleLibrary.length; i++)
        {
            //Check if supplied module name matches library module
            if(this.moduleLibrary[i].package.moduleName === moduleName)
            {
                //return module
                return this.moduleLibrary[i];
            }
        }

        return null;
    },

    InstallModule: async function (moduleName, settings)
    {
        const moduleToInstall = this.GetModuleCopy(moduleName);

        //check if requested module exists
        if(moduleToInstall === null || moduleToInstall === undefined)
        {
            //THROW ERROR - module does not exist
            console.log("Module does not exist")
            return;
        }

        //check if requested module is already installed
        if(settings.settings[moduleToInstall.package.moduleName])
        {
            //Throw err - module already installed
            console.log("Module already installed")
            return;
        }

        let guildSettings = settings;

        //Add module settings
        guildSettings.settings[moduleToInstall.package.moduleName] = moduleToInstall.settings;

        //Add whitelist options to settings
        guildSettings.settings[moduleToInstall.package.moduleName]["listType"] = "none"; //List types "white", "black", "none"
        guildSettings.settings[moduleToInstall.package.moduleName]["channelList"] = [];

        //Add module commands
        var moduleCommands = moduleToInstall.commands;
        var genCommands = {};
        for(let command in moduleCommands)
        {
            let commandName = `${moduleToInstall.package.defGroup}.${command}`;
            genCommands[commandName] = moduleCommands[command];
            //console.log(command);
            genCommands[commandName]["parentModule"] = moduleToInstall.package.moduleName;

            //console.log(command);
            guildSettings.commands[commandName] = genCommands[commandName];
        }

        //Add module to module list
        guildSettings.packages[moduleToInstall.package.moduleName] = moduleToInstall.package;

        //Save new settings
        EventHandler.commonEmitter.emit("SaveGuildSettings", guildSettings);
    },

    UninstallModule: async function(moduleName, settings)
    {
        console.log(`Uninstalling ${moduleName}`);
        //check if requested module is module manager
        if(moduleName === ModuleManager.package.moduleName)
        {   
            console.log("You cannot uninstall module manager!");
            return;
        }


        //check if requested module is installed, delete if found
        let foundPkg = false;
        for(let package in settings.packages)
        {
            if(settings.packages[package]["moduleName"] === moduleName)
            {
                foundPkg = true;
                delete settings.packages[package];
            }
        }

        if(!foundPkg){
            console.log("Module not installed!");
            return;
        }

        //delete module settings
        delete settings.settings[moduleName];

        //remove module commands
        for(let command in settings.commands)
        {
            if(settings.commands[command]["parentModule"] === moduleName)
            {
                delete settings.commands[command];
            }
        }

        //save new settings
        EventHandler.commonEmitter.emit("SaveGuildSettings", settings);

    }
}