var express   = require('express');
var passport  = require('passport');

app = express();
/* All functionality to do with login in should go here. */


passport.use(new LocalStrategy(
            function(username, password, done) {
                User.findOne({ username: username }, function (err, user) {
                    if (err) { return done(err); }
                    if (!user) { return done(null, false); }
                    if (!user.verifyPassword(password)) { return done(null, false); }
                    return done(null, user);
                });
            }
            ));


function login(){
    passport.authenticate('local', { failureRedirect: '/login' }),
    function(req, res) {
        res.redirect('/');
    });
}




app.post('/urbanfarming/register', (req, res) => {
    res.render("dataReceieved", {title: "Register", contents: "New registration"});
})

app.post('/urbanfarming/login', (req, res) => {
    res.render("dataReceieved", {title: "Login", contents: "Login credentials"});
})

app.get('/urbanfarming/register', (req, res) => {
    res.render("register", {title: "Register"});
})

app.get('/urbanfarming/login', (req, res) => {
    res.render("login", {title: "Login"});
})
app.get('/urbanfarming/dashboard', require('connect-ensure-login').ensureLoggedIn(),
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
