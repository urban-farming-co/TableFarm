console.error('Starting');
var path    = require ('path');
var cons    = require('consolidate');
var formidable = require('formidable');
var cors    = require('express-cors');
var vcapServices = require('./vcapServices');
var fs      = require('fs');
var express = require('express');
var exphbs  = require('express-handlebars');
var bodyParser = require('body-parser');
var passport  = require('passport');
var database  = require('./Functions/Database/checkAndCreate.js');
var tableStuff  = require('./Functions/Database/viewInformation.js');
var imageStuff = require('./Functions/ProcessImages/process_images.js');
var util = require('util');




var app     = express();
var port    = (process.env.VCAP_APP_PORT || 4000);


app.use(cors({
    allowedOrigins: [
        'mybluemix.net', 'localhost:4000', 'tablefarm.co.uk'  
    ]
}))

// app.use(express.static(path.join(__dirname, 'views')));
app.use("/urbanfarming/public", express.static(path.join(__dirname, 'public')));
// app.use("/urbanfarming/public/images", express.static(path.join(__dirname, 'public/images')));
app.use("/urbanfarming/public/", express.static('public'));
//app.use("/urbanfarming/public/images", express.static('public/images'));


app.get('/urbanfarming/public/:file', function(req, res) {
    console.log(req.params);    
    res.sendFile(__dirname + req.params);
})

app.get('/urbanfarming/Functions/ProcessImages/processed_image.jpg', function(req, res) {
    res.sendFile(__dirname + "/Functions/ProcessImages/processed_image.jpg");
})
app.get('/urbanfarming/Functions/ProcessImages/image.jpg', function(req, res) {
    res.sendFile(__dirname + "/Functions/ProcessImages/image.jpg");
})

app.listen(port, (err) => { 
    if (err) {
        return console.log('something bad happened.', err)
    }
    console.log(`server is listening on ${port}`)
});

app.use((request, response, next) => {
    console.log(request.headers);
    next();
})

app.use(function(req, res, next) {
    if(req.url.substr(-1) !== '/'){
        res.redirect(301, req.url + "/");
    }
    else{
        next();
    }
});

app.engine('html', cons.swig);
app.set('views',__dirname + "/views");
// app.engine('handlebars', exphbs);
app.set('view engine', 'html');


database.checkTablesExist();



function processChartForm(req, res, callback){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log(fields);
        callback( fields.after, fields.before);
    })
}


function processNewImage(database){
    // Get the id that the processed data needs to have to match up with live data.
    database.askDatabase("SELECT id FROM "+ database.liveData + " WHERE id = (SELECT MAX(id) FROM "+database.liveData +" WHERE image IS NOT NULL)", function(err,result) {
        // Retrieve the image from the database, save it in file.
        formatImageForDisplay(database, result.rows[0].id,1,(file) =>{;
            processImage("Functions/ProcessImages/image.jpg", (data, id)=>{
                if (data != null){
                    formatImageForDB("bar.JPEG", (err, image) => {;
                        database.askDatabase(`INSERT INTO ${database.processedData} (id, image, greenScore, colour, compactness, width, height) VALUES (${id}, '${image}', ${data["Score"]}, '${data["AveragePlantColour"]}', ${data["Compactness"]}, ${data["Width"]}, ${data["Height"]})`, (err)=>{
                            console.log("processed");
                            if (err){
                                console.error(err)
                            }
                        });
                    })
                }
            }, result.rows[0].id);
        })
    })
}

function insertIntoLayout(file, callback){
    fs.readFile(file, 'utf8', function(err, index){
        if (err) {
            console.error(err);
        }
        else {
            index= index.toString();
            fs.readFile('layout.html', 'utf8', function(err, layout) {;
                if (err) {
                    console.error(err);
                }else {
                    layout  = layout.replace('{{content}}',index);
                    callback(layout);
                }

            })
        }
    })
}
app.post('/urbanfarming/data', function(req, res){
    database.processDataUpload(req, res, formidable, imageStuff)  
})

