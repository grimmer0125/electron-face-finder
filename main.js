'use strict';

// import {spawnSync} from 'child_process';
// import {spawn} from 'child_process';
// require('child_process').spawn()
console.log("start");

// in index:
// dir:/Users/grimmer/git/image-viewer/app;
// respath:/Users/grimmer/git/image-viewer/node_modules/electron-prebuilt/dist/Electron.app/Contents/Resources

// dir: /Users/grimmer/git/image-viewer
// path: /Users/grimmer/git/image-viewer/node_modules/electron-prebuilt/dist/Electron.app/Contents/Resources

var projectPath = __dirname;

// var needIntall = false;
var child_process =  require('child_process');
var sync = require('child_process').spawnSync;

var checkResult = sync('sh', [projectPath+"/checkinstallDocker.sh"]);
var output = checkResult.stdout.toString();
console.log(output);
if(output.indexOf("docker is running") >= 0){
  console.log("ok");
} else if (output.indexOf("not installed yet") >= 0) {
  // try to install docker for mac
  // needIntall = true;
  console.log("not ok, installing");
}
console.log("checked docker of Mac");

// if (needIntall){
//   console.log("try to download and install docker");
//   var installResult = sync('sh', ["tryinstallDocker.sh"]);
//   var output = installResult.stdout.toString();
//   console.log(output);
// }
child_process.spawn('sh', [projectPath+"/pullimage.sh"], {});
console.log("pulled docker image");

if (process.env.NODE_ENV =="dev"){
  console.log("use dev");
  // child_process.spawn('sh', ["start-dev.sh"], {});
} else {

  // var prefix="/Users/grimmer/git/image-viewer";
  child_process.spawn('sh', [projectPath+"/start.sh"], {});
}

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
  child_process.spawn('sh', [projectPath+"/stop.sh"], {
   // detached: true, <-????
   // stdio: [ 'ignore', out, err ]
  });
});//willQuitApp = true);
