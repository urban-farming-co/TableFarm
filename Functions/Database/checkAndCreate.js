var schema  = 'urbanfarming';
var vcapServices = require('../../vcapServices');
var fs      = require('fs');
var conStr  = vcapServices.elephantsql[0].credentials.uri; 
var pg      = require('pg');
var Client  = require('pg').Client;
var table   = 'flivedata';
var processed = "fprocesseddata";
var users   = 'fuser';
var plant   = 'fplantproject';
var processedData = schema + "." + processed;
var liveData = schema + "." + table;
var userTable = schema + "." + users;
var plantProject = schema + "." + plant;
var util = require('util');

module.exports = {
    processDataUpload,
    table, 
    processed, 
    users,
    plant,
    liveData,
    userTable,
    processedData, 
    plantProject,
    schema, 
    askDatabase, 
    createTable, 
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
    var moisture =  fields.soil_moisture;
    var colour   = fields.colour;
    var humidity = fields.rel_humidity;
    var temp     = fields.temperature;
    var name     = (( fields.plantname== "")?  'a' : fields.plantname);
    var light    = fields.light_lux_level;
    var tablefarmID = fields.deviceID;

    if (target){   
        var sql=`INSERT INTO ${liveData} (soil_moisture, rel_humidity, temperature, image, plantname, light_lux_level, colour, tablefarmid) VALUES ( ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light}, '${colour}', ${tablefarmID})`;
    }
    else {
        var sql=`INSERT INTO ${liveData} (soil_moisture, rel_humidity, temperature, plantname, light_lux_level, colour, tablefarmid) VALUES ( ${moisture}, ${humidity}, ${temp},  '${name}', ${light}, '${colour}', ${tablefarmID})`;
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




function processDataUpload(request, response, formidable, imageStuff, callback){
    var form = new formidable.IncomingForm();
    form.parse(request, function(err, fields, files) {
        console.log(fields);
        if (files) {
            console.log(files);
            if (files.image.size<1) {
                processTextFields(fields, null, (c) => {
                    callback(c);
                });
            }
            else {
                imageStuff.formatImageForDB(files.image.path, function (err, target){
                    processTextFields(fields, target, (c) =>{
                        callback(c);
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
                callback(c);
            })

        }
    })
}


function  createTables(sql, sql1, callback){
    askDatabase(sql , function(err){
        if (err) {
            console.error(err)
                callback(err);
        }
        askDatabase(sql1, function(err){
            if (err) {
                console.error(err);
                callback(err);
            }
            callback(null);
        })
    });
}


getTableSQL = {
    "plantProject"  :  "CREATE TABLE " + plantProject + " (id SERIAL PRIMARY KEY, tablefarmid INTEGER UNIQUE, userid INTEGER, plantname varchar(50), plant_species varchar(50), FOREIGN KEY(userid) REFERENCES "+userTable + "(id) )",
    "userTable"     : "CREATE TABLE " + userTable + " (id SERIAL PRIMARY KEY, username VARCHAR(50), passwordsalt VARCHAR(100), passwordhash VARCHAR(100))",
    "processedData" : `CREATE TABLE ${processedData} (id SERIAL PRIMARY KEY, image BYTEA, green_score INTEGER, colour VARCHAR(10), width INTEGER, height INTEGER, compactness INTEGER, leaf_elongation INTEGER, liveid INTEGER,  FOREIGN KEY(liveid) REFERENCES ${liveData} (id))`,
    "liveData"      : `CREATE TABLE ${liveData} (id SERIAL  PRIMARY KEY, image BYTEA , soil_moisture INTEGER, rel_humidity INTEGER, temperature INTEGER, time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc') NOT NULL, tablefarmid INTEGER, light_lux_level INTEGER, FOREIGN KEY (tablefarmID) REFERENCES ${plantProject} (tablefarmid))`
}

getInsertRowSQL = {
    // columns: id, username, password salt, password hash
    userTable     : "INSERT INTO " + userTable +" (id, username, passwordhash, passwordsalt)   VALUES (1, 'urbanfarm', 'urban2016', '')",    
    // columns: id, tfid, userid, plantname, plant species, 
    plantProject  : "INSERT INTO " + plantProject + "(id, tablefarmid, userid, plantname, plant_species) VALUES (1, 1, 1, 'Minty MacMintface', 'mint')",
    // columns: id, tfid, image, soil, rel, temp, time, lightlevel, 
    liveData      : "INSERT INTO " + liveData + " (id, tablefarmid, soil_moisture, rel_humidity, temperature)  VALUES (1, 1, 100 ,100 ,100)", 
    // columns: id, liveid, image, green_score, colour,  
    processedData : "INSERT INTO " + processedData + "(id, liveid) "+                        " VALUES (1, 1)",
}

function  createTable(t, callback){
    var sql = getTableSQL[t];
    console.log(sql);
    var sql2 = getInsertRowSQL[t] ;
    console.log(sql2);

    createTables(sql, sql2, (e) =>{
        callback(e);
    } );
}

function  createSchema(callback){
    askDatabase("CREATE SCHEMA" + schema, ()=> {
        callback();
    })
}

function  checkSchema(row, callback){
    if (row.rowCount ==0 ) {
        // creating schema
        createSchema(callback)
    }
    callback();
}

function  checkTable(tables, t, T, callback){
    if (tables.indexOf(t) < 0) {
        console.log(t + " doesn't exist, creating");
        createTable(T, callback);
    }
    else {
        console.log(t + " does exist");
        callback();
    }
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
            checkTable(tables, userTable, "userTable", (e) => {
                if (e){
                    console.error(e); 
                }
                checkTable(tables, plantProject, "plantProject", (e)=>{
                    if (e){
                        console.error(e); 
                    }
                    checkTable(tables, liveData, "liveData", (e) => {
                        if (e){
                            console.error(e); 
                        }
                        checkTable(tables, processedData, "processedData", (e) => {
                            if (e){
                                console.error(e); 
                            }
                            console.log("done");
                        })
                    })
                })
            })
        })
    });
}
