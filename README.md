<!-- # How to install -->
<!-- 1.type 'npm run prepare' -->

# Currently this only tested on Mac platform

## Install (Optional)

### Install dependencies manually with logs
1. Install Docker of Mac if you do not have. Type `sh checkinstallDocker.sh`. If you want to try on Win/Linux, you need to download from [https://www.docker.com](https://www.docker.com) and install it from UI.
2. After installing it, type `sh pullimage.js` to install the needed Docker image.

## Run

### method 1- Run (and automatically install dependencies) without server logs, the only way to see server logs in this mode is to use [kinematic](https://kitematic.com/)
1. type `npm start`. (this method does not need to execute the above `sh checkinstallDocker.sh` & `sh pullimage.js` to install)

### method 2- Run with monitor server logs directly
1. type `npm run dev`
2. open another terminal. type `sh start-dev.sh`

# Image Viewer

A cross-platform Image Viewer based on Electron. It runs on OS X, Windows and Linux. It provides an easy interface to browse a directory of images using the left and right keyboard buttons.

# Preview

- OS X:

![alt tag](http://i.imgur.com/JM0GaFJ.jpg)

- Windows:

![alt tag](http://i.imgur.com/uYsD4yy.png)

- Linux:

![alt tag](http://i.imgur.com/KXlmv3o.png)

# Features

- Find the matched face images. From the menu, `file->open a source file`, select a source image including 1 face. Then click 'open' of menu or click open button , to select folder/any other file. Later it will show matched images.     
- Open a Directory and browse it's images
- Open an Image File and browse the images inside the same directory
- Fast navigation through the images via Left/Right keyboard buttons
- Rotate an image clockwise/anti-clockwise
- Save/Move the image to a new location

<h2 id="contributors">Contributors</h2>

The following is a list of all the people that have helped build the Image-Viewer. Thanks for your contributions!

[<img alt="yyosifov" src="https://avatars1.githubusercontent.com/u/2012493?v=3&s=460" width="117">](https://github.com/yyosifov)[<img alt="akashnimare" src="https://avatars1.githubusercontent.com/u/2263909?v=3&s=460" width="117">](https://github.com/akashnimare)
