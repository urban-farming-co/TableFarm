var vcapServices;

// For processes that are running in bluemix, use those 
// environment variables
//
if(process.env.VCAP_SERVICES){

    vcapServices = JSON.parse(process.env.VCAP_SERVICES);

} else {
    try {
        vcapServices = require('./VCAP_SERVICES.json');
    } catch (e) {
        console.error(er);
    }
}

module.exports = vcapServices;
