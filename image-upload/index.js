'use strict';

/**
 * Node/Express backend REST endpoints
 * @author Ville Lohkovuori
 * 03/04 2018
 *
 * NOTE: This is for uploading images to the remote backend; we'll use that in the app 
 * for allowing users to send new data. There is a separate module in 'ml-train/fetch-images/' 
 * for collecting the needed training images from the Huuto.net API. We don't need to upload those 
 * remotely just yet, as the model can be trained locally just fine.
 *
 * NOTE2: We'll eventually need a remote database for storing the image url + category + price data.
 * Also, we'll probably want a separate db for the user accounts.
 *
 * NOTE3: This thing needs my heroku account + Amazon AWS account to work, so don't try to implement your own 'personal' version.
 * There should be no reason for anyone else to touch this mess (that I can foresee, anyway).
 *
 * NOTE4: (to self, mostly): The version on heroku is NOT up to date with this one (19.04.2018)! Updating it requires re-uploading this 
 * part of the project to Heroku via github, which means separating it as its own project... There's probably a better way, but I cba to 
 * search for it. I will update the Heroku version once we really need it (some time next week, probably). 
 */
 
 // CONSTANTS ETC xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

const express = require('express');
const bodyParser = require('body-parser');
const randomString = require('randomstring');
const aws = require('aws-sdk');

const PORT = process.env.PORT || 5000;
const S3_BUCKET = process.env.S3_BUCKET;

const app = express();
app.use(bodyParser({limit: '500mb'}));

aws.config.region = 'us-east-1'; // I accidentally made the AWS S3 bucket in the US... meh, whatever.

// TODO: figure out how to make CLASS-based imports/exports work!
// EDIT: I know how to do it with Babel now, but other things should take priority
const imageObjModule = require('./imageObj.js');
const ImageObj = imageObjModule.ImageObj;

const ROOT_IMAGE_FOLDER = "https://ios-app-backend.herokuapp.com/Images/";

app.listen(PORT, function () {
  console.log(`Listening on port ${PORT} ...`)
})

// REST ENDPOINTS xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

// receives the image from the client
// and uploads it to remote AWS S3 bucket
app.post('/', function(req, res) {

  // TODO: send imageObjects instead of plain images (that contain the price and category info)
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
}); // end post('/')

// TODO: add GET endpoint(s) for dl'ding some imageObjects (for displaying existing items in the app)
