const mongoose = require('mongoose');
const User = require('../schemas/User');

const auth = async (req, res, next) => {
    const { authorization } = req.headers;
    if (!authorization) {
        return res.status(401).json({ message: 'Unauthorized' });
    }
    const [authType, authString] = authorization.split(' ');
    if (authType !== 'Bearer') {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    await mongoose.connect(process.env["MONGO.URI"]);
    
    try {

        let user = await User.findOne({ token: authString })
        if (!user) {
            return res.status(401).json({ message: 'Unauthorized' });
        } else {
            req.user = user;
            next();
        }
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    }
}

module.exports = auth;