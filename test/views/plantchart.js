var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../server");


var livedataurl = "http://localhost:4000/urbanfarming/livedata/";
var charturl = "http://localhost:4000/urbanfarming/plantchart/";
var insertdataurl = "http://localhost:4000/urbanfarming/data/";
var homeurl = "http://localhost:4000/urbanfarming/";

var today      = "2016-10-06" // new Date();
var yesterday  = "2016-10-05" // new Date(today);
// yesterday.setDate(today.getDate()-1);

var twoDaysAgo = "2016-10-04" // new Date(today);


function waitForResponse(formData, done){
    this.timeout = 30000000;
    console.log(formData);
    console.log(done);
    request.post(charturl, { form:formData}, (err, response, body) => {
        if (err){
            console.error(err);
        }
        else {
            console.log(response.statusCode);
            console.log(body); 
            expect(response.statusCode).to.equal(200);
            done(response, body);
        }
    })

}

function expectDataToExist(body){
    var a = body.match(/data: \[ \d/g);
    console.log(a);
    expect(a).to.length(3, "The body should contain data " + a);
}

describe (" plant chart page", () =>{
    describe("the website works.", () => {
        it ("locally returns status 200", (done) =>{
            this.timeout = 30000000;
            setTimeout(function () {
                request.get(charturl, (error, response, body)=>{
                    if (error) {
                        console.error(error);
                    }
                    expect(response.statusCode).to.equal(200);
                    done();
                })
            }, 300);
            console.log(" ");
        })

        it ("You can enter a before date", (done)  => {
            formData = {before: today}
            console.log(" ");
            waitForResponse(formData,(response, body)=> {    
                console.log(body);
                expect(body).to.contain(today);
                console.log(" ");
                expectDataToExist(body);
                done()
            })
        })

        it ("you can enter an after date", (done) => {
            formData = {after: yesterday}
            console.log(" ");
            waitForResponse(formData,(response, body)=> {    
                expect(body).to.contain(yesterday);
                console.log(" ");
                expectDataToExist(body);
                done()
            })

        })

        it ("you can enter both an after date and a before date", (done) => {
            var a = twoDaysAgo ;
            var b = today ;
            // b.setDate(yesterday.getDate()-1);
            formData = {after: a, before:b}
            console.log(done);
            waitForResponse(formData,(response, body)=> {    
                expect(body).to.contain(a);
                expect(body).to.contain(b);
                console.log(" ");
                expectDataToExist(body);
                done()
            })
        })
    })
})

