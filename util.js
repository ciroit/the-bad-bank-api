function generateAccountNumber(){

    var fecha = new Date();

    return fecha.getTime();
}

module.exports = {generateAccountNumber}