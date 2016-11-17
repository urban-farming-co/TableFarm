$("#submitReg").click(function(){
    console.log("tah");
    alert("thanks paul");
    window.location = "../userHome";
})



function Authenticate()
{
    //save our local GUID and Title Id so we use the same one (or at least until our cookies are cleared)
    localStorage.titleId = $("#inputTitleId").val();
    localStorage.userId = $("#inputUserId").val();

    PlayFab.settings.titleId = $("#inputTitleId").val();
    var LoginWithCustomIDRequest = {
        "TitleId" : PlayFab.settings.titleId,
        "CustomId" : $("#inputUserId").val(),
        "CreateAccount" : true
    };

    console.log("Logging into PlayFab...");
    PlayFabClientSDK.LoginWithCustomID(LoginWithCustomIDRequest, AuthenticationCallback);
}

function AuthenticationCallback(response, error)
{
    if(error)
    {
        console.error(error);
    }   
    else
    {
        var result = response.data;
        console.log("Login Successful. Welcome Player: " + result.PlayFabId);
        console.log("Your session ticket is: " + result.SessionTicket);

        window.location ="../userHome";
    }
}


