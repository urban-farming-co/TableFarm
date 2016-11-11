var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");
var general  = require("./general");

var livedataurl = "http://localhost:4000/urbanfarming/livedata/";
var charturl = "http://localhost:4000/urbanfarming/chart/";
var insertdataurl = "http://localhost:4000/urbanfarming/data/";
var homeurl = "http://localhost:4000/urbanfarming/";

var today      = "2016-10-06" // new Date();
var yesterday  = "2016-10-05" // new Date(today);
// yesterday.setDate(today.getDate()-1);

var twoDaysAgo = "2016-10-04" // new Date(today);


function waitForResponse(formData, done){
    this.timeout = 30000000;
    request.post(charturl, { form:formData}, (err, response, body) => {
        if (err){
            console.error(err);
        }
        else {
            expect(response.statusCode).to.equal(200);
            done(response, body);
        }
    })

}

function expectDataToExist(body){
    var a = body.match(/data: \[ \d/g);
    expect(a).to.length(4, "The body should contain data " + a);
}

describe ("chart page", () =>{
    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            general.requestURL(charturl, done);
        })
        /*

        it ("You can enter a before date", (done)  => {
            formData = {before: today}
            waitForResponse(formData,(response, body)=> {    
                expect(body).to.contain(today);
                expectDataToExist(body);
                done()
            })
        })

        it ("you can enter an after date", (done) => {
            formData = {after: yesterday}
            waitForResponse(formData,(response, body)=> {    
                expect(body).to.contain(yesterday);
                expectDataToExist(body);
                done()
            })

        })

        it ("you can enter both an after date and a before date", (done) => {
            var a = twoDaysAgo ;
            var b = today ;
            // b.setDate(yesterday.getDate()-1);
            formData = {after: a, before:b}
            waitForResponse(formData,(response, body)=> {    
                expect(body).to.contain(a);
                expect(body).to.contain(b);
                expectDataToExist(body);
                done()
            })
        })
        */
    })
})

