'use strict';

console.log("start");

// console.log("sh:", process.env.SHELL);

var shellPath = process.env.SHELL;
var projectPath = __dirname;
// console.log("project:", projectPath);
// console.log("project2:", path.resolve(projectPath));

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

// the key point is the absolute path of docker,
// ref: https://discuss.atom.io/t/every-spawn-task-throws-enoent-when-electron-app-packaged-for-distribution/18692/2

// var docker = "/usr/local/bin/docker";
// var args = ["run", "-d", "-p", "9000:9000", "-t", "-i", "--name", "faceserver", "grimmer0125/electricface"];
// child_process.spawn(docker, args, {});


if (process.env.NODE_ENV =="debug"){
  console.log("use debug");
  // child_process.spawn('sh', ["start-dev.sh"], {});

} else if (process.env.NODE_ENV =="dev"){

  var startScriptPath = projectPath+"/scripts/docker-start-dev.sh";
  console.log("start dev script:", startScriptPath);

  child_process.spawn(shellPath, ['-i', '-c', startScriptPath], {});

  // child_process.spawn(process.env.SHELL, ['-c', 'cd ' + projectPath + ' && scripts/docker-start-dev.sh'])

  // child_process.execFileSync(process.env.SHELL, ['-i', '-c', 'launchctl setenv PATH "$PATH"'])
  // child_process.spawn(startScriptPath, [], {});

} else {
  runProductMode = true;
  // var startScriptPath = projectPath+"/scripts/docker-start.sh";
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
        height: 600,
        width: 800
    });

    mainWindow.loadUrl('file://' + __dirname + '/app/index.html');

    if (runProductMode == false){
      // Open the DevTools.
      mainWindow.webContents.openDevTools();
    }
});

app.on('before-quit', function() {
  console.log("before-quit");

  var docker = "/usr/local/bin/docker";
  var args = ["rm", "-f", "faceserver"];
  child_process.spawn(docker, args, {});

  // child_process.spawn('sh', [projectPath+"/scripts/docker-stop.sh"], {
   // detached: true, <-????
   // stdio: [ 'ignore', out, err ]
  // });
});//willQuitApp = true);
