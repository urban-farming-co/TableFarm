var expect   = require("chai").expect
var fs       = require("fs");
var request  = require("request");
var server   = require("../../../server");
var livedata = require("../../../Functions/Database/viewInformation")
var database = require("../../../Functions/Database/checkAndCreate")

describe ("getHome()", () =>{
    it ("The function creates code to display two images", ()  => {
        livedata.getHome(0, database, (err, content)=>{
            if (err){
                console.error(err);
            }
            console.log(content);
            expect(content).to.contain("src='/urbanfarming/img");
            expect(content).to.contain("src='/urbanfarming/pimg");
        })  
    })
})
