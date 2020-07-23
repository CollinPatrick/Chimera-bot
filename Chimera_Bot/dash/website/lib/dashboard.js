var root = "http://137.220.51.242:80";
var modulePannel;
var moduleList;
var unsavedChangesFlag = false;

document.addEventListener("DOMContentLoaded", function(){

    //set variables
    commandsContainer = document.getElementById("commands-container");
    modulePannel = document.getElementById("module-pannel-container");
    moduleList = document.getElementById("module-list");

    //Show Reload Error
    if(window.sessionStorage.reloadError){
        //show message
        window.sessionStorage.removeItem("reloadError");
    }

    //Get user guilds
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://discordapp.com/api/users/@me/guilds");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + window.sessionStorage.token);
    xhr.onload = function(){
        //alert(xhr.getAllResponseHeaders());
        var response = JSON.parse(xhr.response);
        if(!response[0]){
            //alert("No Token");
            return;
        } 
        else{
            response.forEach(guild=>{
                if(guild.owner){
                    addToGuildsList(guild);
                }
            });
            document.getElementById("dashboard").style.display = "block";
            
            var offset = getScrollOffsets();
            modulePannel.style.marginTop = Math.max(0, 400 - offset.y) + 25 + "px"
            modulePannel.style.display = "block";
        }
    }
    xhr.send();
});

function setNewPrefix(){
    var xhr = new XMLHttpRequest();
    xhr.open("POST", `${root}/prefix`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.send(JSON.stringify({
        token: window.sessionStorage.token,
        id: document.getElementById("guilds").value,
        value: document.getElementById("prefix-field").value
    }));
}

//Check if bot is member of a guild
function addToGuildsList(guild)
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `${root}/ismember`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Guild-ID", guild.id);
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        if(response.value == true)
        {
            var selecter = document.createElement("option");
            selecter.innerHTML = guild.name;
            selecter.value = guild.id;
            document.getElementById("guilds").appendChild(selecter);
        }

        //sets defualt value to saved prefix, checks for 1 to prevent redundentcy
        if(document.getElementById("guilds").childElementCount === 1)
        {
            guildChanged();
        }
    }
    
    xhr.send();
}

function guildChanged(){
    commandsContainer.innerHTML = "";
    moduleList.innerHTML = "";
    GetGuildRoles();
}

var commandsContainer;

function loadGuildData(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `${root}/guild-data`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Guild-ID", document.getElementById("guilds").value);
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        if(response.status !== "success"){
            console.log(response.code);
        }

        //Set Prefix
        if(response.prefix != null){
            document.getElementById("prefix-field").value = response.prefix;
        }

        //build module groups
        for(var settings in response.settings){
            //alert(response.settings[settings]);
            buildModuleGroup(response.settings[settings]["moduleName"]);
        }

        //add commands to module groups
        var animationDelay = 0;
        for(var command in response.commands){
            buildCommandGroup(command, response.commands, animationDelay);
            animationDelay += 0.1;
        }
    }
    xhr.send();
}

function GetGuildRoles(){
    var xhr = new XMLHttpRequest();
    xhr.open("GET", `${root}/guild-roles`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Guild-ID", document.getElementById("guilds").value);
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        if(response.status !== "success"){
            console.log(response.code);
            return;
        }

        window.sessionStorage.guildRoles = JSON.stringify({roles: response.roles});
        console.log(response);

        loadGuildData();

    }
    xhr.send();
}

