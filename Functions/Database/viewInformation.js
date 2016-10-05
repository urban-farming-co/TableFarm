module.exports = {
    getLastXRows,
    getHome,
    generateChartData,
}

function generateChartData(database, callback, after, before){
    var sql = "SELECT * FROM "+ database.liveData;
    var f = true;
    if (!before && !after) {
        // Temp, Humi, light, soil
        var sql = "SELECT AVG(temperature) as temperature, AVG(relhumidity) as relhumidity, MIN(time) as time, AVG(lightluxlevel) as lightluxlevel, AVG(soilmoisture) as soilmoisture, MAX(id) FROM urbanfarming.livedateyo WHERE temperature IS NOT NULL AND relhumidity IS NOT NULL and lightluxlevel IS NOT NULL and  time > CURRENT_DATE -60 GROUP BY time::DATE";
        f = false;
    }else {
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
    }
    sql = sql + " ORDER BY time ASC LIMIT 10";
    var temp = [];
    var humi = [];
    var luxl = [];
    var soil = [];
    var labelData = [];

    database.askDatabase(sql , function(err, result) {
        if (err){
            console.error(err);
        }

        console.log(result)
        for (var n =0; n<result.rowCount; n++ ){
            labelData.push([n, 
                    result.rows[n].time.getFullYear(), 
                    result.rows[n].time.getMonth() + 1, 
                    result.rows[n].time.getDate(), 
                    result.rows[n].time.getHours(), 
                    result.rows[n].time.getMinutes(),  
                    result.rows[n].time.getSeconds(), 
            ]);
            temp.push(parseInt(result.rows[n].temperature));    
            humi.push(parseInt(result.rows[n].relhumidity));    
            luxl.push(parseInt(result.rows[n].lightluxlevel));
            soil.push(parseInt(result.rows[n].soilmoisture));
        };
        var e = "the dawn of time";
        var d = "the end of time";
        if (after) {
            e = JSON.stringify(after)
        }
        if (before) {
            d = JSON.stringify(before)
        }
        t = "chart"
            dict = { title      : t,
                temp       : temp,
                labels     : JSON.stringify(labelData),
                humi       : humi,
                soil       : soil,
                luxl       : luxl,
                after      : e,
                before     : d
            }
        console.log(dict);
        callback(dict)
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
        "<td bgcolor= "+row.colour+"</td>"+
        "</tr>";
    return content;
}

function getLastXRows(x,database, callback)  {
    var content = "<table id='view'>" +
        "<tr>" +
        "<th>Image</th>"+  "<th>date</th>"+ "<th>time</th>"+ "<th>PlantName</th>"+ "<th>light lux level</th>"+ "<th>soilMoisture</th>"+ "<th>relative Humidity</th>"+ "<th>temperature</th>"+ "<th>Colour</th>" +
        "</tr>";
    var sql="SELECT * FROM "+ database.liveData +" LIMIT " + x;
    database.askDatabase(sql, function(err, result) {
        if (err) {
            console.error(err);
            callback(err);
        }
        else {
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
        // content +="<th>                   </th><td><img src='http://tablefarm.co.uk/urbanfarming/img?f=1/' /> <img src='http://tablefarm.co.uk/urbanfarming/pimg?f=1/' /> </td>        </tr>"+

        var content = "<h3>Green Fingers Score:"+row.greenscore+"</h3>";
        content +="<img width=100 src='/urbanfarming/img?f=1/' /> <img width=100 src='/urbanfarming/pimg/' /> "+
            "<table id='data-plant'><tr>"+
            "<tr><th>Plant name:          </th><td>" +row.plantname+                 "</td></tr>"+
            "<tr><th>Date:                </th><td id='date' >" +date+               "</td></tr>"+
            "<tr><th>Time:                </th><td id='time'>" +time+                "</td></tr>"+
            "<tr><th>Green Fingers Score: </th><td> " +row.greenscore +              " </td></tr>" + 
            "<tr><th>Plant Width:         </th><td> " +row.width +                   " </td></tr>" + 
            "<tr><th>Plant Height:        </th><td> " +row.height +                  " </td></tr>" + 
            "<tr><th>Plant Compactness:   </th><td> " +row.compactness +             " </td></tr>" + 
            "<tr><th>Plant Colour composition:</th><td  bgcolor='"+row.colour+"'><font color='white'> red="+rgb.r+" green = "+rgb.g+", blue="+rgb.b+"</font></td>               </tr>"+    
            "</table>"  +
            "<h3>Environment Variables</h3>" +
            "<table id='data-environment'>" +
            "<tr><th>Lighting lux level:  </th><td>" +row.lightluxlevel+" lux" +     " </td></tr>"+
            "<tr><th>Soil Moisture:       </th><td>" +row.soilmoisture+"%"+           "</td></tr>"+
            "<tr><th>Relative Humidity:   </th><td>" +row.relhumidity+"%"+            "</td></tr>"+
            "<tr><th>Ambient temperature: </th><td>" +row.temperature+"C"+            "</td>";
        content+= "</tr></table>";
        callback(null, content);
    })
}

