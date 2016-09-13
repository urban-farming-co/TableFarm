console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var rasp    = require('./Functions/addRaspberryPi/server.js');
var formidable = require('formidable');
var pg      = require('pg');
var Client  = require('pg').Client;
var schema  = 'urbanfarming';
var table   = 'livedata';
var liveData = schema + "." + table;
var cors    = require('express-cors');
var vcapServices = require('./vcapServices');
console.log(vcapServices);
console.log(vcapServices.elephantsql[0].credentials.uri);
var conStr  = vcapServices.elephantsql[0].credentials.uri; 
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var app     = express();
var port    = (process.env.VCAP_APP_PORT || 4000);
var util = require('util');
app.use(cors({
    allowedOrigins: [
        'mybluemix.net', 'localhost:4000', 'tablefarm.co.uk'  
    ]
}))


app.set('views',__dirname);
app.engine('handlebars', exphbs);
app.set('view engine', '');

app.use(express.static(path.join(__dirname, 'views')));
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));


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
    var createLiveData = `CREATE TABLE ${liveData} (id INTEGER PRIMARY KEY, image VARCHAR(200), soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER)`;
    var AddARowToLiveData = `INSERT INTO ${liveData} (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)`;

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
    var sql="SELECT * FROM "+ liveData+" WHERE id=(SELECT MAX(id) FROM "+liveData+" ) ";
    askDatabase(sql, function(err, row) {
        if (err) {
            return callback(err)
        }
        callback(null, row.rows[0].id + 1);
    })
}

function formatDate(d){
    dd=   d.getDate();
    mm=   d.getMonth();
    yyyy= d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTime(t){
    time = t.getHours() + ":" +t.getMinutes() +":"+t.getSeconds();
    return time;
}
function addRow(content, row) {
    var img = "";
    fs.accesssync(row.image, fs.F_OK, function(err) {
        if (err) {
            img="http://tablefarm.co.uk/public/files/flower.gif";
        } 
        else{
            img = "http://tablefarm.co.uk/urbanfarming"+ row.image.substring(1);
        }
    })
    content +="<tr> "+
        "<td><img src='" + img +"' /></td>"+ 
        "<td id='date' >" +formatDate(row.time)+ "</td>"+
        "<td>" + formatTime(row.time)+"</td>"+
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

        content +="<th>                   </th><td><img src=" + row.image+" /></td>        </tr>"+
            "<tr><th>Date:                </th><td id='date' >" +date+ "</td></tr>"+
            "<tr><th>Time:                </th><td>" +time+"</td>                          </tr>"+
            "<tr><th>Plant name:          </th><td>" +row.plantname+"</td>                 </tr>"+
            "<tr><th>Lighting lux level:  </th><td>" +row.lightluxlevel+" lux</td>         </tr>"+
            "<tr><th>Soil Moisture:       </th><td>" +row.soilmoisture+"%</td>             </tr>"+
            "<tr><th>Relative Humidity:   </th><td>" +row.relhumidity+"%</td>              </tr>"+
            "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C</td>";
        content+= "</tr></table>";
        response.write(content);
        response.end();
    })
}



function processDataUpload(request, response, id){
    var form = new formidable.IncomingForm();
    form.parse(request, function(err, fields, files) {
        var target = "./public/files/flower.gif";
        if (files.image.name!=""){
            var fileextention = files.image.name.split('.').pop();
            target = "./public/images/"+id+"." +fileextention;
            fs.rename(files.image.path, target); 
        }
        var moisture =  fields.soilMoisture;
        var humidity = fields.relHumidity;
        var temp     = fields.temperature;
        var name     = (( fields.plantName== "")?  'a' : fields.plantName);
        var light    = fields.lightLuxLevel;

        var sql=`INSERT INTO ${liveData} (id, soilMoisture, relHumidity, temperature, image, plantName, lightLuxLevel) VALUES (${id}, ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light})`;
        console.log(sql);
        askDatabase(sql, function(err, result){;
            if(err){
                console.error(err);
                response.write('The data upload was unsucessful. Couldn\'t connect to postgres. Please try again later.');
                response.end();
            }
            else {
                response.writeHead(200, {'content-type':'text/plain'});         
                response.write('received upload:\n\n');
                response.end(util.inspect({fields:fields, files:files}));
            }
        })
    })
}

app.post('/urbanfarming/data', function(req, res){
    getNextId( (err, id) =>{
        if (err){
            res.write('The data upload was unsucessful. Unable to find the perfect id for this data');
            res.end();
            console.error(err)
        }
        else {
            processDataUpload(req, res, id)  

        }
    })
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