function saveGuildData(){
    try{
        //Create settings objcet
        var settings = {};
        //Get and set modules
        settings["modules"] = getModules();
        //Get and set commands
        var commands = {};
        settings["modules"].forEach(module =>{
            var temp = buildCommandData(module);    
            var updatedCommands = {
                ...commands,
                ...temp
            }
            commands = updatedCommands;
        });
        settings["commands"] = commands;

        settings["prefix"] = document.getElementById("prefix-field").value;
        //console.log(settings);
    }
    catch(err){
        window.sessionStorage.dataError = true;
        location.reload();
    }

    //post new settings to server
    var xhr = new XMLHttpRequest();
    xhr.open("POST", `${root}/guild-data`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        console.log(response);
        if(response.status === "success"){
            document.getElementById("success-message").style.animation = "unsavedChangesEnabled 0.5s ease-in 0s 1 normal forwards";
        }
        else if(response.status === "fail"){
            console.log("error");
            var errorContainer = document.getElementById("error-container");
            errorContainer.innerHTML = "";
            for(let err in response.errors){
                var temp = document.createElement("p");
                temp.innerText = response.errors[err];
                errorContainer.appendChild(temp);
            }
            document.getElementById("error-message").style.animation = "showErrorMessage 0.5s ease-in 0s 1 normal forwards";
        }
    }
    xhr.send(JSON.stringify({
        token: window.sessionStorage.token,
        guildID: document.getElementById("guilds").value,
        settings: settings
    }));

    //Success
    unsavedChangesFlag = false;
    document.getElementById("unsaved-changes-message").style.animation = ("unsavedChangesDisabled 0.5s ease-in 0s 1 normal forwards");
    //Fail
    //show errors
}

function buildModuleGroup(moduleName){
    var moduleGroup = document.createElement("div");
    moduleGroup.className = "command-module-group";
    moduleGroup.id = `${moduleName}-module`;

    var moduleTitle = document.createElement("h3");
    moduleTitle.className = "command-module-title";
    moduleTitle.innerText = moduleName;
    moduleGroup.appendChild(moduleTitle);

    //ADD MODULE GROUP EDIT
    //Create edit group
    var editGroup = document.createElement("div");
    editGroup.style.opacity = 0;
    editGroup.className = "edit-group";
    editGroup.id = `${moduleName}-edit-group`;

    //Create roles label
    var rolesLabel = document.createElement("label");
    rolesLabel.setAttribute("for", `${moduleName}-roles`);
    rolesLabel.innerText = "Roles:";
    editGroup.appendChild(rolesLabel);

    //Create roles field
    var moduleRoles = document.createElement("select");
    moduleRoles.className = "role-select"
    moduleRoles.setAttribute("type", "text");
    moduleRoles.id = `${moduleName}-roles`;
    PopulateRolesList(moduleRoles);
    editGroup.appendChild(moduleRoles);

    //Create roles buttons group
    var buttonGroup = document.createElement("div");
    buttonGroup.className = "roles-buttons";
    editGroup.appendChild(buttonGroup);

    //Create add button
    var addButton = document.createElement("button");
    addButton.type = "button";
    addButton.id = `${moduleName}-add`;
    addButton.setAttribute("onclick", `addModuleRole('${moduleName}')`);
    addButton.innerText = "Add";
    buttonGroup.appendChild(addButton);

    //Create remove button
    var removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.id = `${moduleName}-remove`;
    removeButton.setAttribute("onclick", `removeModuleRole('${moduleName}')`);
    removeButton.innerText = "Remove";
    buttonGroup.appendChild(removeButton);

    editGroup.style.animation = `fadeIn 1.5s 0s forwards`;
    moduleGroup.appendChild(editGroup);

    //Create command wrapper
    var commandWrapper = document.createElement("div");
    commandWrapper.className = "command-module-wrapper";
    commandWrapper.id = `${moduleName}-wrapper`;
    moduleGroup.appendChild(commandWrapper);

    //ADD SETTINGS WRAPPER

    commandsContainer.appendChild(moduleGroup);   

    createPannelOption(moduleName);
}

