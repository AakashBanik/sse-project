const express = require('express');
const router = express.Router();
const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const redis = require('redis');
const MongoClient = require('mongodb').MongoClient;
const { ensureAuth } = require('../config/auth');
const axios = require('axios');
const request = require('request');
const passwordValidator = require('password-validator');

let schema = new passwordValidator();

schema
.is().min(8)                                    // Minimum length 8
.is().max(100)                                  // Maximum length 100
.has().uppercase()                              // Must have uppercase letters
.has().lowercase()                              // Must have lowercase letters
.has().digits(2)                                // Must have at least 2 digits
.has().not().spaces()                           // Should not have spaces
.is().not().oneOf(['123456','Password','password','654321','Password123', 'password123']); // Blacklist these values


let mongoUri = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/integrity?retryWrites=true&w=majority";
let mongoUrl = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/user?retryWrites=true&w=majority";
const client = redis.createClient({ url: process.env.REDIS_URL }); //for heroku
// const client = redis.createClient({ host: process.env.REDIS_URL, port: 6379 }); //for local, docker


client.on('error', (error) => {
    console.log(error);
});


//login page
router.get('/login', (req, res) => {
    res.render('login');
});

//register page
router.get('/register', (req, res) => {
    res.render('register');
});

router.post('/register', (req, res) => {
    // console.log(req.body);

    const { name, email, password, password2, phone } = req.body;

    let errors = [];

    if (!name || !email || !password || !password2 || !phone) {
        errors.push({ msg: 'Please fill in all fields' });
    }

    if (password != password2) {
        errors.push({ msg: "Passwords not equal" });
    }

    if (schema.validate(password)) {
        errors.push({ msg: "Please use a different password" });
    }

    if (errors.length > 0) {
        res.render('register', {
            errors,
            name,
            email,
            password,
            password2,
            phone
        });
    } else {
        //validation passed
        User.findOne({ email: email })
            .then(user => {
                if (user) {
                    //found re render the page
                    errors.push({ msg: 'User/email already registered' });
                    res.render('register', {
                        errors,
                        name,
                        email,
                        password,
                        password2,
                        phone
                    }); 
                } else {

                    const newUser = new User({
                        name,
                        email,
                        password,
                        phone
                    });

                    console.log(newUser);
                    //encrypt pass
                    bcrypt.genSalt(12, (error, salt) => {
                        bcrypt.hash(newUser.password, salt, (error, hash) => {
                            if (error) throw error;
                            //encryopted pass
                            newUser.password = hash;
                            newUser.save()
                                .then(user => {
                                    req.flash('success_msg', 'You are now Registered and can login using email and password');
                                    res.redirect('/users/login');
                                })
                                .catch(error => console.log(error));
                        })
                    });
                }
            })
            .catch(error => {console.log(error)});
    }
});

//handle login routes
router.post('/login', (req, res, next) => {
    passport.authenticate('local', {
        successRedirect: '/users/otp',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);

    // twilio.messages.create({
    //     to: '+918460451089',
    //     from: '+13196006371',
    //     body: 'Hello boi'
    // }).then((message) => console.log(message.sid));
});

router.get('/otp', ensureAuth, (req, res, next) => {
    //const token = Math.floor(Math.random() * (999999 - 111111 + 1) + 111111); //disabled just for demo and testing purposes
    const token = 123456;
    client.set('token', token);
    MongoClient.connect(mongoUrl, (error, mongoclient) => {
        if (error) throw error;
        mongoclient.db('user').collection('users').findOne({ name: req.user.name }, (error, user) => { //is used to find the username and his phone number where in we need to send the otp
            if (error) throw error;
            let phone = '91' + user.phone;
            phone = parseInt(phone);
            console.log(phone);
            console.log(token);
            var data = "Token is: " + token;
            // request(`https://api.textlocal.in/send/?apiKey=${process.env.api_key}&sender=TXTLCL&numbers=${phone}&message=${data}`, (error, response, body) => {
            //     console.log("error: " + error); 
            // }); //not supported outside india, hence disabled at the moment
        });
    });
    res.render('otp');
});

router.post('/otp', (req, res) => {
    const otp = req.body.otp;
    let errors = [];

    client.get('token', (error, reply) => {

        if (otp != reply) {
            errors.push({ msg: 'Invalid Token. Enter OTP Again' });
        } else {
            res.redirect('/dashboard');
        }
        if (errors.length > 0) {
            res.render('otp', {
                errors
            });
        }
    })
});

//handle logut
router.get('/logout', (req, res) => {
    client.mget(['user', 'ip', 'country', 'latitude', 'longitude', 'loggedinAt'], (error, reply) => { //writes to the mongodb dataset after the user is logged out or voting finishes
        var integrityObject = {  //gets values from redis
            user: reply[0],
            ip: reply[1],
            country: reply[2],
            latitude: reply[3],
            longitude: reply[4],
            loggedinAt: reply[5],
            loggedoutAt: Date.now
        };
        MongoClient.connect(mongoUri, {useNewUrlParser:true} ,(error, client) => {
            if (error) throw error;
            client.db('user').collection('integrity').insertOne(integrityObject, (error, result) => { //object is written to the memory
                if (error) throw error;
    
                console.log(result);
            });
        });
    });
    req.logout();
    req.flash('success_msg', 'Your vote has been successfully registered! Thank You!');
    res.redirect('/users/login');
    client.flushall((error, success) => {
        console.log(success);
    })
});

module.exports = router;