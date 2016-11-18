var request = require("request");
var expect  = require("chai").expect;
var fs = require("fs");

var livedataurl = "http://localhost:4000/urbanfarming/livedata/";
var insertdataurl = "http://localhost:4000/urbanfarming/data/";

module.exports = { requestURL, postToServer }
function requestURL(url, done){
    request.get(url, (error, response, body)=>{
        if (error) {
            console.error(error);
        }
        expect(response.statusCode).to.equal(200);
        done();
    })
}

function postToServer(fields, path) {
    var stats = fs.statSync(path);
    var size = stats["size"];
    var file = JSON.stringify({
        _attachments: {
            path: {
                follows: true, 
                length: size, 
                'content_type': 'image/*', 
                                        }
                                        }
                                        });

                                                                                                          request({
                                                                                                          method:"POST",
                                                                                                          preambleCRLF:true,
                                                                                                          postambleCRLF:true,
                                                                                                          uri: "http://localhost:4000/urbanfarming/data/",
                                                                                                          multipart:[
                                                                                                          {
                                                                                                          'content-type':'application/json',
                                                                                                          body: file
                                                                                                          }, 
                                                                                                          ] 
                                                                                                          }, (err, response, body)=>{ 
                                                                                                          if (err){
                                                                                                          console.error(err);
                                                                                                          }
                                                                                                          expect(response.statusCode).to.equal(200);
                                                                                                          request(livedataurl, (error, response, body) => {
                                                                                                          if (error){
                                                                                                          console.error(err);
                                                                                                          }
                                                                                                          expect(body).to.contain(fields["soilMoisture"]);
                                                                                                          expect(body).to.contain(fields["relHumidity"]);
                                                                                                          expect(body).to.contain(fields["lightLuxLevel"]);
                                                                                                          expect(body).to.contain(fields["temperature"]);
                                                                                                          done();
                                                                                                          })
                                                                                                          })
                                                                                                          }
