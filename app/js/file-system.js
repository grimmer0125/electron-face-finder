'use strict';
var utilities = require('./utilities');
var _ = require('lodash');

module.exports = {
	getDirectoryImageFiles: function(dir) {
		console.log('select dir:', dir);
		var files = fs.readdirSync(dir);
		// console.log('all files:', files);
		var fullFilePaths = _.map(files, function(fileName) {
			return path.join(dir, fileName);
		});

		var imageFiles = _.filter(fullFilePaths, utilities.isSupportedImageFile);

		return imageFiles;
	},
	getAllImageFiles: function(dir) {

		console.log('select dir:', dir);
		var imageFiles = [];

		getImages(dir, imageFiles);
		console.log('all:', imageFiles);
		// var imageFiles = _.filter(fullFilePaths, utilities.isSupportedImageFile);

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
			images.push(file);
			// console.log("file is image file:", file);
		} else if (isDirectory(file)){
			getImages(file, images);
			// console.log("file is folder:", file);
		}
	}
}

function isDirectory(path){
	return fs.statSync(path).isDirectory();
}

// function getSubDirectories(srcpath) {
// 	return fs.readdirSync(srcpath).filter(function(file) {
// 		return fs.statSync(path.join(srcpath, file)).isDirectory();
// 	});
// }
