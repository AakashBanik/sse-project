const express = require('express')
const expressLayouts = require('express-ejs-layouts');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require('passport');

require('./config/passport')(passport);


//use the first link for docker compose and the second one for mongodb atlas
//let mongoUrl = 'mongodb://' + process.env.MONGOHOST + '/' + process.env.MONGODATA + ':' + process.env.MONGOPORT + '/user';
let mongoUrl = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/user?retryWrites=true&w=majority"

const app = express();
const PORT = process.env.PORT || 8080;

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

app.listen(PORT, () => {
    console.log(`Server started at ${PORT}`);
});