var express = require('express');
var app = express();
var config = require('./config.js');
var expressJWT = require('express-jwt');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var request = require('request');

var oa = require('simple-oauth2')({
  clientID: config.TWITCH_CLIENT_ID,
  clientSecret: config.TWITCH_SECRET,
  site: 'https://www.twitch.tv/',
  tokenPath: '/kraken/oauth2/token',
  authorizationPath: '/kraken/oauth2/authorize'
});

// Authorization uri definition
var authorization_uri = oa.authCode.authorizeURL({
  redirect_uri: config.BASE_URL + '/auth/confirm',
  scope: 'user_read',
  state: config.TWITCH_STATE
});


// Allow anything in the 'static' dir
// url.com/js/main.js => static/js/main.js
app.use(express.static('static'));

var jwt_opts = {
    secret: config.JWT_SECRET,
    credentialsRequired: false,
    getToken: function(req) {
        if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
            return req.headers.authorization.split(' ')[1];
        } else if (req.cookies && req.cookies.auth !== undefined) {
            return req.cookies.auth;
        }
        return null;
    }
}

app.use(cookieParser());
app.use(expressJWT(jwt_opts).unless({ path: [/\/auth\/(.*)/, '/'] }));

app.get('/', function(req, res) {
    res.send('Hello from twitch live');
});

app.get('/auth/login', function(req, res) {
    res.redirect(authorization_uri)
});

app.get('/auth/confirm', function(req, res) {
    var code = req.query.code;
    
    // Should hold the info from before, but also pass in more info?
    oa.authCode.getToken({
        code: code,
        redirect_uri: config.BASE_URL + '/auth/confirm',
        client_id: config.TWITCH_CLIENT_ID,
        client_secret: config.TWITCH_SECRET,
        state: config.TWITCH_STATE
    }, saveToken);
    
    var token;
    function saveToken(error, result) {
        if (error) { console.log('Access Token Error', error.message); }
        token = oa.accessToken.create(result);
        
        //console.log('OUR TOKEN', token.token, result);
        // Get username via kraken
        var url = 'https://api.twitch.tv/kraken?oauth_token=' + token.token.access_token;
        request(url, function(error, response, body) {
            if (response.statusCode == 200 && !error) {
                var twitchUser = JSON.parse(body);
                
                // Store token in a cookie I guess, then redirect
                var jwtToken = jwt.sign({
                    sub: 1,
                    email: 'twitchlive@paimoe.com',
                    access: token.token.access_token,
                    username: twitchUser.token.user_name,
                }, config.JWT_SECRET);
                res.cookie('auth', jwtToken, { maxAge: 90000000, httpOnly: true });
                
                res.redirect('/loggedin');
            }
        })
    }
})

app.get('/loggedin', function(req, res) {
    // WE'd have to check the auth header here
    if (req.user === undefined) {
        // Redirect mainly
        res.status(401).send('Not logged in');
    } else {
        //console.log(req.get('authorization'));
        console.log(JSON.stringify(req.user));
        res.send('LOGGED IN AS ' + req.user.email + ' = ' + req.user.username);
        
        // Load their stuff
    }
})

app.listen(process.env.PORT || 3000, process.env.IP || "0.0.0.0", function () {
    console.log('Example app listening on port 3000!');
});