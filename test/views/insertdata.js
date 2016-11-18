var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");
var livedata = require("../../Functions/Database/viewInformation")
var database = require("../../Functions/Database/checkAndCreate")
var general  = require("./general");



describe ("I can insert data", () =>{
    var insertdataurl = "http://localhost:4000/urbanfarming/data/";
    var livedataurl = "http://localhost:4000/urbanfarming/livedata/";

    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            general.requestURL(insertdataurl, done);
        })
        it ("integrates well with live data  without image", (done) => {
            var formData = { soilMoisture: '2',
                relHumidity: '45',
                lightLuxLevel: '458',
                temperature: '20' }

            var path = "/home/karen/Repos/UrbanFarming/public/test.jpg"
            // general.postToServer(formData, path);
            done();
        })
        it ("integrates well with live data image", (done) => {
            var formData = { soilMoisture: '3',
                relHumidity: '4',
                lightLuxLevel: '500',
                temperature: '21' 
            }

            var path = "/home/karen/Repos/UrbanFarming/Functions/ProcessImages/image.jpg";           
            // general.postToServer(formData, path);
            done();
        })
    })
})

/*
   var liveurl = "http://www.tablefarm.co.uk/urbanfarming/livedata";
   describe("the production website works.", () => {
   it ("online returns status 200", () =>{
   request(liveurl, (error, response, body)=>{
   response.statusCode.to.equal(200);
   done();
   })
   })
   it ("displays two images", ()  => {
   request(liveurl, (error, response, body)=>{
   expect(body).to.contain("src='/urbanfarming/img")
   expect(body).to.contain("src='/urbanfarming/pimg")
   } )  

   })
   })
   */
