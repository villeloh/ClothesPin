'use strict';

/**
 * After some problems and due to lack of time, we decided to 'simulate' a remote server 
 * by running a local one. This way we can show image and evaluation data on the client, and 
 * allow the user to send additional sales data, all without the hurdles of managing a remote db
 * installed on Linux (which I *hate* -.-).
 * @author Ville Lohkovuori
 * 04/05 2018
 */

 // ***************************** CONSTANTS ETC *******************************************************************************************************************************

const express = require('express');
const bodyParser = require('body-parser');
const randomString = require('randomstring');
const fetch = require("node-fetch");
const fs = require('fs');

const PORT = process.env.PORT || 5000;

const app = express();
app.use(bodyParser({limit: '500mb'}));

const categoryObjModule = require('./category.js');
const Category = categoryObjModule.CategoryObj;

const imageObjModule = require('./image.js');
const ImageObj = imageObjModule.ImageObj;

const ROOT_IMAGE_FOLDER = "images/"; // and now it's a *relative* path for some reason -.-

// ***************************** CREATE SCHEMAS + DB *******************************************************************************************************************************

const Realm = require('realm');

const ImageObjSchema = {
  name: 'ImageObj',
  properties: {
    url:  'string',
		price: 'float'
  }
};

const CategorySchema = {
  name: 'Category',
  properties: {
		name:  'string',
		images: 'ImageObj[]'
  }
};

const imageRealm = new Realm({
  path: 'images.realm',
  schema: [ImageObjSchema, CategorySchema]
});

// ******************* LISTEN **************************************************************************************************************************

app.listen(PORT, function () {
    console.log(`Local server listening on port ${PORT} ...`)
});

// ********************** ENDPOINTS ********************************************************************************************************************

// retrieve some sample data to show in the app
app.get('/:itemType', function(req, res) {
	
	const itemType = req.params.itemType; // it should be a string that's taken directly from the request string ('/shirts' or whatever)
    const imgObjs = retrieveObjectsFromRealm(itemType);
	
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
    saveImgObjToRealm(imgObj, categoryName);

    res.json({ status: 'ok'});
  }); // end post('/')

// ********************** FUNCTIONS ********************************************************************************************************************

function saveImgObjToRealm(imageObj, categoryName) {

    // we'll assume that only valid data comes from the client, so, no checks are needed...
	imageRealm.write(() => {

		// apparently backticks are a no-no here... looks weird but it works, so, whatever
		let cat = imageRealm.objects('Category').filtered('name = ' + '"' + categoryName + '"')[0];

        cat.images.push(imageObj);			
        console.log("wrote object to existing Realm category!");
	}); // end write()
} // end saveImgObjToRealm()

function retrieveObjectsFromRealm(categoryName) {

    let cat;

    imageRealm.write(() => {

		  cat = imageRealm.objects('Category').filtered('name = ' + '"' + categoryName + '"')[0];
	
    }); // end write()
    
    return cat.images.slice(0, 50); // return first 50 objects	
} // end retrieveObjectsFromRealm()
