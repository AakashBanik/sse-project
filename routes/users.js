const express = require('express');
const router = express.Router();
const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const redis = require('redis');
const MongoClient = require('mongodb').MongoClient;
const { ensureAuth } = require('../config/auth');

const accountSid = 'AC220dfb42781b7a1696980087b049c168'; 
const authToken = '5b10e4438cdd60112313adcabd9fa657';
const twilio = require('twilio')(accountSid, authToken);


let mongoUri = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/integrity?retryWrites=true&w=majority";
let mongoUrl = "mongodb+srv://aakash:aakash@cluster0.rm4tn.mongodb.net/user?retryWrites=true&w=majority";


const client = redis.createClient({
    host: process.env.REDIS_HOST, //mentioned in docker compose file
    port: process.env.REDIS_PORT
});

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

    if (password.length < 6) {
        errors.push({ msg: "Password should be atleast 6 chars long" });
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
});

router.get('/otp', ensureAuth, (req, res, next) => {
    const token = Math.floor(Math.random() * (999999 - 111111 + 1) + 111111);
    client.set('token', token);
    MongoClient.connect(mongoUrl, (error, mongoclient) => {
        if (error) throw error;
        mongoclient.db('user').collection('users').findOne({ name: req.user.name }, (error, user) => {
            if (error) throw error;
            const phone = '+91' + user.phone;
            console.log(phone);
            console.log(token);
            twilio.messages.create({
                    body: 'The Code for loggin into the voting system is: ' + token,
                    from: '+13196006371',
                    to: phones
                })
                .then(message => console.log(message.sid))
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
    client.mget(['user', 'ip', 'country', 'latitude', 'longitude', 'loggedinAt', 'cookie'], (error, reply) => {
        var integrityObject = {
            user: reply[0],
            ip: reply[1],
            country: reply[2],
            latitude: reply[3],
            longitude: reply[4],
            loggedinAt: reply[5],
            loggedoutAt: Date.now,
            cookie: reply[6]
        };
        MongoClient.connect(mongoUri, {useNewUrlParser:true} ,(error, client) => {
            if (error) throw error;
            client.db('user').collection('integrity').insertOne(integrityObject, (error, result) => {
                if (error) throw error;
    
                console.log(result);
            });
        });
    });
    req.logout();
    req.flash('success_msg', 'You are successfully logged out!');
    res.redirect('/users/login');
    client.flushall((error, success) => {
        console.log(success);
    })
});

module.exports = router;