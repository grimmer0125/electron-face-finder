'use strict';

// console.log(process.env.PATH);

var shellPath = process.env.SHELL;
var projectPath = __dirname;
var child_process =  require('child_process');

var runProductMode = false;

if (process.env.NODE_ENV =="debug"){
  console.log("use debug");

} else if (process.env.NODE_ENV =="dev"){

  var startScriptPath = projectPath+"/scripts/docker-start-dev.sh";
  console.log("start dev script:", startScriptPath);

  child_process.spawn(shellPath, ['-i', '-c', startScriptPath], {});

} else {
  runProductMode = true;
  console.log("start production script");

  // 1
  // child_process.spawn(shellPath, ['-i','-c',startScriptPath], {});

  // 2
  // child_process.spawn(process.env.SHELL, ['-c', 'cd ' + projectPath + ' && scripts/docker-start.sh'])

  // 3
  // child_process.execFileSync(process.env.SHELL, ['-i', '-c', 'launchctl setenv PATH "$PATH"'])
  // child_process.spawn(startScriptPath, [], {});

  // 4
  var docker = "/usr/local/bin/docker";
  var args = ["run", "-d", "-p", "9000:9000", "-t", "-i", "--name", "faceserver", "grimmer0125/electricface"];
  child_process.spawn(docker, args, {});
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
        height: 768,
        width: 1024
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

    if (runProductMode == false){
      // Open the DevTools.
      mainWindow.webContents.openDevTools();
    }

    // mainWindow.maximize()
});

app.on('before-quit', function() {
  console.log("before-quit");

  var docker = "/usr/local/bin/docker";
  var args = ["rm", "-f", "faceserver"];
  child_process.spawn(docker, args, {});

});//willQuitApp = true);
