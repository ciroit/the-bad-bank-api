const express = require('express');
const cors    = require('cors');
const swaggerUI = require('swagger-ui-express');
const swaggerDoc = require('./swagger.json');
const routerUser = require('./user');
const routerAccount = require('./account');
const routerTransaction = require('./transaction');

const app = express();

app.use('/api-docs', swaggerUI.serve, swaggerUI.setup(swaggerDoc));

var dal = require('./dal');

app.use(cors());

app.use('/user', routerUser);

app.use('/account', routerAccount);

app.use('/transaction', routerTransaction);

// find user account
app.get('/account/find/:email', function (req, res) {

    dal.find(req.params.email).
        then((user) => {
            console.log(user);
            res.send(user);
    });
});

// find one user by email - alternative to find
app.get('/account/findOne/:email', function (req, res) {

    dal.findOne(req.params.email).
        then((user) => {
            console.log(user);
            res.send(user);
    });
});

// all accounts
app.get('/account/all', function (req, res) {

    dal.all()
        .then((docs) => {
            
            res.send({isSuccess: true, accounts : docs});
        }).
        catch((err) => {
            console.log('Error :', err);

            res.send({isSuccess: false, message: 'An error ocurred.'});
        });
});

var port = 3001;
app.listen(port);
console.log('Running on port: ' + port);