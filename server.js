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
var conStr  = ""; 
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var app     = express();


if (process.env.NODE_ENV === 'development') {
    conStr = "postgres://ilperodq:WQO8D8EHusxAIFAfhS065P1iWIOhkwFN@qdjjtnkv.db.elephantsql.com:5432/ilperodq"; 
    var host='localhost';
    var port=4000;
} else  if (process.env.NODE_ENV === 'production') {
    conStr = "postgres://ibyxzonx:dWFDS_l0tiI_fNMA0Q7iZvKe6aWlMcS_@qdjjtnkv.db.elephantsql.com:5432/ibyxzonx"; 
    var host=process.env.VCAP_APP_HOST;
    var port=process.env.VCAP_APP_PORT;
}

var client = new Client(conStr);

app.use(express.static(path.join(__dirname, 'views')));
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));

var tableCheck = "SELECT 1 FROM information_schema.tables WHERE table_name='"+table+"' and table_schema='"+schema+"'";
pg.connect(conStr, function(err, client){    
    if(err){ 
        console.error(err);
    }
    else {
        client.query(tableCheck, function(err, row) {
            if (row.rowCount === 0 ) {
                console.log("livedata doesn't exist, creating");
                var sql0 = "SELECT 1 FROM information_schema.tables WHERE table_schema='"+schema+"'";
                var sql = `CREATE TABLE ${liveData} (id INTEGER PRIMARY KEY, image VARCHAR(200), soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER)`;
                var sql1 = `INSERT INTO ${liveData} (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)`;
                var query0 = client.query(sql0, function(err, result){if (err) {console.error(err)}});
                query0.on('end', function(){
                    if (row.rowCount === 0) {
                        client.query("CREATE SCHEMA " + schema, function(err){
                            if (err) {console.error(err)}  
                        })
                    }
                    var query1 = client.query(sql , function(err){if (err) {console.error(err)}});
                    query1.on('end', function(){ 
                        var query2 = client.query(sql1, function(err){if (err) {console.error(err)}});
                        query2.on('end', function() {

                            client.end();
                        })
                    });

                })
            }
            else {
                console.log("livedata does exist");
                client.end();
            }
        });
    }
})
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
    pg.connect(conStr, function(err, client){
        if (err){

            return console.error("couldn't connect to postgres", err)
        }
        else {

            var q = client.query(sql, function(err, row) {
                if (err) {
                    return callback(err)
                }
                callback(null, row.rows[0].id + 1);
            })
            q.on('end', function() {
                client.end()
            })
        }
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

function getLastXRows(request, response)  {
    var content = "<table id='view'>" +
        "<tr>" +
        "<th>Image</th>"+
        "<th>date</th>"+
        "<th>time</th>"+
        "<th>PlantName</th>"+
        "<th>light lux level</th>"+
        "<th>soilMoisture</th>"+
        "<th>relative Humidity</th>"+
        "<th>temperature</th>"+
        "</tr>";
    var x = request.query.x;
    x = 10;
    var sql="SELECT * FROM "+liveData +" WHERE id >(SELECT MAX(id) - "+ x+ " FROM "+liveData +" )";
    console.log(sql);
    pg.connect(conStr, function(err, client){
        if(err){
            console.error(err);
        } 
        else {
            var q = client.query(sql, function(err, result) {
                console.log(result);
                if (err) {
                    response.write('Error getting data');
                    console.error(err)
                }
                else {
                    var N = result.rows.length;
                    var row = result.rows[0];
                    for (var n =0; n <N; n++){
                        row = result.rows[n];
                        console.log(N +"    "+ n);
                        console.log(row);
                        date = formatDate(row.time);
                        time = formatTime(row.time);
                        var img = "";
                        if (row.image==null) {
                            img="http://tablefarm.co.uk/public/files/flower.gif";
                        }
                        else{
                            img = "http://tablefarm.co.uk/urbanfarming"+ row.image.substring(1);
                        }
                        content +="<tr> "+
                            "<td><img src='" + img +"' /></td>"+ 
                            "<td id='date' >" +date+ "</td>"+
                            "<td>" +time+"</td>"+
                            "<td>" +row.plantname+"</td>"+
                            "<td>" +row.lightluxlevel+" lux</td>"+
                            "<td>" +row.soilmoisture+"%</td>"+
                            "<td>" +row.relhumidity+"%</td>"+
                            "<td>" +row.temperature+"C</td>"+
                            "</tr>";
                    }
                    content += "</table>" ;
                    console.log(content);
                    console.log(Buffer.byteLength(content));
                    response.writeHead(200, {
                        'Content-Type'  : 'text/html', 
                        'Content-Length': Buffer.byteLength(content)});
                    response.write(content); 
                    client.end();
                }
            })
        }
    })
}

app.get('/urbanfarming/viewcontent', (request, response) => {
    getLastXRows(request, response);
})
app.get('/urbanfarming/view', (request, response) => {
    var index = fs.readFileSync('view.html', 'utf8');
    response.write(index);
    response.end()
})
function getHome(request, response, callback)  {
    var content = "<table id='data'><tr>";
    var sql="SELECT * FROM "+liveData+" WHERE id=(SELECT MAX(id) FROM "+liveData+") ";
    pg.connect(conStr, function(err, client){
        if (err){
            res.write('Unable to connect to postgres at this moment in time.');
            res.end();
            callback( err)
        }
        else {

            client.query(sql, function(err, row) {
                if (err) {
                    callback(err)
                }

                date = row.rows[0]['time'];
                time = date.getHours() + ":" +date.getMinutes() +":"+date.getSeconds();


                console.log("The date is:");
                console.log(date);
                console.log(typeof date);
                console.log(date.toString().split('-')[2]);
                dd   = date.getDate();
                mm   = date.getMonth()+1;
                yyyy = date.getFullYear();
                content +="<th>                   </th><td><img src=" + row.rows[0].image+" /></td>        </tr>"+
                    "<tr><th>Date:                </th><td id='date' >" +dd+"-"+mm+"-"+yyyy+ "</td></tr>"+
                    "<tr><th>Time:                </th><td>" +time+"</td>                          </tr>"+
                    "<tr><th>Plant name:          </th><td>" +row.rows[0].plantname+"</td>                 </tr>"+
                    "<tr><th>Lighting lux level:  </th><td>" +row.rows[0].lightluxlevel+" lux</td>         </tr>"+
                    "<tr><th>Soil Moisture:       </th><td>" +row.rows[0].soilmoisture+"%</td>             </tr>"+
                    "<tr><th>Relative Humidity:   </th><td>" +row.rows[0].relhumidity+"%</td>              </tr>"+
                    "<tr><th>Ambient temperature: </th><td>" +row.rows[0].temperature+"C</td>";
                content+= "</tr></table>";
                callback(null, content)
                    client.end()
            })
        }
    })
}

app.get('/urbanfarming/liveData',(req, res)=>{
    getHome(req, res, function(err, con){ 
        if (err) {
            console.error(err);
        } else{
            res.write(con);
            res.end();
        }
    })
})


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
        if (err){
            res.write('The data upload was unsucessful. Unable to find the perfect id for this data');
            res.end();
            console.error(err)
        }
        else {
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
                console.log(files.image.name);
                if (files.image.name!=""){
                    var fileextention = files.image.name.split('.').pop();
                    target = "./public/images/"+id+"." +fileextention;
                    fs.rename(files.image.path, target); 
                }
                var moisture = (( fields.soilMoisture !="")? fields.soilMoisture : 0);
                var humidity = (( fields.relHumidity !="")? fields.relHumidity : 0);
                var temp     = (( fields.temperature !="")? fields.temperature : 0);
                var name     = (( fields.plantName !="")? fields.plantName : 0);
                var light    = (( fields.lightLuxLevel !="")? fields.lightLuxLevel : 0);
                var sql=`INSERT INTO ${liveData} (id, soilMoisture, relHumidity, temperature, image, plantName, lightLuxLevel) VALUES (${id}, ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light})`;
                console.log(sql);
                pg.connect(conStr, function(err, client){;
                    if(err){
                        console.error(err);
                        res.write('The data upload was unsucessful. Couldn\'t connect to postgres. Please try again later.');
                        res.end();
                    }
                    else{
                        var q = client.query(sql);
                        q.on('end', function(){
                            client.end()
                        });
                    }
                })
            })
        };
    })
})
app.get('/urbanfarming', (request, response) => {
    var index = fs.readFileSync('index.html', 'utf8');
    response.write(index);
    response.end()
})
