var schema  = 'urbanfarming';
var vcapServices = require('../../vcapServices');
var fs      = require('fs');
var conStr  = vcapServices.elephantsql[0].credentials.uri; 
var pg      = require('pg');
var Client  = require('pg').Client;
var table   = 'livedateyo';
var processed = "processeddata";
var processedData = schema + "." + processed;
var liveData = schema + "." + table;
var util = require('util');

module.exports = {
    processDataUpload,
    processed, 
    table, 
    liveData,
    processedData, 
    schema, 
    askDatabase, 
    createTable, 
    getTableSQL, 
    createTables, 
    createSchema, 
    checkSchema, 
    checkTable, 
    checkTablesExist, 
    formatImageForDisplay,
}

var clientPromise;

function getMostRecentImageID(callback){
    askDatabase("SELECT id FROM "+ liveData + " WHERE id = (SELECT MAX(id) FROM "+ liveData +" WHERE image IS NOT NULL)", function(err,result) {
        if (err){
            console.error(err);
            callback(err);
        }
        callback(null, result.rows[0].id);
    })
}


function saveProcessedData(data, callback){
    askDatabase(`INSERT INTO ${processedData} (id, image, greenScore, colour, compactness, width, height) VALUES (${data["id"]}, '${data["image"]}', ${data["Score"]}, '${data["AveragePlantColour"]}', ${data["Compactness"]}, ${data["Width"]}, ${data["Height"]})`, (err)=>{
        if (err){
            console.error(err);
            callback(err);
        }
        console.log("saved processed data");
    })
}

function getImageSQL(x,f){
    var sql = "";
    if (x && f){
        sql = "SELECT image FROM " + liveData + " WHERE id>=" +x +" AND image IS NOT NULL LIMIT 1;";
    }
    else if (x==null && f){
        sql = "SELECT image FROM " + liveData + " WHERE id=(SELECT MAX(id) FROM  "+ liveData +" WHERE image IS NOT NULL)";
    }
    else if(x && f==null) {
        sql = "SELECT image FROM " + liveData + " WHERE id=" +x ;
    }

    else {
        sql = "SELECT image FROM " + liveData + " WHERE id=(SELECT MAX(id) FROM  "+ liveData+")" ;
    }
    return sql;
}

function formatImageForDisplay(x, f, callback){
    sql = getImageSQL(x,f);
    askDatabase(sql , function(err, result){
        if (err) {
            console.error(err)
        }
        if (result.rowCount === 0){
            console.log("not sending image")
                callback("/public/test.jpg");
        }
        else if (result.rows[0].image == undefined) {
            console.log("not sending image")
                callback("/public/test.jpg");
        }
        else {
            fs.writeFile(__dirname + "/../ProcessImages/image.jpg", result.rows[0].image, function (errr) {
                if (errr) {
                    console.error(errr)
                }
                callback("/Functions/ProcessImages/image.jpg");
            })
        }
    })
}

function askDatabase( sql, callback ) {
    console.log(sql)
        if (clientPromise == null) {
            clientPromise = pg.connect(conStr);
        } 
    clientPromise.then(function (client) {
        client.query(sql, callback);
    })
}

function processTextFields(fields, target, callback){
    var moisture =  fields.soilMoisture;
    var colour   = fields.colour;
    var humidity = fields.relHumidity;
    var temp     = fields.temperature;
    var name     = (( fields.plantName== "")?  'a' : fields.plantName);
    var light    = fields.lightLuxLevel;
    if (target){   
        var sql=`INSERT INTO ${liveData} (soilMoisture, relHumidity, temperature, image, plantName, lightLuxLevel, colour) VALUES ( ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light}, '${colour}')`;
    }
    else {
        var sql=`INSERT INTO ${liveData} (soilMoisture, relHum idity, temperature, plantName, lightLuxLevel, colour) VALUES ( ${moisture}, ${humidity}, ${temp},  '${name}', ${light}, '${colour}')`;
    }
    askDatabase(sql, function(err, result){;
        if(err){
            console.error(err);
            callback(err);
        }
        else {
            console.log(callback);
            callback(util.inspect({fields:fields}));
        }
    })
}




function processDataUpload(request, response, formidable, imageStuff){
    var form = new formidable.IncomingForm();
    form.parse(request, function(err, fields, files) {
        if (files) {
            if (files.image.size<1) {
                processTextFields(fields, null, (c) => {
                    response.write(c);
                    response.end();
                });
            }
            else {
                imageStuff.formatImageForDB(files.image.path, function (err, target){
                    processTextFields(fields, target, (c) =>{
                        response.writeHead(200, {'content-type':'text/plain'});         
                        response.write('received upload:\n\n');
                        response.end(c);
                        getMostRecentImageID((err, id) =>{
                            if (err) {
                                console.error(err)
                            }
                            formatImageForDisplay(id, 1, (file) =>{;
                                imageStuff.processNewImage(id, saveProcessedData);
                            })
                        })
                    });
                })
            }
        }
        else {

            processTextFields(fields,  null, (c)=> {
                response.write(c);
                response.end();
            })

        }
    })
}


function  createTables(sql, sql1){
    askDatabase(sql , function(err){
        if (err) {
            console.error(err)
        }
        askDatabase(sql1, function(err){
            if (err) {
                console.error(err)
            }
        })
    });
}


function  getTableSQL(t){ 
    if (t==liveData) {
        return `CREATE TABLE ${liveData} (id SERIAL  PRIMARY KEY, image BYTEA , soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc') NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER, colour VARCHAR(20))`;
    }
    else if (t == processedData){
        return `CREATE TABLE ${processedData} (id SERIAL PRIMARY KEY, image BYTEA, greenScore INTEGER, colour VARCHAR(10))`;

    }
    else {
        console.error("attempting to create table, but don't have a sql");
        return null
    }
}

function  createTable(t){
    sql = getTableSQL(t);
    createTables(sql, "INSERT INTO "+t+"(id) VALUES (0)");
}

function  createSchema(callback){
    askDatabase("CREATE SCHEMA" + schema);
    callback();
}

function  checkSchema(row, callback){
    if (row.rowCount ==0 ) {
        // creating schema
        createSchema(callback)
    }
    callback();
}

function  checkTable(tables, t, callback){
    if (tables.indexOf(t) < 0) {
        console.log(t + " doesn't exist, creating");
        createTable(t)
    }
    else {
        console.log(t + " does exist");
    }
    callback();
}

function  checkTablesExist(){    
    var tableCheck = "SELECT table_name FROM information_schema.tables WHERE table_schema='"+schema+"'";
    console.log("checking tables");
    askDatabase(tableCheck, function(err, row) {
        if (err) {console.error(err)}
        console.log(row);
        tables = ["", "", ""];
        for (var n =0; n<row.rowCount ; n++){
            tables[n] = schema +"."+ row.rows[n].table_name;
        }
        checkSchema(row, () => {
            checkTable(tables, liveData, () => {
                checkTable(tables, processedData, () => {
                    console.log("done");
                })
            })
        })
    });
}



