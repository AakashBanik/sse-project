const LocalStrategy = require('passport-local').Strategy; //local strategy for use with mongodb and our local logic
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//load model
const User = require('../models/User');

module.exports = (passport) => {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => { 
          //match user
            User.findOne({ email: email })  //check if a given users exists
                .then(user => {
                    if (!user) { //if not, then this user is not registered
                        return done(null, false, { message: 'That ID is not registered.' });
                    }
                    //of if users do exist, they check for password, if matched, log them in, if not the, show them the error
                    //macth hashed pass
                    bcrypt.compare(password, user.password, (error, isMatch) => {
                        if (error) throw error;

                        if (isMatch) {
                            return done(null, user);
                        } else {
                            return done(null, false, { message: "Passwords don not match." });
                        }
                    });
                })
                .catch(error => console.log(error));
        })
    );

    passport.serializeUser(function(user, done) {
        done(null, user.id);
      });
      
    passport.deserializeUser(function(id, done) {
        User.findById(id, function(err, user) {
            done(err, user);
        });
    });
}