function buildCommandGroup(command, commands, delay){
    //Create command group
    var commandGroup = document.createElement("div");
    commandGroup.style.opacity = 0;
    commandGroup.className = "command-group";
    commandGroup.id = `${command}-group`;

    //Create command group label
    var groupLabel = document.createElement("label");
    groupLabel.setAttribute("for", commandGroup.id);
    groupLabel.className = "command-group-label";
    groupLabel.innerText = command;
    commandGroup.appendChild(groupLabel);

    //Create admin field
    var commandAdmin = document.createElement("input");
    commandAdmin.setAttribute("type", "checkbox");
    commandAdmin.setAttribute("onchange", "flagChanges()");
    commandAdmin.id = `${command}-admin`;
    commandAdmin.checked = commands[command]["admin"];
    commandGroup.appendChild(commandAdmin);

    //Create admin label
    var adminLabel = document.createElement("label");
    adminLabel.setAttribute("for", commandAdmin.id);
    adminLabel.className = "command-admin-label";
    adminLabel.innerText = "Admin?";
    commandGroup.appendChild(adminLabel);

    //Create roles label
    var rolesLabel = document.createElement("label");
    rolesLabel.setAttribute("for", `${command}-roles`);
    rolesLabel.innerText = "Roles:";
    commandGroup.appendChild(rolesLabel);

    //Create roles field
    var commandRoles = document.createElement("select");
    commandRoles.className = "role-select";
    commandRoles.setAttribute("type", "text");
    commandRoles.id = `${command}-roles`;
    PopulateRolesList(commandRoles);
    commandGroup.appendChild(commandRoles);

    //Create roles buttons group
    var buttonGroup = document.createElement("div");
    buttonGroup.className = "roles-buttons";
    commandGroup.appendChild(buttonGroup);

    //Create add button
    var addButton = document.createElement("button");
    addButton.type = "button";
    addButton.id = `${command}-add`;
    addButton.setAttribute("onclick", `addCommandRole('${command}')`);
    addButton.innerText = "Add";
    buttonGroup.appendChild(addButton);

    //Create remove button
    var removeButton = document.createElement("button");
    removeButton.type = "button";
    removeButton.id = `${command}-remove`;
    removeButton.setAttribute("onclick", `removeCommandRole('${command}')`);
    removeButton.innerText = "Remove";
    buttonGroup.appendChild(removeButton);

    //Create role list
    var roleList = document.createElement("p");
    roleList.className = "command-role-list";
    roleList.id = `${command}-role-list`;
    roleList.setAttribute("data", JSON.stringify({roles: commands[command]["roles"]}));
    roleList.innerText = (commands[command]["roles"] == "") ? "none" : commands[command]["roles"];
    commandGroup.appendChild(roleList);

    //Add command to module command wrapper
    var commandWrapper = document.getElementById(`${commands[command]["parentModule"]}-wrapper`);
    commandWrapper.appendChild(commandGroup);
    commandGroup.style.animation = `fadeIn 1.5s ${delay}s forwards`;
}

function PopulateRolesList(selection){
    var roles = JSON.parse(window.sessionStorage.guildRoles).roles;
    if(roles === []){
        console.log("bad");
        return;
    }

    roles.forEach(role =>{
        var selecter = document.createElement("option");
        selecter.innerHTML = role;
        selecter.value = role;
        selection.appendChild(selecter);
    })
}

function createPannelOption(moduleName){
    //Create pannel option
    var moduleLink = document.createElement("a");
    moduleLink.className = "module-list-link";
    moduleLink.href = `#${moduleName}-module`;

    //Create option title
    var optionTitle = document.createElement("h3");
    optionTitle.className = "module-list-name";
    optionTitle.innerText = moduleName;
    moduleLink.appendChild(optionTitle);

    //Create Underline
    var underline = document.createElement("div");
    underline.className = "module-link-underline";
    moduleLink.appendChild(underline);

    moduleList.appendChild(moduleLink);
}

function getModules(){
    var modules = [];
    var moduleGroups = document.getElementById('commands-container').childNodes;
    for(let group in moduleGroups){
        if(moduleGroups[group].id == undefined) { continue; }
        var moduleName = moduleGroups[group].id;
        moduleName = moduleName.substring(0, moduleName.indexOf("-module"));
        modules.push(moduleName);
    }

    return modules;

}

function buildCommandData(moduleName){
    var compiledCommands = {};
    
    var commandWrapper = document.getElementById(`${moduleName}-wrapper`).childNodes;
    for(let commandGroup in commandWrapper){
        //Only get elements of id type "group"
        if(commandWrapper[commandGroup].id == undefined) { continue; }
        
        //Get command name
        var command = commandWrapper[commandGroup].id;
        command = command.substring(0, command.indexOf("-group"));
        
        //Create command data container
        var data = {};
        
        //Get admin value
        data["admin"] = document.getElementById(`${command}-admin`).checked;
        
        //get roles and create array //Probably doesn't work
        var roles = document.getElementById(`${command}-role-list`).innerText;
        if(roles == "none"){
            roles = [];
        }
        else{
            roles = roles.split(",");
        }
        data["roles"] = roles;
        
        //set parent module
        data["parentModule"] = moduleName;
        
        //Add data to compiled commands
        compiledCommands[command] = data;
    }
    return compiledCommands;
    //console.log(compiledCommands);
}

