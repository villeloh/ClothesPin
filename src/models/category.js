'use strict';

/**
 * Category Model (for use in storing the images + prices to the database)
 * @author Ville Lohkovuori
 * 04/05 2018
 */

exports.CategoryObj = function (name, arrayOfImages) {
	
    this.name = name;
    this.images = arrayOfImages;
};
