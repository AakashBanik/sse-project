const express = require('express');
const router = express.Router();
const { ensureAuth } = require('../config/auth');
const path = require('path');

const app = express();
app.use('/js', express.static(path.join(__dirname + '/../js')));

router.get('/', (req, res) => {
    res.render('welcome');
});

router.get('/dashboard', ensureAuth, (req, res) => {
    res.render('dashboard', {
        user: req.user
    });
});


module.exports = router;
