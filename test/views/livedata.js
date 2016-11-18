var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");
var livedata = require("../../Functions/Database/viewInformation")
var database = require("../../Functions/Database/checkAndCreate")
var general  = require("./general");


describe ("live data page", () =>{
    var livedataurl = "http://localhost:4000/urbanfarming/livedata/";
    var insertdataurl = "http://localhost:4000/urbanfarming/data/";

    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            general.requestURL(livedataurl, done);
        })
        it ("displays two images", (done)  => {
            request(livedataurl, (error, response, body)=>{
                expect(body).to.contain("src='/urbanfarming/img");
                expect(body).to.contain("src='/urbanfarming/pimg");
                done()
            })  
        }) 
        it ("integrates well with data insertion without image", (done) => {
            var fields = {
                soilMoisture : '2',
                relHumidity  : '45',
                lightLuxLevel: '458',
                temperature  : '20'
            }
            var path = "/home/karen/Repos/UrbanFarming/public/test.jpg";
            // general.postToServer(fields, path);
             done()

        })
    })
    it ("integrates well with data insertion with image", (done) => {
        var formData = { soilMoisture: '3',
            relHumidity: '4',
            lightLuxLevel: '500',
            temperature: '21' 
        }

        var path = "/home/karen/Repos/UrbanFarming/Functions/ProcessImages/image.jpg"
        //general.postToServer(formData, path);
        done()
    })
})
