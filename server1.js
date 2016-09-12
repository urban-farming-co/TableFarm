console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var rasp    = require('./Functions/addRaspberryPi/server.js');
var formidable = require('formidable')
var pg      = require('pg');
var conString= "postgres://ibyxzonx:dWFDS_l0tiI_fNMA0Q7iZvKe6aWlMcS_@qdjjtnkv.db.elephantsql.com:5432/ibyxzonx" || "postgres://postgres:urban2016@localhost/postgres";
var Client  = require('pg').Client;
var port    = (process.env.VCAP_APP_PORT || 4000);
var host    = (process.env.VCAP_APP_HOST || 'localhost');
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var app     = express();

app.use(express.static(path.join(__dirname, 'views')))
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));

var tableCheck = "SELECT 1 FROM information_schema.tables WHERE table_name='livedata'";
var client = new Client({user:'postgres', password:'urban2016', database:'UrbanFarming', host:'localhost', port:5432});
client.connect();    
client.query(tableCheck, function(err, row) {
    if (err) {console.error(err)};
    if (row == undefined ) {
        var sql = "CREATE TABLE livedata (id INT PRIMARY KEY, image VARCHAR(200), soilMoisture FLOAT, relHumidity FLOAT, temperature FLOAT, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel FLOAT )"
            var sql1="INSERT INTO tbl1 (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)"
            client.query(sql , function(err){if (err) {console.error(err)}});
        client.query(sql1, function(err){if (err) {console.error(err)}});
    };
    client.end();
});

app.listen(port, (err) => { 
    if (err) {
        return console.log('something bad happened.', err)
    }
    console.log(`server is listening on ${port}`)
});

app.use((request, response, next) => {
    console.log(request.headers)
        next()
})

app.use(function(req, res, next) {
    if(req.url.substr(-1) !== '/')
        res.redirect(301, req.url + "/");
    else
        next();
});

app.get('/urbanfarming', (request, response) => {
    getHome(request, response, (err, content) =>{
        if (err){ console.error(err) }
        var index = fs.readFileSync('index.html', 'utf8');
        response.end(index.replace("{{content}}",content));
    })
})

