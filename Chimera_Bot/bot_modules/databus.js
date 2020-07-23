require('dotenv').config();
const mysql = require("mysql");
//const cmdManager = require("./command-manager");
const fetch = require("node-fetch");

module.exports = {

    moduleLibrary: [],

    database: mysql.createConnection({
        host: "localhost",
	    user: "root",
	    password: process.env.SQL_PASSWORD,
	    database: process.env.SQL_DATABASE
    }),

    //Run in bot.js
    Connect: function()
    {
        this.database.connect(err => {
            if (err) throw err;
            console.log("Connected to database!");
            this.database.query("CREATE TABLE IF NOT EXISTS guildSettings (id varchar(30) NOT NULL, settings JSON NOT NULL, commands JSON NOT NULL, modules JSON NOT NULL, prefix char(1) NOT NULL DEFAULT '!')");
        });
    },

    SetUp: function()
    {
        var sql = "CREATE TABLE guildSettings (id VARCHAR(30), address VARCHAR(255))";
    },

    IsGuildRegistered: function(guildID)
    {
        return new Promise((resolve, reject) => {
            this.database.query(`SELECT * FROM guildSettings WHERE id = '${guildID}'`, (err, rows) =>{ 
                if (err) {
                    console.log(err);
                    return resolve(false);
                }
                let temp = (rows && rows.length) ? true : false;
                return resolve(temp);
            });
        });
    },

    GetGuildSettings: function(guildID, prefix = "\\")
    {
        return new Promise((resolve, reject) => {
            this.database.query(`SELECT * FROM guildSettings WHERE id = '${guildID}'`, (err, rows) =>{
                
                if(rows[0].prefix !== prefix && prefix !== "\\") {
                    return reject(new Error("incorrect prefix"));
                }

                //Construct guild settings object
                let guildSettings = {};
                guildSettings["id"] = rows[0].id;
                guildSettings["settings"] = JSON.parse(rows[0].settings);
                guildSettings["commands"] = JSON.parse(rows[0].commands);
                guildSettings["modules"] = JSON.parse(rows[0].modules);
                guildSettings["prefix"] = rows[0].prefix;

                return err ? reject(err) : resolve(guildSettings);
            });
        });
    },

    //Supply root settings object array (contains all modules)
    SaveGuildSettings: async function(guildSettings)
    {
        // console.log("Save Settings:");
        // console.log(guildSettings);
        // return;


        // //if(settings === undefined || settings === null) return;
        // if(settings === undefined)
        // {
        //     console.log("SAVING DEFUALT SETTINGS!");
        //     let modSettings = [];

        //     modSettings.push(this.settings);

        //     this.modules.forEach(element => {
        //         modSettings.push(element.settings);
        //     });

        //     settings = modSettings;
        // }

        // //let data = JSON.stringify(settings);


        let settings = JSON.stringify(guildSettings["settings"]);
        let commands = JSON.stringify(guildSettings["commands"]);
        let modules = JSON.stringify(guildSettings["modules"]);
        let prefix = guildSettings["prefix"];

        this.database.query(`SELECT * FROM guildSettings WHERE id = '${guildSettings["id"]}'`, (err, rows) =>
        {
            if(err) throw err;
            
            this.database.query(`UPDATE guildSettings SET 
                                settings = '${settings}', 
                                commands = '${commands}', 
                                modules = '${modules}', 
                                prefix = '${prefix}' 
                                WHERE id = '${guildSettings["id"]}'`);

            // let sql;
            
            // //Create row in table to guild if existing save data not found
            // if(rows.length < 1)
            // {
            //     sql = `INSERT INTO guildSettings(id, settings) VALUES('${guild.id}', '${data}')`;
            // }
            // else
            // {
            //     sql = `UPDATE guildSettings SET settings = '${data}' WHERE id = '${guild.id}'`;
            // }

            // this.database.query(sql);
        });
    },

    ValidateGuildSettings: async function(settings, guildID){
        var status = {status: "success", errors: []};

        //Validate data is not empty
        if(!settings["commands"]){
            status.status = "fail";
            status.errors.push("Missing data: No command data");
        }
        if(!settings["prefix"]){
            status.status = "fail";
            status.errors.push("Missing data: No prefix");
        }
        if(!settings["modules"]){
            status.status = "fail";
            status.errors.push("Missing data: No modules");
        }

        if(status.status == "fail") return status;

        //validate prefix data
        var prefixTest = this.ValidatePrefix(settings["prefix"]);
        if(prefixTest.status == "fail"){
            status.status = "fail";
            status.errors = status.errors.concat(prefixTest.errors);
        }

        await this.ValidateCommands(settings["commands"], settings["modules"], guildID)
        .then(commandTest =>{
            if(commandTest.status == "fail"){
                status.status = "fail";
                status.errors = status.errors.concat(commandTest.errors);
            }
        });

        return status;

    },

    allowedPrefix: process.env.ALLOWED_PREFIX,//"!$%^&-+=~|:",

    ValidatePrefix: function(prefix){
        let test = {status: "pass", errors: []};
        if(prefix.length > 1 || prefix.length === 0){
            test.status = "fail"
            test.errors.push(`Invalid response: Prefix too long. Expected length of '1', response length: ${prefix.length}`);
            return test;
        }

        if(this.allowedPrefix.indexOf(prefix) == -1){
            test.status = "fail";
            test.errors.push(`Invalid response: Prefix not valid. Expected prefix '${this.allowedPrefix}', response: ${prefix}`);
            return test;
        }

        return test;
    },

    //Checks if commands exist in installed modules
    ValidateCommands: async function(commands, modules, guildID){
        var commandTest = {status: "pass", errors: []};
        let roles = await this.GetGuildRoles(guildID);

        for(let command in commands){
            
            //Check if commands parent module is installed
            if(!modules.includes(commands[command]["parentModule"])){
                commandTest.status = "fail";
                commandTest.errors.push(`Mismatch: The module associated with the command '${command}' is not installed. Associated module: '${commands[command]["parentModule"]}'`);
                //continue;
            }

            //Check if parent module exists in library and command exists in module
            var foundModule = false;
            var foundCommand = false;
            this.moduleLibrary.forEach(module =>{
                //if(foundModule) continue;
                if(module.settings.moduleName == commands[command]["parentModule"]){
                    foundModule = true;
                    if(module.commands[command]){
                        foundCommand = true;
                    }
                }
            });
            
            if(!foundModule){
                commandTest.status = "fail";
                commandTest.errors.push(`Mismatch: The module associated with the command '${command}' does not exist. Associated module: '${commands[command]["parentModule"]}'`);
            }
            if(foundModule && !foundCommand){
                
                commandTest.status = "fail";
                commandTest.errors.push(`Mismatch: The command '${command}' does not exist in associated module. Associated module: '${commands[command]["parentModule"]}'`);
            }

            //check command data
            //check admin
            let adminTest = this.ValidateAdmin(command, commands[command]);
            if(adminTest.status == "fail"){
                commandTest.status = "fail";
                commandTest.errors = commandTest.errors.concat(adminTest.errors);
            }

            //Check roles
            await this.ValidateRoles(command, commands[command], roles)
            .then(rolesTest =>{
                //console.log(rolesTest);
                if(rolesTest.status == "fail"){
                    commandTest.status = "fail";
                    commandTest.errors = commandTest.errors.concat(rolesTest.errors);
                }
            });
                
        }
        //console.log(test);
        return commandTest;
    },

    //checks if admin exists and is a boolean
    ValidateAdmin: function(commandName, command){
        let test = {status: "pass", errors: []}; 

        if(command["admin"] === "" || command["admin"] === null || command["admin"] === undefined){
            test.status = "fail";
            test.errors.push(`Missing data: The admin value of ${commandName} is missing`);
        }

        if(typeof(command["admin"]) !== 'boolean'){
            test.status = "fail";
            test.errors.push(`Invalid response: ${commandName} admin value must be either true or false (checkbox). Response: ${command["admin"]}`);
        }

        return test;
    },

    //checks if roles exist in guild
    ValidateRoles: async function(commandName, command, roles){
        let test = {status: "pass", errors: []}; 
        
        if(command["roles"].length === 0){
            return test;
        }

        command.roles.forEach(role => {
            if(!roles.includes(role)){
                test.status = "fail";
                test.errors.push(`Invalid response: guild does not have role '${role}'. Command: ${commandName}`);
            }
        });

        return test;
    },

    ValidateModuleSettings: function(settings){

    },

    GetGuildRoles: async function(guildID){
        return new Promise((resolve, reject) => {
            fetch("https://discordapp.com/api/guilds/" + guildID + "/roles", {
                method: "GET",
                headers: {
                    "Content-Type":"application/json",
                    Authorization: "Bot " + process.env.SECRET_TOKEN,
                }
            })
            .then(x=>x.json())
            .then(response=>{
                let temp = []

                for(let role in response){
                    temp.push(response[role].name);
                }
                //console.log(temp);
                if (temp == []){
                    return reject(temp);
                }
                return resolve(temp);
            });
        });
    },

    ValidateModuleInstall: async function(moduleName){
        //let moduleLibrary = cmdManager.GetModuleLibrary();
        let test = {status: "fail", errors: []};
        
        this.moduleLibrary.forEach(module =>{
            if(module.settings.moduleName === moduleName){
                test.status = "success";
            }
        });

        if(test.status === "success"){
            return test;
        }

        test.errors.push(`Invalid response: The module '${moduleName}' does not exist.`);
        return test;
    },

    // InstallModule: async function(moduleName, settings){
    //     cmdManager.InstallModule(moduleName, settings);
    // },

    // UninstallModule: async function(moduleName, settings){
    //     cmdManager.UninstallModule(moduleName, settings);
    // },

    //Does not add or remove from saved settings, only overwrites existing fields
    MergeSave: async function(settings, guildID) {
        var savedSettings = await this.GetGuildSettings(guildID);

        //Merge Commands
        for (let command in savedSettings["commands"]){
            //Check if command exists in settings before overwriting
            if(settings["commands"][command]){
                savedSettings["commands"][command]["admin"] = settings["commands"][command]["admin"];
                savedSettings["commands"][command]["roles"] = settings["commands"][command]["roles"];
            }
        }

        //Merge prefix
        savedSettings["prefix"] = settings["prefix"];

        //Save
        await this.SaveGuildSettings(savedSettings);
    }
}