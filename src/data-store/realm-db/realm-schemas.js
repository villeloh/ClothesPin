'use strict';

/**
 * Schemas for use with the Realm database
 * @author Ville Lohkovuori
 * 05 2018
 */

exports.ImageObjSchema = {
    name: 'ImageObj',
    properties: {
      url:  'string',
          price: 'float'
    }
  };
  
  exports.CategorySchema = {
    name: 'Category',
    properties: {
          name:  'string',
          images: 'ImageObj[]'
    }
  };
  