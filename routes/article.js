require('dotenv').config();
const express = require('express');
const router = express.Router();
const fs = require('fs');

const mongoose = require('mongoose');
const Article = require('../schemas/Article');
const auth = require('../middlewares/auth');

//Utilisé en angular
router.get('/tags', async (req, res, next) => {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const tags = await Article.aggregate([
            { $unwind: "$tags" },
            { $group: { _id: "$tags", count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $group: { _id: null, tags: { $push: "$_id" } } },
        ]);
        res.json(tags[0].tags);
    } catch (err) {
        console.log(err);
        res.json(err);
    } finally {
        await mongoose.disconnect();
    }
});


//Utilisé en angular
router.get('/:lang', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const articles = await Article.find();
        let data = [];
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            data.push(getDataForLang(article, req.params.lang));
        }
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    } finally {
        await mongoose.disconnect();
    }
});

//Utilisé en angular
router.get('/:lang/tag/:tag', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const articles = await Article.find({ tags: { $all: [req.params.tag] } });
        let data = [];
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            data.push(getDataForLang(article, req.params.lang));
        }
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    } finally {
        await mongoose.disconnect();
    }
});

router.get('/:lang/author/:authorName', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const articles = await Article.find({ author: req.params.authorName });
        let data = [];
        for (let i = 0; i < articles.length; i++) {
            const article = articles[i];
            data.push(getDataForLang(article, req.params.lang));
        }
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    } finally {
        await mongoose.disconnect();
    }
});


//Utilisé en angular
router.get('/:lang/markdown/:articleId', async function (req, res, next) {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const article = await Article.findOne({ articleIdentifier: req.params.articleId });
        const data = getDataForLang(article, req.params.lang);
        if (article && fs.existsSync(`public/articles/${req.params.lang}/${article.filename}`)) {
            res.json({ markdown: fs.readFileSync(`public/articles/${req.params.lang}/${article.filename}`, 'utf8'), article: data });
        } else if (article && fs.existsSync(`public/articles/${article.defaultLanguage}/${article.filename}`)) {
            res.json({ markdown: fs.readFileSync(`public/articles/${article.defaultLanguage}/${article.filename}`, 'utf8'), article: data });
        } else {
            res.status(404).json({ message: `Article introuvable avec le language ${req.params.lang}` });
        }
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    } finally {
        await mongoose.disconnect();
    }
});

//utilisé en angular
router.post('/', auth, async (req, res, next) => {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {

        //Pour réglé le problème de la langue par défaut avec angular
        if(typeof(req.body.name) == "string") {
            req.body.name = { [req.body.defaultLanguage]: req.body.name};
        }
        if(typeof(req.body.description) == "string") {
            req.body.description = { [req.body.defaultLanguage]: req.body.description};
        }
        
        let article = new Article(req.body);
        article.authorIdentifier = req.user._id;
    
        if(article.filename == null || article.filename == "") {
            article.filename = article.articleIdentifier + ".md";
        }

        let i = 1;
        while(fs.existsSync(`public/articles/${article.defaultLanguage}/${article.filename}`)){
            article.filename = article.articleIdentifier + "_" + i + ".md";
            i++;
        }
        fs.writeFileSync(`public/articles/${article.defaultLanguage}/${article.filename}`, req.body.markdown);
        const newArticle = await article.save();
        const data = getDataForLang(newArticle, article.defaultLanguage);
        res.json(data);
    } catch (err) {
        console.log(err);
        res.json(err);
    } finally {
        await mongoose.disconnect();
    }
});

//utilisé en angular
router.delete('/:articleId', auth, async (req, res, next) => {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        const article = await Article.findOne({ articleIdentifier: req.params.articleId });
        if (article == null) {
            res.status(404).json({ message: "Article introuvable" });
            return;
        }

        if (article.authorIdentifier != req.user._id.toString()) {
            res.status(403).json({ message: "Vous n'avez pas les droits pour supprimer cet article" });
            return;
        }

        const deletedArticle = await article.remove();
        if (fs.existsSync(`public/articles/${article.defaultLanguage}/${article.filename}`))
        {
            fs.rmSync(`public/articles/${article.defaultLanguage}/${article.filename}`);
        }
        res.json({ deleted: deletedArticle });
    } catch (err) {
        console.log(err);
        res.json({ message: err.message });
    } finally {
        await mongoose.disconnect();
    }
});

//utilisé en angular
router.patch('/:articleId', async (req, res, next) => {
    await mongoose.connect(process.env["MONGO.URI"]);

    try {
        req.body.updated = new Date();
        const result = await Article.findOneAndUpdate(
            { articleIdentifier: req.params.articleId },
            req.body,
            { new: true }
        );
        res.json(result);
    } catch (err) {
        console.log(err);
        res.json({ err });
    }
});


module.exports = router;


function getDataForLang(article, lang) {
    let description = article.description.get(lang);
    let name = article.name.get(lang);

    if (description == null) {
        description = article.description.get(article.defaultLanguage);
    }

    if (name == null) {
        name = article.name.get(article.defaultLanguage);
    }

    article.description = description;
    article.name = name;

    return {
        _id: article._id,
        articleIdentifier: article.articleIdentifier,
        authorIdentifier: article.authorIdentifier,
        views: article.views,
        isVerified: article.isVerified,
        filename: article.filename,
        defaultLanguage: article.defaultLanguage,
        created: article.created,
        updated: article.updated,
        tags: article.tags,
        sources: article.sources,
        availableLanguages: article.availableLanguages,
        daysSinceCreation: article.daysSinceCreation,

        name: name,
        description: description,
    };
}