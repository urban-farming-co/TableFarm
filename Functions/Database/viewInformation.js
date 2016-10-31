module.exports = {
    getLastXRows,
    getHome,
    generateChartData,
    generatePlantChartData,
    getImageIDs
}


function getImageIDs(database, callback){
    sql = "SELECT id FROM " + database.liveData + " WHERE IMAGE IS NOT NULL";
    database.askDatabase(sql, (err, result) => {
        if (err) {
            console.error(err);
        }
        console.log(result);
        ids = []
        for (row in result.rows){
            console.log(row);
            ids.push(result.rows[row].id);
        }
        callback(ids);
    })

}

function generatePlantChartData(database, callback, after, before){
    sql = workOutSQL(database, database.processedData, "SELECT AVG(height) as height, AVG(width) as width, MIN(time) as time, AVG(greenscore) as score, MAX(livedateyo.id) FROM urbanfarming.livedateyo, urbanfarming.processedData WHERE livedateyo.id = processedData.id AND time > CURRENT_DATE - 60 GROUP BY time::DATE", after, before);

    var wid = [];
    var hei = [];
    var sco = [];
    var labelData = [];
    database.askDatabase(sql , function(err, result) {
        if (err){
            console.error(err);
        }
        console.log("the result is: ");
        console.log(result);
        for (var n =0; n<result.rowCount; n++ ){

            labelData.push(formatLabel(result.rows[n], n));
            w = parseInt(result.rows[n].width);
            h = parseInt(result.rows[n].height);
            s = parseInt(result.rows[n].score);
            wid.push(w || 0);    
            hei.push(h || 0);    
            sco.push(s || 0);
        }
        var e;
        e = afterAndBefore(after, before);
        console.log(e[0]);
        console.log(e[1]);
        console.log(e[2]);

        dict = { title      : e[2],
            score : sco,
            labels: JSON.stringify(labelData),
            width :wid,
            height : hei,
            after: e[0],
            before:e[1]
        }
        callback(null, dict);
    })
}


function workOutSQL(database, table,  noABsql, after, before){
    if (table == database.processedData){
        var sql = "SELECT height, width, time, greenscore as score, livedateyo.id FROM urbanfarming.livedateyo, urbanfarming.processedData WHERE livedateyo.id = processedData.id" ;

        var whereInStatement= true;
    }else {
        var sql = "SELECT * FROM "+ table;
        var whereInStatement= false;
    }
    if (!before && !after) {
        // Temp, Humi, light, soil
        sql = noABsql;
        sql = sql + " ORDER BY time ASC";
        whereInStatement= true;
    }else {
        console.log(after)
            console.log(before)
            if (typeof after !== 'undefined' && after){
                var b = sql + " AND time > '" + after + "'";
                if  (!whereInStatement){ 
                    b = sql + " WHERE time > '" + after + "'";
                    whereInStatement= true;
                }
                sql = b;
            }
        if (typeof before !== 'undefined' && before){
            var b = sql + " AND time < '" + before + "'";
            if  (!whereInStatement){ 
                b = sql + " WHERE time > '" + before + "'";
            }
            sql = b;
        }
        sql = sql + " ORDER BY time ASC";
    }
    return sql;
}

function formatLabel(result, n){
    return [n, 
    result.time.getFullYear(), 
    result.time.getMonth() + 1, 
    result.time.getDate(), 
    result.time.getHours(), 
    result.time.getMinutes(),  
    result.time.getSeconds(), 
    ]
}


function afterAndBefore(after, before){
    var e = "the dawn of time";
    var d = "the end of time";
    if (after) {
        e = JSON.stringify(after)
    }
    if (before) {
        d = JSON.stringify(before)
    }
    t = "chart";
    return [e, d, t];
}

