var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");
var livedata = require("../../Functions/Database/viewInformation")
var database = require("../../Functions/Database/checkAndCreate")
var general  = require("./general");



describe ("home page", () =>{

    var livedataurl = "http://localhost:4000/urbanfarming/livedata";
    var insertdataurl = "http://localhost:4000/urbanfarming/data";
    var homeurl = "http://localhost:4000/urbanfarming/";

    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            general.requestURL(homeurl, done);
        })

        it ("AJAX works", (done)  => {
            request(homeurl, (error, response, body)=>{
                setTimeout(function() {
                    console.log('Hopefully ajax will load within 3 seconds.');
                    expect(response.statusCode).to.equal(200);
                    expect( body ).to.contain("<td>");
                    done();
                }, 3000);
            })
        })
    })
})

