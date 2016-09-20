'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var remote = require('remote');
var dialog = remote.require('dialog');
var ipc = require('ipc');

var fileSystem = require('./js/file-system');
var constants = require('./js/constants');

var client = require('./js/ws-client');
client.createSocket("ws:" + "//localhost" + ":9000", "ws");

// for testing
var getPixels = require("get-pixels")

// jquery selectors
var $currentImage = $('#currentImage'),
	$previous = $('#previous'),
	$next = $('#next'),
	$directoryStats = $('#directoryStats'),
	$openFile = $('#open-file'),
	$controlPanel = $('#control-panel'),
	$rotateLeft = $('#rotate-left'),
	$rotateRight = $('#rotate-right');

// the list of all retrieved files
var imageFiles = [],
	currentImageFile = '',
	currentDir = '';

// added by grimmer
var sourceFilePath = null;
var candidateImageList = [];
var CompareType = {
	SOURCE: "COMPARE_SOURCE",
	TARGET: "COMPARE_TARGET"
};

var MatchStatus = {
	NOTSTART: 0,
	STARTING: 1,
	MATCH: 2,
	NOTMATCH: 3
};

// imageFile
// name:
// 	imgObj:


var toggleButtons = function(hasSelectedImage) {
	// disable buttons?
	if (hasSelectedImage) {
		$openFile.hide();
		$currentImage.show();
		$controlPanel.show();
	} else {
		$openFile.show();
		$currentImage.hide();
		$controlPanel.hide();
	}
};

var getImageMatchResult = function(data) {
	console.log("getImageMatchResult");
	var ifMatch = null,
		imagePath = null;
	if (data.hasOwnProperty("ifMatch")) {
		ifMatch = data.ifMatch;
	}
	if (data.hasOwnProperty("imagePath")) {
		imagePath = data.imagePath;
	}

	if (ifMatch !== null && imagePath != null) {
		var len = candidateImageList.length;
		for (var i = 0; i < len; i++) {
			var imageInfo = candidateImageList[i];
			if (imageInfo.imagePath == imagePath) {

				if (ifMatch) {
					imageInfo.status = MatchStatus.MATCH;
					imageFiles.push(imageInfo.imagePath)

					// try to show the image
					if (imageFiles.length == 1) {
						var selectedImageIndex = 0;
						console.log('to show image !!!');
						showImage(selectedImageIndex);
					}

					// var selectedImageIndex = imageFiles.indexOf(fileName);
					// if (selectedImageIndex === -1) {
					// 	selectedImageIndex = 0;
					// }
					// console.log("index:%s, length:%s", selectedImageIndex, imageFiles);
					//
					// if (selectedImageIndex < imageFiles.length) {
					// 	showImage(selectedImageIndex);
					// } else {
					// 	alert('No image files found in this directory.');
					// }

				} else {
					imageInfo.status = MatchStatus.NOTMATCH;
				}
			}
		}
	}

}
client.registerReceiveHandler(getImageMatchResult);

var getImageThenSendToServer = function(imagePath, type) {

	console.log("get image then send to server,type:%s", type);
	var t1 = new Date().getTime();

	var imageObj = new Image();
	// imageObj.src = imageFiles[index];
	imageObj.src = imagePath;

	imageObj.onload = function() {

		var t2 = new Date().getTime();
		console.log("loading consumes:", (t2 - t1));

		//var imageObj = document.getElementById("currentImage");
		// var imageObj = $currentImage[0];
		var canvas = document.createElement('canvas');
		canvas.width = imageObj.width;
		canvas.height = imageObj.height;
		var context = canvas.getContext('2d');
		context.drawImage(imageObj, 0, 0);
		// var imageData = context.getImageData(0, 0, imageObj.width, imageObj.height);
		// console.log('imageData:', imageData);

		//encoding jpeg and base64, can use this https://www.npmjs.com/package/get-pixels later
		var dataURL = canvas.toDataURL('image/jpeg', 0.5)
		var t3 = new Date().getTime();
		console.log("image obj -> canvas -> jpeg.", (t3 - t2));
		console.log('path:%s;image width:%s', imagePath, imageObj.width);

		var data = {
			imagePath: imagePath,
			type: type,
			dataURL: dataURL,
			width: canvas.width,
			height: canvas.height
		};

		client.sendData(JSON.stringify(data));
	};

}

// Shows an image on the page.
var showImage = function(index) {
	toggleButtons(true);

	setRotateDegrees(0);
	$currentImage.data('currentIndex', index);

	var imageObj = new Image();
	imageObj.src = imageFiles[index]; //'http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg';
	imageObj.onload = function() {

		// var grimmer2 = new Date().getTime();
		// var v2 = grimmer2 - grimmer1;
		// console.log("loading consumes:", v2);

		$currentImage[0].src = imageObj.src;
		// $currentImage.attr('src', imageFiles[index]).load(function() {
		console.log('show current image:', currentImageFile);
		currentImageFile = imageFiles[index];

		// Hide show previous/next if there are no more/less files.
		// $next.toggle(!(index + 1 === imageFiles.length));
		// $previous.toggle(!(index === 0));

		// set the stats text
		var statsText = (index + 1) + ' / ' + imageFiles.length;
		$directoryStats.text(statsText);

		ipc.send('image-changed', currentImageFile);
	};

};

var onPreviousClick = function() {
	var currentImageId = $currentImage.data('currentIndex');
	if (currentImageId > 0) {
		showImage(--currentImageId);
	} else {
		// we're at 0 -> move to the end.
		showImage(imageFiles.length - 1);
	}
};

$previous.click(onPreviousClick);

