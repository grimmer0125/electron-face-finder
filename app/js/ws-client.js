module.exports = {

  socket: null,
  receiveHandler :  null,
  sendQueue:[],

  registerReceiveHandler: function(handler){
    this.receiveHandler = handler;
  },

  sendData: function(data){
    if(data){
      this.sendQueue.push(data);
    }
    var self = this;

    // if(process && process.nextTick){
    //   console.log("process.nextTick is defined when sending.");
    // }

    if(this.sendQueue.length==0){
      return;
    }


    try {
      var firstData = this.sendQueue[0];
      console.log("try to send data:", firstData.length);

      // http://stackoverflow.com/questions/24786628/web-socket-exception-could-not-be-caught
      // workaround to solving can not catch problem
      if( self.socket && self.socket.readyState === 1){
        this.socket.send(firstData);
        this.sendQueue.shift();
        if(this.sendQueue.length>0){
          process.nextTick(function(){
            console.log("send in ticker");
            this.sendData();
          });
        }
      } else {
        console.log("manually check status. socket is not in open !!!!!!");
        throw(new Error("WebSocket is not in OPEN state."));
      }
    } catch (error) {
      console.log("send data fail:", error);
      self.destorySocket();
      setTimeout(self.createSocket.bind(self), 3000);
    }
  },

  destorySocket: function(){
    console.log("try to destory socket");
    this.socket.close();
    this.socket = null;
  },

  createSocket: function(address){
    console.log("start to create socket");
    address ="ws:" + "//localhost" + ":9000";
    var self = this;

    if(!this.socket){

      // can not catch again.
      // try{
      this.socket = new WebSocket(address);
      // } catch (error){
      //   console.log("can not create socket ok:", error);
      // this.destorySocket();
      //   setTimeout(self.createSocket.bind(self), 3000);
      // }
    }

    console.log("after creating");

    // socketName = name;
    this.socket.binaryType = "arraybuffer"; //"blob";
    this.socket.onopen = function() {
      console.log('on open and try to send queued data!!!');
      self.sendData();
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
