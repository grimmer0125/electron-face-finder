#!/usr/bin/env python2
#
# Copyright 2015-2016 Carnegie Mellon University
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
import time
start = time.time()

import os
import sys
fileDir = os.path.dirname(os.path.realpath(__file__))
sys.path.append(os.path.join(fileDir, "..", ".."))

import txaio
txaio.use_twisted()

from autobahn.twisted.websocket import WebSocketServerProtocol, \
    WebSocketServerFactory
from twisted.python import log
from twisted.internet import reactor

import argparse
import cv2
import imagehash
import json
from PIL import Image
import numpy as np
import os
import StringIO
import urllib
import base64

import openface

modelDir = os.path.join(fileDir, '..', '..', 'models')
dlibModelDir = os.path.join(modelDir, 'dlib')
openfaceModelDir = os.path.join(modelDir, 'openface')

parser = argparse.ArgumentParser()
parser.add_argument('--dlibFacePredictor', type=str, help="Path to dlib's face predictor.",
                    default=os.path.join(dlibModelDir, "shape_predictor_68_face_landmarks.dat"))
parser.add_argument('--networkModel', type=str, help="Path to Torch network model.",
                    default=os.path.join(openfaceModelDir, 'nn4.small2.v1.t7'))
parser.add_argument('--imgDim', type=int,
                    help="Default image dimension.", default=96)
parser.add_argument('--cuda', action='store_true')
parser.add_argument('--unknown', type=bool, default=False,
                    help='Try to predict unknown people')
parser.add_argument('--port', type=int, default=9000,
                    help='WebSocket Port')

args = parser.parse_args()

align = openface.AlignDlib(args.dlibFacePredictor)
net = openface.TorchNeuralNet(args.networkModel, imgDim=args.imgDim,
                              cuda=args.cuda)


class Face:

    def __init__(self, rep, identity):
        self.rep = rep
        self.identity = identity

    def __repr__(self):
        return "{{id: {}, rep[0:5]: {}}}".format(
            str(self.identity),
            self.rep[0:5]
        )


