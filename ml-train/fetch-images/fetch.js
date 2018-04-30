'use strict';

/** 
 * For fetching the training set images from the Huuto.net API and saving them
 * into a local Realm database (a db for objects, basically).
 * @author Ville Lohkovuori
 * 04 2018
 */

// *************************** CONSTANTS ETC *************************************************************************

const fetch = require("node-fetch");
const download = require('image-downloader');
const fse = require('fs-extra');
const rs = require('randomstring');

const imageObjModule = require('./image.js');
const ImageObj = imageObjModule.ImageObj;

const categoryObjModule = require('./category.js');
const Category = categoryObjModule.CategoryObj;

const BASE_API_URL = 'https://api.huuto.net/1.1/';

// used when making the image objects. this needs to be changed for it to work on your computer (duh)
// const ABS_ROOT_IMG_FOLDER = 'C:/Users/VilleL/Desktop/backend/ClothesPin/ml-train/fetch-images/images/'; 
//const ABS_ROOT_IMG_FOLDER = 'MACOS_SIERRA/Users/iosdev/Desktop/backend/ClothesPin/ml-train/fetch-images/images/'; 
const ABS_ROOT_IMG_FOLDER = 'MACOS_SIERRA/Users/iosdev/Desktop/ClothesPin-Backend/ClothesPin/ml-train/fetch-images/images/'; 


// used when dl'ding the images... it hides the 'C:' for some reason. -.- again, change this for yourself
// const ROOT_DEST_FOLDER = '/Users/VilleL/Desktop/backend/ClothesPin/ml-train/fetch-images/images/'; 
//const ROOT_DEST_FOLDER = '/Users/iosdev/Desktop/backend/ClothesPin/ml-train/fetch-images/images/'; 
const ROOT_DEST_FOLDER = '/Users/iosdev/Desktop/ClothesPin-Backend/ClothesPin/ml-train/fetch-images/images/'; 

// ***************************** CREATE IMAGE DIRECTORIES IF THEY DON'T EXIST ******************************************************************************************************

// this is only needed because git doesn't want to commit empty folders -.-
createImageFolders();

// ***************************** CREATE SCHEMAS + DB *******************************************************************************************************************************

// NOTE: in order for this to work, you'll need to do 'npm install' in the fetch-images folder. that should install the Realm database (along with all the other dependencies).
// I recommend a soft called Realm Studio for viewing the contents of the database (it's very easy to install and use; there's zero configuration involved).

// NOTE2: Eventually, we'll want the database to be remote, so that users can add their own images to it. This remains a major unknown and TODO at this point.

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
  path: 'imagez.realm',
  schema: [ImageObjSchema, CategorySchema]
});

// *************************** DL THE IMAGES & SAVE THEM TO THE DB ******************************************************************************************************************

const searches = [ ['paita', 'shirts'], ['takki', 'coats'], ['housut', 'pants'], ['kengät', 'shoes'], ['hattu', 'hats'] ];

// there's some complications (stuff becomes undefined) if we try to dl more than 400 items at once, despite the 'await' keyword,
// so it's best to do the downloads in batches
const numOfItemsToDl = 200;

doFetch(searches, numOfItemsToDl);

// it's needed as a wrapper function in order to use the 'await' keyword
async function doFetch(searchArray, numOfImages) {

	const promises = [];

	for (let i = 0; i < searchArray.length; i++) {
	
		// to get four pages of results for each search... inelegant, but ehh, it works
		// NOTE: if you want pages 5++, you'll have to manually update these calls for now.
		// if you don't do that, you'll get the same images all over again and they'll
		// overwrite the old ones!
		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, 1));
		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, 2));
		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, 3));
		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, 4));
		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, 5));
	}

	const resultsArray = await Promise.all(promises);

	const rLength = resultsArray.length;
	const sLength = searchArray.length - 1;
	let j = 0;

	for (let i = 0; i < rLength; i++) {

		// searchArray contains 5 items, so the index to obtain the correct categoryName must loop around
		if (j > sLength) {
			j = 0;
		}

		let categoryName = searchArray[j][1];
		j++;
	
		// pretty damn 'loopy' solution, but we need the relevant categoryName for this call, and it's not returned with the results.
		// another option would be to add the categoryName to the result (either return an object with that field and an array field 
		// instead of a 'plain' array -- OR add the category field to every ImageObj just for this one use), but I'm not sure if either is really a better solution.
		saveToRealmDb(resultsArray[i], categoryName);
	}
} // end doFetch()

// it both downloads the images and returns the objects that contain the local urls, 
// which breaks separation of concerns... meh, it was highly convenient and we only need to do this once.
function getItems(term, category, numOfImages, resultPageNumber) {
	
	const items = [];
	
	return fetch(BASE_API_URL + `items?words=${term}&category=561&sellstyle=buy-now&limit=${numOfImages}&page=${resultPageNumber}`) // category 561 = 'clothing'; it can be hard-coded as it never changes
    .then(response => {
		if (response.ok) {
			return response.json();
		}
    })
    .then(myJson => {
		
		const validItems = [];
		
		for (let i = 0; i < numOfImages; i++) {

			 // it seems there are no images for some sales entries, and some entries are even invalid
			if (myJson.items[i] !== undefined && myJson.items[i].images[0] !== undefined) {

				validItems.push(myJson.items[i]);
			}
		}
			
		validItems.map(item => {
							
				const dlUrl = item.images[0].links.thumbnail; // 'thumbnail' = 140 x 140 pixel image; 'medium' varies, but is usually something like 400-600 x 400-600 px
				
				const newImageName = rs.generate() + '.png'; // name with 32 random characters

				const destFilePath = ROOT_DEST_FOLDER + category + '/' + newImageName;

				const options = {
					url: dlUrl,
					dest: destFilePath
				}
				
				// dl and save the images
				download.image(options)
			    .then(({ filename, image }) => {
						// console.log('File saved to', filename)
			    }).catch((err) => {
						console.log(err.message);
			    });
				
				const price = item.buyNowPrice * 0.9; // the 'real' sale prices are always a bit lower than those on the listed items
				
				const img = new ImageObj(destFilePath, price);
				
				items.push(img);
		}); // end map()
		
		return items;
	})
	.catch(error => console.log(error.message));
} // end getItems()

function saveToRealmDb(arrayOfImageObjs, categoryName) {

	imageRealm.write(() => {

		// apparently backticks are a no-no here... looks weird but it works, so, whatever
		let existingCat = imageRealm.objects('Category').filtered('name = ' + '"' + categoryName + '"')[0];

		if (existingCat === null || existingCat === undefined) {
		
			const newCat = new Category(categoryName, arrayOfImageObjs);

			imageRealm.create('Category', {name: newCat.name, images: newCat.images});
			console.log("wrote new category to Realm!");

		} else {

				arrayOfImageObjs.map(imageObj => {

					existingCat.images.push(imageObj);			
					console.log("wrote objects to existing Realm category!");
				});
		}	
	}); // end write()
} // end saveToRealmDb()

function createImageFolders() {

	const imgFolderPaths = ['./images/shirts', './images/coats', './images/shoes', './images/pants', './images/hats'];

	imgFolderPaths.map(path => {
	
		fse.ensureDir(path, err => {
			console.log(err) // => prints 'null' if it succeeds
		})
	});
} // end createImageFolders()
