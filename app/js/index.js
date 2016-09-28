'use strict';

console.log("os:", process.platform)
// darwin

var utilities = require('./js/utilities');

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var remote = require('remote');
var dialog = remote.require('dialog');
var ipc = require('ipc');

var fileSystem = require('./js/file-system');
var constants = require('./js/constants');

var client = require('./js/ws-client');
client.createSocket();


// var //console.log;

// for debugging
if (process.env.NODE_ENV == "debug" || process.env.NODE_ENV == "dev"){
	//console.log("require getpixels");
	var getPixels = require("get-pixels")
	// //console.log = function(log){
		// //console.log(arguments);
	// } ;
}	else {
	// //console.log = function(log){
	// };
}



// jquery selectors
var $currentImage = $('#currentImage'),
	$sourceImage = $('#sourceImage'),
	$previous = $('#previous'),
	$next = $('#next'),
	$directoryStats = $('#directoryStats'),
	$openFile = $('#open-file'),
	$openFileSource = $('#open-file-source'),
	$controlPanel = $('#control-panel'),
	$rotateLeft = $('#rotate-left'),
	$rotateRight = $('#rotate-right');

// the list of all retrieved files
var imageFiles = [],
	currentImageFileIndex = -1,
	currentDir = '';

// added by grimmer
var sourceFilePath = "";
var waittingImageList = [];
var handlingOrHandledImageList = [];
var handledNumber = 0;
var CompareType = {
	SOURCE: "COMPARE_SOURCE",
	TARGET: "COMPARE_TARGET"
};
var MatchStatus = {
	NOTSTART: 0,
	STARTING: 1,
	MATCH: 2,
	NOTMATCH: 3,
	NOFACE: 4,
	LOADFAIL:5
};
var t1, t2, t3;
var imageObj, canvas, showImageObj, context;


function resetWhenGetNoFaceSourceInfo(){
	sourceFilePath = -1;
	$sourceImage[0].src = null;
}

function resetAllImagesStatusWhenTarget(){
	currentImageFileIndex = -1;
	imageFiles = [];

	// reset handling
	// step1: copy data to waitting, no need this step
	// step2:
	handlingOrHandledImageList = [];
	handledNumber = 0;

	// reset total
	waittingImageList = [];
}

function resetAllImagesStatus() {

	currentImageFileIndex = -1;
	imageFiles = [];

	// reset handling
	// step1: copy data to waitting
	var len = handlingOrHandledImageList.length;
	for (var i=0; i<len; i++){
		var imageInfo = handlingOrHandledImageList[i];
		waittingImageList.push(imageInfo.imagePath);
	}

	// step2:
	handlingOrHandledImageList = [];
	handledNumber = 0;

	return;
}

// function onlyUpdateHandledText(){
//
// }

function updateStatusText() {
	// var index = imageFiles.indexOf(currentImageFileIndex);
	// var currentImage = (index + 1);
	// var totalMatched = imageFiles.length;
	// var totalFiles = (waittingImageList.length+handlingOrHandledImageList.length);
	// var totalHandled = countHandledImages();
	//handling includes failed
	var totalHandling = handlingOrHandledImageList.length;

	var statsText =              "Matched: "+
	                            (currentImageFileIndex + 1) + 'th/' +
	                      imageFiles.length + ". Total: " +
	  (waittingImageList.length+totalHandling) + ". Handled: " +
		            handledNumber + "";

	$directoryStats.text(statsText);
}

// function countHandledImages() {
//
// 	var count = 0;
// 	var len = handlingOrHandledImageList.length;
// 	for (var i = 0; i < len; i++) {
// 		var imageInfo = handlingOrHandledImageList[i];
// 		if (imageInfo.status != MatchStatus.STARTING) {
// 			count++;
// 		}
// 	}
//
// 	return count;
// }
//
// 	//                    MatchStatus.STARTING
// 	// imageInfo.status = MatchStatus.NOTMATCH;
// 	// imageInfo.status = MatchStatus.NOFACE;
//
// 	return count;
// }


