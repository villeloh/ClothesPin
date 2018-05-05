'use strict';

/**
 * Convert the objects that are stored in the Realm database to a format that is 
 * readable with Python; i.e., a .json file.
 * @author Ville Lohkovuori
 * 04/05 2018
 */

const jf = require('jsonfile');
const retrieveCats = require('../data-store/realm-db/realm-ops').retrieveAllCategories;
const PATHS = require('../paths').JSON_PATHS;

const REALM_PATH = PATHS.REALM_PATH;

// it's overwritten each time, and made to exist if it doesn't -- perfect for our purposes!
// const file = '/Users/VilleL/Desktop/backend/ClothesPin/src/data-store/data.json';
const filePath = PATHS.SAVE_PATH;

const cats = retrieveCats(REALM_PATH);

jf.writeFile(filePath, cats, {spaces: 2, EOL: '\r\n'}, function (err) {
    console.error(err)
});
