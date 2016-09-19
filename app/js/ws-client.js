
var socket = null;

module.exports = {

  // this.receiveHandler = null;

  receiveHandler :  null,

  registerReceiveHandler: function(handler){
    this.receiveHandler = handler;
  },

  sendData: function(data){
    socket.send(data);
  },
  createSocket: function(address){

    var self = this;

    if(!socket){
      socket = new WebSocket(address);
    }
    // socketName = name;
    socket.binaryType = "arraybuffer"; //"blob";
    socket.onopen = function() {
      console.log('on open !!!');
      // $("#serverStatus").html("Connected to " + name);
      // debugger;
      // var data2 = JSON.stringify(sentData);
      // console.log('on open 2!!!');

      // socket.send(data2);
      // socket.send(sentData);
      // console.log('on open 3!!!');
    };
    socket.onmessage = function(e) {
      console.log("test, get data !!!! :", e.data);
      // debugger;
      var data = JSON.parse(e.data);
      self.receiveHandler(data);
    };
    socket.onerror = function(e) {
      console.log("Error creating WebSocket connection to " + address);
      console.log(e);
    };

    // var fun =
    // var fun2
    socket.onclose = function(e) {
      if (e.target == socket) {
        console.log("Disconnected");
        // $("#serverStatus").html("Disconnected.");
      }
    };
  }
}
// var wsModule = {
//
// }
// function testWS(){
// function createSocket(address, name) {
// 	socket = new WebSocket(address);
// 	// socketName = name;
// 	socket.binaryType = "arraybuffer"; //"blob";
// 	socket.onopen = function() {
// 		console.log('on open !!!');
// 		// $("#serverStatus").html("Connected to " + name);
// 		// debugger;
// 		var data2 = JSON.stringify(sentData);
// 		console.log('on open 2!!!');
//
// 		socket.send(data2);
// 		// socket.send(sentData);
// 		console.log('on open 3!!!');
//
//
// 	}
// 	socket.onmessage = function(e) {
// 		console.log("message:", e);
// 	}
// 	socket.onerror = function(e) {
// 		console.log("Error creating WebSocket connection to " + address);
// 		console.log(e);
// 	}
// 	socket.onclose = function(e) {
// 		if (e.target == socket) {
// 			console.log("Disconnected");
// 			// $("#serverStatus").html("Disconnected.");
// 		}
// 	}
// }

function sendData(data) {
	socket.send(data);
}
