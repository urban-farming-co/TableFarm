module.exports = {
    getLastXRows,
    getLast1Row,
    getHome,
    generateChartData,
    generatePlantChartData,
    generateDeviceChartData,
    remove,
    getImageIDs
}

function remove(database, x, callback){
    sql1 = "UPDATE " + database.liveData + 
        " SET image = NULL WHERE id = " + x;
    sql2 = "DELETE FROM " + database.processedData +
        " WHERE id = " + x;
    database.askDatabase(sql1, (err, result1) =>{
        if (err){
            callback(err);
        }
        database.askDatabase(sql2, (err, result2) =>{
            if(err){
                callback(err);
            }
            callback(null);
        })
    })

}
function getDeviceImageIDs(database, deviceID, callback){
    sql = "SELECT id FROM " + database.liveData + " WHERE IMAGE IS NOT NULL AND deviceid = " +deviceID +" ORDER BY id DESC";
    database.askDatabase(sql, (err, result) => {
        if (err) {
            console.error(err);
            callback(err);
        }
        console.log(result);
        ids = []
            for (row in result.rows){
                console.log(row);
                ids.push(result.rows[row].id);
            }
        callback(null, ids);
    })
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

function generatePlantChartData(database, after, before, callback){
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

function generateDeviceChartData(database, device, callback){
    sql1 = "SELECT AVG(greenscore) as greenscore, "+
        " AVG(width) as width, " + 
        "AVG(temperature) as temperature, "  + 
        "AVG(relhumidity) as relhumidity, " +
        "MIN(time) as time, " +
        "AVG(lightluxlevel) as lightluxlevel, "+
        "AVG(soilmoisture) as soilmoisture, "+
        " AVG(height) as height " +
        " FROM " + database.liveData + " LEFT JOIN " + database.processedData + " ON (" + database.processed+".id = " + database.table + ".id )" +
        " WHERE time > (CURRENT_DATE -30) "+

        " AND "+  database.table +".deviceid = " + device+
        " GROUP BY time::DATE "+
        " ORDER BY time DESC" ; 
    database.askDatabase(sql1, (err, results)=>{
        if (err){
            console.log(err);
            callback(err);
        }
        else{
            temp = [];
            soil = [];
            humi = [];
            luxl = [];
            width = [];
            height = [];
            green = [];
            labelData = [];
            console.log(results);
            for (var n =0; n<results.rowCount; n++ ){
                labelData.push(formatLabel(results.rows[n], n));
                t = parseInt(results.rows[n].temperature);
                h = parseInt(results.rows[n].relhumidity);
                l = parseInt(results.rows[n].lightluxlevel);
                s = parseInt(results.rows[n].soilmoisture);
                g = parseInt(results.rows[n].greenscore);
                w = parseInt(results.rows[n].width);
                h1 = parseInt(results.rows[n].height);

                temp.push(t || 0);
                humi.push(h || 0);
                luxl.push(l || 0);
                soil.push(s || 0);
                width.push(w || 0);
                green.push(g || 0);
                height.push(h1 || 0);
            }
            var contents = {
                title : "You're chart",
                height: height,
                width : width,
                score : green,
                temp : temp,
                humi : humi,
                soil : soil,
                labels: JSON.stringify(labelData),
                luxl : luxl
            }
            callback(null, contents);
        }
    })
}

function generateChartData(database, after, before, callback){
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
        try{
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
            callback(err, dict);
        }
        catch (e){

            dict = { title      : "no",
                temp       :  "no",
                labels     : "no",
                humi       : "no",
                soil       : "no",
                luxl       : "no",
                after      : "no",
                before     : "no",
            }
            console.log(dict);
            callback(e, dict);

        }

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
function addRow(row) {
    c ={ 
        id : row.id.toString(),
        date: formatDate(row.time),
        time: formatTime(row.time),
        lightluxlevel: row.lightluxlevelux,
        soilmoisture: row.soilmoisture,
        relhumidity: row.relhumidity,
        temperature: row.temperature,
        colour: row.colour
    }
    console.log(c);
    return c;
}

function getLast1Row(u,database, callback)  {
    /*
       var sql="SELECT "+database.table + ".id, time, lightluxlevel, soilMoisture, relHumidity, temperature, "+
    // database.userTable+ ".id " +
    database.processed+ ".colour "+
    " FROM "+ database.liveData + ", " + database.processedData + 
    // ", " +  database.userTable +
    " Where "+ database.table + ".id  = " + database.processed +".id "+
    " GROUP BY "+ database.table +".id "  +
    " HAVING "+database.table+".id = MAX ("+database.table+".id)" +
    // " AND " + database.user +".id = " + u +
    "ORDER BY id DESC LIMIT 1";
    */
    var sql1 =`SELECT id,deviceid, time, lightluxlevel, soilMoisture, relHumidity, temperature FROM ${database.liveData} WHERE deviceid=${u} ORDER BY id DESC LIMIT 1` ;
    database.askDatabase(sql1, function(err, result) {
        if (err) {
            console.error(err);
            callback(err);
        }
        else {
            console.log(result);
            if (result.rows.length ===0){
                callback("no rows to return", null);
            } else {
                getDeviceImageIDs(database, u, (err, ids) =>{
                    if(err){
                        callback(err);
                    }
                    else{
                        console.log(ids);
                        mostRecentImageID = ids.shift(); // the list is sorted, this will be the top entry.
                        var sql2 =`SELECT compactness, greenscore, width, height, colour FROM ${database.processedData}  WHERE id=${mostRecentImageID}` ;
                        var content = {
                            id:             result.rows[0].id,
                            time:           result.rows[0].time, 
                            relhumidity:    result.rows[0].relhumidity,
                            lightluxlevel:  result.rows[0].lightluxlevel,
                            soilmoisture:   result.rows[0].soilmoisture,
                            temperature:    result.rows[0].temperature}

                        database.askDatabase(sql2, function(err, result2) {
                            if (err) {
                                console.error(err);
                                callback(err);
                            }
                            else {
                                if (result2.rows.length >0){

                                    console.log(result2);

                                    content["width"] = result2.rows[0].width;
                                    content["height"] = result2.rows[0].height;
                                    content["colour"] = result2.rows[0].colour;
                                    content["greenscore"] = result2.rows[0].greenscore;

                                }
                                callback(null, content );
                            }
                        })
                    }
                })
            }
        }
    })
};
function getLastXRows(x,database, callback)  {
    var sql="SELECT "+database.table + ".id, time, lightluxlevel, soilMoisture, relHumidity, temperature, "+
        database.processed+ ".colour "+
        " FROM "+ database.liveData + ", " + database.processedData +
        " Where "+ database.table + ".id  = " + database.processed +".id ORDER BY id DESC LIMIT " + x;
    var content= [];
    database.askDatabase(sql, function(err, result) {
        if (err) {
            console.error(err);
            callback(err);
        }
        else {
            console.log(result);
            var N = result.rows.length;
            for (var n =0; n <N; n++){
                t = addRow(result.rows[n]);
                content.push(t);
            }
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
    var sql="SELECT time, lightluxlevel, "+database.processed+ ".colour, soilmoisture, relhumidity, temperature, greenscore, width, height, compactness FROM "+database.liveData+" , " +database.processedData+" WHERE "+database.table+".id=(SELECT MAX(id) FROM "+database.liveData+") AND " +database.processed+".id = (SELECT MAX(id) FROM " + database.processedData +")";
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

