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

# from sklearn.decomposition import PCA
# from sklearn.grid_search import GridSearchCV
# from sklearn.manifold import TSNE
# from sklearn.svm import SVC

# import matplotlib as mpl
# mpl.use('Agg')
# import matplotlib.pyplot as plt
# import matplotlib.cm as cm

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
        # self.training = True
        self.people = []
        self.svm = None
        if args.unknown:
            self.unknownImgs = np.load("./examples/web/unknown.npy")

    def onConnect(self, request):
        print("Client connecting: {0}".format(request.peer))
        # self.training = True

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
        # if msg['type'] == "ALL_STATE":
        #     self.loadState(msg['images'], msg['training'], msg['people'])
        if msg['type'] == "NULL":
            self.sendMessage('{"type": "NULL"}')
        # elif msg['type'] == "FRAME":
        #     self.processFrame(msg['dataURL'], msg['identity'])
        #     self.sendMessage('{"type": "PROCESSED"}')
        elif msg['type'] == "COMPARE_SOURCE":
            self.handleSourceFrame(msg)
        elif msg['type'] == "COMPARE_TARGET":
            self.handleTargetFrame(msg)

            # self.sendMessage('{"type": "PROCESSED"}')
        # elif msg['type'] == "TRAINING":
        #     self.training = msg['val']
        #     if not self.training:
        #         self.trainSVM()
        elif msg['type'] == "ADD_PERSON":
            self.people.append(msg['val'].encode('ascii', 'ignore'))
            print(self.people)
        # elif msg['type'] == "UPDATE_IDENTITY":
        #     h = msg['hash'].encode('ascii', 'ignore')
        #     if h in self.images:
        #         self.images[h].identity = msg['idx']
        #         if not self.training:
        #             self.trainSVM()
        #     else:
        #         print("Image not found.")
        # elif msg['type'] == "REMOVE_IMAGE":
        #     h = msg['hash'].encode('ascii', 'ignore')
        #     if h in self.images:
        #         del self.images[h]
        #         if not self.training:
        #             self.trainSVM()
        #     else:
        #         print("Image not found.")
        # elif msg['type'] == 'REQ_TSNE':
        #     self.sendTSNE(msg['people'])
        else:
            print("Warning: Unknown message type: {}".format(msg['type']))

    def onClose(self, wasClean, code, reason):
        print("WebSocket connection closed: {0}".format(reason))

    # def loadState(self, jsImages, training, jsPeople):
    #     self.training = training
    #
    #     for jsImage in jsImages:
    #         h = jsImage['hash'].encode('ascii', 'ignore')
    #         self.images[h] = Face(np.array(jsImage['representation']),
    #                               jsImage['identity'])
    #
    #     for jsPerson in jsPeople:
    #         self.people.append(jsPerson.encode('ascii', 'ignore'))

        # if not training:
        #     self.trainSVM()

    # def getData(self):
    #     X = []
    #     y = []
    #     for img in self.images.values():
    #         X.append(img.rep)
    #         y.append(img.identity)
    #
    #     numIdentities = len(set(y + [-1])) - 1
    #     if numIdentities == 0:
    #         return None
    #
    #     if args.unknown:
    #         numUnknown = y.count(-1)
    #         numIdentified = len(y) - numUnknown
    #         numUnknownAdd = (numIdentified / numIdentities) - numUnknown
    #         if numUnknownAdd > 0:
    #             print("+ Augmenting with {} unknown images.".format(numUnknownAdd))
    #             for rep in self.unknownImgs[:numUnknownAdd]:
    #                 # print(rep)
    #                 X.append(rep)
    #                 y.append(-1)
    #
    #     X = np.vstack(X)
    #     y = np.array(y)
    #     return (X, y)

    # def sendTSNE(self, people):
    #     d = self.getData()
    #     if d is None:
    #         return
    #     else:
    #         (X, y) = d
    #
    #     X_pca = PCA(n_components=50).fit_transform(X, X)
    #     tsne = TSNE(n_components=2, init='random', random_state=0)
    #     X_r = tsne.fit_transform(X_pca)
    #
    #     yVals = list(np.unique(y))
    #     colors = cm.rainbow(np.linspace(0, 1, len(yVals)))
    #
    #     # print(yVals)
    #
    #     plt.figure()
    #     for c, i in zip(colors, yVals):
    #         name = "Unknown" if i == -1 else people[i]
    #         plt.scatter(X_r[y == i, 0], X_r[y == i, 1], c=c, label=name)
    #         plt.legend()
    #
    #     imgdata = StringIO.StringIO()
    #     plt.savefig(imgdata, format='png')
    #     imgdata.seek(0)
    #
    #     content = 'data:image/png;base64,' + \
    #               urllib.quote(base64.b64encode(imgdata.buf))
    #     msg = {
    #         "type": "TSNE_DATA",
    #         "content": content
    #     }
    #     self.sendMessage(json.dumps(msg))

    # def trainSVM(self):
    #     print("+ Training SVM on {} labeled images.".format(len(self.images)))
    #     d = self.getData()
    #     if d is None:
    #         self.svm = None
    #         return
    #     else:
    #         (X, y) = d
    #         numIdentities = len(set(y + [-1]))
    #         if numIdentities <= 1:
    #             return
    #
    #         param_grid = [
    #             {'C': [1, 10, 100, 1000],
    #              'kernel': ['linear']},
    #             {'C': [1, 10, 100, 1000],
    #              'gamma': [0.001, 0.0001],
    #              'kernel': ['rbf']}
    #         ]
    #         self.svm = GridSearchCV(SVC(C=1), param_grid, cv=5).fit(X, y)

    # def handleSourceFrameUsingArrayBuffer(self, buffer):
    #     print("into handleSourceFrameUsingArrayBuffer")
        # print(buffer[2][2][2])
        # print("end to get 2,2,2")

        # return
        # print("got handleSourceFrame")
        # print(`width`+" x "+ `height`)

        # head = "data:image/jpeg;base64,"
        # ('dataURL:', u'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAEsAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDCiOevOamddw9x0qhA5RijdR0+lXo2yozxXPombjVO8Ed6hPytgYqZvkYehpkqkDNICvMgkjZT0NYoJilOeoODW2cjOKzdRj+YSY68GtISfUTVyK1Ae/X0DZrW7HGeax7J0jnDOdoArQF5BjHmcVbV3cSEhJJmbsXxT7fm5J7BarQ3ESxNub5ixP61YsGWQyMCDSkg0LmeKTtmlwCP60h4xxWWpQg4p4JHPpTRR0oeoFtTkDmn1XibtVgHtTuAtGMjBpRRmkIaBntTunQUnfinU9AGnAzx2rCY/MT0rdcHYT6CsHPJz1zTXYCRenFSA4PvUK1Kp+WizsMnT7lPRiqEfhUaklfWnd80O4idWGKdketVi5456c5pfMbPFJ73Qycuvc0m4HvUO857dKb5nPAFPqItBh6gmjcO1V93P3cZpCxxwOfehO+gFkmm55qHeeMikaXapYjgDJoaewGdqcu662Z4UYFaenRmK0UHq3JrDX9/cDIzuPP0rcVwMAZAHAq5aJCS1LWafntmqvm4HU+3FL5nqTUJ6lFndigSYFVjJ70gkBxz+dPYRa8xscGmsxbOTxUHmdCKR59oLPtA7nNDGTcY5qs/7ybZ/C

        # print("dataURL:",dataURL)
        # assert(dataURL.startswith(head))
        # imgdata = base64.b64decode(dataURL[len(head):])
        # imgF = StringIO.StringIO()
        # imgF.write(imgdata)
        # imgF.seek(0)
        # img = Image.open(imgF)
        #
        # # 300: height
        # buf = np.fliplr(np.asarray(img))
        # rgbFrame = np.zeros((height, width, 3), dtype=np.uint8)
        # rgbFrame[:, :, 0] = buf[:, :, 2]
        # rgbFrame[:, :, 1] = buf[:, :, 1]
        # rgbFrame[:, :, 2] = buf[:, :, 0]
        # print("print rgbImg info:",rgbFrame)