function receiveSourceImageInfo(data){
	// if (data.hasOwnProperty("type") && data.type == CompareType.SOURCE) {

	//console.log("Res: source info!!");

	if (data.representationStatus == false) {
		//console.log("Res: source representation info fail!!!");

		alert('Can not find any face in the source image. please select again');
		resetWhenGetNoFaceSourceInfo();
		return;
	}


	//console.log("selected source, now start to match");
	getNextImageToHandle();

	// var num_Images = waittingImageList.length;
	// if (num_Images > 0) {

		// 理論上如果server是非同步, 那不一定, 但應該實際上會是這樣沒錯, 不然就是選到空的folder

		// for (var i = 0; i < num_Images; i++) {
		// 	var selectedImageInfo = waittingImageList[i];
		// 	getImageThenSendToServer(selectedImageInfo.imagePath, CompareType.TARGET);
		// 	selectedImageInfo.status = MatchStatus.STARTING;
		// }
		// //console.log("open folder before selecting source, end sending all match data");
	// }
}

function receiveTargetImageInfo(data){

	// var ifMatch = null,
	// 	imagePath = null;
	// if (data.hasOwnProperty("ifMatch")) {
	// 	ifMatch = data.ifMatch;
	// }
	// if (data.hasOwnProperty("imagePath")) {
	// 	imagePath = data.imagePath;
	// }

	if (data.hasOwnProperty("ifMatch") && data.ifMatch !== null &&
	    data.hasOwnProperty("imagePath") && data.imagePath != null) {

		var ifMatch = false;
		var len = handlingOrHandledImageList.length;
		for (var i = 0; i < len; i++) {
			var imageInfo = handlingOrHandledImageList[i];
			if (imageInfo.imagePath == data.imagePath) {

				handledNumber++;

				// match時一定會讓 matched +1 / total / handling
				if (data.ifMatch) {
					imageInfo.status = MatchStatus.MATCH;
					imageFiles.push(imageInfo.imagePath)

					// try to show the image
					if (imageFiles.length == 1) {
						// var selectedImageIndex = 0;
						//console.log('to show image !!!');

						showImage(0);
					}
					else {
						updateStatusText();
					}
				} else {

					imageInfo.status = MatchStatus.NOTMATCH;

					if (data.representationStatus == false) {
						imageInfo.status = MatchStatus.NOFACE;
					}

					updateStatusText();
				}

				ifMatch = true;
				break;
			}
		}

		if (ifMatch) {
			if (handledNumber%10==0){
				console.log("get 10 more images handled and next");
			}
			getNextImageToHandle();
		}
	}
}

function imageInfoReceiver(data) {

	if (data.hasOwnProperty("type")==false) {

		//console.log("Res: type property is missing !!!");
		return;
	}

	if(data.type == CompareType.SOURCE){
		receiveSourceImageInfo(data);
		return;
	}

	//console.log("Res: target afterCompare");

	receiveTargetImageInfo(data);
}
client.registerReceiveHandler(imageInfoReceiver);

