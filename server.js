console.error('Starting');
var fs     = require('fs');
var http   = require('http');
var sqlite = require('sqlite3');
var db     = new sqlite.Database("holdingDash.sqlite");
var port = 4000;
var path = require('path');
var express = require('express');
var exphbs = require('express-handlebars');
var app = express();
app.use(express.static(path.join(__dirname, 'views')))

var tableCheck = "SELECT 1 FROM sqlite_master WHERE type='table' AND name='tbl1';";
db.get(tableCheck, function(err, row) {
    if (err) {console.error(err)};
    if (row == undefined ) {
        db.serialize(function() {
            db.run("CREATE TABLE tbl1 (id, image, soilMoisture, relHumidity, Temp )", function(err){console.error(err)});
            db.run("INSERT INTO tbl1 VALUES (1, ,100 ,100 , 100)", function(err){console.error(err)});
        });
    }
});


app.engine('.hbs', exphbs({
    defaultLayout: 'layout',
    extname:'.hbs',
    layoutsDir:path.join(__dirname, 'public')
}))

const requestHandler = (req, res) => {
    var layout  = fs.readFileSync('Functions/HoldingPage/index.hbs', 'utf8');
    console.log(layout);
    var content = '';
    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1) ", function(err, row) {
    if (err) {console.error(err)};
        content +="<th>Image</th> <td>" + row.image+ "</td> </tr><tr> <th>Soil Moisture</th> <td>i"+row.soilMoisture+"</td> </tr><tr> <th>Relative Humidity</th> <td>"+row.relHumidity+"</td> </tr><tr> <th>Temperature</th> <td>"+row.Temp+"</td>";
    }, function() {
        res.end(layout.replace("{{content}}", content));
    });
}

app.set('view engine', '.hbs')
app.set('views', path.join(__dirname, ''))
const server = http.createserver().listen(port, requestHandler) 
server.listen(port, (err) => {
    if (err) {
        return console.log('something bad happened')
    }
    server.log('Listening');
});

