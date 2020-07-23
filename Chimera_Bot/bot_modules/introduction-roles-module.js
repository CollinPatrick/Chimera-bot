const cmdTools = require('../commnad-tools.js');
const EventHandler = require('../event-handler.js');

module.exports = {

    moduleHelp :   "This module will read messages from an introduction channel and automatically assign roles based of search terms. \n" +
    "-- (Admin) Use '@me !introrolesaddterm [term]' to add a word or phrase to my list of search terms. EX: he/him, he him, he-him \n" +
    "-- (Admin) Use '@me !introrolesremoveterm [term]' to remove a word or phrase to my list of search terms. \n" +
    "-- (Admin) Use '@me !introroleslistterms' to see the list of terms I will search for. \n" +
    "-- (Admin) Use '@me !introrolescleartterms' to to clear my list of search terms. \n" +
    "-- (Admin) Use '@me !introrolesaddkey [key] [role] ' to add a role key. The key must be one or more search terms after removing /, -, or ' ' from the term. EX: hehim. The role is the role that is associated with the key\n" +
    "-- (Admin) Use '@me !introroleseditkey [key] [role] ' to change the role associated with the key\n" +
    "-- (Admin) Use '@me !introrolesremovekey [key]' to remove a role key. \n" +
    "-- (Admin) Use '@me !introroleslistkeys' to see my list of role keys. \n" +
    "-- (Admin) Use '@me !introrolesclearkeys' to clear my list of role keys. \n" +
    "-- (Admin) Use '@me !introrolesassign [true/false]' to toggle if I assign roles. \n"+
    "-- (Admin) Use '@me !introrolehelp' to get help for only this module. \n",

    settings : {
        moduleName : "Introduction-Roles",
        consoleChannel : "",
        bypassChannel: "introduction", //will read messages regardless of @ mention
        enabled: "true",

        //Includes all varients of words/phrases to look for
        searchTerms: ["game design", "game-design", "gamedesign",
					"interactive design", "interactive-design", "interactivedesign",
					"graphic design", "graphic-design", "graphicdesign",
					"interior design", "interior-design", "interiordesign",
					"she/her", "she her", "sheher", "she-her",
					"they/them", "they them", "theythem", "they-them",
					"he/him", "he him", "hehim", "he-him"],
        
        //Symbols such as "/" and "-" are removed from the search term and checked if it matches a key
        introKeys: {
            "gamedesign" : "Game Design",
            "interactivedesign" : "Interactive Design",
            "interiordesign" : "Interior Design",
            "graphicdesign" : "Graphic Design",
            "hehim" : "He/Him",
            "sheher" : "She/Her",
            "theythem" : "They/Them"
        },

    },


    /////////////Module Functions/////////////
    StartUp: function(client)
    {
        //put commands in settings so admin can toggle "adminOnly" and change allowed roles
        cmdTools.commands["TestModule"]["!test"].run = cmdTools.Test;
    },

    CheckForCommands: function(client, message)
    {
        if(message.channel.name === this.settings.consoleChannel && message.member.permissions.has('ADMINISTRATOR'))
	    {
        
            if(message.content.includes("!introroleshelp"))
            {
                this.Help(message);
            } 
            else if(message.content.includes("!introrolesaddterm"))
            {
                this.AddTerm(message);
            }
            else if(message.content.includes("!introrolesremoveterm"))
            {
                this.RemoveTerm(message);
            } 
            else if(message.content.includes("!introroleslistterms"))
            {
                this.ListTerms(message);
            } 
            else if(message.content.includes("!introrolesclearterms"))
            {
                this.ClearTerms(message);
            }
            else if(message.content.includes("!introrolesaddkey"))
            {
                this.AddKey(message);
            }
            else if(message.content.includes("!introrolesremovekey"))
            {
                this.RemoveKey(message);
            } 
            else if(message.content.includes("!introroleseditkey"))
            {
                this.EditKey(message);
            } 
            else if(message.content.includes("!introroleslistkeys"))
            {
                this.ListKeys(message);
            } 
            else if(message.content.includes("!introrolesclearkeys"))
            {
                this.ClearKeys(message);
            } 
            else if(message.content.includes("!test"))
            {
                cmdTools.commands["TestModule"]["!test"].run(message);
            }
        }
    },

    //Runs even if bot is not mentioned. Best if used in only one channel with little traffic.
    DontMention: function(client, message)
    {
        if(this.settings.enabled == true && message.channel.name === this.settings.bypassChannel)
        {
            this.CheckMessage(message);
        }
    },

    Help: function(message){
        message.channel.send("**" + this.settings.moduleName + "**" + "\n" + this.moduleHelp + "\n");
    },


    /////////////Command Functions/////////////

    CheckMessage: function(message)
    {
        if(!this.IgnoreMessage(message))
        {
            try
            {
                let keys = this.findKeys(message);
                let roles = this.getRoles(keys);
                
                if(roles.length > 0)
                {
                    this.setRoles(roles, message.member, message)
                    message.channel.send("Welcome <@" + message.author.id + ">! I set your role(s) to : " + roles)
                }
                else
                {
                    message.channel.send("Welcome <@" + message.author.id + ">! I could not find any roles for you. Please contact a mod for help.");
                    return;
                }
            }
            catch(err)
            {
                console.log(err);
                message.channel.send("Something went wrong! Please contact @Collin to fix me!");
            }
        }
    },

    RemoveTerm: function(message){
        let temp = cmdTools.StripMessage(message);

        try{
            let index = this.settings.searchTerms.indexOf(temp);
            this.settings.searchTerms.splice(index,1);
            message.channel.send("Removed " + temp + " from the " + this.settings.moduleName + " search term list.");
            EventHandler.commonEmitter.emit('SaveModules');
        }
        catch(exception)
        {
            message.channel.send(temp + " is not in my list of search terms for the" + this.settings.moduleName + " module!")
        }
    },

    //Adds the term to the list of seartch terms
    AddTerm: function(message){
        let temp = cmdTools.StripMessage(message);
        this.settings.searchTerms.push(temp);
        message.channel.send("Added " + temp + " to the " + this.settings.moduleName + " search term list.");
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Removes all terms from the list of search terms
    ClearTerms: function(message){
        this.settings.searchTerms = [];
        message.channel.send("Cleared all terms from my search list.")
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Lists all terms in the list of search terms.
    ListTerms: function(message)
    {
        message.channel.send("**My search terms:** \n [" + this.settings.searchTerms.toString() + "]");
    },

    //removes specified key from list of role keys
    RemoveKey: function(message){
        let key = cmdTools.StripMessage(message);

        if(this.settings.introKeys[key])
        {
            let role  = this.settings.introKeys[key];
            delete this.settings.introKeys[key];
            EventHandler.commonEmitter.emit('SaveModules');
            message.channel.send("removed [" + key + " : " + role + "] from my list of role keys.");
        }
        else
        {
            message.channel.send("That key does not exist!");
        }
    },

    //removes specified key/value to list of role keys
    AddKey: function(message){
        let temp = cmdTools.StripMessage(message);
        let key = temp.substring(0, temp.indexOf(" "));
        temp = temp.replace(temp.substring(0, temp.indexOf(" ")+1), "");
        let role = temp;

        if(!this.settings.introKeys[key])
        {
            this.settings.introKeys[key] = role;
            EventHandler.commonEmitter.emit('SaveModules');
            message.channel.send("Added [" + key + " : " + role + "] to my list of role keys.");
        }
        else
        {
            message.channel.send("That key is already registered! Please use '@me !introroleseditkey [key] [role]' if you want to change the role " + key + " is paired with");
        }
    },

    //Removes all keys from list of role keys
    ClearKeys: function(message){
        this.settings.introKeys = {};
        message.channel.send("Cleared all keys from my search list.")
        EventHandler.commonEmitter.emit('SaveModules');
    },

    //Lists all channels in this modules whitelist.
    ListKeys: function(message)
    {
        message.channel.send("**My search terms:** \n**[key : role]** \n" + 
        (() => {
            let temp = "";
            for(let key in this.settings.introKeys){
                temp += ("[" + key + " : " + this.settings.introKeys[key] + "] \n");
            }
            return temp;
        })());
    },

    ToggleIntroRoles: function(message)
    {
        let temp = cmdTools.StripMessage(message);
        if(temp.includes("true"))
        {
            this.settings.enabled = true;
            message.channel.send("Intro roles are now enabled!");
            EventHandler.commonEmitter.emit('SaveModules');
        }
        else if(temp.includes("false"))
        {
            this.settings.enabled = false;
            message.channel.send("intro toles are now disabled!");
            EventHandler.commonEmitter.emit('SaveModules');
        }
        else
        {
            message.channel.send("Please specify true or false!");
        }
    },
    

    findKeys: function(message)
    {
        //lowercase entire message
        let temp = message.content.toLowerCase();
        let foundKeys = new Array();
        
        for(i = 0; i<this.settings.searchTerms.length; i++)
        {
            if(temp.includes(this.settings.searchTerms[i]))
            {
                
                let key = this.settings.searchTerms[i];
                
                //strips key of special characters and spaces
                if(key.includes('-'))
                {
                    key = key.replace('-', '');
                }
                if(key.includes(' '))
                {
                    key = key.replace(' ', '');
                }
                if(key.includes('/'))
                {
                    key = key.replace('/', '');
                }
                
                //prevents adding duplicate keys
                let dup = foundKeys.indexOf(key);
                if(dup == -1)
                {
                    foundKeys.push(key);
                }
            }
        }
        
        return foundKeys;
    },

    getRoles: function(keys)
    {
        let roles = new Array();
        for(let key in keys)
        {
            for(let role in this.settings.introKeys)
            {

                let value = this.settings.introKeys[role];
                //console.log(keys[key] + " " + role);
                if(keys[key] == role) 
                {
                    roles.push(value);
                    break;
                }
            }
        }
        
        return roles;
    },

    setRoles: function(roles, member, message)
    {
        for(let role in roles)
        {
            let temp = message.guild.roles.find(x => x.name === roles[role]);
            //console.log(temp);
            member.addRole(temp);
        }
    },

    IgnoreMessage: function(message)
    {
        if(message.member.roles.some(r=>this.settings.roles.includes(r.name)) ) {
            // has one of the roles
            return true;
        } 
        else 
        {
            // has none of the roles
            return false;
        }
    }
}