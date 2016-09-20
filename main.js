'use strict';

// import {spawnSync} from 'child_process';
// import {spawn} from 'child_process';
// require('child_process').spawn()
var child_process =  require('child_process');
child_process.spawn('sh', ["start.sh"], {
 // detached: true, <-????
 // stdio: [ 'ignore', out, err ]
});

var app = require('app');
var BrowserWindow = require('browser-window');

var mainWindow = null;

var ipc = require('ipc');

ipc.on('close-main-window', function () {
    app.quit();
});

ipc.on('image-changed', function(sender, fileName) {
	//console.log('on image-changed  with ' + JSON.stringify(arguments));
	mainWindow.setTitle(fileName);
});

app.on('ready', function() {
    mainWindow = new BrowserWindow({
        //frame: false,
        resizable: true,
        height: 600,
        width: 800
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

    // Open the DevTools.
    mainWindow.webContents.openDevTools();
});

app.on('before-quit', function() {
  console.log("before-quit");
  child_process.spawn('sh', ["stop.sh"], {
   // detached: true, <-????
   // stdio: [ 'ignore', out, err ]
  });
});//willQuitApp = true);
