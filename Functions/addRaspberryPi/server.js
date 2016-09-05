var fs = require('fs');
var path = require('path');
var sqlite = require('sqlite3');
var db = new sqlite.Database("raspberrys.sqlite");
var port    = (process.env.VCAP_APP_PORT || 4000);
var host    = (process.env.VCAP_APP_HOST || 'localhost');
var express = require('express');
var app     = express();


var tableCheck = "SELECT 1 FROM sqlite_master WHERE type='table' AND name='piToUser';";
db.get(tableCheck, function(err, row) {
    if (err) {console.error(err)};
    if (row == undefined ) {
        db.serialize(function() {
            db.run("CREATE TABLE piToUser (id INT PRIMARY KEY, image VARCHAR(200), soilMoisture DOUBLE, relHumidity DOUBLE, temperature DOUBLE, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel DOUBLE )", function(err){if (err) {console.error(err)}});
            //db.run("INSERT INTO tbl1 (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)", function(err){if (err) {console.error(err)}});
        });
    }
});
app.get('registerRaspberry', (request, response) => {
    response.write("raspberry pi registration area, no humans allowed.");
});


app.post("registerRaspberry", (request, response) => {
    Object.keys(request).forEach(function(name){ ;
        console.log('got header named ' + name);
    });

});
