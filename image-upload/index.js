"use strict";

/**
 * Node/Express backend REST endpoints
 * @author Ville Lohkovuori
 * 03/04 2018
 *
 * NOTE: This is for uploading images to a remote backend; we'll use that in the app 
 * for allowing users to send new data. There will be a separate 'module' for collecting
 * the needed training images from the Huuto.net API. We don't even need to upload those 
 * remotely, as the model can be trained locally just fine.
 *
 * NOTE2: We need a database for storing the image url + category + price data, I guess.
 * The categories should probably be separate tables, with 'url' and 'price' as the only two columns in each row (i.e., image).
 *
 * I will clean up this code a lot in the near future (half of it is only being used for the labs atm).
 */

const express = require('express');
const bodyParser = require('body-parser');
// const fs = require('fs'); // used for saving the file locally
const randomString = require('randomstring');
const aws = require('aws-sdk');

const PORT = process.env.PORT || 5000;
const S3_BUCKET = process.env.S3_BUCKET;

const app = express();
app.use(bodyParser({limit: '500mb'}));

aws.config.region = 'us-east-1'; // I accidentally made the AWS S3 bucket in the US... meh, whatever.

// one of these should probably be made to work... we get 2 warnings with the current bodyParser usage
/*
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));
app.use( bodyParser.json());       // to support JSON-encoded bodies
app.use(bodyParser.json({ limit: '500mb' }))
*/

// TODO: figure out how to make CLASS-based imports/exports work!
// EDIT: I know how to do it with Babel now, but other things should take priority
const imageObjModule = require('./imageObj.js');
const ImageObj = imageObjModule.ImageObj;

// const ROOT_IMAGE_FOLDER = "/Users/iosdev/Desktop/iOSAppBackend/Images/"; // for local storage
const ROOT_IMAGE_FOLDER = "https://ios-app-backend.herokuapp.com/Images/";

app.listen(PORT, function () {
  console.log('Listening on port 5000 ...')
})

// DUMMY DATA FOR TESTING AND LABS ONLY xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// this approach seems awkward, but we cannot return the 'names' of objects...
const categories = {};
const categoryNames = [];

const dogs = [new ImageObj('muppe', 'url...'), new ImageObj('Musti', 'url...')];
const cats = [new ImageObj('Mirre', 'url...'),new ImageObj('Bella', 'url...')];
const turtles = [new ImageObj('Kille', 'url...'), new ImageObj('Kalle', 'url...')];

categories['0'] = dogs;
categoryNames[0] = 'dogs';

categories['1'] = cats;
categoryNames[1] = 'cats';

categories['2'] = turtles;
categoryNames[2] = 'turtles';

// USED REST ENDPOINTS xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// This can be used atm (if you want to use it for your labs), but imo we should just save the categories in the app itself... 
// they won't really update without a major app update, and that can just be done to the source code itself.
app.get('/categoryNames', function(req, res) {
  
  res.json( {categoryNames: categoryNames} )
});

// receives the image from the client
// and uploads it to remote AWS S3 bucket
app.post('/', function(req, res) {

  const base64image = req.body.encodedImage;
  const fileDataDecoded = Buffer.from(base64image,'base64');

  const s3 = new aws.S3();
  const fileName = randomString.generate(20) + '.png'; // in practice, there are never two identical names
  const fileType = 'image/png';

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Body: fileDataDecoded,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.putObject(s3Params, function(err, data) {
    if (err) { 
      console.log(err);
      console.log('Error uploading data: ', data);
    } else {
      console.log('succesfully uploaded the image!');
    }
  });

  // saving the file locally:
  /*
  fs.writeFile(ROOT_IMAGE_FOLDER + uniqueFileName, fileDataDecoded, function(err) {
    
    console.log(err)
  });
*/
}); // end POST '/'

// preserving this for now... it's to do with authenticating the upload (I guess; 
// the tutorial that I followed was pretty nebulous). I could make it work without this, so it's not used atm.
/*
app.get('/signedRequest', function(req, res) {

  const s3 = new aws.S3();
  const fileName = randomString.generate(10) + '.png';
  const fileType = 'image/png'; // could be wrong!

  const s3Params = {
    Bucket: S3_BUCKET,
    Key: fileName,
    Expires: 60,
    ContentType: fileType,
    ACL: 'public-read'
  };

  s3.getSignedUrl('putObject', s3Params, (err, data) => {
    if(err){
      console.log(err);
      return res.end();
    }
    const returnData = {
      signedRequest: data,
      url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`
    };
    res.write(JSON.stringify(returnData));
    res.end();
  });
}); // end GET /signedRequest
*/

// will probably only be needed for the labs (users posting new, empty categories 'breaks' the ML model)
app.post('/newCategory', function(req, res) {

  const newCategory = req.body.newCategory;
  categoryNames.push(newCategory);
  console.log("categoryNames: " + categoryNames)
});

// LIKELY TO BE UNNECESSARY xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// send the actual objects... not used atm. (most probably won't ever be)
app.get('/', function (req, res) {
  
  res.json({categories: categories});
});

// just a test... should be made to work dynamically if we are to use it (unlikely)
app.get('/0', function(req, res) {
  
  res.json({0: categories['0']});
});
