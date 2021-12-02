const express = require("express");
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');

const passport = require('passport');
const saml = require('passport-saml');
const fs = require('fs');

passport.serializeUser(function (user, done) {
    console.log('-----------------------------');
    console.log('serialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    console.log('-----------------------------');
    console.log('deserialize user');
    console.log(user);
    console.log('-----------------------------');
    done(null, user);
});

const samlStrategy = new saml.Strategy({
    callbackUrl: 'http://localhost/login/callback',
    entryPoint: 'http://localhost:8080/simplesaml/saml2/idp/SSOService.php',
    issuer: 'saml-poc',
    identifierFormat: null,
    decryptionPvk: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
    privateCert: fs.readFileSync(__dirname + '/certs/key.pem', 'utf8'),
    validateInResponseTo: false,
    disableRequestedAuthnContext: true
}, function (profile, done) {
    return done(null, profile);
});

const PORT = 4300;

const app = express();

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(session({
    secret: 'secret',
    resave: false,
    saveUninitialized: true,
}));

app.use(passport.initialize({}));
app.use(passport.session({}));

app.get('/', function (req, res) {
    res.send('Test Home Page');
});

app.get('/login',
    function (req, res, next) {
        console.log('-----------------------------');
        console.log('/Start login handler');
        next();
    },
    passport.authenticate(samlStrategy),
);

app.post('/login/callback',
    function (req, res, next) {
        console.log('-----------------------------');
        console.log('/Start login callback ');
        next();
    },
    passport.authenticate(samlStrategy),
    function (req, res) {
        console.log('-----------------------------');
        console.log('login call back dumps');
        console.log(req.user);
        console.log('-----------------------------');
        res.send('Log in Callback Success');
    }
);

app.get('/metadata',
    function (req, res) {
        res.type('application/xml');
        res.status(200).send(
            samlStrategy.generateServiceProviderMetadata(
                fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8'),
                fs.readFileSync(__dirname + '/certs/cert.pem', 'utf8')
            )
        );
    }
);

app.listen(PORT, function () {
    console.log('Listening on port %d', PORT)
});