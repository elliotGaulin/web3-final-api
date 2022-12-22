require('dotenv').config();

const bcrypt = require('bcrypt');
var express = require('express');
const { mongoose } = require('mongoose');
var router = express.Router();
const User = require('../schemas/User');

/* GET users listing. */
router.post('/signup', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);
    try {
        let user = new User(req.body);
        user.password = bcrypt.hashSync(user.password, 10);
        const newUser = await user.save();
        res.json(newUser);
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    }finally{
        await mongoose.disconnect();
    }
});

router.post('/login', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);
    console.log(req.body);
    try {
        const user = await User.findOne({ username : req.body.username });
        if(user){
            if(bcrypt.compareSync(req.body.password, user.password)){
                user.token = bcrypt.hashSync(user.username + user.password, 10);
                const updatedUser = await user.save();
                res.json(updatedUser);
            }else{
                res.json({message : "Mauvaises informations de connexion"});
            }
        }else{
            res.json({message : "Utilisateur non trouvé"});
        }
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    }finally{
        await mongoose.disconnect();
    }
});

module.exports = router;
