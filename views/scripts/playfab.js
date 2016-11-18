var titleID = "DF78";
var secretKey = "7EKB53HCE5XACZD644IFFIUU4RP1QRP3YMOFDP5Z593BCH8544";

var url =  "https://DF78.playfabapi.com/Client/"; 
var regAPI = url + "RegisterPlayFabUser";
var updAPI = url + "UpdateUserData";

$("#submitReg").click(function(){
    console.log("tah");
    alert("thanks paul");
    isValid = $("#email")[0].checkValidity() && 
        $("#type")[0].checkValidity() && 
        $("#name")[0].checkValidity() && 
        $("#password")[0].checkValidity();
        $("#passwordConf")[0].checkValidity();
    if (!isValid){
        return;
    }

    var email = $("#email").val();
    var name = $("#name").val();
    var type = $("#type").val();
    var password = $("#password").val();
    var deviceID = $("#deviceID").val();
    var plantspecies = $("#plantspecies").val();
    var plantname = $("#plantname").val();

    Register(name, password,email, function(err, data){

        var user_session_ticket_value = 0; 
        setAdditionalParameters(deviceID, plantspecies, plantname, user_session_ticket_value, function(err, data){
 //           window.location = "../userHome";
        });
    });


})

$("#submitLog").click(function(){
    console.log("tah");
    alert("thanks paul");
    window.location = "../userHome";
})


function Register(name, password, email, callback){
    console.log(regAPI);
    var headers = {"Content-Type": "application/json"};
    var data  = {
        "TitleId": titleID,
        "Username": name,
        "Email": email,
        "Password": password
    };
    console.log(JSON.stringify( data));
    $.ajax({
        type: "POST",
            url: regAPI, 
            data: JSON.stringify( data),
            complete: function(data, status, hik){
                callback(status, data)
            },
            error: function(err, dko){
                console.error(err);
            },
            contentType: "application/json",
            dataType:  "json"
    });

}


function setAdditionalParameters(deviceID, plantspecies, plantname, user_session_ticket_value, callback){
    var headers = {"Content-Type": "application/json"};
    headers["X-Authentication"]= user_session_ticket_value ;
    var data2 =  {
        "Data": {
            "deviceID": deviceID,
            "plantSpecies": plantspecies,
            "plantName": plantname
        },
        "Permission": "Public"
    }
    callback();
}

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