function getImageThenSendToServer(imageInfo, type) {
	// //console.log("process type0:", process.type)

	// var imagePath = imageInfo.imagePath;
	//console.log("get image then send to server,type:%s;%s", type, imageInfo.imagePath);
	// if(!t1){
	// 	t1 = new Date().getTime();
	// }

	if(!imageObj){
		imageObj = new Image();
	}

	//如果是放在上面new Image()裡, 則type就只是第一次的值而已, 不會變
	imageObj.onerror = handleLoadError;
	imageObj.onload = handleLoadOK;

	imageObj.src = imageInfo.imagePath;

	function handleLoadError() {
		//console.log("image error:%s", imageObj);

		if (type == CompareType.TARGET) {
			// console.log("load target image fail");
			imageInfo.status = MatchStatus.LOADFAIL;
			handledNumber++;

			if (handledNumber%10==0){
				console.log("get 10 more images handled and next");
			}

			updateStatusText();
			getNextImageToHandle();
		} else {
			// resetWhenGetNoFaceSourceInfo();
			alert('source image file has load error, please change');
		}
	}

	// imageObj.onabort = function() {
	// 	//console.log("image abort:%s", imageObj);
	//
	// 	if (type == CompareType.TARGET) {
	// 		//console.log("load target image fail and continue");
	// 		getNextImageToHandle();
	// 	} else {
	// 		resetWhenGetNoFaceSourceInfo();
	// 		alert('source image file has error, please change');
	// 	}
	// };

	// var str = "Visit Microsoft!";
  // var res = str.replace("Microsoft", "W3Schools");


	function handleLoadOK() {

		//console.log("type:", type)

		// if(!t2){
		// 	t2 = new Date().getTime();
		// }

		// var imageObj = $currentImage[0];
		if(!canvas){
			canvas = document.createElement('canvas');
		  context = canvas.getContext('2d');
		}
		canvas.width = imageObj.width;
		canvas.height = imageObj.height;
		context.drawImage(imageObj, 0, 0);

		// var imageData = context.getImageData(0, 0, imageObj.width, imageObj.height);
		// //console.log('imageData:', imageData);

		var dataURL = canvas.toDataURL('image/jpeg', 0.5)

		// if(!t3){
		// 	t3 = new Date().getTime();
		// }

		//console.log('Image:%s. Width:%s,height:%s', imageInfo.imagePath, imageObj.width, imageObj.height);
		// //console.log("file ->image:%s;image obj -> jpeg:%s", (t2 - t1), (t3 - t2));

		var data = {
			imagePath: imageInfo.imagePath,
			type: type,
			dataURL: dataURL,
			width: canvas.width,
			height: canvas.height
		};

		client.sendData(data);

		if (type == CompareType.TARGET) {
			//console.log("load target image ok");
			// getNextImageToHandle();
		} else {
			//console.log("load source face ok then send ")
			// if(type == CompareType.SOURCE){
				// imageFiles = [];
				// currentImageFileIndex = '';
			resetAllImagesStatus();
			updateStatusText();
			sourceFilePath = imageInfo.imagePath;
			$sourceImage[0].src = sourceFilePath; //.src = sourceFilePath;//why not use sourceFilePath originally? filePath;
			// }

		}
	}
}

function getNextImageToHandle(){
	if (waittingImageList.length>0){
		//console.log("get file from waittingImageList ok")
		// var selectedImage = waittingImageList[0];

		var imageInfo = {
			imagePath: waittingImageList[0],
			status: MatchStatus.STARTING,
		};

		handlingOrHandledImageList.push(imageInfo);
		waittingImageList.shift();
		getImageThenSendToServer(imageInfo, CompareType.TARGET);
	} else {
		//console.log("waittingImageList is empty !!!")
	}
}

// Shows an image on the page.
function showImage(index) {
	toggleButtons(true);

	setRotateDegrees(0);
	$currentImage.data('currentIndex', index);

	if(!showImageObj){
		showImageObj = new Image();
	}
	showImageObj.src = imageFiles[index]; //'http://www.html5canvastutorials.com/demos/assets/darth-vader.jpg';
	showImageObj.onload = function() {

		$currentImage[0].src = showImageObj.src;
		// $currentImage.attr('src', imageFiles[index]).load(function() {
		currentImageFileIndex = index;//imageFiles[index];
		//console.log('show current image:', imageFiles[index]);

		// Hide show previous/next if there are no more/less files.
		// $next.toggle(!(index + 1 === imageFiles.length));
		// $previous.toggle(!(index === 0));

		// set the stats text
		updateStatusText();
		// var statsText = (index + 1) + ' / ' + imageFiles.length;
		// $directoryStats.text(statsText);

		ipc.send('image-changed', imageFiles[index]);
	};

};

var toggleButtons = function(hasSelectedImage) {
	// disable buttons?
	if (hasSelectedImage) {
		// $openFile.hide();
		$currentImage.show();
		$controlPanel.show();
	} else {
		$openFile.show();
		$currentImage.hide();
		$controlPanel.hide();
	}
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
			//console.log("Bad image path")
			return
		}
		//console.log("got pixels:", pixels.shape.slice())

		var data = {
			type: 'COMPARE',
			data: pixels.data,
			shape: pixels.shape
				// width: canvas.width,
				// height: canvas.height
		};
		var sendData = JSON.stringify(data);
		//console.log("after jsoned pixels:", sendData.length);
		client.sendData(sendData);
		//console.log("after send");
	})

}

