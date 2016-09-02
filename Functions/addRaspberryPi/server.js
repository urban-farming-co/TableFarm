var fs = require('fs');
var path = require('path');
var multiparty = require('multiparty');
var sqlite = require('sqlite3');
var db = new sqlite.Database("raspberrys.sqlite");
var port    = (process.env.VCAP_APP_PORT || 4000);
var host    = (process.env.VCAP_APP_HOST || 'localhost');
var express = require('express');
var app     = express();


app.get('registerRaspberry', (request, response) => {
    response.write("raspberry pi registration area, no humans allowed.");
});


app.post("registerRaspberry", (request, response) => {
    var form = new multiparty.Form();
    form.parse(req, function(err, fields, files){

        

});
