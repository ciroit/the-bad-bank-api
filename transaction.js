var express = require('express');
var router = express.Router();
var dal = require('./dal');


router.get('/all/:userId', (req, res) => {

    dal.getHistory(req.params.userId)
        .then((response) => {

            res.send({isSuccess: true, transactions : response});

        })
        .catch((err) => {

            console.log('Error: ', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});

        });

});

module.exports = router;