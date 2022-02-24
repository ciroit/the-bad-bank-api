var express = require('express');
var router = express.Router();
var dal = require('./dal');

// create user account
router.get('/create/:name/:email/:password', function (req, res) {

    // check if account exists
    dal.find(req.params.email).
        then((users) => {

            var result = {isSuccess : false, message : ''}

            // if user exists, return error message
            if(users.length > 0){
                console.log('User already in exists');

                result.message = 'User already in exists';

                res.send(result);    
            }
            else{
                // else create user
                dal.createUserTx(req.params.name,req.params.email,req.params.password).
                    then((user) => {
                        console.log(user);

                        result.message = 'User Created!'
                        result.isSuccess = true;

                        res.send(result);               
                    });            
            }

        });
});

// login user 
router.get('/login/:email/:password', function (req, res) {

    dal.find(req.params.email).
        then((user) => {

            var result = {isSuccess : false, message : ''} 

            // if user exists, check password
            if(user.length > 0){
                if (user[0].password === req.params.password){

                    result.isSuccess = true;
                    user[0].password = null;

                    result.user = user[0];

                    res.send(result);
                }
                else{
                    result.message = 'Login failed: wrong password';
                    res.send(result);
                }
            }
            else{
                result.message = 'Login failed: user not found';
                res.send(result);
            }
    });
    
});

module.exports = router;