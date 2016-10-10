var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");
var livedata = require("../../Functions/Database/viewInformation")
var database = require("../../Functions/Database/checkAndCreate")



describe ("pimg page", () =>{
    var livedataurl = "http://localhost:4000/urbanfarming/livedata/";
    var insertdataurl = "http://localhost:4000/urbanfarming/data/";
    var url = "http://localhost:4000/urbanfarming/pimg/";

    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            request(url, (error, response, body)=>{
                if (error){
                    console.error(error)
                }
                expect(response.statusCode).to.equal(200);
                done();
            })
        })
        it ("AJAX works", ()  => {

        })
        it ("integrates well with data insertion without image", () => {

        })
        it ("integrates well with data insertion with image", () => {

        })
    })
})

