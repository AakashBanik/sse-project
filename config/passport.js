const LocalStrategy = require('passport-local').Strategy;
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

//load model
const User = require('../models/User');

module.exports = (passport) => {
    passport.use(
        new LocalStrategy({ usernameField: 'email' }, (email, password, done) => {
          //match user
            User.findOne({ email: email })
                .then(user => {
                    if (!user) {
                        return done(null, false, { message: 'That email is not registered.' });
                    }

                    //macth hased pass
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