# http://www.scipy-lectures.org/intro/numpy/numpy.html

# height * widtht * 3
# [0][0][0]
# [0][1][0]  4*0+1*200 +0*1 ?  = array[200] ?
#
# height

    # sometimes receive part of websockt is slow when the file is big

    def convertDataURLtoRGB(self,dataURL, width, height):
        print("width:{}, height:{}".format(width,height))

        head = "data:image/jpeg;base64,"
        # ('dataURL:', u'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAEsAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDCiOevOamddw9x0qhA5RijdR0+lXo2yozxXPombjVO8Ed6hPytgYqZvkYehpkqkDNICvMgkjZT0NYoJilOeoODW2cjOKzdRj+YSY68GtISfUTVyK1Ae/X0DZrW7HGeax7J0jnDOdoArQF5BjHmcVbV3cSEhJJmbsXxT7fm5J7BarQ3ESxNub5ixP61YsGWQyMCDSkg0LmeKTtmlwCP60h4xxWWpQg4p4JHPpTRR0oeoFtTkDmn1XibtVgHtTuAtGMjBpRRmkIaBntTunQUnfinU9AGnAzx2rCY/MT0rdcHYT6CsHPJz1zTXYCRenFSA4PvUK1Kp+WizsMnT7lPRiqEfhUaklfWnd80O4idWGKdketVi5456c5pfMbPFJ73Qycuvc0m4HvUO857dKb5nPAFPqItBh6gmjcO1V93P3cZpCxxwOfehO+gFkmm55qHeeMikaXapYjgDJoaewGdqcu662Z4UYFaenRmK0UHq3JrDX9/cDIzuPP0rcVwMAZAHAq5aJCS1LWafntmqvm4HU+3FL5nqTUJ6lFndigSYFVjJ70gkBxz+dPYRa8xscGmsxbOTxUHmdCKR59oLPtA7nNDGTcY5qs/7ybZ/C

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
        # if args.verbose:
        #     print("  + Face detection took {} seconds.".format(time.time() - start))

        start = time.time()
        alignedFace = align.align(args.imgDim, rgbImg, bb,
                                  landmarkIndices=openface.AlignDlib.OUTER_EYES_AND_NOSE)
        if alignedFace is None:
            # raise Exception
            print("Unable to align image: {}".format(imgPath))
            return None
        # if args.verbose:
        #     print("  + Face alignment took {} seconds.".format(time.time() - start))

        start = time.time()
        rep = net.forward(alignedFace)
        print("  + OpenFace forward pass took {} seconds.".format(time.time() - start))

        # if args.verbose:
        #     print("  + OpenFace forward pass took {} seconds.".format(time.time() - start))
        #     print("Representation:")
        #     print(rep)
        #     print("-----\n")
        return rep

    def handleTargetFrame(self, msg):
        dataURL = msg['dataURL']
        imagePath = msg['imagePath']
        print(u"got handleTargetFrame:{}:".format(imagePath))
        # compareType = msg['type']
        width = msg['width']
        height = msg['height']
        rgbFrame = self.convertDataURLtoRGB(dataURL, width, height)
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
                res = {
                    "ifMatch": ifMatch,
                    "imagePath": imagePath,
                    "width": width,
                    "height": height
                    # "representation": rep.tolist()
                }
                # imagePath2 = res['imagePath']
                # if not unicode, only need to use json.dumps() w/ .encode
                self.sendMessage(json.dumps(res, ensure_ascii=False).encode('utf8'))
                return
            else:
                print("targetNDArray is none")
        else:
            print("sourece is none when handling target files")

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
        # self.sourceRGBFrame = rgbFrame

    def processFrame(self, dataURL, identity):
        head = "data:image/jpeg;base64,"
        # ('dataURL:', u'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCAEsAZADASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwDCiOevOamddw9x0qhA5RijdR0+lXo2yozxXPombjVO8Ed6hPytgYqZvkYehpkqkDNICvMgkjZT0NYoJilOeoODW2cjOKzdRj+YSY68GtISfUTVyK1Ae/X0DZrW7HGeax7J0jnDOdoArQF5BjHmcVbV3cSEhJJmbsXxT7fm5J7BarQ3ESxNub5ixP61YsGWQyMCDSkg0LmeKTtmlwCP60h4xxWWpQg4p4JHPpTRR0oeoFtTkDmn1XibtVgHtTuAtGMjBpRRmkIaBntTunQUnfinU9AGnAzx2rCY/MT0rdcHYT6CsHPJz1zTXYCRenFSA4PvUK1Kp+WizsMnT7lPRiqEfhUaklfWnd80O4idWGKdketVi5456c5pfMbPFJ73Qycuvc0m4HvUO857dKb5nPAFPqItBh6gmjcO1V93P3cZpCxxwOfehO+gFkmm55qHeeMikaXapYjgDJoaewGdqcu662Z4UYFaenRmK0UHq3JrDX9/cDIzuPP0rcVwMAZAHAq5aJCS1LWafntmqvm4HU+3FL5nqTUJ6lFndigSYFVjJ70gkBxz+dPYRa8xscGmsxbOTxUHmdCKR59oLPtA7nNDGTcY5qs/7ybZ/C

        # print("dataURL:",dataURL)
        assert(dataURL.startswith(head))
        imgdata = base64.b64decode(dataURL[len(head):])
        imgF = StringIO.StringIO()
        imgF.write(imgdata)
        imgF.seek(0)
        img = Image.open(imgF)

        buf = np.fliplr(np.asarray(img))
        rgbFrame = np.zeros((300, 400, 3), dtype=np.uint8)
        rgbFrame[:, :, 0] = buf[:, :, 2]
        rgbFrame[:, :, 1] = buf[:, :, 1]
        rgbFrame[:, :, 2] = buf[:, :, 0]

        if not self.training:
            annotatedFrame = np.copy(buf)

        # cv2.imshow('frame', rgbFrame)
        # if cv2.waitKey(1) & 0xFF == ord('q'):
        #     return

        identities = []
        # bbs = align.getAllFaceBoundingBoxes(rgbFrame)
        bb = align.getLargestFaceBoundingBox(rgbFrame)
        bbs = [bb] if bb is not None else []
        for bb in bbs:
            # print(len(bbs))
            landmarks = align.findLandmarks(rgbFrame, bb)
            alignedFace = align.align(args.imgDim, rgbFrame, bb,
                                      landmarks=landmarks,
                                      landmarkIndices=openface.AlignDlib.OUTER_EYES_AND_NOSE)
            if alignedFace is None:
                continue

            phash = str(imagehash.phash(Image.fromarray(alignedFace)))
            if phash in self.images:
                identity = self.images[phash].identity
            else:
                rep = net.forward(alignedFace)
                # print(rep)
                if self.training:
                    self.images[phash] = Face(rep, identity)
                    # TODO: Transferring as a string is suboptimal.
                    # content = [str(x) for x in cv2.resize(alignedFace, (0,0),
                    # fx=0.5, fy=0.5).flatten()]
                    content = [str(x) for x in alignedFace.flatten()]
                    msg = {
                        "type": "NEW_IMAGE",
                        "hash": phash,
                        "content": content,
                        "identity": identity,
                        "representation": rep.tolist()
                    }
                    self.sendMessage(json.dumps(msg))
                else:
                    if len(self.people) == 0:
                        identity = -1
                    elif len(self.people) == 1:
                        identity = 0
                    elif self.svm:
                        identity = self.svm.predict(rep)[0]
                    else:
                        print("hhh")
                        identity = -1
                    if identity not in identities:
                        identities.append(identity)

            if not self.training:
                bl = (bb.left(), bb.bottom())
                tr = (bb.right(), bb.top())
                cv2.rectangle(annotatedFrame, bl, tr, color=(153, 255, 204),
                              thickness=3)
                for p in openface.AlignDlib.OUTER_EYES_AND_NOSE:
                    cv2.circle(annotatedFrame, center=landmarks[p], radius=3,
                               color=(102, 204, 255), thickness=-1)
                if identity == -1:
                    if len(self.people) == 1:
                        name = self.people[0]
                    else:
                        name = "Unknown"
                else:
                    name = self.people[identity]
                cv2.putText(annotatedFrame, name, (bb.left(), bb.top() - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, fontScale=0.75,
                            color=(152, 255, 204), thickness=2)

        if not self.training:
            msg = {
                "type": "IDENTITIES",
                "identities": identities
            }
            self.sendMessage(json.dumps(msg))

            plt.figure()
            plt.imshow(annotatedFrame)
            plt.xticks([])
            plt.yticks([])

            imgdata = StringIO.StringIO()
            plt.savefig(imgdata, format='png')
            imgdata.seek(0)
            content = 'data:image/png;base64,' + \
                urllib.quote(base64.b64encode(imgdata.buf))
            msg = {
                "type": "ANNOTATED",
                "content": content
            }
            plt.close()
            self.sendMessage(json.dumps(msg))

if __name__ == '__main__':
    log.startLogging(sys.stdout)

    factory = WebSocketServerFactory("ws://localhost:{}".format(args.port),
                                     debug=False)
    factory.protocol = OpenFaceServerProtocol

    reactor.listenTCP(args.port, factory)
    reactor.run()
