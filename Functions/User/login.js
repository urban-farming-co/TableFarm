var express   = require('express');
var passport  = require('passport');
var Strategy = require('passport-local').Strategy;


var app = express();
/* All functionality to do with login in should go here. */

module.exports = {app};

passport.use(new Strategy(
            function(username, password, done) {
                User.findOne({ username: username }, function (err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    if (!user.verifyPassword(password)) { return done(null, false); }
                    return done(null, user);
                });
            }
            ));



app.get('/', (req, res) => {
    // if logged in, go to dashboard
    //
    // else go to login page
    res.redirect(301,  "/urbanfarming/user/login/");
})
app.post('/register', (req, res) => {
    res.render("dataReceieved", {title: "Register", contents: "New registration"});
})

app.post('/login', (req, res) => {
    res.render("dataReceieved", {title: "Login", contents: "Login credentials"});
})

app.get('/register', (req, res) => {
    res.render("register", {title: "Register"});
})

app.get('/login', (req, res) => {
    res.render("login", {title: "Login"});
})
app.get('/dashboard', require('connect-ensure-login').ensureLoggedIn(),
        function(req, res){

            // get the game url
            var index = '<iframe src="http://zap.pm/game/57d96ed87dfb28e51e95f50b/play" width="480" height="365" allowfullscreen></iframe><br> Keep your plant safe from the salt!';
            // get the table info.
            tableStuff.getHome( 1, database, (err, content)=>{
                if (err){
                    res.render("error", {title:"something went wrong", error:err});
                }else{
                    tableStuff.generateChartData(database,null, null, (err, dict) => {
                        if (err) {
                            res.render("error", {title:"something went wrong", error:err});
                        }else{
                            res.render("userHome", {title: "Welcome", user:"karen", game:index, row:content, dict});
                        }
                    })
                }
            })
        })
