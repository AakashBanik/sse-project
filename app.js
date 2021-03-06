const express = require('express')
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');
const path = require('path');
const bodyParser = require('body-parser');
const redis = require('redis');

const client = redis.createClient({ url: process.env.REDIS_URL }); //enable this for heroku or any other paas deployment
// const client = redis.createClient({ host: process.env.REDIS_URL, port: 6379 }); //enable this for local, docker

client.on('error', (error) => {
    console.log(error);
});


require('./config/passport')(passport);


//use the first link for docker compose and the second one for mongodb atlas
//let mongoUrl = 'mongodb://' + process.env.MONGOHOST + '/' + process.env.MONGODATA + ':' + process.env.MONGOPORT + '/user'; //for docker based mongo deployment
let mongoUrl = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/user?retryWrites=true&w=majority" //for mongo atlas based deployment
let mongoUri = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/integrity?retryWrites=true&w=majority"

const app = express();
const PORT = process.env.PORT;

app.use(bodyParser.json());

//server static files
app.use('/js', express.static(path.join(__dirname + '/js')));

//mongodb
mongoose.connect(mongoUrl, { useNewUrlParser: true })
    .then(() => {console.log('Mongo Connected')})
    .catch((error) => { console.log(error) });

//ejs
app.use(expressLayouts);
app.set('view engine', 'ejs');

//bodyparser
app.use(express.urlencoded( { extended: false } ));

//express session 
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

//passport config
app.use(passport.initialize());
app.use(passport.session());

//flash
app.use(flash());

app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
})

//routes
app.use('/', require('./routes/index'));
app.use('/users', require('./routes/users'));


app.post('/', (req, res) => {
    console.log("Post triggered");
    res.setHeader('Content-Type', 'application/json');
    // var cookies = req.headers.cookie;
    // var splitCookie = cookies.split(';');
    // var cookie = 'abc';
    // splitCookie.forEach(element => {
    //     if (element.includes('connect.sid')) {
    //         cookie = element.split('=')[1];
    //     }
    // });
    // stores the values of the current logged in user to the redis (temp log service)
    client.set('user', req.user.name);
    client.set('ip', req.body.ip_address);
    client.set('country', req.body.country);
    client.set('latitude', req.body.latitude);
    client.set('longitude', req.body.longitude);
    client.set('loggedinAt', Date.now());
    // client.set('cookie', cookie);
});

app.listen(PORT, () => {
    console.log(`Server started at ${PORT}`);
});
