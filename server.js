console.error('Starting');
var fs      = require('fs');
var path    = require ('path');
var rasp    = require('./Functions/addRaspberryPi/server.js');
var formidable = require('formidable')
var pg      = require('pg');
var conString= "postgres://ibyxzonx:dWFDS_l0tiI_fNMA0Q7iZvKe6aWlMcS_@qdjjtnkv.db.elephantsql.com:5432/ibyxzonx" || "postgres://postgres:urban2016@127.0.0.1:5432/UrbanFarming";
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
    console.log(row.rowCount)
    if (row.rowCount == 0 ) {
        console.log("livedata doesn't exist, creating")
        var sql = "CREATE TABLE livedata (id INTEGER PRIMARY KEY, image VARCHAR(200), soilMoisture INTEGER, relHumidity INTEGER, temperature INTEGER, time TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL, plantName VARCHAR(50), lightLuxLevel INTEGER )";
        var sql1="INSERT INTO livedata (id, soilMoisture, relHumidity, temperature) VALUES (1,100 ,100 ,100)";
        var query1 = client.query(sql , function(err){if (err) {console.error(err)}});
        query1.on('end', function(){ 
            var query2 = client.query(sql1, function(err){if (err) {console.error(err)}});
            query2.on('end', function() {

                client.end();
            })
        });
    }
    else {
        console.log("livedata does exist")
        client.end();
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
    var sql="SELECT * FROM livedata WHERE id=(SELECT MAX(id)) ";
    var client = new Client({user:'postgres', password:'urban2016', database:'UrbanFarming', host:'localhost', port:5432});
    client.connect(function(err){
        if (err){return console.error("couldn't connect to postgres", err)}
        var q = client.query(sql, function(err, row) {
            if (err) {
                return callback(err)
            }
            callback(null, row.id + 1);
        })
        q.on('end', function() {
            client.end()
        })
    })
}

function getLast127Rows(request, response, callback)  {
    var content = '';
    db.all("SELECT * FROM tbl1", function(err, rows) {
        if (err) {
            return callback(err)
        }
        rows.forEach(function(row) {
            date=row.time.split(' ')[0];
            time=row.time.split(' ')[1];
            dd=   date.split('-')[2];
            mm=   date.split('-')[1];
            yyyy= date.split('-')[0];
            var img = "";
            if (row.image==null) {
                img="http://tablefarm.co.uk/public/files/flower.gif";
            }
            else{
                img = "http://tablefarm.co.uk/urbanfarming"+ row.image.substring(1);
            }
            content +="<table id='"+row.id+"' >"+
                "<tr><th>               </th><td><img src=" + img +" />       </td> </tr>"+
                "<tr><th>Date:                </th><td id='date' >" +dd+"-"+mm+"-"+yyyy+ "</td></tr>"+
                "<tr><th>Time:                </th><td>" +time+"</td>                          </tr>"+
                "<tr><th>Plant name:          </th><td>" +row.plantName+"</td>                 </tr>"+
                "<tr><th>Lighting lux level:  </th><td>" +row.lightLuxLevel+" lux</td>         </tr>"+
                "<tr><th>Soil Moisture:       </th><td>" +row.soilMoisture+"%</td>             </tr>"+
                "<tr><th>Relative Humidity:  </th><td>" +row.relHumidity+"%</td>               </tr>"+
                "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C</td>              </tr>"+

                "</table> <hr/>";
        })
        callback(null, content)
    })
}
app.get('/urbanfarming/view', (request, response) => {
    getLast127Rows(request, response, (err, content) =>{
        if (err){ console.error(err) }
        var index = fs.readFileSync('view.html', 'utf8');
        response.end(index.replace("{{content}}",content));
    })
})
function getHome(request, response, callback)  {
    var content = '';
    var sql="SELECT * FROM livedata WHERE id=(SELECT MAX(id)) ";
    var client = new Client({user:'postgres', password:'urban2016', database:'UrbanFarming', host:'localhost', port:5432});
    client.connect(function(err){
        if (err){return console.error("couldn't connect to postgres", err)}
        client.query(sql, function(err, row) {
            if (err) {
                return callback(err)
            }
            date = row.time.split(' ')[0];
            time = row.time.split(' ')[1];
            dd   = date.split('-')[2];
            mm   = date.split('-')[1];
            yyyy = date.split('-')[0];
            content +="<th>                   </th><td><img src=" + row.image+" /></td>        </tr>"+
                "<tr><th>Date:                </th><td id='date' >" +dd+"-"+mm+"-"+yyyy+ "</td></tr>"+
                "<tr><th>Time:                </th><td>" +time+"</td>                          </tr>"+
                "<tr><th>Plant name:          </th><td>" +row.plantName+"</td>                 </tr>"+
                "<tr><th>Lighting lux level:  </th><td>" +row.lightLuxLevel+" lux</td>         </tr>"+
                "<tr><th>Soil Moisture:       </th><td>" +row.soilMoisture+"%</td>             </tr>"+
                "<tr><th>Relative Humidity:   </th><td>" +row.relHumidity+"%</td>              </tr>"+
                "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C</td>";
            callback(null, content)
            client.end()
        })
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


                var moisture =  fields.soilMoisture;
                var humidity = fields.relHumidity;
                var temp     = fields.temperature;
                var name     = (( fields.plantName== "")?  'a' : fields.plantName);
                var light    = fields.lightLuxLevel;

                var a =`(id, soilMoisture,relHumidity, temperature, image, plantName, lightLuxLevel) VALUES (${id}, ${moisture}, ${humidity}, ${temp}, '${target}', '${name}', ${light})`;
                console.log(a);
                var a =`(id, soilMoisture,relHumidity, temperature, image, plantName, lightLuxLevel) VALUES (${id}, ${fields.soilMoisture}, ${fields.relHumidity}, ${fields.temperature}, '${target}', '${fields.plantName}', ${fields.lightLuxLevel})`;
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
    getHome(request, response, (err, content) =>{
        if (err){ console.error(err) }
        var index = fs.readFileSync('index.html', 'utf8');
        response.end(index.replace("{{content}}",content));
    })
})