// p.s 不管那一個方法最好還是加try catch for loading images

// 方法1:, 使用process.nextTick, 但說不定還是會爆掉.
//       從 run- all, callback1, callback2改成
// run1 -load run2 load run3 run-callback1

// 方法2: 得到每一張callback後才去處理下一張, 可能會ok, 但萬一onload因為莫名的原因沒有被trigger ?

// 方法3:, 預設每100張處理一次, 這樣還是有可能會爆掉?

// 方法4: 爆掉時, 再pause, 再等下一批

// 看起來最好的是 方法3+try catch+ 方法4,因為如果是大量批次preview圖 也很難用方法2
// 不過可能也同時要結合方法2....




function loadDir(dir, fileName) {

	// for testing
	// if (true) {
	// 	testArrayBufferJSON(fileName);
	// 	return;
	// }

	// currentImageFileIndex = '';
	// imageFiles = [];
	// waittingImageList = [];

	var tmpList = fileSystem.getAllImageFiles(dir);
	var num_Images = tmpList.length;
	if (num_Images == 0) {
		alert('No image files found in this directory.');
		return;
	} else {

    // 或是每次在render 時再去改?? yes
		// for (var i=0; i<num_Images; i++){
		// 	var imageInfo = handlingOrHandledImageList[i];
		// 	waittingImageList.push(imageInfo.imagePath);
		// }
	}

	//console.log("open target folder, total candidate:%s", num_Images);

	resetAllImagesStatusWhenTarget();

	currentDir = dir;
	waittingImageList = tmpList;
	updateStatusText();

	//try to send by ws
	// for (var i = 0; i < num_Images; i++) {
	// 	var selectedImage = waittingImageList[i];
	//
	//
	// 	if (sourceFilePath) {
	// 		// //console.log("loop:",i);
	// 		// process.nextTick(function(){
	//
	//
	// 	}
	//
	// 	// waittingImageList.push(imageInfo);
	//
	// }
	// //console.log("open folder after selecting source, end sending all match data");

	if (sourceFilePath) {
		//console.log("start to prepare images and match");

		getNextImageToHandle();
		// if (waittingImageList.length>0){
		//
		// 	var selectedImage = waittingImageList[0];
		// 	var imageInfo = {
		// 		imagePath: selectedImage,
		// 		status: MatchStatus.STARTING
		// 	};
		//
		// 	handlingOrHandledImageList.push(imageInfo);
		// 	waittingImageList.shift();
		// 	getImageThenSendToServer(selectedImage, CompareType.TARGET);
		// }

	} else {
		//console.log("No set source image yet !!!");
		alert('No set source image yet');
		return;
	}
}

var onOpenSource = function(filePath) {
	//renderer process
	//console.log('open Source and send to server, clear previous imageFiles');

	// currentImageFileIndex = '';
	console.log("source:",utilities.processSpecialCharacter((filePath + '')));
	var imageInfo = {
		imagePath: utilities.processSpecialCharacter((filePath + '')),
		status: MatchStatus.STARTING
	};

	getImageThenSendToServer(imageInfo, CompareType.SOURCE);
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

	loadDir(dirName, fileName);
};

var onDirOpen = function(dir) {
	loadDir(dir + ''); // convert to string
};

var onFileDelete = function() {

	// file has been deleted, show previous or next...
	var index = currentImageFileIndex; //imageFiles.indexOf(currentImageFileIndex);
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
	if(currentImageFileIndex>=0){
		return imageFiles[currentImageFileIndex];
	}

	return "";
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

	$openFileSource.click(function() {
		dialog.showOpenDialog({
				properties: [
					'openFile'
				],
				filters: [{
					name: 'Images',
					extensions: constants.SupportedImageExtensions
				}]
			},
			function(fileName) {
				if (fileName) {
					onOpenSource(fileName);
				}
			});
	});

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
