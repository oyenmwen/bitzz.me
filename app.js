//jshint esversion:9
require('dotenv').config();
const express = require('express');
const bodyParser = require("body-parser");
const validUrl = require('valid-url');
const shortid = require('shortid');
const mongoose = require('mongoose');
const _ = require('lodash/string');
const app = express();
const urls = [{
  shortUrl: String,
  longUrl: String
}];

app.use(bodyParser.urlencoded({
  extended: true
}));

app.use(express.static('public'));
app.set('view engine', 'ejs');

//Connect to Database


const connectDB = async function(req, res) {
  try {
    await mongoose.connect(process.env.MONGO_CONNECT, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err.message);
    process.exit(1);
  }
};
connectDB();

//Create UrlSchema

const urlSchema = new mongoose.Schema({
  urlCode: String,
  longUrl: String,
  shortUrl: String,
  date: {
    type: String,
    default: Date.now
  }
});
const Url = mongoose.model('Url', urlSchema);


app.use(express.json({
  extended: false
}));


//Routes

//GET Routes

app.get('/', function(req, res) {
  res.render("home", {});
});

app.get('/:code', async function(req, res) {
  try {
    const url = await Url.findOne({
      urlCode: req.params.code
    });

    if (url) {
      return res.redirect(url.longUrl);
    } else {
      return res.status(404).json('No url found');
    }
  } catch (e) {
    console.error(err);
    res.status(500).json('Server error');
  }
});


//POST Routes

app.post("/", function(req, res) {});

app.post('/shorten', async function(req, res) {


  const {
    longUrl
  } = req.body;

  const baseUrl = "http://bitzz.me";

  //Is BaseUrl Valid?
  if (!validUrl.isUri(baseUrl)) {
    return res.status(401).json('Invalid base url');
  }

  // Create the Shortened Url Id Code
  const urlCode = shortid.generate();


  //If LongUrl is Valid create a shortned url,
  // or return one that has been shortned in the past
  if (validUrl.isUri(longUrl)) {

    try {
      let url = await Url.findOne({
        longUrl
      });
      if (url) {
        let loLongUrl = _.truncate(longUrl, {
          'length': 30
        });

        if (urls.includes({
            longUrl: loLongUrl,
            shortUrl: url.shortUrl
          })) {
          res.render("success", {
            urls: urls
          });
        }

        // res.json(url);

        urls.push({
          longUrl: loLongUrl,
          shortUrl: url.shortUrl
        });
        res.render("success", {
          urls: urls
        });


      } else {
        const shortUrl = baseUrl + '/' + urlCode;

        url = new Url({
          longUrl,
          shortUrl,
          urlCode,
          date: new Date()
        });


        await url.save();
        let loLongUrl = _.truncate(longUrl);
        urls.push({
          longUrl: loLongUrl,
          shortUrl: url.shortUrl
        });
        res.render("success", {
          urls: urls
        });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json('Server Error');
    }
  } else {
    res.render("invalid", {
      urls: urls
    });
  }
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 5000;
}

app.listen(port, function() {
  console.log("Port running on server 5000");
});
