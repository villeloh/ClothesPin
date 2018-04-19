"use strict";

/**
 * Category Model (for use in storing the images + prices to the database)
 * @author Ville Lohkovuori
 * 04 2018
 */

 var categoryObjModule = (function() {

    var CategoryObj = function (name, arrayOfImages) {
	
        this.name = name;
        this.images = arrayOfImages;
    };

    return { CategoryObj: CategoryObj }
}());

 module.exports =  categoryObjModule;
