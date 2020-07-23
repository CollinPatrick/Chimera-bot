function login()
{
    window.onbeforeunload = null;
    document.location.replace("https://discord.com/api/oauth2/authorize?client_id=730864857590792313&redirect_uri=http%3A%2F%2Flocalhost%3A3001%2Fsite%2Fcallback.html&response_type=token&scope=identify%20guilds");
}

function logout(page)
{
    window.sessionStorage.removeItem("token");
    window.sessionStorage.removeItem("userData");
    setTimeout(function(){
        window.onbeforeunload = null;
        window.location.replace(`/site/${page}.html`);
    }, 1000);
}