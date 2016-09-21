<!-- # How to install -->
<!-- 1.type 'npm run prepare' -->

# Currently this only tested on Mac platform. This experimental project is based on [https://github.com/cmusatyalab/openface](https://github.com/cmusatyalab/openface) and [https://github.com/yyosifov/image-viewer](https://github.com/yyosifov/image-viewer).

### Known Bugs:
1. It seems that sometimes electron side will send partial data to the python sever running in the previous docker container.  
## Install (Optional)

### Install dependencies manually with logs
1. Install Docker of Mac if you do not have. Type `sh checkinstallDocker.sh`. If you want to try on Win/Linux, you need to download from [https://www.docker.com](https://www.docker.com) and install it from UI.
2. After installing it, type `sh pullimage.js` to install the needed Docker image.

## Run

### method 1- Run (and automatically install dependencies) without server logs, the only way to see server logs in this mode is to use [kinematic](https://kitematic.com/)
1. type `npm start`. (this method does not need to execute the above `sh checkinstallDocker.sh` & `sh pullimage.sh` to install)

### method 2- Run with monitor server logs directly
1. type `npm run dev`
2. open another terminal. type `sh start-dev.sh`

# Face Finder/Matcher

A cross-platform Face Matcher based on Electron. It runs on OS X, Windows and Linux. It provides an easy interface to browse a directory of images using the left and right keyboard buttons.

### Caution 
It will search all the sub-folders and consume a lot time (maybe hours, depends on the number of image files). The UI does not have any progress bar, please keep in mind. Also the UI is not optimized and it may have bugs. 

# Preview

- OS X:

![alt tag](http://i.imgur.com/JM0GaFJ.jpg)

- Windows:

![alt tag](http://i.imgur.com/uYsD4yy.png)

- Linux:

![alt tag](http://i.imgur.com/KXlmv3o.png)

# Features

- Find the matched face images. From the menu, `file->open a source file`, select a source image including 1 face. Then click 'open' of menu or click open button , to select folder/any other file. Later it will show matched images.     
- ~~Open a Directory and browse it's images~~
- ~~Open an Image File and browse the images inside the same directory~~
- ~~Fast navigation through the images via Left/Right keyboard buttons~~
- Rotate an image clockwise/anti-clockwise
- Save/Move the image to a new location

