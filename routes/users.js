const express = require('express');
const router = express.Router();
const User = require('./../models/User');
const bcrypt = require('bcryptjs');
const passport = require('passport');
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

    const { name, email, password, password2 } = req.body;

    let errors = [];

    if (!name || !email || !password || !password2) {
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
            password2
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
                        password2
                    }); 
                } else {
                    const newUser = new User({
                        name,
                        email,
                        password
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
        successRedirect: '/dashboard',
        failureRedirect: '/users/login',
        failureFlash: true
    })(req, res, next);
});

//handle logut
router.get('/logout', (req, res) => {
    req.logout();
    req.flash('success_msg', 'You are successfully logged out!');
    res.redirect('/users/login');
});

module.exports = router;