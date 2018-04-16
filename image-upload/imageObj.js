"use strict";

/**
 * Server-side Image Model
 * @author Ville Lohkovuori
 * 03 2018
 */

 // 'title' is for lab purposes; it should be changed to 'price' for the actual used objects
 var imageObjModule = (function() {

    var ImageObj = function (title, fileUrl) {

        this.title = title;
        this.fileUrl = fileUrl;
    };

    // example of adding a method:
    /*
    Animal.prototype.print = function () {
        console.log('Name is :'+ this.name);
    };
    */

    return { ImageObj: ImageObj }
}());

 module.exports = imageObjModule;
