const mongoose = require('mongoose'); // Import mongoose library

module.exports = function(uri) {
    mongoose.connect(uri, {  //attempt to connect to database
        useNewUrlParser: true, // Recommended, insures support for future MongoDB drivers
        useUnifiedTopology: true, // Recommended, uses new MongoDB topology engine
        useFindAndModify: false // to use mongodb native api instead for findOneAndUpdate.
    }).catch(error => console.error(error)) // Error handling

    mongoose.connection.on('connected', function () { // On connection
      console.log('Successful connection with database: ' + uri); // Callback for successful connection
    });
}
