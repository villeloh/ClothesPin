'use strict';

/**
 * Server-side Image Model (NOTE: not used atm, but it will be once everything is properly set up with a db on the server)
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
