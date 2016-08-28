console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var sqlite  = require('sqlite3');
var db      = new sqlite.Database("holdingDash.sqlite");
var port    = 4000;
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var app     = express();

app.use(express.static(path.join(__dirname, 'views')))
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));


var tableCheck = "SELECT 1 FROM sqlite_master WHERE type='table' AND name='tbl1';";
db.get(tableCheck, function(err, row) {
    if (err) {console.error(err)};
    if (row == undefined ) {
        db.serialize(function() {
            db.run("CREATE TABLE tbl1 (id INT PRIMARY KEY, image BLOB, soilMoisture DOUBLE, relHumidity DOUBLE, Temp DOUBLE )", function(err){console.error(err)});
            db.run("INSERT INTO tbl1 (id, soilMoisture, relHumidity, Temp) VALUES (1,100 ,100 ,100)", function(err){console.error(err)});
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

function getNextId() {
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

        content +="<th>Image</th> <td>" + row.image+ "</td> </tr><tr> <th>Soil Moistureture</th> <td>"+row.soilMoisture+"%</td> </tr><tr> <th>Relative Humidity</th> <td>"+row.relHumidity+"%</td> </tr><tr> <th>Temperature</th> <td>"+row.Temp+"%</td>";
        callback(null, content)
    })
}

var Busboy =require('busboy');

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

app.post('/urbanfarming/data', Busboy, function(req, res){
    getNextId( (err, id) =>{
        if (err){ console.error(err) }
        console.log("next id is" + id);
        var busboy = new Busboy({headers: req.headers});
        busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
            console.log('file [' + fieldname + ']: filename: '+filename + ', encoding: ' + encoding + ', mimetype: ' + mimetype);
            file.on('data', function(data){
                console.log('File [' +fieldname +'] got ' + data.length + ' bytes');
            });
            file.on ('end', function() {
                console.log('File [' + fieldname + '] Finished');
            });
        });
        busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated, encoding, mimetype) {
            console.log('Field [' + fieldname + ']: value: ' + inspect(val));
        });
        busboy.on('finish', function() {
            console.log('Done parsing form!');
            res.writeHead(303, { Connection: 'close', Location: '/' });
            res.end();
        });
        req.pipe(busboy);
    });

    res.send("thanks")
})
app.get('/urbanfarming', (request, response) => {
    getHome(request, response, (err, content) =>{
        if (err){ console.error(err) }
        var index = fs.readFileSync('index.html', 'utf8');
        response.end(index.replace("{{content}}",content));
    })
})
