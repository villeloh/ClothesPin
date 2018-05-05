'use strict';

/** 
 * For fetching the training set images from the Huuto.net API and saving them
 * into a local Realm database (a db for objects, basically).
 * @author Ville Lohkovuori
 * 04/05 2018
 */

const fetch = require("node-fetch");
const download = require('image-downloader');
const fse = require('fs-extra');
const rs = require('randomstring');

const realm = require('../data-store/realm-db/realm-ops');
const ImageObj = require('../models/image').ImageObj;

const PATHS = require('../paths').FETCH_PATHS;

const BASE_API_URL = PATHS.BASE_API_URL;

// for some reason, the realm gets created in the folder where the *top calling* script resides...
// not in the folder where the actual creation script is called! -.- for this reason, we need 
// to explicitly specify the relative realm path when calling from other folders
const REALM_PATH = PATHS.REALM_PATH;

// used when saving the image objects
const ABS_ROOT_IMG_FOLDER = PATHS.ABS_ROOT_IMG_FOLDER; 
// const ABS_ROOT_IMG_FOLDER = 'MACOS_SIERRA/Users/iosdev/Desktop/ClothesPin-Backend/ClothesPin/src/data-store/images/'; 


// used when dl'ding the images... it omits the 'C:' for some reason. -.- again, change this for yourself
// const ROOT_DEST_FOLDER = '/Users/VilleL/Desktop/backend/ClothesPin/src/data-store/images/'; 
const ROOT_DEST_FOLDER = PATHS.ROOT_DEST_FOLDER; 
// const ROOT_DEST_FOLDER = '/Users/iosdev/Desktop/ClothesPin-Backend/ClothesPin/src/data-store/images/'; 

// ***************************** CREATE IMAGE DIRECTORIES IF THEY DON'T EXIST ***************************

// this is only needed because git doesn't want to commit empty folders -.-
createImageFolders();

// *************************** DL THE IMAGES & SAVE THEM TO THE DB **************************************

const SEARCHES= [ 
	['paita', 'shirts'], 
	['takki', 'coats'], 
	['housut', 'pants'], 
	['kengät', 'shoes'], 
	['hattu', 'hats'], 
	['hanskat', 'gloves'] 
];

// there's some complications (stuff becomes undefined) if we try to dl more than 400 items at once, 
// despite the 'await' keyword, so it's best to do the downloads in batches.
// EDIT: for some reason, the api stopped giving us more than 50 images at a time (per category), no matter
// the value that we set here.
const numOfItemsToDl = 50;

// USAGE: see IMPORTANT NOTE in the beginning of doFetch() method!
doFetch(SEARCHES, numOfItemsToDl, 1);
// doFetch(searches, numOfItemsToDl, 2);
// doFetch(searches, numOfItemsToDl, 3);
// doFetch(searches, numOfItemsToDl, 4);
// ... etc. uncomment and do these ONE AT A TIME !!!

// it's needed as a wrapper function in order to use the 'await' keyword
async function doFetch(searchArray, numOfImages, pageNum) {

	/* IMPORTANT NOTE!!!!

	Originally, I wrote this method so that we could retrieve 5 or more pages with one call of doFetch().
	However, it seems the database gets crazy somehow as a result, saving god knows what to 
	who knows where :D Therefore, in order to get enough images, you'll have to run 
	'node fetch' many times, increasing the last argument ('pageNum') after each call:

	1. doFetch(searches, numOfItemsToDl, 1);
	2. doFetch(searches, numOfItemsToDl, 2);
	... etc (another example above where the call is)

	NOTE: be sure to do these calls ONE AT A TIME !!!!!!!!!

	NOTE2: The number of existing pages of images depends on the size of the batch of images 
	to be dl'ded ('numOfItemsToDl' above). If you take 100 images at a time, there
	should in theory be about 160 pages of shirts, for example... The search sometimes 
	returns way less items than you ask for, though. EDIT: and now only 50 max for some reason...
	*/

	const promises = [];

	for (let i = 0; i < searchArray.length; i++) {

		promises.push(getItems(searchArray[i][0], searchArray[i][1], numOfImages, pageNum));
	}

	const resultsArray = await Promise.all(promises);

	const rLength = resultsArray.length;
	const sLength = searchArray.length - 1;
	let j = 0;

	for (let i = 0; i < rLength; i++) {

		// searchArray contains 6 items, so the index to obtain the correct categoryName must loop around
		if (j > sLength) {
			j = 0;
		}

		let categoryName = searchArray[j][1];
		j++;
	
		// pretty damn 'loopy' solution, but we need the relevant categoryName for this call, and it's not returned with the results.
		// another option would be to add the categoryName to the result (either return an object with that field and an array field 
		// instead of a 'plain' array -- OR add the category field to every ImageObj just for this one use), but I'm not sure if either is really a better solution.
		realm.saveMany(REALM_PATH, resultsArray[i], categoryName);
	}
} // end doFetch()

// it both downloads the images and returns the objects that contain the local urls, 
// which breaks separation of concerns... meh, it was highly convenient and we only need to do this a few times.
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

// could be in some utils file I guess,,, meh, it's short enough
function createImageFolders() {

	const imgFolderPaths = PATHS.IMAGE_FOLDER_PATHS;

	imgFolderPaths.map(path => {
	
		fse.ensureDir(path, err => {
			console.log(err) // => prints 'null' if it succeeds
		})
	});
} // end createImageFolders()