function addCommandRole(command, moduleName = undefined){
    var rolesList = document.getElementById(`${command}-role-list`);
    var roleField = (moduleName !== undefined) ? document.getElementById(`${moduleName}-roles`) : document.getElementById(`${command}-roles`);
    var data = JSON.parse(rolesList.getAttribute("data"));

    if(data.roles.indexOf(roleField.value) === -1){
        data.roles.push(roleField.value);
        rolesList.setAttribute("data", JSON.stringify(data));
        rolesList.innerText = data.roles;
        flagChanges();
    }

    // if(roleField.value == "" || roleField.value == " "){return}

    // flagChanges();

    // if (rolesList.innerText == "none"){
    //     rolesList.innerText = roleField.value;
    // }
    // else{
    //     rolesList.innerText = rolesList.innerHTML + "," + roleField.value; 
    // }

    // //only clear value if single command role field
    // if(moduleName == undefined){
    //     roleField.value = "";
    // }


}

function removeCommandRole(command, moduleName = undefined){
    var rolesList = document.getElementById(`${command}-role-list`);
    var roleField = (moduleName !== undefined) ? document.getElementById(`${moduleName}-roles`) : document.getElementById(`${command}-roles`);
    var data = JSON.parse(rolesList.getAttribute("data"));

    if(data.roles.indexOf(roleField.value) != -1){
        data.roles.splice(data.roles.indexOf(roleField.value), 1);
        rolesList.setAttribute("data", JSON.stringify(data));
        rolesList.innerText = data.roles;
        flagChanges();
    }
    

    // var temp = rolesList.innerText;
    // //return if bad input or roles list is empty
    // if(temp == "none" || roleField.value.length == 0 || roleField.value == "," || roleField.value == "" || roleField.value == " "){
    //     return;
    // }

    // //return if role is not in list
    // if(temp.indexOf(roleField.value) === -1){
    //     return;
    // }

    // //remove role
    // temp = temp.replace(roleField.value, "");
    
    // //remove extra comma if needed
    // if(temp.indexOf(",,")){
    //     temp = temp.replace(",,", ",");
    // }

    // //remove leading comma if needed
    // if(temp[0] === ","){
    //     temp = temp.substr(1, temp.length);
    // }

    // //remove trailing comma if needed
    // if(temp[temp.length-1] === ","){
    //     temp = temp.substr(0, temp.length-1);
    // }

    // //set value to none if empty
    // if(temp === ""){
    //     temp = "none";
    // }

    // //set new role list
    // rolesList.innerText = temp;

    // //only clear value if single command role field
    // if(moduleName == undefined){
    //     roleField.value = "";
    // }

    // flagChanges();
}

function addModuleRole(moduleName){
    var commandWrapper = document.getElementById(`${moduleName}-wrapper`).childNodes;
    for(let commandGroup in commandWrapper){
        //Only get elements of id type "group"
        if(commandWrapper[commandGroup].id == undefined) { continue; }
        
        //Get command name
        var command = commandWrapper[commandGroup].id;
        command = command.substring(0, command.indexOf("-group"));
        
        addCommandRole(command, moduleName);
    }
    document.getElementById(`${moduleName}-roles`).value = "";
}

function removeModuleRole(moduleName){
    var commandWrapper = document.getElementById(`${moduleName}-wrapper`).childNodes;
    for(let commandGroup in commandWrapper){
        //Only get elements of id type "group"
        if(commandWrapper[commandGroup].id == undefined) { continue; }
        
        //Get command name
        var command = commandWrapper[commandGroup].id;
        command = command.substring(0, command.indexOf("-group"));
        
        removeCommandRole(command, moduleName);
    }
    document.getElementById(`${moduleName}-roles`).value = "";
}