app.post('/urbanfarming/chart', function(req, res) {
    var a;
    var b;
    processChartForm(req, res, (a, b) =>{
        tableStuff.generateChartData(database, (c) => {
            console.log(c);
            res.render("chart", c)},a,b);      
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

app.get('/urbanfarming/pimg', function(req, res){
    var x = req.query.x;
    var f = req.query.f;  // if supplied then when the corresponding id image is null, then find the nearest id that has got an image. otherwise, if the image is null, then display the null image.
    if (x && x.substr(-1) == '/'){
        x = x.substr(0, x.length -1);
    }

    if (f && f.substr(-1) == '/'){
        f = f.substr(0, f.length -1);
    }
    imageStuff.showProcessedData(database, (fileName)=>{
        res.sendFile(__dirname + fileName);

    } );
}) 

app.get('/urbanfarming/img', function(req, res){
    var x = req.query.x;
    var f = req.query.f;  // if supplied then when the corresponding id image is null, then find the nearest id that has got an image. otherwise, if the image is null, then display the null image.
    if (x && x.substr(-1) == '/'){
        x = x.substr(0, x.length -1);
    }

    if (f && f.substr(-1) == '/'){
        f = f.substr(0, f.length -1);
    }
    database.formatImageForDisplay(x, f, (fileName)=>{
        res.sendFile(__dirname  +fileName);

    } );
}) 

app.get('/urbanfarming', (request, response) => {
    response.render("index");
})
app.get('/urbanfarming/processImage', (req, res) => {
    var x = req.query.x;
    if (x && x.substr(-1) == '/') {
        x = x.substr(0, x.length -1);
    }
    database.formatImageForDisplay(x, 1, (fileName)=> {
        imageStuff.showProcessedData(database, (file, score)=> {       
            insertIntoLayout(__dirname + "/process.html", (index) => {  
                c = index.replace("{{image}}", "/urbanfarming"+ file); 
                c = c.replace("{{imageO}}", "/urbanfarming" + fileName);
                c = c.replace("{{score}}", score);
                res.write(c);
                res.end();
            });
        })
    })
})


app.get('/urbanfarming/slides/carosel.js', (req, res) => {
    res.sendFile(__dirname + "/Functions/ProcessImages/carosel.js");
})
app.get('/urbanfarming/slides/carosel.css', (req, res) => {
    res.sendFile(__dirname + "/Functions/ProcessImages/carosel.css");
})

app.get('/urbanfarming/slides', (req, res) => {

    res.sendFile(__dirname + "/Functions/ProcessImages/carosel.html");
})

app.get('/urbanfarming/viewcontent', (request, response) => {
    var x = request.query.x;
    if (x && x.substr(-1) == '/'){
        x = x.substr(0, x.length -1);
        parseInt(x);
        console.log("The variable x is:");
        console.log(x);
    }
    if (!x) 
    {
        x =10;
    }
    tableStuff.getLastXRows(x, database, (err, content) => {
        if (err) {
            response.write(err);
        }
        else {
            response.writeHead(200, {
                'Content-Type'  : 'text/html', 
                'Content-Length': Buffer.byteLength(content)});
            response.write(content);
        }
    })
})
app.get('/urbanfarming/view', (request, response) => {
    response.sendFile(__dirname + "/view.html", () =>{
        console.log("sent");
        response.end();

    });
})
app.get('/urbanfarming/liveData',(req, res)=>{
    var o =  req.query.o;
    if (o && o.substr(-1) == '/'){
        o = o.substr(0, o.length -1);
        parseInt(o);
        console.log(o);
    }
    if (!o) {
        o = 0;
    }
    tableStuff.getHome( o, database, (err, content)=>{
        if (err){
            res.write(err);
        }else{
            res.writeHead(200, {
                'Content-Type'  : 'text/html', 
                'Content-Length': Buffer.byteLength(content)});
            res.write(content);
        }
        res.end()
    });
})

app.get('/urbanfarming/game', (req, res) => {
    var index ='<iframe src="http://zap.pm/game/55ae4e2b7dfb285122934106/play" width="480" height="365" allowfullscreen></iframe><br> <a href="http://zap.pm/game/55ae4e2b7dfb285122934106" target=_blank>Tank Battle by roger on ZAP<br> Remix to add your own pictures and settings!</a> - See more at: http://zap.pm/game/55ae4e2b7dfb285122934106#sthash.Ptk8wWfG.dpuf';
    res.write(index);
    res.end()
})


app.get('/urbanfarming/chart', (req, res) => {
    var c;
    tableStuff.generateChartData(database, (dict) => {
        res.render("chart", dict);
    })
})
app.get('/urbanfarming/verifyemail', (req, res) => {
    insertIntoLayout(__dirname+"/pleaseVerify.html", (l)=>{
        res.write(l);
        res.end();
    });
})
app.get('/urbanfarming/verified', (req, res) => {
    insertIntoLayout(__dirname + "/thanksVerify.html", (l) => {
        res.write(l);
        res.end();
    });
})
