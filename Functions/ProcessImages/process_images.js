var fs      = require('fs');
var spawn   = require('child_process').spawn;



module.exports = {formatImageForDB,
    //  formatImageForDisplay, 
    processNewImage, 
    processImage,
    getImageSQL, 
    showProcessedData 
}


function formatImageForDB( path, callback){
    console.log(path);
    fs.readFile(path,'hex', function(err, data) {
        if (!err) {
            data = '\\x'+data;
            callback(null, data);
        }else{
            console.error(err);
            callback(err);
        }
    });
}




function getImageSQL(database, x,f){
    var sql = "";
    if (x && f){
        sql = "SELECT image FROM " + database.liveData + " WHERE id>=" +x +" AND image IS NOT NULL LIMIT 1;";
    }
    else if (x==null && f){
        sql = "SELECT image FROM " + database.liveData + " WHERE id=(SELECT MAX(id) FROM  "+database.liveData +" WHERE image IS NOT NULL)";
    }
    else if(x && f==null) {
        sql = "SELECT image FROM " + database.liveData + " WHERE id=" +x ;
    }

    else {
        sql = "SELECT image FROM " + database.liveData + " WHERE id=(SELECT MAX(id) FROM  "+database.liveData+")" ;
    }
    return sql;
}

function showProcessedData(database, callback){
    database.askDatabase("SELECT *  FROM "+database.processedData + " WHERE id=(SELECT MAX(id) FROM "+database.processedData+")" , function(err, result){
        if (err) {
            console.error(err);
        }
        console.log(result);
        if (result.rowCount === 0){
            console.log("not sending image");
            callback("/public/test.jpg", 0);
        }
        else if (result.rows[0].image == undefined) {
            console.log("not sending image");
            callback("/public/test.jpg", result.rows[0].greenscore);
        }
        else {
            fs.writeFile(__dirname + "/processed_image.jpg", result.rows[0].image, function (errr) {
                callback("/Functions/ProcessImages/processed_image.jpg", result.rows[0].greenscore);
            })
        }
    })
}



function processImage(file, callback){

    spawned_process = spawn('python', ["Functions/ProcessImages/greenScore.py", file, 3]);

    spawned_process.stdout.on('data', function(data){
        console.log("GOT DATA");
        d = data.toString();
        console.log(d);
        var dict = {};
        dict = JSON.parse(d);
        for (key in dict){
            console.log(dict[key]);
        }
        dict["AveragePlantColour"] = "#" + dict["AveragePlantColour"];
        callback(dict);
    })

    spawned_process.on('message', function(message){
        console.log("GOT A MESSAGE");
        console.log(message.toString('utf8'));
    })

    spawned_process.stderr.on('data', function(data) {
        console.log("GOT AN ERROR");
        console.log(data.toString('utf8'));
    })

    spawned_process.on('close', function(code) {
        console.log("child process exited with a code: "+ code);
        callback(null);
    })

}

function processNewImage(id, saveProcessedData ){
    // Get the id that the processed data needs to have to match up with live data.
    // Retrieve the image from the database, save it in file.
    processImage("Functions/ProcessImages/image.jpg", (data)=>{
        if (data != null){
            formatImageForDB(data["saveTo"], (err, image) => {;
                data["id"] = id;
                data["image"] = image;
                saveProcessedData(data, () =>{
                    console.log("processed");
                    if (err){
                        console.error(err)

                    }
                })
            });
        }
    }) 
}

