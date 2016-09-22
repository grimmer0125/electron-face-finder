'use strict';

console.log("start");

var projectPath = __dirname;
var child_process =  require('child_process');
// var needIntall = false;

// var sync = require('child_process').spawnSync;
// var checkResult = sync('sh', [projectPath+"/checkinstallDocker.sh"]);
// var output = checkResult.stdout.toString();
// console.log(output);
// if(output.indexOf("docker is running") >= 0){
//   console.log("ok");
// } else if (output.indexOf("not installed yet") >= 0) {
//   // try to install docker for mac
//   // needIntall = true;
//   console.log("not ok, installing");
// }
// console.log("checked docker of Mac");
//
// // if (needIntall){
// //   console.log("try to download and install docker");
// //   var installResult = sync('sh', ["tryinstallDocker.sh"]);
// //   var output = installResult.stdout.toString();
// //   console.log(output);
// // }
// child_process.spawn('sh', [projectPath+"/pullimage.sh"], {});
// console.log("pulled docker image");

var runProductMode = false;

if (process.env.NODE_ENV =="debug"){
  console.log("use debug");
  // child_process.spawn('sh', ["start-dev.sh"], {});
} else if (process.env.NODE_ENV =="dev"){

  var startScriptPath = projectPath+"/scripts/docker-start-dev.sh";
  console.log("start dev script:", startScriptPath);
  child_process.spawn('sh', [startScriptPath], {});
} else {
  runProductMode = true;
  var startScriptPath = projectPath+"/scripts/docker-start.sh";
  console.log("start script:", startScriptPath);
  child_process.spawn('sh', [startScriptPath], {});
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
    if (runProductMode == false){
      mainWindow.webContents.openDevTools();
    }
});

app.on('before-quit', function() {
  console.log("before-quit");
  child_process.spawn('sh', [projectPath+"/scripts/docker-stop.sh"], {
   // detached: true, <-????
   // stdio: [ 'ignore', out, err ]
  });
});//willQuitApp = true);
