console.error('Starting');
var path    = require ('path');
var cons    = require('consolidate');
var formidable = require('formidable');
var cors    = require('express-cors');
var vcapServices = require('./vcapServices');
var fs      = require('fs');
var express = require('express');
var exphbs  = require('express-handlebars');
var passport  = require('passport');
var database  = require('./Functions/Database/checkAndCreate.js');
var tableStuff  = require('./Functions/Database/viewInformation.js');
var imageStuff = require('./Functions/ProcessImages/process_images.js');
var util = require('util');
var spawn   = require('child_process').spawn;




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

app.use("/urbanfarming/scripts", express.static(path.join(__dirname, 'views/scripts')));
app.use("/urbanfarming/scripts/", express.static('views/scripts'));

app.use("/urbanfarming/styles", express.static(path.join(__dirname, 'views/styles')));
app.use("/urbanfarming/styles/", express.static('views/styles'));
app.use("/urbanfarming/model/skins/transparent_light", express.static('views/minimal/skins/transparent_light'));
app.use("/urbanfarming/model/skins/transparent_dark", express.static('views/minimal/skins/transparent_dark'));
app.use("/urbanfarming/model/skins/minimal_light", express.static('views/minimal/skins/minimal_light'));
app.use("/urbanfarming/model/skins/minimal_dark", express.static('views/minimal/skins/minimal_dark'));
app.use("/urbanfarming/model/skins/icons", express.static('views/minimal/skins/icons'));
app.use("/urbanfarming/model/skins/light", express.static('views/minimal/skins/light'));
app.use("/urbanfarming/model/js/", express.static('views/minimal/js'));
app.use("/urbanfarming/model/stylesheet/", express.static('views/minimal/stylesheet'));
app.use("/urbanfarming/model/models/multires/", express.static('views/models/multires'));
app.use("/urbanfarming/model/models/singleres/", express.static('views/models/singleres'));
app.use("/urbanfarming/model/skins/dark", express.static('views/minimal/skins/dark'));
app.use("/urbanfarming/model/skins/backgrounds", express.static('views/minimal/skins/backgrounds'));


app.get('/urbanfarming/scripts/:file', function(req, res) {
    console.log(req.params);    
    res.sendFile(__dirname + "/views/scripts/" + req.params.file);
})
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

app.engine('html', cons.ejs);
app.set('views',__dirname + "/views");
// app.engine('handlebars', exphbs);
app.set('view engine', 'html');


database.checkTablesExist();



function processChartForm(req, res, callback){
    var form = new formidable.IncomingForm();
    form.parse(req, function(err, fields, files) {
        console.log(fields);
        callback( fields.after, fields.before);
        console.log(fields.after);
        console.log(fields.before);
    })
}

function insertIntoLayout(file, callback){
    fs.readFile(file, 'utf8', function(err, index){
        if (err) {
            console.error(err);
        }
        else {
            index= index.toString();
            fs.readFile('views/layout.html', 'utf8', function(err, layout) {;
                if (err) {
                    console.error(err);
                }else {
                    layout  = layout.replace('{{content}}', index );
                    callback(layout);
                }

            })
        }
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
function createStereoModel(){
    spawnProcess = spawn("python", ["Functions/ProcessImages/ideas/createStereo.py", "public/left.jpg", "public/right.jpg"]);
    spawnProcess.stdout.on("data", function(data){
        console.log("GOT DATA");
        d = data.toString();
        console.log(d);
    })

    spawnProcess.stderr.on('data', function(data) {
        console.log("GOT AN ERROR");
        console.log(data.toString('utf8'));
    })

    spawnProcess.on('close', function(code) {
        console.log("child process exited with a code: "+ code);
    })
}

function processStereoForm(req, res, callback){
    var i = 0;
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        console.log(files);
        console.log(files[0]);
        console.log(files[1]);
        var temp_path = files.left.path;
        var new_location = "public/left.jpg";
        fs.createReadStream(temp_path).pipe(fs.createWriteStream( new_location) );

        var temp_path = files.right.path;
        var new_location = "public/right.jpg";
        fs.createReadStream(temp_path).pipe(fs.createWriteStream( new_location) );

        createStereoModel();
        callback( files.left, files.right);
    })
}

function processGameForm(req, res, callback){
    var i = 0;
    var form = new formidable.IncomingForm();

    form.parse(req, function(err, fields, files) {
        callback(util.inspect({fields:fields}));
    })
}

app.get('/urbanfarming/model', (req, res) => {
    res.render("model", {title:"model", left:"../public/left.jpg", right:"../public/right.jpg", disparity:"../public/disparity.jpg", model:"../public/out.ply"});  // model");   
})
app.post('/urbanfarming/twoimages', (req, res) => {
    processStereoForm(req, res, (c)=> {
        res.render("dataReceieved", {title: "two images", contents: "Left image and right image"});
    })
})

app.post('/urbanfarming/data', function(req, res){
    database.processDataUpload(req, res, formidable, imageStuff, (c) => {
        res.render("dataReceieved", {title: "Upload Complete", contents: c});
    })
})

app.post('/urbanfarming/chart', function(req, res) {
    console.log("post");
    processChartForm(req, res, (a, b) =>{
        tableStuff.generateChartData(database, (err, c) => {
            console.log(c);
            res.render("chart", c)},a,b);      
    })
})


app.post('/urbanfarming/plantchart', function(req, res) {
    console.log("post");
    processChartForm(req, res, (a, b) =>{
        tableStuff.generatePlantChartData(database, (err, c) => {
            console.log(c);
            res.render("plantChart", c)},a,b);      
    })
})

app.get('/', function (req, res) {
    res.redirect(301,  "/urbanfarming/");
})

app.get('/urbanfarming/data', (req, res) => {
    res.render("form");
});

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
            /*insertIntoLayout(__dirname + "/views/process.html", (index) => {  
              c = index.replace("{{image}}", "/urbanfarming"+ file); 
              c = c.replace("{{imageO}}", "/urbanfarming" + fileName);
              c = c.replace("{{score}}", score);
              res.write(c);
              res.end();
              });
              */
            res.render("process", {
                title:"Processed Image",
                image:`/urbanfarming${file.toString()}`,
                imageO:`/urbanfarming${fileName}`,
                score: score
            });
        })
    })
})

