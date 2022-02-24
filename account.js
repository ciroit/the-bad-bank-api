var express = require('express');
var router = express.Router();
var dal = require('./dal');

// update - deposit/withdraw amount
router.get('/update/:userId/:accountNumber/:amount', function (req, res) {

    var amount = Number(req.params.amount);

    dal.update(req.params.userId, req.params.accountNumber, amount)
        .then((response) => {
            console.log(response);
            
            var result = {isSuccess: false, message: ''};

            if(response.lastErrorObject.updatedExisting){

                result.isSuccess = true;
                result.message = 'Account Updated';
                result.accountUpdated = response.value;

            }else{

                result.message = 'The account doesnt exists.';

            }

            res.send(result);
        })
        .catch((err) => {

            console.log('Error: ', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});

        });

});

// update - deposit/withdraw amount
router.get('/transfer/:userId/:accountNumber/:amount/:recipientAccountNumber', function (req, res) {

    var amount = Number(req.params.amount);

    dal.transfer(req.params.userId, req.params.accountNumber, amount, req.params.recipientAccountNumber)
        .then((response) => {
            console.log(response);
            
            var result = {isSuccess: false, message: ''};

            if(response.lastErrorObject.updatedExisting){

                result.isSuccess = true;
                result.message = 'Transfer successfully';
                result.accountUpdated = response.value;

            }else{

                result.message = 'The account doesnt exists.';

            }

            res.send(result);
        })
        .catch((err) => {

            console.log('Error: ', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});

        });

});

router.get('/list/:userId', (req, res) => {

    dal.listAccounts(req.params.userId)
        .then((response) => {

            res.send({isSuccess: true, accounts : response});

        })
        .catch((err) => {

            console.log('Error: ', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});

        });

});

router.get('/exists/:accountNumber', (req, res) => {

    dal.accountsExists(req.params.accountNumber)
        .then((response) => {

            res.send({isSuccess: true, exists : response});

        })
        .catch((err) => {

            console.log('Error: ', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});

        });

});

module.exports = router;