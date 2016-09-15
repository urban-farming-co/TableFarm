console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var rasp    = require('./Functions/addRaspberryPi/server.js');
var formidable = require('formidable');
var pg      = require('pg');
var Client  = require('pg').Client;
var schema  = 'urbanfarming';
var table   = 'livedateyo';
var liveData = schema + "." + table;
var cors    = require('express-cors');
var vcapServices = require('./vcapServices');
var conStr  = vcapServices.elephantsql[0].credentials.uri; 
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var passport  = require('passport');




var app     = express();
var port    = (process.env.VCAP_APP_PORT || 4000);
var util = require('util');


app.use(cors({
    allowedOrigins: [
        'mybluemix.net', 'localhost:4000', 'tablefarm.co.uk'  
    ]
}))

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

app.set('views',__dirname);
app.engine('handlebars', exphbs);
app.set('view engine', '');

// app.use(express.static(path.join(__dirname, 'views')));
// app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
// app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));
// app.use("/urbanfarming/public/", express.static('public'));
// app.use("/urbanfarming/public/images", express.static('public/images'));

app.get('/urbanfarming/public/files/flower.gif/', function(req, res) {
    res.sendFile(__dirname + "/public/files/flower.gif")
})

app.get('/urbanfarming/public/index.css/', function(req, res) {
    res.sendFile(__dirname + "/public/index.css")
})

app.get('/urbanfarming/public/files/scotsman_article.jpg/', function (req, res) {
    res.sendFile(__dirname + "/public/files/scotsman_article.jpg");
})

app.get('/urbanfarming/public/files/child.jpg/', function (req, res) {
    res.sendFile(__dirname + "/public/files/child.jpg");
})

app.get('/urbanfarming/public/files/strawberry.jpg/', function (req, res) {
    res.sendFile(__dirname + "/public/files/strawberry.jpg");
})

app.get('/urbanfarming/public/files/getMotivated.jpg/', function (req, res) {
    res.sendFile(__dirname + "/public/files/getMotivated.jpg");
})



checkTablesExist();

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



