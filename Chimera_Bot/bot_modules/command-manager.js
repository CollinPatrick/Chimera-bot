const ModuleManager = require("./modules/manager-259311378555207680/manager.js");
const DataBus = require("./databus.js");
const cmdTools = require("./command-tools.js");
const fs = require('fs');
const EventHandler = require("./event-handler.js");
const { Message, Client } = require("discord.js");

/**
 * @module command-manager
 * @exports command-manager
 */
module.exports = {

    /**
     * A library of all avalible modules
     * @deprecated
     */
    moduleLibrary: [],

    /**
     * Imports all command modules from the module folder and populates moduleLibrary array
     * @deprecated
     */
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

    /**
     * Returns an array of all commnad modules
     * @deprecated
     */
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

    /**
     * The entry point for prefixed messages
     * @param {Client} client - Discord client
     * @param {Message} message - Recieved message
     */
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

        //Get module commands //could merge with earlier loop through commands for efficientcy
        var commands = {};
        for(let command in guildSettings.commands)
        {
            if(guildSettings.commands[command].parentModule === moduleToExecute)
            {
                commands[command] = guildSettings.commands[command];
            }
        }

        let params = this.ParseParams(message, guildSettings.commands[command].params);
        
        //check for undefined params
        for(let param in params){
            if(params[param] === undefined || params[param] === ""){
                cmdTools.SendCommandErrorMessage(message, "Unable to process command. One or more parameters are missing!");
                return;
            }
        }

        //Not manager - run command with module settings
        if(moduleToExecute !== ModuleManager.package.moduleName)
        {
            //Get module id
            let id = `${moduleToExecute}-${guildSettings.packages[moduleToExecute].id}`;

            //Get command module
            let module = this.GetModule(id, `${moduleToExecute}.js`);

            //Build module specific settings
            let moduleSettings = {
                settings: guildSettings.settings[moduleToExecute],
                commands: commands,
                defGroup: guildSettings.packages[moduleToExecute].defGroup,
                prefix: guildSettings.prefix
            }

            //Run command - return object or null
            let updatedSettings;
            try {
                updatedSettings = await module[commands[command]["run"]](message, params, moduleSettings);
            }
            catch(error){
                console.log("Command function does not exist!");
            }
            // let updatedSettings = await module.Run(message, command, params, moduleSettings);

            //Changes returned from module
            if(updatedSettings !== null)
            {
                //Only module settings get saved. Other settings are changed using the manager module
                guildSettings.settings[moduleToExecute] = updatedSettings.settings;
                DataBus.SaveGuildSettings(guildSettings);
            }
        }
        else //Is manager - run command with full guild settings
        {
            //Run command
            let updatedSettings;
            try{
                updatedSettings = await ModuleManager[commands[command]["run"]](message, params, guildSettings)
            } 
            catch(error){
                console.log("Command function does not exist!");
            }

            //Changes returned from module
            if(updatedSettings !== null && updatedSettings !== undefined)
            {
                // let validation = await DataBus.ValidateGuildSettings(updatedSettings)
                // if(validation.status === "success"){
                //     DataBus.SaveGuildSettings(updatedSettings);
                // }

                DataBus.SaveGuildSettings(updatedSettings);
            }
        }


    },

    /**
     * Retrieves parameters from a command.
     * @param {Message} message - Discord message object.
     * @param {string[]} params - Array of command parameters.
     * @returns {object}
     */
    ParseParams: function(message, params){

        if (params.length < 1){
            return {};
        }

        let content = message.content;
        if(content.indexOf(" ") !== -1){
            content = content.replace(content.substring(0, content.indexOf(" ")), "");
        }
        else{
            content = "";
        }
        
        let paramObj = {};

        //remove leading space
        if(content[0] === " "){
            content = content.substring(1, content.length);
        }

        //get raw params
        let paramList = content.split("-");

        //Remove empty param if it exists
        if(paramList[0] === ""){
            paramList.splice(0,1);
        }

        for(let param in params){
            let temp = paramList[param];
            if(temp === "" || temp === undefined){
                //No param
                paramObj[params[param]] = undefined;
            }
            else{
                //Remove leading and trailing spaces
                if(temp[0] === " "){
                    temp = temp.substring(1, temp.length-1);
                }
                if(temp[temp.length-1] === " "){
                    temp = temp.substring(0, temp.length-1);
                }
                //Add parsed param
                paramObj[params[param]] = temp;
            }
        }
        return paramObj;
    },

    /**
     * Adds guild to database and installs manager module.
     * @param {string} guildID - Discord guild object id. 
     */
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

        //Create guild settings entry for guild, TO-DO: Move to databus
        DataBus.database.query(`INSERT INTO guildSettings(id, settings, commands, packages, prefix) VALUES('${guildID}', '${settings}', '${genCommands}', '${packages}', '${prefix}')`);

        let guildSettings = await DataBus.GetGuildSettings(guildID);

        this.InstallModule("template-259311378555207680", guildSettings);
    },

    /**
     * Deletes guild data from database
     * @param {string} guildID - Discord guild object id
     */
    LeaveGuild: function (guildID)
    {
        //remove guild settings entry for from database TO-DO: Move to databus
        DataBus.database.query(`DELETE FROM guildSettings WHERE id = '${guildID}'`);
    },

    /**
     * Returns a copy of a Chimera module matching the provided ID.
     * This is used for installing modules.
     * @param {string} moduleID - The name of the module and it's id separated with a dash. EX: "manager-123"  
     * @returns {object} Copy of a Chimera module
     */
    GetModuleCopy: function(moduleID)
    {
        let normalizedPath = require("path").join(__dirname, `modules/${moduleID}/`);
        let module = null;
        fs.readdirSync(normalizedPath).forEach(file =>{
            if(file === "package.json"){
                let pkg = require(`./modules/${moduleID}/${file}`);
                module = require(`./modules/${moduleID}/${pkg.moduleName}.js`);
            }
        });
        return (JSON.parse(JSON.stringify(module)));
    },

    /**
     * Returns the Chimera module matching the provided id and file name.
     * This is used for running commands.
     * @param {string} moduleID - The name of the module and it's id separated with a dash. EX: "manager-123" 
     * @param {string} fileName - The name of a module as a .js file EX: "manager.js" 
     * @returns {object} A Chimera module
     */
    GetModule: function(moduleID, fileName)
    {
        let normalizedPath = require("path").join(__dirname, `modules/${moduleID}/`);
        let module = null;
        fs.readdirSync(normalizedPath).forEach(file =>{
            if(file === fileName){
                module = require(`./modules/${moduleID}/${file}`);
                return;
            }
        });

        return module;
    },

    InstallModule: async function (moduleID, settings)
    {
        const moduleToInstall = this.GetModuleCopy(moduleID);
        console.log(moduleToInstall);

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
        for(let pkg in settings.packages)
        {
            if(settings.packages[pkg]["moduleName"] === moduleName)
            {
                foundPkg = true;
                delete settings.packages[pkg];
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