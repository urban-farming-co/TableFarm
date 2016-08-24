console.error('Starting');
var fs     = require('fs');
var http   = require('http');
var sqlite = require('sqlite3');
var db     = new sqlite.Database("holdingDash.sqlite");

var tableCheck = "SELECT name FROM sqlite_master WHERE type='table' AND name='LOREM';";
db.get(tableCheck, function(err, exists) {
    if (exists.length == 0) {
        db.serialize(function() {
            db.run("CREATE TABLE tbl1 (id, image, soilMoisture, relHumidity, Temp )");
            db.run("INSERT INTO tbl1 VALUES (1, , 100, 100, 100)");
        });
    }
});





http.createServer(function(req, res) {
    var layout  = fs.readFileSync('index.html', 'utf8');
    var content = '';
    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1 ", function(err, row) {
        content +="
            <th>Image</th>
            <td>row.image</td>
            </tr><tr>
            <th>Soil Moisture</th>
            <td>row.soilMoisture</td>
            </tr><tr>
            <th>Relative Humidity</th>
            <td>row.relHumidity</td>
            </tr><tr>
            <th>Temperature</th>
            <td>row.Temp</td>";
    }, function() {
        res.end(layout.replace("{{content}}", content));
    });
}).listen(3000, function() {
    console.log('Listening');
});

