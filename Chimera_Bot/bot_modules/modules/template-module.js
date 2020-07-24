const cmdTools = require('../command-tools.js'); //A collection of common tools to help streamline command interactions
const { set } = require('lodash');

module.exports = {
    //List all commands for this module here and their defuault permissions
    //Make sure all commands are unique
    commands : {    
        "ping" : {
            admin : false, //User must have admin to use this command. 
            roles : [] //User must have role(s) to use this command. Leave empty by default
        },
        "setresponse" : {
            admin : true,
            roles : []
        },
        "help" : {
            admin : false,
            roles : []
        },
    },

    //List all settings that will need to be saved (per server) for this module
    settings : {
        //The name of this module. Make sure this is a unique name. It is used to identify this module when saving and loading settings
        moduleName: "Template",

        //Module specific settings
        resonse: "pong"
    },

    //These are required fields that describe this module and are used for insallation and updating the module
    package : {
        moduleName: "Template",     //This is the name of the module and will never change
        version: "1.0.0",   //If this number changes, the module will update
        author: "Collin Patrick",   
        description: "This module is a template example for creating new modules.",
        defGroup: "tmp",    //This is the default group identifier for this command EX: "tpl.help"
        whatsNew: ""    //This is sent to server owners when the module updates
    },

    //This is called when a requested command matches this module.
    Run: async function(message, command, settings)
    {
        //Remove defGroup from command
        let cmd = command.substring(command.indexOf(".")+1, command.length);
        
        switch (cmd) {
            case "ping":
                //functionality for this command
                return this.DoSomething(message, settings);
            case "setresponse":
                return this.SetResponse(message, settings);
            case "help":
                return this.Help(message, settings);
        }
    },

    //It's generally a good idea to have a help command
    //[prefix]template.help
    Help: async function(message, settings)
    {
        message.channel.send(
            cmdTools.HelpBuilder(this.package, 
                [
                    cmdTools.CreateCommandField(settings.prefix, settings, `${settings.defGroup}.ping`, "", "Make me respond with a preset message."),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${settings.defGroup}.setresponse`, "[response]", `Set my response for ${settings.prefix}template.ping.`),
                    cmdTools.CreateCommandField(settings.prefix, settings, `${settings.defGroup}.help`, "", "Get help for only this module."),
                ]
            )
        );

        //return null if no settings were changed
        return null;
    },

    //This is used to check incoming setting changes for this module
    //This is only used when settings were changed via the web dashboard
    //Return object with status of either "pass" or "fail"
    //if fail, add array with all errors, these errors will appear on the dashboard
    /*
        return example = {
            status: "fail",
            errors: [
                "error 1",
                "error 2",
                ...
            ]
        }
    */
    ValidateSettings: function(settings){ //not implimented

    },

    //////////////// COMMAND FUNCTIONS ////////////////

    //Sends the preset response to the recieved message channel
    //[prefix]template.ping
    DoSomething: async function(message, settings)
    {
        //Send saved response to channel 
        message.channel.send(settings.settings.resonse);
        //return null if no settings were changed
        return null;
    },

    //Sets the preset response for the ping command
    //[prefix]template.setresponse [response]
    SetResponse: async function(message, settings)
    {
        //console.log(settings);
        let newResponse = message.content;
        //Remove command from message
        newResponse = newResponse.substring(newResponse.indexOf(" ") + 1, newResponse.length);
        //Set new response
        settings.settings.resonse = newResponse;
        //Send success message
        cmdTools.SendCommandSuccessMessage(message, `Set response to: ${newResponse}`);
        //return changes to be saved
        return settings;
    },

}