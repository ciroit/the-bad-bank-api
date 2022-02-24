const Mongo = require('mongodb');
const MongoClient = Mongo.MongoClient;
const url = 'mongodb://localhost:27017';
const util = require('./util');

let db = null;
let client = null;

//Connect to Mongo
MongoClient.connect(url, {useUnifiedTopology: true}, (err, dbclient) => {
    console.log("Connected succesfully to MongoDB server");
    client = dbclient;
    db = client.db("bad-bank")
});

function createUser(name, email, password){

    return new Promise((resolve, reject) => {

        const collUser = db.collection('users');
        const doc = {name, email, password, balance:0};

        collUser.insertOne(doc, {w:1}, (err, result) => {

            if(err) reject(err)
            else{

                const collAccount =  db.collection('accounts');

                var accountNumber = util.generateAccountNumber()

                const account = {userId : result.insertedId, accountNumber }

                collAccount.insertOne(account, {w:1}, (err, result2) => {
                    err ? reject(err) : resolve(result2);
                })


            }

           
        });

    });

}


async function createUserTx(name, email, password){


    const session  = client.startSession();

    try {
        await session.startTransaction();
        
        const collUser = db.collection('users');

        const user = {name, email, password};

        const resultUserInserted = await collUser.insertOne(user, {w:1, session});

        const collAccounts = db.collection('accounts');

        const accountNumber = util.generateAccountNumber() + '';

        const account = {userId : resultUserInserted.insertedId, accountNumber, amount : 0}

        await collAccounts.insertOne(account, {w:1, session})

        const collTransactions = db.collection('transactions');

        const transaction = {userId : resultUserInserted.insertedId, accountNumber, description : 'Account Created', amount : 0};

        await collTransactions.insertOne(transaction, {w:1, session})

        await session.commitTransaction();
        console.log('Transaction successfully committed.');

        return resultUserInserted;

    } catch (error) {
        
        console.log('An error occured in the transaction, performing a data rollback:' + error);

        await session.abortTransaction();

    } finally {
        await session.endSession();
    }

}


// find user account 
function find(email) {
    return new Promise((resolve, reject) => {
        const customers = db
            .collection('users')
            .find({ email: email })
            .toArray(function (err, docs) {
                err ? reject(err) : resolve(docs);
            });
    })
}

// find user account
function findOne(email) {
    return new Promise((resolve, reject) => {
        const customers = db
            .collection('users')
            .findOne({ email: email })
            .then((doc) => resolve(doc))
            .catch((err) => reject(err));
    })
}

// update - deposit/withdraw amount
async function update(userId, accountNumber, amount) {

    const session  = client.startSession();

    console.log(`userId: ${userId} | accountNumber: ${accountNumber} | amount: ${amount}`)

    try {
        await session.startTransaction();
        
        const collAccounts = db.collection('accounts');

        const userObjId = Mongo.ObjectId(userId);

        const userAccountUpdated = await collAccounts.findOneAndUpdate(
            { userId : userObjId ,accountNumber },
            { $inc: { amount } },
            { returnDocument: 'after' }
        );
      
        var operation = ''
        if(amount > 0) operation = 'Deposit' 
        else operation = 'Withdrawll'

        const collTransactions = db.collection('transactions');

        const transaction = {userId : userObjId, accountNumber, description : operation, amount};

        await collTransactions.insertOne(transaction, {w:1, session})

        await session.commitTransaction();
        console.log('Transaction successfully committed.');

        return userAccountUpdated;

    } catch (error) {
        
        console.log('An error occured in the transaction, performing a data rollback:' + error);

        await session.abortTransaction();

        throw error;

    } finally {
        await session.endSession();
    }
}

async function transfer(userId, accountNumber, amount, recipientAccountNumber){

    const session  = client.startSession();

    try {
        await session.startTransaction();
        
        const collAccounts = db.collection('accounts');

        const negativeAmount = amount * -1;

        const userObjId = Mongo.ObjectId(userId);

        const userAccountUpdated = await collAccounts.findOneAndUpdate(
            { userId : userObjId, accountNumber },
            { $inc: { amount : negativeAmount } },
            { returnDocument: 'after' }
        );

        console.log(userAccountUpdated);
        
        const recipientAccountUpdated = await collAccounts.findOneAndUpdate(
            { accountNumber : recipientAccountNumber },
            { $inc: { amount} },
            { returnDocument: 'after' }
        );
        
        const collTransactions = db.collection('transactions');

        const transactions = [
            { userId : userAccountUpdated.value.userId, accountNumber, description : `Transfer to ${recipientAccountNumber}`, amount : negativeAmount },
            { userId : recipientAccountUpdated.value.userId, accountNumber: recipientAccountNumber, description : `Deposit of ${accountNumber}`, amount }
        ];

        console.log(transactions);

        await collTransactions.insertMany(transactions, {w:1, session})

        await session.commitTransaction();
        console.log('Transaction successfully committed.');

        return userAccountUpdated;

    } catch (error) {
        
        console.log('An error occured in the transaction, performing a data rollback:' + error);

        await session.abortTransaction();

        throw error;

    } finally {
        await session.endSession();
    }

}

async function listAccounts(userId){

    const userObjId = Mongo.ObjectId(userId);

    const collAccounts = db.collection('accounts');

    var cursor = await collAccounts.find({userId : userObjId});

    var accounts = await cursor.toArray();

    return accounts
}

async function accountsExists(accountNumber){

    const collAccounts = db.collection('accounts');

    var account = await collAccounts.findOne({ accountNumber });

    var accountsExists = account ? true : false;

    return accountsExists;

}


// return all users by using the collection.find method
function all() {
    // TODO: populate this function based off the video
    return new Promise((resolve, reject) => {

        const customers = db.collection('users').find({}).toArray((err, docs)=> {

            err ? reject(err) : resolve(docs);

        });

    });
}

async function getHistory(userId){

    const userObjId = Mongo.ObjectId(userId);

    const collTransactions = db.collection('transactions');

    var cursor = await collTransactions.find({userId : userObjId});

    var transactions = await cursor.toArray();

    return transactions
}


module.exports = { createUserTx, findOne, find, update, all, listAccounts, transfer, accountsExists, getHistory };