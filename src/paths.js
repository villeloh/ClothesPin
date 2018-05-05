'use strict';

/**
 * There were a lot of folder paths that changed throughout the project,
 * causing various issues. I should've made this file ages ago as a 
 * band-aid against this... The main culprit were a few downloaded
 * modules that needed absolute file-paths. Ehh, better
 * late than never.
 * @author Ville Lohkovuori
 * 05 2018
 */

const user = {};

user.name = 'VilleL';

function setUserPaths(absRootImgFolder, rootDestFolder, jsonFileSavePath) {

    user.absRootImgFolder = absRootImgFolder;
    user.rootDestFolder = rootDestFolder;
    user.jsonFileSavePath = jsonFileSavePath;
}

switch(user.name) {

    case 'VilleL':

        setUserPaths(
            'MACOS_SIERRA/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/', 
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/',
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/data.json'
        );
        break;

    case 'VilleL_PC':

        setUserPaths(
            'C:/Users/VilleL/Desktop/backend/ClothesPin/src/data-store/images/', 
            '/Users/VilleL/Desktop/backend/ClothesPin/src/data-store/images/',
            '/Users/VilleL/Desktop/backend/ClothesPin/src/data-store/data.json'
        );
        break;

    case 'LongThai':

        setUserPaths(
            'xxx', 
            'xxx',
            'xxx'
        );
        break;

    case 'ManhTranDuc':

        setUserPaths(
            'xxx', 
            'xxx',
            'xxx'
        );
        break;

    case 'TimiL':

        setUserPaths(
            'MACOS_SIERRA/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/', 
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/',
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/data.json'
        );
        break;

    default:

        // VilleL's paths
        setUserPaths(
            'MACOS_SIERRA/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/', 
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/images/',
            '/Users/iosdev/Desktop/backend/ClothesPin/src/data-store/data.json'
        );
        break;
}

// local-server.js
exports.SERVER_PATHS = {

PORT: process.env.PORT || 5000,
REALM_PATH: '../data-store/realm-db/images.realm',
ROOT_IMAGE_FOLDER: '../data-store/images/'
};

// fetch-images.js
exports.FETCH_PATHS = {

REALM_PATH: '../data-store/realm-db/images.realm',
BASE_API_URL: 'https://api.huuto.net/1.1/',
ABS_ROOT_IMG_FOLDER: user.absRootImgFolder,
ROOT_DEST_FOLDER : user.rootDestFolder,
IMAGE_FOLDER_PATHS: [
    '../data-store/images/shirts', 
    '../data-store/images/coats', 
    '../data-store/images/shoes', 
    '../data-store/images/pants', 
    '../data-store/images/hats', 
    '../data-store/images/gloves'
    ]
};

// convert-to-json.js
exports.JSON_PATHS = {

    REALM_PATH: '../data-store/realm-db/images.realm',
    SAVE_PATH: user.jsonFileSavePath
}
