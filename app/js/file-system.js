'use strict';
var utilities = require('./utilities');
var _ = require('lodash');

module.exports = {
	getAllImageFiles: function(dir) {

		console.log('select dir:', dir);
		var imageFiles = [];

		getImages(dir, imageFiles);

		return imageFiles;
	}

};

function getImages(dir, images){
	var files = fs.readdirSync(dir);
	var fullFilePaths = _.map(files, function(fileName) {
		return path.join(dir, fileName);
	});
	for (let file of fullFilePaths){
		if(utilities.isSupportedImageFile(file)){
			images.push(utilities.processSpecialCharacter(file));
			// console.log("file is image file:", file);
		} else if (isDirectory(file)){
			getImages(file, images);
			// console.log("file is folder:", file);
		}
	}
}

function isDirectory(path){
	var answer = false;
	try {
		answer = fs.statSync(path).isDirectory();
	} catch(err) {
		console.log("statSync err happen:", err);
	}
	return answer;
}
