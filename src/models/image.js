'use strict';

/**
 * Image Model (for use in storing the images + prices to the database)
 * @author Ville Lohkovuori
 * 03-05 2018
 */

exports.ImageObj = function(url, price) {

    this.url = url;
    this.price = price;
};