function generateChartData(database, callback, after, before){
    sql = workOutSQL(database, database.liveData, "SELECT AVG(temperature) as temperature, AVG(relhumidity) as relhumidity, MIN(time) as time, AVG(lightluxlevel) as lightluxlevel, AVG(soilmoisture) as soilmoisture, MAX(id) FROM urbanfarming.livedateyo WHERE time > CURRENT_DATE -60 GROUP BY time::DATE", after, before);
    console.log(sql);
    var temp = [];
    var humi = [];
    var luxl = [];
    var soil = [];
    var labelData = [];

    console.log("HELLO");
    database.askDatabase(sql , function(err, result) {
        if (err){
            console.error(err);
        }
        console.log("the result is: ");
        console.log(result);
        for (var n =0; n<result.rowCount; n++ ){
            labelData.push(formatLabel(result.rows[n], n));
            t = parseInt(result.rows[n].temperature);
            h = parseInt(result.rows[n].relhumidity);
            l = parseInt(result.rows[n].lightluxlevel);
            m = parseInt(result.rows[n].soilmoisture);
            temp.push(t || 0);    
            humi.push(h || 0);    
            luxl.push(l || 0);
            soil.push(m || 0);
        };
        var e;

        e = afterAndBefore(after, before);

        dict = { title      : e[2],
            temp       : temp,
            labels     : JSON.stringify(labelData),
            humi       : humi,
            soil       : soil,
            luxl       : luxl,
            after      : e[0],
            before     : e[1]
        }
        console.log(dict);
        callback(err, dict)
    })

}
function formatDate(d){
    dd   =   ('0' + d.getDate()).slice(-2);
    mm   =   ('0' + (d.getMonth() + 1)).slice(-2);
    yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
}

function formatTime(t, o ){
    o = typeof o !== 'undefined' ? o: 0;
    hh = parseInt(t.getHours());
    hh = hh - parseInt(o);  
    hh = ('0' + hh.toString()).slice(-2); 
    mm = ('0' + t.getMinutes()).slice(-2) ;
    ss = t.getSeconds();
    time = `${hh}:${mm}`;
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
        "<td bgcolor= "+row.colour+"></td>"+
        "</tr>";
    return content;
}

function getLastXRows(x,database, callback)  {
    var content = "<table id='view'>" +
        "<tr>" +
        "<th>Image</th>"+  "<th>date</th>"+ "<th>time</th>"+ "<th>PlantName</th>"+ "<th>light lux level</th>"+ "<th>soilMoisture</th>"+ "<th>relative Humidity</th>"+ "<th>temperature</th>"+ "<th>Colour</th>" +
        "</tr>";
    var sql="SELECT "+database.table + ".id, " + database.table+ ".image, time, plantname, lightluxlevel, soilMoisture, relHumidity, temperature, "+
        database.processed+ ".colour "+
        " FROM "+ database.liveData + ", " + database.processedData +
        " Where "+ database.table + ".id  = " + database.processed +".id ORDER BY id DESC LIMIT " + x;
    database.askDatabase(sql, function(err, result) {
        if (err) {
            console.error(err);
            callback(err);
        }
        else {
            console.log(result);
            var N = result.rows.length;
            for (var n =0; n <N; n++){
                content = addRow(content, result.rows[n]) ;
            }
            content += "</table>" ;
            callback(null, content);
        }
    })
}


function getrgb(hex) {
    var result = hex.match(/^#?([\da-fA-F]{2})([\da-fA-F]{2})([\da-fA-F]{2})$/i);
    col = result ? { r: parseInt(result[1], 16),  g: parseInt(result[2], 16), b: parseInt(result[3], 16) } : {r:0, g:0, b:0};  
    return col ;
}


function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}


function getHome(o, database, callback)  {
    var sql="SELECT time, plantname, lightluxlevel, "+database.processed+ ".colour, soilmoisture, relhumidity, temperature, greenscore, width, height, compactness FROM "+database.liveData+" , " +database.processedData+" WHERE "+database.table+".id=(SELECT MAX(id) FROM "+database.liveData+") AND " +database.processed+".id = (SELECT MAX(id) FROM " + database.processedData +")";
    database.askDatabase (sql, function(err, result){

        if (err) {
            console.error(err); 
            callback(err)
        }
        var row = result.rows[0];
        date = formatDate(row.time);
        time = formatTime(row.time, o);
        var rgb = getrgb(row.colour); 
        var rgbf = rgbToHex(255 - rgb.r, 255 - rgb.g, 255 - rgb.b);

        row.green= rgb.g;
        row.blue= rgb.b;
        row.red = rgb.r;
        row.time = time;
        row.date = date;
        
        callback(null, row);


    })
}

