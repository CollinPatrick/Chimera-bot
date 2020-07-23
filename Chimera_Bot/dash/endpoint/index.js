require('dotenv').config();
const express = require('express');
const databus = require('../../bot_modules/databus.js');
const cmdManager = require('../../bot_modules/command-manager')
const path = require('path');
const fetch = require('node-fetch');
const bodyParser = require("body-parser");
const port = process.env.PORT;
var app = express(), 
server = require('http').createServer(app);
var cors = require('cors');

app.use("/site", express.static(path.join(__dirname, "../website")));
app.use(cors({
	origin: ['http://chimerabot.net', `localhost:${port}`]
}))
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.use((req,res,next) => {
	req.header("Access-Control-Allow-Origin", "http://chimerabot.net");
	req.header("Access-Control-Allow-Methods", "*");
	next();
});

app.get("/test", (req,res) => {
    res.json({hello: "world"})
});

//Checks if member of a guild (guild is in database) and returns value as boolean
app.get("/ismember", async (req, res) => {
	let guildID = req.get("Guild-ID");
	if(guildID == null || guildID == undefined) return res.json({value: false});

	let isMember = await databus.IsGuildRegistered(guildID);
	(isMember) ? res.json({value: true}) : res.json({value: false});
});

app.get("/prefix", async (req, res) => {
	let guildID = req.get("Guild-ID");
	if(!guildID) return res.json({prefix: null});

	let settings = await databus.GetGuildSettings(guildID);
	if(settings != undefined && settings != null)
	{
		res.json({prefix: settings.prefix});
	}
	else
	{
		res.json({prefix: ""});
	}
});

app.post("/prefix", (req,res) =>{
	console.log("Posting");
	if(!req.body.token) return res.json({error: "unauth"});
	fetch("https://discordapp.com/api/users/@me/guilds", {
		method: "GET",
		headers: {
			"Content-Type":"application/json",
			Authorization: "Bearer " + req.body.token,
		}
	})
	.then(x=>x.json())
	.then(response=>{	
		let guild = response.find(x=>x.id == req.body.id);
		if(!guild || !guild.owner) return res.json({error: "unauth"});

		databus.database.query(`SELECT * FROM guildSettings WHERE id = '${req.body.id}'`, (err, rows) =>{
			if(err) throw err;
	
			databus.database.query(`UPDATE guildSettings SET 
									prefix = '${req.body.value}' 
									WHERE id = '${req.body.id}'`);
		});  
		res.json({success: true});
	})

	    
});

app.get("/guild-roles", async (req, res) =>{
	let guildID = req.get("Guild-ID");
	if(!guildID) return res.json({status:"fail", code: "Unauth"}); //return fail

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

		return res.json({status: "success", roles: temp});
	});

});

app.get("/guild-data", async (req,res) =>{
	let guildID = req.get("Guild-ID");
	if(!guildID) return res.json({status:"fail", code: "Unauth"}); //return fail

	let settings = await databus.GetGuildSettings(guildID);
	if(settings != undefined && settings != null){
		return res.json({
			status: "success",
			id: guildID,
			settings: settings.settings,
			commands: settings.commands,
			modules: settings.modules,
			prefix: settings.prefix
		});
	}
	else{
		return res.json({status:"fail", code: "No saved settings"}); //return fail
	}
});

app.post("/guild-data", async (req,res) =>{
	let guildID = req.body.guildID;
	let token = req.body.token;
	let settings = req.body.settings;

	//Catch missing data
	if(!guildID) return res.json({status:"fail", errors: ["Unauth: bad guild"]});
	if(!token) return res.json({status:"fail", errors: ["Unauth: bad token"]});
	if(!settings) return res.json({status:"fail", errors: ["Unauth: no settings"]});

	//Validate guild and token
	fetch("https://discordapp.com/api/users/@me/guilds", {
		method: "GET",
		headers: {
			"Content-Type":"application/json",
			Authorization: "Bearer " + token,
		}
	})
	.then(x=>x.json())
	.then(async response=>{	
		let guild = response.find(x=>x.id == guildID);

		//Catch premissions error
		if(!guild || !guild.owner) return res.json({error: "unauth: bad guild"});

		//validate settings
		let status = await databus.ValidateGuildSettings(settings, guildID);

		if(status.status == "fail"){
			return res.json(status);
		}

		await databus.MergeSave(settings, guildID);

		return res.json(status);
	})
	
});

app.post("/install-module", async (req,res) =>{
	let guildID = req.body.guildID;
	let token = req.body.token;
	let module = req.body.module;

	//Catch missing data
	if(!guildID) return res.json({status:"fail", errors: ["Unauth: bad guild"]});
	if(!token) return res.json({status:"fail", errors: ["Unauth: bad token"]});
	if(!module) return res.json({status:"fail", errors: ["Unauth: no module"]});

	//Validate guild and token
	fetch("https://discordapp.com/api/users/@me/guilds", {
		method: "GET",
		headers: {
			"Content-Type":"application/json",
			Authorization: "Bearer " + token,
		}
	})
	.then(x=>x.json())
	.then(async response=>{	
		let guild = response.find(x=>x.id == guildID);

		//Catch premissions error
		if(!guild || !guild.owner) return res.json({error: "unauth: bad guild"});

		//validate module
		let status = await databus.ValidateModuleInstall(module);
		console.log(status);
		if(status.status == "fail"){
			return res.json(status);
		}

		let guildSettings = await databus.GetGuildSettings(guildID);

		cmdManager.InstallModule(module, guildSettings);
		//databus.InstallModule(module, guildSettings);

		return res.json(status);
	})
	
});

app.post("/uninstall-module", async (req,res) =>{
	let guildID = req.body.guildID;
	let token = req.body.token;
	let module = req.body.module;

	//Catch missing data
	if(!guildID) return res.json({status:"fail", errors: ["Unauth: bad guild"]});
	if(!token) return res.json({status:"fail", errors: ["Unauth: bad token"]});
	if(!module) return res.json({status:"fail", errors: ["Unauth: no module"]});

	//Validate guild and token
	fetch("https://discordapp.com/api/users/@me/guilds", {
		method: "GET",
		headers: {
			"Content-Type":"application/json",
			Authorization: "Bearer " + token,
		}
	})
	.then(x=>x.json())
	.then(async response=>{	
		let guild = response.find(x=>x.id == guildID);

		//Catch premissions error
		if(!guild || !guild.owner) return res.json({error: "unauth: bad guild"});

		//validate module
		let status = await databus.ValidateModuleInstall(module);
		console.log(status);
		if(status.status == "fail"){
			return res.json(status);
		}

		let guildSettings = await databus.GetGuildSettings(guildID);

		cmdManager.UninstallModule(module, guildSettings);
		//databus.UninstallModule(module, guildSettings);

		return res.json(status);
	})
	
});

app.get('/', function(req, res) {
	res.redirect("/site/index.html");
});

// var http=require('http');

// var server=http.createServer(function(req,res){
//     res.end('test');
// });

// server.on('listening',function(){
//     console.log('ok, server is running');
// });

//server.listen(port);
server.listen(port);