function createTables(sql, sql1){
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
function createSchemaAndTables(){
    var checkSchema = "SELECT 1 FROM information_schema.tables WHERE table_schema='"+schema+"'";
    var createLiveData = `CREATE TABLE ${liveData} (id SERIAL  PRIMARY KEY, image BYTEA , soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP WITHOUT TIME ZONE DEFAULT (now() at time zone 'utc') NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER)`;
    var AddARowToLiveData = `INSERT INTO ${liveData} (soilMoisture, relHumidity, temperature) VALUES (100 ,100 ,100)`;

    askDatabase(checkSchema, function(err, result){
        if (err) {
            console.error(err)
        }

        if (result.rowCount === 0) {
            askDatabase("CREATE SCHEMA " + schema, function(err){
                if (err) {
                    console.error(err)
                }  
                createTables(createLiveData, AddARowToLiveData);
            })
        }
        else {
            createTables(createLiveData, AddARowToLiveData);
        }
    })
}

function checkTablesExist(){    
    var tableCheck = "SELECT 1 FROM information_schema.tables WHERE table_name='"+table+"' and table_schema='"+schema+"'";
    console.log("checking tables");
    askDatabase(tableCheck, function(err, row) {
        if (err) {console.error(err)}
        console.log(row);
        if (row.rowCount === 0 ) {
            console.log("livedata doesn't exist, creating");
            createSchemaAndTables()
        }
        else {
            console.log("livedata does exist");
        }
    });
}


function formatDate(d){
    dd=   d.getDate();
    mm=   d.getMonth();
    yyyy= d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTime(t){
    hh = t.getHours(); 
    o =  t.getTimezoneOffset() / 60;
    hh = hh- o;
    mm = t.getMinutes() ;
    ss = t.getSeconds();
    time = `${hh}:${mm}:${ss}`
        return time;
}
function addRow(content, row) {
    content +="<tr> "+
        "<td><img src='http://tablefarm.co.uk/urbanfarming/img?x=" + row.id.toString() + "' /></td>"+ 
        "<td id='date' >" +formatDate(row.time)+ "</td>"+
        "<td>" + formatTime(row.time) +"</td>"+
        "<td>" +row.plantname+"</td>"+
        "<td>" +row.lightluxlevel+" lux</td>"+
        "<td>" +row.soilmoisture+"%</td>"+
        "<td>" +row.relhumidity+"%</td>"+
        "<td>" +row.temperature+"C</td>"+
        "</tr>";
    return content;
}

function getLastXRows(request, response)  {
    var content = "<table id='view'>" +
        "<tr>" +
        "<th>Image</th>"+  "<th>date</th>"+ "<th>time</th>"+ "<th>PlantName</th>"+ "<th>light lux level</th>"+ "<th>soilMoisture</th>"+ "<th>relative Humidity</th>"+ "<th>temperature</th>"+
        "</tr>";
    var x = request.query.x;
    x = 10;
    var sql="SELECT * FROM "+liveData +" WHERE id >(SELECT MAX(id) - "+ x+ " FROM "+liveData +" )";
    console.log(sql);
    askDatabase(sql, function(err, result) {
        if (err) {
            response.write('Error getting data');
            console.error(err)
        }
        else {
            var N = result.rows.length;
            for (var n =0; n <N; n++){
                content = addRow(content, result.rows[n]) ;
            }
            content += "</table>" ;
            response.writeHead(200, {
                'Content-Type'  : 'text/html', 
                'Content-Length': Buffer.byteLength(content)});
            response.write(content); 
        }
    })
}



function getHome(request, response)  {
    var content = "<table id='data'><tr>";
    var sql="SELECT * FROM "+liveData+" WHERE id=(SELECT MAX(id) FROM "+liveData+") ";
    askDatabase (sql, function(err, result){
        if (err) { console.error(err); return false }
        var row = result.rows[0];
        date = formatDate(row.time);
        time = formatTime(row.time);

        content +="<th>                   </th><td><img src='http://tablefarm.co.uk/urbanfarming/img?f=1/' /></td>        </tr>"+
            "<tr><th>Date:                </th><td id='date' >" +date+ "</td></tr>"+
            "<tr><th>Time:                </th><td id='time'>" +time+"</td>                          </tr>"+
            "<tr><th>Plant name:          </th><td>" +row.plantname+"</td>                 </tr>"+
            "<tr><th>Lighting lux level:  </th><td>" +row.lightluxlevel+" lux</td>         </tr>"+
            "<tr><th>Soil Moisture:       </th><td>" +row.soilmoisture+"%</td>             </tr>"+
            "<tr><th>Relative Humidity:   </th><td>" +row.relhumidity+"%</td>              </tr>"+
            "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C</td>";
        content+= "</tr></table>";
        content+="<script>console.log('i');</script>";
        content+="<script>console.log(1);var tz = (new Date()).getTimezoneOffset() / 60;console.log(1); var textarea = document.getElementById('time'); console.log(1); tex= textarea.innerHTML;console.log(1); var hh = parseInt(tex.split(':')[0]) - tz; var mm = tex.split(':')[1]; var ss =tex.split(':')[2]; textarea.innerHTML = `${hh.toString()}:${mm}:${ss}`; </script> ";
        response.write(content);
        response.end();
    })
}

function formatImageForDB(path, response, callback){
    fs.open( path, 'r', function (err, fileToRead){
        if (!err) {
            console.log(fileToRead);
            console.log(typeof(fileToRead))
                fs.readFile(path,'hex', function(err, data) {
                    if (!err) {
                        data = '\\x'+data;

                        callback(null, data);
                    }else{

                        console.error(err);
                        callback(err);
                    }
                });

        }else {
            console.log(err);
            callback(err);
        }
    });
}
function processTextFields(fields, response, request, target){
    var moisture =  fields.soilMoisture;
    var humidity = fields.relHumidity;
    var temp     = fields.temperature;
    var name     = (( fields.plantName== "")?  'a' : fields.plantName);
    var light    = fields.lightLuxLevel;
    if (target){   
    var sql=`INSERT INTO ${liveData} (soilMoisture, relHumidity, temperature, image, plantName, lightLuxLevel) VALUES ( ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light})`;
    }
    else {
    var sql=`INSERT INTO ${liveData} (soilMoisture, relHumidity, temperature, plantName, lightLuxLevel) VALUES ( ${moisture}, ${humidity}, ${temp},  '${name}', ${light})`;
    }
    askDatabase(sql, function(err, result){;
        if(err){
            console.error(err);
            response.write('The data upload was unsucessful. Couldn\'t connect to postgres. Please try again later.');
            response.end();
        }
        else {
            response.writeHead(200, {'content-type':'text/plain'});         
            response.write('received upload:\n\n');
            response.end(util.inspect({fields:fields}));
        }
    })
}
function processDataUpload(request, response, id){
    var form = new formidable.IncomingForm();
    form.parse(request, function(err, fields, files) {
        if (files) {
            console.log(files.image.size);
            if (files.image.size<1) {
                processTextFields(fields, response, request, null);
            }
            else {
                formatImageForDB(files.image.path, response, function (err, target){
                    processTextFields(fields, response, request, target);
                })
            }
        }
        else {

            processTextFields(fields, response, request, null);

        }
    })
}

app.post('/urbanfarming/data', function(req, res){
    processDataUpload(req, res)  


})
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

app.get('/urbanfarming/img', function(req, res, next){
    var x = req.query.x;
    var f = req.query.f;  // if supplied then when the corresponding id image is null, then find the nearest id that has got an image. otherwise, if the image is null, then display the null image.
    if (x && x.substr(-1) == '/'){
        x = x.substr(0, x.length -1);
    }

    if (f && f.substr(-1) == '/'){
        f = f.substr(0, f.length -1);
    }
    console.log(f);
    console.log(x);

    var sql = "";
    if (x && f){

        sql = "SELECT image FROM " + liveData + " WHERE id>" +x +" AND image IS NOT NULL LIMIT 1;";
    }
    else if (x==null && f){
        sql = "SELECT image FROM " + liveData + " WHERE id=(SELECT MAX(id) FROM  "+liveData +" WHERE image IS NOT NULL)";
    }
    else if(x && f==null) {
        sql = "SELECT image FROM " + liveData + " WHERE id=" +x ;
    }

    else {
        sql = "SELECT image FROM " + liveData + " WHERE id=(SELECT MAX(id) FROM  "+liveData+")" ;
    }
    askDatabase(sql , function(err, result){
        if (err) {
            console.error(err)

        }
        console.log(result);
        if (result.rowCount === 0){
            console.log("not sending image")
                res.sendFile(__dirname +"/public/test.jpg");
        }
        else if (result.rows[0].image == undefined) {
            console.log("not sending image")
                res.sendFile(__dirname +"/public/test.jpg");
        }
        else {
            fs.writeFile('public/foo.jpg', result.rows[0].image, function (errr) {
                console.log("sending image");
                res.sendFile(__dirname + "/public/foo.jpg");
            })
        }
    });   
}) 

app.get('/urbanfarming', (request, response) => {
    var index = fs.readFileSync('index.html', 'utf8');
    response.write(index);
    response.end()
})
app.get('/urbanfarming/viewcontent', (request, response) => {
    getLastXRows(request, response);
})
app.get('/urbanfarming/view', (request, response) => {
    var index = fs.readFileSync('view.html', 'utf8');
    response.write(index);
    response.end()
})
app.get('/urbanfarming/liveData',(req, res)=>{
    getHome(req, res)
})

app.get('/urbanfarming/game', (req, res) => {
    var index ='<iframe src="http://zap.pm/game/55ae4e2b7dfb285122934106/play" width="480" height="365" allowfullscreen></iframe><br> <a href="http://zap.pm/game/55ae4e2b7dfb285122934106" target=_blank>Tank Battle by roger on ZAP<br> Remix to add your own pictures and settings!</a> - See more at: http://zap.pm/game/55ae4e2b7dfb285122934106#sthash.Ptk8wWfG.dpuf';
    res.write(index);
    res.end()
})