function installModule(){
    var installField = document.getElementById("install-field");

    //empty field
    if(installField.value == "" || installField.value == " "){
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", `${root}/install-module`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        console.log(response);
        if(response.status === "success"){
            document.getElementById("unsaved-changes-message");
            alert("Module install requested successfully!\n\nInstallation is not immediate. You may have to refresh the page until the module shows up.")
            //document.getElementById("success-message").style.animation = "unsavedChangesEnabled 0.5s ease-in 0s 1 normal forwards";
        }
        else if(response.status === "fail"){
            console.log("error");
            var errorContainer = document.getElementById("error-container");
            errorContainer.innerHTML = "";
            for(let err in response.errors){
                var temp = document.createElement("p");
                temp.innerText = response.errors[err];
                errorContainer.appendChild(temp);
            }
            document.getElementById("error-message").style.animation = "showErrorMessage 0.5s ease-in 0s 1 normal forwards";
        }
    }
    xhr.send(JSON.stringify({
        token: window.sessionStorage.token,
        guildID: document.getElementById("guilds").value,
        module: installField.value
    }));
}

function uninstallModule(){
    var installField = document.getElementById("install-field");

    //empty field
    if(installField.value == "" || installField.value == " "){
        return;
    }

    var xhr = new XMLHttpRequest();
    xhr.open("POST", `${root}/uninstall-module`);
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        console.log(response);
        if(response.status === "success"){
            alert("Module uninstall requested successfully!\n\nUninstallation is not immediate. You may have to refresh the page until the module is removed.")
            //document.getElementById("success-message").style.animation = "unsavedChangesEnabled 0.5s ease-in 0s 1 normal forwards";
            //location.reload();
        }
        else if(response.status === "fail"){
            console.log("error");
            var errorContainer = document.getElementById("error-container");
            errorContainer.innerHTML = "";
            for(let err in response.errors){
                var temp = document.createElement("p");
                temp.innerText = response.errors[err];
                errorContainer.appendChild(temp);
            }
            document.getElementById("error-message").style.animation = "showErrorMessage 0.5s ease-in 0s 1 normal forwards";
        }
    }
    xhr.send(JSON.stringify({
        token: window.sessionStorage.token,
        guildID: document.getElementById("guilds").value,
        module: installField.value
    }));
}

function getScrollOffsets() {
    var doc = document, w = window;
    var x, y, docEl;
    
    if ( typeof w.pageYOffset === 'number' ) {
        x = w.pageXOffset;
        y = w.pageYOffset;
    } else {
        docEl = (doc.compatMode && doc.compatMode === 'CSS1Compat')?
                doc.documentElement: doc.body;
        x = docEl.scrollLeft;
        y = docEl.scrollTop;
    }
    return {x:x, y:y};
}

window.onscroll = function(ev){
    var offset = getScrollOffsets();
    var topOffset = Math.max(0, 550 - offset.y);
    modulePannel.style.marginTop = topOffset  + 25 + "px";
    modulePannel.style.height = screen.height - topOffset - 190 + "px";// = Math.min("contain", 400 - offset.y) + 25 + "px";
    //modulePannel.style.maxHeigt = Math.min(contain, screen.height - (Math.max(0, 400 - offset.y)) + "px");
};

function flagChanges(){
    if(!unsavedChangesFlag){
        document.getElementById("unsaved-changes-message").style.animation = ("unsavedChangesEnabled 0.5s ease-in 0s 1 normal forwards");
    }
    unsavedChangesFlag = true;
    //document.getElementById("unsaved-changes-message").style.display = "block";
}

function expandErrors(){
    document.getElementById("error-expand-button").style.display = "none";
    document.getElementById("error-collapse-button").style.display = "block";
    document.getElementById("error-message").style.animation = ("expandButtonExpand 0.5s ease-in 0s 1 normal forwards");
}

function collapseErrors(){
    document.getElementById("error-collapse-button").style.display = "none";
    document.getElementById("error-expand-button").style.display = "block";
    document.getElementById("error-message").style.animation = ("expandButtonCollapse 0.5s ease-in 0s 1 normal forwards");
}

function closeErrors(){
    document.getElementById("error-message").style.animation = "closeErrorMessage 0.5s ease-in 0s 1 normal forwards";
    //set buttons to default state
    document.getElementById("error-collapse-button").style.display = "none";
    document.getElementById("error-expand-button").style.display = "block";
}

function closeSuccess(){
    document.getElementById("success-message").style.animation = "closeSuccessMessage 0.5s ease-in 0s 1 normal forwards";
}
