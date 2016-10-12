//Browser Support Code
function ajaxFunction(){
    var ajaxRequest;  // The variable that makes Ajax possible!
    try{

        // Opera 8.0+, Firefox, Safari
        ajaxRequest = new XMLHttpRequest();
    }catch (e){

        // Internet Explorer Browsers
        try{
            ajaxRequest = new ActiveXObject("Msxml2.XMLHTTP");
        }catch (e) {

            try{
                ajaxRequest = new ActiveXObject("Microsoft.XMLHTTP");
            }catch (e){

                // Something went wrong
                alert("Your browser broke!");
                return false;
            }
        }
    }

    // Create a function that will receive data
    // sent from the server and will update
    // div section in the same page.
    ajaxRequest.onreadystatechange = function(){
        var ajaxDisplay = document.getElementById('ajaxDiv');
        if(ajaxRequest.readyState == 4){
            if (ajaxRequest.status == 200 && ajaxRequest.status<300){
                console.log(ajaxRequest.responseText);
                ajaxDisplay.innerHTML = ajaxRequest.responseText;
                var arr = ajaxDisplay.getElementsByTagName('script');
                for (var n =0; n<arr.length; n++) 
                    eval(arr[n].innerHTML)


            }
            else{
                console.log("error!");
                ajaxDisplay.innerHTML = "Error";
            }
        }
        else if (ajaxRequest.readyState < 4){
            console.log("loading")
        }
    }

    var localTimeOffset = (new Date()).getTimezoneOffset() / 60
        console.log(localTimeOffset);        
    ajaxRequest.open("GET", "/urbanfarming/liveData?o="+localTimeOffset+"/");
    ajaxRequest.send();
}
setInterval(function(){ ajaxFunction(); }, 30 *1000);
setTimeout(ajaxFunction(), 20);
