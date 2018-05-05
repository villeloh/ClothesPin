'use strict';

/**
 * After some problems and due to lack of time, we decided to 'simulate' a remote server 
 * by running a local one. This way we can show image and evaluation data on the client, and 
 * allow the user to send additional sales data, all without the hurdles of managing a remote db
 * installed on Linux.
 * @author Ville Lohkovuori
 * 04/05 2018
 */

 // ***************************** CONSTANTS ETC *******************************************************************************************************************************

const express = require('express');
const bodyParser = require('body-parser');
const randomString = require('randomstring');
const fetch = require("node-fetch");
const fs = require('fs');

const ImageObj = require('../models/image').ImageObj;
const realm = require('../data-store/realm-db/realm-ops');
const PATHS = require('../paths').SERVER_PATHS;

const PORT = PATHS.PORT;
const REALM_PATH = PATHS.REALM_PATH;
const ROOT_IMAGE_FOLDER = PATHS.ROOT_IMAGE_FOLDER;

const app = express();
app.use(bodyParser({limit: '500mb'}));

// ******************* LISTEN ******************************************************************************

app.listen(PORT, function () {
    console.log(`Local server listening on port ${PORT} ...`)
});

// ********************** ENDPOINTS ************************************************************************

// retrieve some sample data to show in the app
app.get('/:itemType', function(req, res) {
	
	const itemType = req.params.itemType; // it should be a string that's taken directly from the request string ('/shirts' or whatever)
    const imgObjs = realm.retrieveObjects(REALM_PATH, itemType);
	
	// I thought it best to embed the image data itself into the response; the images are small enough that it should work out ok
	const jsonImgObjsWithImageData = imgObjs.map(imgObj => {
		
		let newObj = {};
		
		const fileUrl = imgObj.url;
		const bitmap = fs.readFileSync(fileUrl);
		const base64image = new Buffer(bitmap).toString('base64');
		
		newObj.image = base64image;
        newObj.price = imgObj.price;
		return JSON.stringify(newObj);
    });

    res.json({ images: jsonImgObjsWithImageData });
});

// receives the image from the client, saves it locally and saves the image object in the db
app.post('/', function(req, res) {

	const categoryName = req.body.category;
    const base64image = req.body.encodedImage; // the actual image as a base64 string
    const fileDataDecoded = Buffer.from(base64image,'base64');
  
    const fileName = randomString.generate() + '.png'; // in practice, there are never two identical names

    const imgUrl = `${ROOT_IMAGE_FOLDER}${categoryName}/${fileName}`;

    fs.writeFile(
        imgUrl,
        fileDataDecoded, 
        function(err) { 
        
        console.log(err); // prints 'null' if it succeeds

        // not sure whether this really works or not... meh, it's error handling of *some* sort :p
        if (err) {

            res.json({error: err, status: 'failed to write file to local folder!'});
            return; // not sure if res.json() already does this or not...
        }
    });
	
    const price = Number(req.body.price);
    const imgObj = new ImageObj(imgUrl, price);

    // should have a try-catch here, ideally, but I'm not sure
    // how they work with Realm and there's no time to study (and debug) that now
    realm.saveImgObj(REALM_PATH, imgObj, categoryName);

    res.json({ status: 'ok'});
  }); // end post('/')
