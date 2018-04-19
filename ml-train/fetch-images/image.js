"use strict";

/**
 * Image Model (for use in storing the images + prices to the database)
 * @author Ville Lohkovuori
 * 03/04 2018
 */

 var imageObjModule = (function() {

    var ImageObj = function (url, price) {
	
        this.url = url;
        this.price = price;
    };

    return { ImageObj: ImageObj }
}());

 module.exports = imageObjModule;
