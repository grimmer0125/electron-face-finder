'use strict';

var constants = require('./constants');

module.exports = {
	processSpecialCharacter: function(str){

		if (process.platform === "darwin"){
			str = encodeURIComponent(str).replace(/%2F/g, "/");
		} else if (process.platform === "win32"){
		  str = encodeURIComponent(str).replace(/%3A/g, ":").replace(/%5C/g, "\\");
		}

		return str;
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
