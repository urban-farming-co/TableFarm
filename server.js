console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var sqlite  = require('sqlite3');
var multiparty = require('multiparty')
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

        content +="<th></th> <td><img width=50px height=50px  src=" + row.image+ " /></td> </tr> <tr><th>Date/Time:</th><td>"+row.time+"</td><tr><th>Plant name:</th><td>"+row.plantName+"</td></tr><tr><th>Lighting lux level:</th><td>"+row.lightLuxLevel+" lux <tr> <th>Soil Moisture: </th> <td>"+row.soilMoisture+"%</td> </tr><tr> <th>Relative Humidity:</th> <td>"+row.relHumidity+"%</td> </tr><tr> <th>Ambient temperature:</th> <td>"+row.temperature+" C</td>";
        callback(null, content)
    })
}


app.set('views',__dirname);
app.engine('handlebars', exphbs)
app.set('view engine', '');

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
        //db.run("INSERT INTO tbl1 (id) VALUES (" +id+")", function(err){console.error(err)});
        var form = new multiparty.Form();
        form.parse(req, function(err, fields, files) {
            res.writeHead(200, {'content-type':'text/plain'});         
            res.write('received upload:\n\n');
            res.end(util.inspect({fields:fields, files:files}));
            var fileextention = files.image[0].originalFilename.split('.').pop();
            var target = "./public/images/"+id+"." +fileextention
                fs.rename(files.image[0].path, target) 
                console.log(fields.soilMoisture[0]);
            console.log(fields.relHumidity[0]);
            console.log(fields.temp[0]);
            console.log(files.image[0].name);
            console.log(fields.plantName[0]);
            console.log(fields.lightLuxLevel[0]);
            console.log(`INSERT INTO tbl1 (id, soilMoisture,relHumidity, temperature, image  ) VALUES (${id},${fields.soilMoisture[0]}, ${fields.relHumidity[0]}, ${fields.temp[0]}, '${files.image[0].path}')`)

                db.run(`INSERT INTO tbl1 (id, soilMoisture,relHumidity, temperature, image, plantName, lightLuxLevel  ) VALUES (${id},${fields.soilMoisture[0]}, ${fields.relHumidity[0]}, ${fields.temp[0]},'${target}', fields.plantName[0], fields.lightLuxLevel[0] )`, function(err){if (err) {console.error("error on 93 "+ err)}});

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