app.get('/urbanfarming/slides', (req, res) => {
    tableStuff.getImageIDs(database, (ids) =>{
        console.log(ids);
        res.render("carosel", {title:"timelapse", ids:ids});
    })
})

app.get('/urbanfarming/viewcontent', (request, response) => {
    var x = request.query.x;
    var u = request.query.u;

    if (u && u.substr(-1) == '/'){
        u = u.substr(0, u.length -1);
        u = parseInt(u);
    }
    if (!u) 
    {
        u =10;
    }
    if (x && x.substr(-1) == '/'){
        x = x.substr(0, x.length -1);
        x = parseInt(x);
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
        console.log("The variable u is:");
        console.log(u);
        console.log("The variable x is:");
        console.log(x);
            response.writeHead(200, {
                'Content-Type'  : 'text/html', 
                'Content-Length': Buffer.byteLength(content)});
            response.write(content);
        }
    })
})

app.get('/urbanfarming/api/getUserPlantDetails', (req, res) =>{
    
    var u = req.query.u;

    if (u && u.substr(-1) == '/'){
        u = u.substr(0, u.length -1);
        u = parseInt(u);
    }
    if (!u) 
    {
        u =10;
    }
    tableStuff.getLast1Row(u, database, (err, content) => {
        if (err) {
            res.write(err);
            res.end();
        }
        else {
        console.log("The variable u is:");
        console.log(u);
        console.log("The variable x is:");
        console.log(1);
        res.setHeader("Content-Type", "application/json");
        res.send(JSON.stringify(content));
        }
    })
})

app.get('/urbanfarming/view', (request, response) => {
    response.sendFile(__dirname + "/views/view.html", () =>{
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
            res.end();
        }else{
            res.render("liveData", {row:content});
        }
    });
})

app.get('/urbanfarming/game', (req, res) => {
    var index ='<iframe src="http://zap.pm/game/55ae4e2b7dfb285122934106/play" width="480" height="365" allowfullscreen></iframe><br> <a href="http://zap.pm/game/55ae4e2b7dfb285122934106" target=_blank>Tank Battle by roger on ZAP<br> Remix to add your own pictures and settings!</a> - See more at: http://zap.pm/game/55ae4e2b7dfb285122934106#sthash.Ptk8wWfG.dpuf';
    //res.writeHead(200, {
    //    "Content-Type": "text/plain"
    //});
    res.render("layout", {title: "possible game",
        content:index});
})


app.get('/urbanfarming/plantchart', (req, res) => {
    console.log("get");
    tableStuff.generatePlantChartData(database, (err, dict) => {
        res.render("plantChart", dict);
    })
})
app.get('/urbanfarming/chart', (req, res) => {
    console.log("get");
    tableStuff.generateChartData(database, (err, dict) => {
        res.render("chart", dict);
    })
})
app.get('/urbanfarming/verifyemail', (req, res) => {
    res.render("pleaseVerify", {title: "Please check your email"});
})
app.get('/urbanfarming/verified', (req, res) => {
    res.render("thanksVerify", {title: "Thank you"});
})

app.get('/urbanfarming/twoimages', (req, res) => {
    res.render("twoImages", {title: "two images"});
})

app.get('/urbanfarming/login', (req, res) => {
    res.render("login", {title: "login"});
})
app.get('/urbanfarming/register', (req, res) => {
    res.render("register", {title: "register"});
})

app.get('/urbanfarming/userHome', (req, res) => {
    res.render("userHome", {title: "userHome"});
})


app.use('', (err, req, res, next) =>{
    res.render('404', {title: "500", status:err.status || 500, url:err});
});
app.use('', (req, res, next) =>{
    res.render('404', {title: "404", status:404, url:req.url});
});
