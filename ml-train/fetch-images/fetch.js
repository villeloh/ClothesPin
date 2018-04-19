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

const imageObjModule = require('./image.js');
const ImageObj = imageObjModule.ImageObj;

const categoryObjModule = require('./category.js');
const Category = categoryObjModule.CategoryObj;

const BASE_API_URL = 'https://api.huuto.net/1.1/';
const ABS_ROOT_IMG_FOLDER = 'C:/Users/VilleL/Desktop/ClothesPin/ml-train/fetch-images/images/'; // used when making the image objects. this needs to be changed for it to work on your computer (duh)
const ROOT_DEST_FOLDER = '/Users/VilleL/Desktop/ClothesPin/ml-train/fetch-images/images/'; // used when dl'ding the images... it hides the 'C:' for some reason. -.- again, change this for yourself

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
  path: 'image.realm',
  schema: [ImageObjSchema, CategorySchema]
});

// *************************** DL THE IMAGES & SAVE THEM TO THE DB ******************************************************************************************************************

// there's some complications (stuff becomes undefined) if we try to dl more than 400 items at once, despite the 'await' keyword. 
// it's not too big of a deal if we can figure out how to add items to existing categories.
const numOfItemsToDl = 400; 

// just uncomment the one that you want to do... I tried mucking about with Promise.all to do 
// all of these at once, but it seems I just can't get it right. You *could* try to run these 
// one after the other, but the database might have some sync issues because of it... I'd do these
// one by one, just to be safe.

doFetch('paita', 'shirts', numOfItemsToDl);
// doFetch('takki', 'coats', numOfItemsToDl);
// doFetch('housut', 'pants', numOfItemsToDl);
// doFetch('kengät', 'shoes', numOfItemsToDl);
// doFetch('hattu', 'hats', numOfItemsToDl);

// it's needed as a wrapper function in order to use the 'await' keyword
async function doFetch(term, categoryName, numOfImages) {
	
	const images = await getItems(term, categoryName, numOfImages);
	
	saveToRealmDb(images, categoryName);
}

// it both downloads the images and returns the objects that contain the local urls, 
// which breaks separation of concerns... meh, it was highly convenient and we only need to do this once.
function getItems(term, category, numOfImages) {
	
	const items = [];
	
	return fetch(BASE_API_URL + `items?words=${term}&category=561&sellstyle=buy-now&limit=500`) // category 561 = 'clothing'; it can be hard-coded as it never changes
    .then(response => {
		if (response.ok) {
			return response.json();
		}
    })
    .then(myJson => {
		
		const someItems = [];
		
		for (let i = 0; i < numOfImages; i++) {
			
			someItems.push(myJson.items[i]);
		}
			
		someItems.map(item => {
			
			// it seems the 'images' array can be undefined for some items
			if (item.images[0]) {
				
				const dlUrl = item.images[0].links.thumbnail; // 'thumbnail' = 140 x 140 pixel image; 'medium' varies, but is usually something like 400-600 x 400-600 px
				
				const options = {
					url: dlUrl,
					dest: ROOT_DEST_FOLDER + category // keeps the old image name
				}
				
				download.image(options)
			    .then(({ filename, image }) => {
					console.log('File saved to', filename)
			    }).catch((err) => {
					console.log(err.message);
			    });
				
				// changing the image url to point to the locally saved image. 
				// there's probably a simpler way to do this, but rn my brain can't seem to think of it
				const urlSplit = dlUrl.split('.');
				const imageName = urlSplit[urlSplit.length-2];
				const png = urlSplit[urlSplit.length-1];
				const imageNameDotPng = imageName + '.' + png;
				
				const localUrl = ABS_ROOT_IMG_FOLDER + category + '/' + imageNameDotPng; // save it in a local folder under .../images/
				const price = item.buyNowPrice * 0.9; // the 'real' sale prices are always a bit lower than those on the listed items
				
				const img = new ImageObj(localUrl, price);
				
				items.push(img);
			} // end if
		}); // end map()
		
		return items;
	})
	.catch(error => console.log(error.message));
} // end getItems()

function saveToRealmDb(arrayOfImageObjs, categoryName) {
	
	const cat = new Category(categoryName, arrayOfImageObjs); // for now, it creates a new category each time, preventing us from adding images to existing ones... TODO: fix asap!

	imageRealm.write(() => {
		imageRealm.create('Category', {name: cat.name, images: cat.images});
		console.log("wrote category to Realm!");
	});
} // end saveToRealmDb()
