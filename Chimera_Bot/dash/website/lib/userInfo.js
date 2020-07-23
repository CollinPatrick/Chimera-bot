var root = "http://137.220.51.242:80"

document.addEventListener("DOMContentLoaded", function(){
    displayUserInfo();
});

function displayUserInfo()
{
    if(window.sessionStorage.getItem("token") === null){
        document.getElementById("user-info-fallback").style.display = "block";
        document.getElementById("login-button").style.display = "block";
    }
    else{
        document.getElementById("logout-button").style.display = "block";
        setUserData();
    }
}

function setUserData(){
    if(window.sessionStorage.getItem("userData") === null){
        getUserData(); 
        return;
    }

    var data = JSON.parse(window.sessionStorage.userData);
    //console.log(data);
    document.getElementById("user-info").style.display = "block";
    document.getElementById("username").innerHTML = `${data.username}#${data.discriminator}`;
    document.getElementById("user-avatar").setAttribute('src', `https://cdn.discordapp.com/avatars/${data.id}/${data.avatar}.png`);
    
}

function getUserData()
{
    var xhr = new XMLHttpRequest();
    xhr.open("GET", "https://discordapp.com/api/users/@me");
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.setRequestHeader("Authorization", "Bearer " + window.sessionStorage.token);
    xhr.onload = function(){
        var response = JSON.parse(xhr.response);
        window.sessionStorage.userData = JSON.stringify({
            username: response.username,
            discriminator: response.discriminator,
            id: response.id,
            avatar:response.avatar
        });
        setUserData();
        //window.sessionStorage.userData = JSON.stringify(data);
    }
    xhr.send();
}