var schema  = 'urbanfarming';
var vcapServices = require('../../vcapServices');
var fs      = require('fs');
var conStr  = vcapServices.elephantsql[0].credentials.uri; 
var pg      = require('pg');
var Client  = require('pg').Client;
var table   = 'livedateyo';
var processedData = schema + ".processeddata";
var liveData = schema + "." + table;


module.exports = {liveData, processedData, schema, askDatabase, createTable, getTableSQL, createTables, createSchema, checkSchema,checkTable, checkTablesExist,  }

var clientPromise;
function askDatabase( sql, callback ) {
    console.log(sql)
        if (clientPromise == null) {
            clientPromise = pg.connect(conStr);
        } 
    clientPromise.then(function (client) {
        client.query(sql, callback);
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
        return `CREATE TABLE ${liveData} (id SERIAL  PRIMARY KEY, image BYTEA , soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc') NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER)`;
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



