console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var rasp    = require('./Functions/addRaspberryPi/server.js');
var sqlite  = require('sqlite3');
var formidable = require('formidable')
var db      = new sqlite.Database("holdingDash.sqlite");
var port    = (process.env.VCAP_APP_PORT || 4000);
var host    = (process.env.VCAP_APP_HOST || 'localhost');
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var app     = express();

app.use(express.static(path.join(__dirname, 'views')))
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));

var tableCheck = "SELECT 1 FROM sqlite_master WHERE type='table' AND name='tbl1';";
db.get(tableCheck, function(err, row) {
    if (err) {console.error(err)};
    if (row == undefined ) {
        db.serialize(function() {
            db.run("CREATE TABLE tbl1 (id INT PRIMARY KEY, image VARCHAR(200), soilMoisture DOUBLE, relHumidity DOUBLE, temperature DOUBLE, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel DOUBLE )", function(err){if (err) {console.error(err)}});
            //db.run("INSERT INTO tbl1 (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)", function(err){if (err) {console.error(err)}});
        });
    }
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

function getNextId(callback) {
    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1) ", function(err, row) {
        if (err) {
            return callback(err)
        }
        callback(null, row.id + 1);
    })
}

function getHome(request, response, callback)  {
    var content = '';
    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1) ", function(err, row) {
        if (err) {
            return callback(err)
        }
        date=row.time.split(' ')[0];
        time=row.time.split(' ')[1];
        dd=   date.split('-')[2];
        mm=   date.split('-')[1];
        yyyy= date.split('-')[0];
        content +="<th>                   </th><td><img src=" + row.image+" /></td> </tr>"+
            "<tr><th>Date:                </th><td id='date' >" +dd+"-"+mm+"-"+yyyy+ "</td>                  </tr>"+
            "<tr><th>Time:                </th><td>" +time+"</td>                   </tr>"+
            "<tr><th>Plant name:          </th><td>" +row.plantName+"</td>          </tr>"+
            "<tr><th>Lighting lux level:  </th><td>" +row.lightLuxLevel+" lux</td>  </tr>"+
            "<tr><th>Soil Moisture:       </th><td>" +row.soilMoisture+"%</td>      </tr>"+
            "<tr><th>Relative Humidity:  </th><td>" +row.relHumidity+"%</td>       </tr>"+
            "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C</td>";
        callback(null, content)
    })
}


app.set('views',__dirname);
app.engine('handlebars', exphbs)
app.set('view engine', '');

app.get('/', function (req, res) {
    res.redirect(301,  "/urbanfarming/");
})

app.get('/urbanfarming/data', (req, res) => {
    fs.readFile('form.html', function(err, data) {
        res.writeHead(200, {
            'Content-Type' : 'text/html',
            'Content-Length': data.length 
        });
        res.write(data);
        res.end();
    });
})

var util = require('util');
app.post('/urbanfarming/data', function(req, res){
    getNextId( (err, id) =>{
        if (err){ console.error(err) }
        console.log("next id is" + id);
        var form = new formidable.IncomingForm();
        form.parse(req, function(err, fields, files) {
            Object.keys(files).forEach(function(name){
                console.log('got file named '+ name);
            });
            var fileArry = files.uploadFiles;
            console.log(" fileAry" + fileArry);
            res.writeHead(200, {'content-type':'text/plain'});         
            res.write('received upload:\n\n');
            res.end(util.inspect({fields:fields, files:files}));
            var target = "./public/files/flower.gif";
            if (files.image.name!=undefined){
                var fileextention = files.image.name.split('.').pop();
                target = "./public/images/"+id+"." +fileextention;
                fs.rename(files.image.path, target); 
            }
            console.log(fields.soilMoisture);
            console.log(fields.relHumidity);
            console.log(fields.temperature);
            console.log(files.image.name);
            console.log(fields.plantName);
            console.log(fields.lightLuxLevel);
            var sql=`INSERT INTO tbl1 (id, soilMoisture, relHumidity, temperature, image, plantName, lightLuxLevel) VALUES (${id}, ${fields.soilMoisture}, ${fields.relHumidity}, ${fields.temperature}, '${target}', '${fields.plantName}', ${fields.lightLuxLevel})`;
            console.log(sql);
            db.run(sql, function(err){if (err) {console.error("error on 93 "+ err)}});

        });
    })
})
app.get('/urbanfarming', (request, response) => {
    getHome(request, response, (err, content) =>{
        if (err){ console.error(err) }
        var index = fs.readFileSync('index.html', 'utf8');
        response.end(index.replace("{{content}}",content));
    })
})
