const cmdTools = require('../../command-tools.js');
const { Message } = require('discord.js');

/**
 * An example template for creating new Chimera modules.
 * @module template
 * @exports template
 */
module.exports = {

    /**
     * The commands.JSON associated with the module.
     * List all commands for this module here and their defuault permissions
     * All commands must be unique within the module
     * @type {JSON}
     */
    commands : require('./commands.json'),

    /**
     * The settings.JSON associated with the module.
     * All module persistant data is listed here
     * @type {JSON}
     */
    settings : require('./settings.json'),

    /**
     * The package.JSON associated with the module.
     * These are required fields that describe this module and are used for insallation and updating the module.
     * @type {JSON}
     */
    package : require('./package.json'),

    /**
     * This is used to check incoming setting changes for this module.
     * Funtion is called when settings were changed via the web dashboard.
     * @param {settings} moduleSettings 
     * @returns An object with a status of either "pass" or "fail".
     * If fail, add an array with errors. These errors will appear on the dashboard.
     * Return null to opt out of dashboard changes
     * @todo Impliment in databus dashboard data validation.
     */
    ValidateSettings: async function(moduleSettings){
        let test = {status: "fail", errors: []}
        return test;
    },

    /**
     * Sends an embedded help message to the recieved message's channel.
     * @param {Message} message 
     * @param {moduleSettings} settings 
     * @returns {null}
     */
    Help: async function(message, command, params, settings)
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
        return null;
    },

    //////////////// COMMAND FUNCTIONS ////////////////

    //Sends the preset response to the recieved message channel
    //Command: ping
    Ping: async function(message, command, params, settings)
    {
        //Send saved response to channel 
        message.channel.send(settings.settings.response);
        //return null if no settings were changed
        return null;
    },

    //Sets the preset response for the ping command
    //Command: setresponse [response]
    SetResponse: async function(message, command, params, settings)
    {
        settings.settings.response = params.response;
        //Send success message
        cmdTools.SendCommandSuccessMessage(message, `Set response to: ${params.response}`);
        //return changes to be saved
        return settings;
    },

}