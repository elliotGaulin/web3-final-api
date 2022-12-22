const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const articleSchema = new Schema({
    "articleIdentifier": {
        type: String,
        required: [true, "L'identifiant de l'article est requis"],  
        unique: [true, "L'identifiant de l'article doit être unique"],      
    },
    "authorIdentifier": {
        type: String,
        required: [true, "L'identifiant de l'auteur de l'article est requis"],
    },
    "views": {
        type: Number,
        required: [true, "Le nombre de vues de l'article est requis"],
        min: [0, "Le nombre de vues de l'article doit être supérieur ou égal à 0"],
    },
    "isVerified": {
        type: Boolean,
        required: [true, "L'état de vérification de l'article est requis"],
        default: false,
    },
    "filename": {
        type: String,
        required: [true, "Le nom du fichier de l'article est requis"],
    },
    "defaultLanguage": {
        type: String,
        required: [true, "La langue par défaut de l'article est requise"],
    },
    "created": {
        type: Date,
        required: [true, "La date de création de l'article est requise"],
    },
    "updated": {
        type: Date,
        required: [true, "La date de mise à jour de l'article est requise"],
    },
    "name": {
        type: Map,
        of: String,
    },
    "description": {
        type: Map,
        of: String,
    },
    "tags": {
        type: [String],
        validate : (v) => {
            return v.length <= 10;
        }
    },
    "sources": {
        type: [{
            "name": {
                type: String,
                required: [true, "Le nom de la source de l'article est requis"],
            },
            "url": {
                type: String,
                required: [true, "L'URL de la source de l'article est requise"],
            },
            _id: false,
        }],
    },
});

articleSchema.virtual('availableLanguages').get(function () {
    let lang = [];
    for (let [key, value] of this.name) {
        lang.push(key);
    }
    return lang;
});

articleSchema.virtual('daysSinceCreation').get(function () {
    let now = new Date();
    let diff = now - this.created;
    let days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return days;
});

module.exports = mongoose.model('Article', articleSchema);
