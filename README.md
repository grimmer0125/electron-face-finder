## Currently this is only tested on Mac platform. This experimental project is based on the following projects.
1. [https://github.com/cmusatyalab/openface](https://github.com/cmusatyalab/openface),Apache 2.0 License. Modify its Dockerfile.
2. [https://github.com/yyosifov/image-viewer](https://github.com/yyosifov/image-viewer),  ISC License. Most of UI are from it.

### Known Issues:
1. It seems that sometimes electron side will send partial data to the python sever running in the previous docker container. It may happen when you close the app and immediately restart it and operate it very soon.
2. Slow python WebSocket in Docker. Need to debug it.
3. cpu and memory usage is too high.
4. sometimes html image object will load an image file in a wrong way. Such as rotating a 90/180 degree somehow. It is exif issue.
5. ~~If the folder contain too many images(may hundred of files), "out of memory" will happen and throw exception, net::ERR_INSUFFICIENT_RESOURCES.~~
6. ~~Need to hanle the exception due to the symbolic link of a file.~~

### Todo list
1. add source/targetImage info in the ack packet from server. It is to handle interrupt case. E.g. Change target/source when the process is not finished.
2. stop button.
3. study how to debug main process when this app is as a package app.
4. Add connecting indicator to block UI operation and progress bar.
5. Clean the sending queue when reseting
6. Add Mac app signing.
7. Support multiple faces in an image file.
8. ~~try to support the image path having "%"~~

# Before run in in development environment or download a packaged app, you need Docker for Mac.

Type `sh checkinstallDocker.sh` to install it. Or you can download it from [https://www.docker.com/products/docker#/mac](https://www.docker.com/products/docker#/mac) and then install it.

# How to Run in development environment

### Install additional dependencies before running locally
After installing it, type `docker pull grimmer0125/openface-nostartdemo` to install the needed Docker image. Or you can use Docker-UI-tool [kinematic](https://kitematic.com/) to search the above docker image (**openface-nostartdemo**) and install.

#### then type `npm install` to install NPM packages.

### Run method 1
1. type `npm start` in terminal. But this way does not have any terminal logs of server side, you need to use [kinematic](https://kitematic.com/) to monitor the server logs from Docker. Or use shell script to attach/exec into the Docker.  

### Run method 2- Run with monitor server logs directly
1. type `make run` in terminal. In this way, you can see server logs. But you can not use ctrl+c to close Electron-UI app. You need to close it inside Electron app.

# Run Production packaged app:

### Install additional dependencies before running locally
After installing it, type `docker pull grimmer0125/electricface`(web:[https://hub.docker.com/r/grimmer0125/electricface/](https://hub.docker.com/r/grimmer0125/electricface/)) to install the needed Docker image. Or you can use Docker-UI-tool [kinematic](https://kitematic.com/) to search the docker image (**electricface**) and install.

### Download the distributed binary packaged Electron app, FaceFinder.dmg form here.
[http://goo.gl/GsNWJe](http://goo.gl/GsNWJe)

# Face Finder/Matcher

A cross-platform Face Matcher based on Electron. It runs on OS X, Windows and Linux. It provides an easy interface to browse a directory of images using the left and right keyboard buttons.

### Caution
1. It will search all the sub-folders and consume a lot time (1 file-1MB consumes 5s).

# Preview

- OS X:

![alt tag](https://grimmer.io/images/electron-dog.png)

# Features

- Find the matched face images. From the menu, `file->open a source file`, select a source image including 1 face. Then click 'open' of menu or click open button , to select folder/any other file. Later it will show matched images having the same face.    
- ~~Open a Directory and browse it's images~~
- ~~Open an Image File and browse the images inside the same directory~~
- Fast navigation through the images via Left/Right keyboard buttons
- Rotate an image clockwise/anti-clockwise
- Save/Move the image to a new location
