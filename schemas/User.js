const mongoose = require('mongoose');

var Schema = mongoose.Schema;
var UserSchema = new Schema({
    username: {
        type: String,
        required: true,
        validate : (v) => {
            return v != "dereck"; //Déreck est banni du site pour des raison de sécurité
        }
    },
    password: {
        type: String,
        required: true,
    },
    token: {
        type: String,
        required: false,
    }
});

module.exports = mongoose.model('User', UserSchema);