
function generateChart(callback, after, before){
    var sql = "SELECT * FROM "+ database.liveData;
    var f = true;
    if (!before && !after) {
        var sql = "SELECT * FROM "+ database.liveData + " WHERE id % 4=0" ;
        f = false;
    }
    if (after){
        var b = sql + " AND time > '" + after + "'";
        if (f){ 
            b = sql + " WHERE time > '" + after + "'";
            f = false;
        }
        sql = b;
    }
    if (before){
        var b = sql + " AND time < '" + before + "'";
        if (f){ 
            b = sql + " WHERE time > '" + after + "'";
        }
        sql = b
    }
    sql = sql +" ORDER BY id DESC LIMIT 255";
    fs.readFile('chart.html', 'utf-8', function( err, data) {
        var temp = [];
        var humi = [];
        var luxl = [];
        var soil = [];
        var labelData = [];
        database.askDatabase(sql , function(err, result) {
            for (var n =0; n<result.rowCount; n++ ){
                labelData.push(result.rows[n].time);
                temp.push(result.rows[n].temperature);    
                humi.push(result.rows[n].relhumidity);    
                luxl.push(result.rows[n].lightluxlevel);
                soil.push(result.rows[n].soilmoisture);
            };
            var c = data.replace('{{temp}}', JSON.stringify(temp));
            c = c.replace('{{labels}}',JSON.stringify(labelData));
            c = c.replace('{{humi}}', JSON.stringify(humi));
            c = c.replace('{{soil}}', JSON.stringify(soil));
            c = c.replace('{{luxl}}', JSON.stringify(luxl));
            if (after) {
                c = c.replace('{{after}}', JSON.stringify(after))
            } else {
                c = c.replace('{{after}}', JSON.stringify("the dawn of time"))
            }
            if (before) {
                c = c.replace('{{before}}', JSON.stringify(before))
            } else {
                c = c.replace('{{before}}', JSON.stringify("the end of time"))
            }
            callback(c)
        })
    })
}