class OpenFaceServerProtocol(WebSocketServerProtocol):

    def __init__(self):
        self.sourceFaceNDArray = None
        self.images = {}

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))

    def onOpen(self):
        print("WebSocket connection open.")

    def onMessage(self, payload, isBinary):
        print("on message")
        if isBinary == True:
            print("Binary message received: {} bytes".format(len(payload)))
            print("type:{}".format(type(payload)))
            # self.handleSourceFrameUsingArrayBuffer(payload)
            # print("Got binary")
            return
        # print("on message, not binary")
        try:
            raw = payload.decode('utf8')
            msg = json.loads(raw)
        except Exception as err:
            print(type(err))
            print("can not decode to utf8 or json,{}".format(err))
            return
        print("Received {} message of length {}.".format(
            msg['type'], len(raw)))
        if msg['type'] == "NULL":
            self.sendMessage('{"type": "NULL"}')
        elif msg['type'] == "COMPARE_SOURCE":
            self.handleSourceFrame(msg)
        elif msg['type'] == "COMPARE_TARGET":
            self.handleTargetFrame(msg)
        else:
            print("Warning: Unknown message type: {}".format(msg['type']))

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))

    # sometimes receive part of websockt is slow when the file is big

    def convertDataURLtoRGB(self,dataURL, width, height):
        print("width:{}, height:{}".format(width,height))

        head = "data:image/jpeg;base64,"

        # print("dataURL:",dataURL)
        assert(dataURL.startswith(head))
        imgdata = base64.b64decode(dataURL[len(head):])
        imgF = StringIO.StringIO()
        imgF.write(imgdata)
        imgF.seek(0)
        img = Image.open(imgF)

        buf = np.fliplr(np.asarray(img))
        rgbFrame = np.zeros((height, width, 3), dtype=np.uint8)
        rgbFrame[:, :, 0] = buf[:, :, 2]
        rgbFrame[:, :, 1] = buf[:, :, 1]
        rgbFrame[:, :, 2] = buf[:, :, 0]

        print("print rgbFrame:{}".format(rgbFrame.shape))
        return rgbFrame

    def getRep(self, rgbImg):

        start = time.time()
        print("start to get largestBox/allboundingBox")
        bb = align.getLargestFaceBoundingBox(rgbImg)
        # cc = align.getAllFaceBoundingBoxes(rgbImg)
        # print("all boxes:", cc, ";box length:", len(cc))

        if bb is None:
            print("not get get the largestBox")
            return None
            # raise Exception("Unable to find a face: {}".format(imgPath))
        # print("  + Face detection took {} seconds.".format(time.time() - start))

        start = time.time()
        alignedFace = align.align(args.imgDim, rgbImg, bb,
                                  landmarkIndices=openface.AlignDlib.OUTER_EYES_AND_NOSE)
        if alignedFace is None:
            # raise Exception
            print("Unable to align image: {}".format(imgPath))
            return None

        start = time.time()
        rep = net.forward(alignedFace)
        print("  + OpenFace forward pass took {} seconds.".format(time.time() - start))

        return rep

    def handleTargetFrame(self, msg):
        dataURL = msg['dataURL']
        imagePath = msg['imagePath']
        print(u"got handleTargetFrame:{}:".format(imagePath))
        # compareType = msg['type']
        width = msg['width']
        height = msg['height']
        rgbFrame = self.convertDataURLtoRGB(dataURL, width, height)

        representationStatus = False
        ifMatch = False
        if self.sourceFaceNDArray is not None:
            targetNDArray = self.getRep(rgbFrame)
            if targetNDArray is not None:
                # start to compare these two frames
                d = targetNDArray - self.sourceFaceNDArray
                distance = np.dot(d, d)
                print("Squared l2 distance:{}".format(distance))
                ifMatch = False
                if distance < 0.5:
                    print("the same face")
                    ifMatch = True

                representationStatus = True
            else:
                print("error, targetNDArray is none")
        else:
            print("error, sourece is none when handling target files")

        res = {
            "type" : "COMPARE_TARGET",
            "representationStatus": representationStatus,
            "ifMatch": ifMatch,
            "imagePath": imagePath,
            "width": width,
            "height": height
            # "representation": rep.tolist()
        }
        # imagePath2 = res['imagePath']
        # if not unicode, only need to use json.dumps() w/ .encode
        self.sendMessage(json.dumps(res, ensure_ascii=False).encode('utf8'))

        # print("Squared l2 distance between representations: {:0.3f}".format(distance))
        print("something wrong when comparing frames")

    def handleSourceFrame(self, msg):

        # compareType = msg['type']
        dataURL = msg['dataURL']
        imagePath = msg['imagePath']
        print("got handleSourceFrame, type:{}".format(type(imagePath)))

        print(u"got handleSourceFrame:{}:".format(imagePath))

        width = msg['width']
        height = msg['height']

        rgbFrame = self.convertDataURLtoRGB(dataURL, width, height)
        self.sourceFaceNDArray = self.getRep(rgbFrame)
        if self.sourceFaceNDArray is not None:
            representationStatus = True
        else:
            representationStatus = False
        res = {
            "type" : "COMPARE_SOURCE",
            "representationStatus": representationStatus,
            "imagePath": imagePath,
            "width": width,
            "height": height
            # "representation": rep.tolist()
        }
        # if not unicode, only need to use json.dumps() w/ .encode
        self.sendMessage(json.dumps(res, ensure_ascii=False).encode('utf8'))

if __name__ == '__main__':
    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory("ws://localhost:{}".format(args.port),
                                     debug=False)
    factory.protocol = OpenFaceServerProtocol

    reactor.listenTCP(args.port, factory)
    reactor.run()
