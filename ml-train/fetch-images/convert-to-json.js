'use strict';

/**
 * Convert the objects that are stored in the Realm database to a format that is 
 * readable with Python; i.e., a .json file.
 * @author Ville Lohkovuori
 * 04 2018
 */

const Realm = require('realm');
const jf = require('jsonfile');

// some duplicate code here; these should be moved to a single file,
// but time is of the essence and modules are a bitch in node, it seems
const imageObjModule = require('./image.js');
const ImageObj = imageObjModule.ImageObj;

const categoryObjModule = require('./category.js');
const Category = categoryObjModule.CategoryObj;

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

// it's overwritten each time, and made to exist if it doesn't -- perfect for our purposes!
// const file = '/Users/VilleL/Desktop/backend/ClothesPin/ml-train/fetch-images/data.json';
const file = '/Users/iosdev/Desktop/backend/ClothesPin/ml-train/fetch-images/data.json';

imageRealm.write(() => {

    const cats = imageRealm.objects('Category');

    jf.writeFile(file, cats, {spaces: 2, EOL: '\r\n'}, function (err) {
        console.error(err)
    });
});
