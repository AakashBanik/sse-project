module.exports = { //used to protech routes so that any un-authenticated users cannot access secured routes
    ensureAuth: function (req, res, next) {
        if (req.isAuthenticated()) {  //function is provided by the passport middleware
            return next();
        }

        req.flash('error_msg', 'Please log in to view this resource');
        res.redirect('/users/login');
    } 
}