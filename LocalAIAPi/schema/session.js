const mongoose = require('mongoose'); // Erase if already required

// Declare the Schema of the Mongo model
var sessionSchema = new mongoose.Schema({
    name: {
        type: String
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
});

//Export the model
module.exports = mongoose.model('Session', sessionSchema);