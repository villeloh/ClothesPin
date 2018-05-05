'use strict';

/**
 * Operations for using the Realm database
 * @author Ville Lohkovuori
 * 05 2018
 */

const Realm = require('realm');

const ImageObjSchema = require('./realm-schemas').ImageObjSchema;
const CategorySchema = require('./realm-schemas').CategorySchema;
const Category = require('../../models/category').CategoryObj;
const ImageObj = require('../../models/image').ImageObj;

const ensureRealm = (realmPath) => {

    return new Realm({
        path: realmPath,
        schema: [ImageObjSchema, CategorySchema]
      });
}

exports.saveImgObj = (realmPath, imageObj, categoryName) => {

    const imageRealm = ensureRealm(realmPath);

    // we'll assume that only valid data comes from the client, so, no checks are needed...
	imageRealm.write(() => {

		// apparently backticks are a no-no here... looks weird but it works, so, whatever
		let cat = imageRealm.objects('Category').filtered('name = ' + '"' + categoryName + '"')[0];

        cat.images.push(imageObj);			
        console.log("wrote object to existing Realm category!");
	}); // end write()
} // end saveImgObj()

exports.retrieveObjects = (realmPath, categoryName) => {

    const imageRealm = ensureRealm(realmPath);

    let cat;

    imageRealm.write(() => {

		  cat = imageRealm.objects('Category').filtered('name = ' + '"' + categoryName + '"')[0];
    }); // end write()
    
    return cat.images.slice(0, 50); // return first 50 objects	
} // end retrieveObjects()

exports.saveMany = (realmPath, arrayOfImageObjs, category) => {

    const imageRealm = ensureRealm(realmPath);

	imageRealm.write(() => {

		// apparently backticks are a no-no here... looks weird but it works, so, whatever
		let existingCat = imageRealm.objects('Category').filtered('name = ' + '"' + category + '"')[0];

		if (existingCat === null || existingCat === undefined) {
		
			const newCat = new Category(category, arrayOfImageObjs);

			imageRealm.create('Category', {name: newCat.name, images: newCat.images});
			console.log("wrote new category to Realm!");

		} else {

			arrayOfImageObjs.forEach(imageObj => {

				existingCat.images.push(imageObj);			
				console.log("wrote objects to existing Realm category!");
			});
		}	
	}); // end write()
} // end saveMany()

exports.retrieveAllCategories = (realmPath) => {

	const imageRealm = ensureRealm(realmPath);

	let cats;

	imageRealm.write(() => {

		cats = imageRealm.objects('Category')[0]; // why it's an array only God can tell... -.-
	});
	return cats;
} // end retrieveAllCategories()
