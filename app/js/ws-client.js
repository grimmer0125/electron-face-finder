module.exports = {

  socket: null,
  receiveHandler :  null,

  registerReceiveHandler: function(handler){
    this.receiveHandler = handler;
  },

  sendData: function(data){
    this.socket.send(data);
  },

  destorySocket: function(){
    this.socket = null;
  },

  createSocket: function(address){
    console.log("start to create socket");
    address ="ws:" + "//localhost" + ":9000";
    var self = this;

    if(!this.socket){
      this.socket = new WebSocket(address);
    }
    // socketName = name;
    this.socket.binaryType = "arraybuffer"; //"blob";
    this.socket.onopen = function() {
      console.log('on open !!!');
    };
    this.socket.onmessage = function(e) {
      console.log("get data !!!! :", e.data);
      // debugger;
      var data = JSON.parse(e.data);
      self.receiveHandler(data);
    };
    this.socket.onerror = function(e) {
      console.log("Error creating WebSocket connection to " + address);
      console.log(e);
      self.destorySocket();
      setTimeout(self.createSocket.bind(self), 3000);
    };

    this.socket.onclose = function(e) {
      if (e.target == this.socket) {
        console.log("Disconnected");
        self.destorySocket();
        setTimeout(self.createSocket.bind(self), 3000);
        // $("#serverStatus").html("Disconnected.");
      }
    };
  }
}
