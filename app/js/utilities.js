'use strict';

var constants = require('./constants');

module.exports = {
	processSpecialCharacter: function(str){
		// var str = "Visit Microsoft!";
		//連/都變成%2f http://www.w3schools.com/tags/ref_urlencode.asp


		// console.log("a:", encodeURIComponent(str));

		// console.log("b:", encodeURI(str));

		// var res = str.replace(/%/g, "%25");
		// res = res.replace(/#/g, "%23");
		var res = encodeURIComponent(str).replace(/%2F/g, "/");
		// console.log("final:", res);

		return res;
	},
	isSupportedImageFile: function(file) {
		var extension = path.extname(file);
		if(extension) {
			extension = extension.slice(1); // remove the dot
			extension = extension.toLowerCase();
			return constants.SupportedImageExtensions.indexOf(extension) !== -1;
		}

		// no extension
		return false;
	}
}
