console.error('Starting');
var fs     = require('fs');
var path   = require ('path');
//var http   = require('http');
var sqlite = require('sqlite3');
var db     = new sqlite.Database("holdingDash.sqlite");
const express = require('express')
const app = express()
const port = 4000

app.use(express.static(path.join(__dirname, 'public')));


var tableCheck = "SELECT name FROM sqlite_master WHERE type='table' AND name='tbl1';";
db.get(tableCheck, function(err, exists) {
    if (err) {console.error(error)};
    if (exists==undefined) {
        db.serialize(function() {
            db.run("CREATE TABLE tbl1 (id, image, soilMoisture, relHumidity, Temp )");
            db.run("INSERT INTO tbl1 VALUES (1, , 100, 100, 100)");
        });
    }
});



app.listen(port, (err) => { 
   if (err) {
     return console.log('something bad happened.', err)
   }
   console.log(`server is listening on ${port}`)

//http.createServer(app)(function(req, res) {
//    var layout  = fs.readFileSync('index.html', 'utf8');
//    console.log(layout);
//    var content = '';
//    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1) ", function(err, row) {
//    if (err) {console.error(err)};
//        content +="<th>Image</th> <td>" + row.image+ "</td> </tr><tr> <th>Soil Moisture</th> <td>i"+row.soilMoisture+"</td> </tr><tr> <th>Relative Humidity</th> <td>"+row.relHumidity+"</td> </tr><tr> <th>Temperature</th> <td>"+row.Temp+"</td>";
//    }, function() {
//        res.end(layout.replace("{{content}}", content));
//    });
//}).listen(4000, function() {
//    console.log('Listening');
});

app.use((request, response, next) => {
    console.log(request.headers)
    next()
})
app.use((request, response, next) => {
    var layout = fs.readFileSync('index.html', 'utf8');
    var content = '';
    db.each("SELECT * FROM tbl1 WHERE id=(SELECT MAX(id) FROM tbl1) ", function(err, row) {
        if (err) {
           console.error(err)
	}
        content +="<th>Image</th> <td>" + row.image+ "</td> </tr><tr> <th>Soil Moisture</th> <td>i"+row.soilMoisture+"</td> </tr><tr> <th>Relative Humidity</th> <td>"+row.relHumidity+"</td> </tr><tr> <th>Temperature</th> <td>"+row.Temp+"</td>";
    }, function() {
        res.end(layout.replace("{{content}}", content));
    })	
})

app.engine('.hbs', exphbs({
	defaultLayout:'main',
	extname:'.hbs',
	layoutsDir: path.join(__dirname, 'public/layouts')
}))
app.get('/urbanfarming', (request, response) => {
    response.send('Hello from Express!')
})