var onNextClick = function() {
	var currentImageId = $currentImage.data('currentIndex');
	if (currentImageId + 1 < imageFiles.length) {
		showImage(++currentImageId);
	} else {
		// we're at the end - next is the beginning
		showImage(0);
	}
};

$next.click(onNextClick);

// Show image in Full screen on double click
var fullscreenButton = document.getElementById("currentImage");
fullscreenButton.addEventListener("dblclick", toggleFullScreen, false);

function toggleFullScreen() {
	if (!document.fullscreenElement && !document.webkitFullscreenElement) { // current working methods
		if (document.documentElement.requestFullscreen) {
			document.documentElement.requestFullscreen();
		} else if (document.documentElement.webkitRequestFullscreen) {
			document.documentElement.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}
	} else {
		if (document.exitFullscreen) {
			document.exitFullscreen();
		} else if (document.webkitExitFullscreen) {
			document.webkitExitFullscreen();
		}
	}
}

function testArrayBufferJSON(imageFile) {
	getPixels(imageFile, function(err, pixels) {
		if (err) {
			console.log("Bad image path")
			return
		}
		console.log("got pixels:", pixels.shape.slice())

		var data = {
			type: 'COMPARE',
			data: pixels.data,
			shape: pixels.shape
				// width: canvas.width,
				// height: canvas.height
		};
		var sendData = JSON.stringify(data);
		console.log("after jsoned pixels:", sendData.length);
		client.sendData(sendData);
		console.log("after send");
	})

}

var _loadDir = function(dir, fileName) {

	// for testing
	// if (true) {
	// 	testArrayBufferJSON(fileName);
	// 	return;
	// }

	currentDir = dir;
	// imageFiles = fileSystem.getDirectoryImageFiles(dir);
	var tmpImageList = fileSystem.getDirectoryImageFiles(dir);
	console.log("get candidate image files:", imageFiles);

	if (sourceFilePath) {

		var num_Images = tmpImageList.length;
		console.log("open target folder, length:%s", num_Images);

		if (num_Images == 0) {
			alert('No image files found in this directory.');
			return;
		}

		//try to send by ws
		console.log("test!! open folder and send ");
		for (var i = 0; i < num_Images; i++) {
			var selectedImage = tmpImageList[i];
			getImageThenSendToServer(selectedImage, CompareType.TARGET);

			var imageInfo = {
				status: MatchStatus.STARTING,
				imagePath: selectedImage
			};

			candidateImageList.push(imageInfo);
		}
		console.log("test!! end open folder  ");
	} else {
		alert('No set source image yet');
		return;
	}
}

var onOpenSource = function(filePath) {
	//renderer
	console.log('open Source, process type:', process.type);

	sourceFilePath = filePath + '';

	getImageThenSendToServer(sourceFilePath, CompareType.SOURCE);

	// filePath = filePath + ''; // convert to string
	// var stat = fs.lstatSync(filePath);
	// if (stat.isDirectory()) {
	// 	onDirOpen(filePath);
	// } else {
	// 	onFileOpen(filePath);
	// }
};

var onOpen = function(filePath) {

	filePath = filePath + ''; // convert to string
	var stat = fs.lstatSync(filePath);
	if (stat.isDirectory()) {
		onDirOpen(filePath);
	} else {
		onFileOpen(filePath);
	}
};

var onFileOpen = function(fileName) {
	fileName = fileName + ''; // convert to string.
	var dirName = path.dirname(fileName);

	_loadDir(dirName, fileName);
};

var onDirOpen = function(dir) {
	_loadDir(dir + ''); // convert to string
};

var onFileDelete = function() {
	// file has been deleted, show previous or next...
	var index = imageFiles.indexOf(currentImageFile);
	if (index > -1) {
		imageFiles.splice(index, 1);
	}
	if (index === imageFiles.length) index--;
	if (index < 0) {
		// no more images in this directory - it's empty...
		toggleButtons(false);
	} else {
		showImage(index);
	}
};

var getCurrentFile = function() {
	return currentImageFile;
};

var setRotateDegrees = function(deg) {
	$currentImage.css({
		'-webkit-transform': 'rotate(' + deg + 'deg)',
		'-moz-transform': 'rotate(' + deg + 'deg)',
		'-ms-transform': 'rotate(' + deg + 'deg)',
		'-o-transform': 'rotate(' + deg + 'deg)',
		'transform': 'rotate(' + deg + 'deg)',
		'zoom': 1
	});

	$currentImage.data('rotateDegree', deg);
};

var onRotate = function(rotationDegrees) {
	// get current degree and rotationDegrees
	var deg = $currentImage.data('rotateDegree') || 0;
	deg -= rotationDegrees;

	setRotateDegrees(deg);
};

$rotateLeft.click(function() {
	onRotate(-90);
});

$rotateRight.click(function() {
	onRotate(90);
});

// Initialize the app
var initialize = function() {
	var appMenu = require('./js/app-menu');
	appMenu.initialize({
		onOpenSource: onOpenSource,
		onOpen: onOpen,
		onFileDelete: onFileDelete,
		getCurrentFile: getCurrentFile
	});

	// no files selected
	toggleButtons(false);

	$openFile.click(function() {
		// TODO: Refactor this... code duplication
		dialog.showOpenDialog({
				properties: [
					'openFile',
					'openDirectory'
				],
				filters: [{
					name: 'Images',
					extensions: constants.SupportedImageExtensions
				}]
			},
			function(fileName) {
				if (fileName) {
					onOpen(fileName);
				}
			});
	});

	// handle navigation from left/right clicks
	$(window).keydown(function(ev) {
		ev.keyCode === constants.LeftKey && onPreviousClick();
		ev.keyCode === constants.RightKey && onNextClick();
	});
};
initialize();
