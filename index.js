"use strict";
var http = require("http"), express = require("express"), cors = require("cors");
var colyseus = require("colyseus"), WebSocketTransport = require("@colyseus/ws-transport").WebSocketTransport;
var FreeWorldRoom = require("./room.js").FreeWorldRoom;

var PORT = Number(process.env.PORT) || 2567;
var app = express(); app.use(cors());
app.get("/", function(req, res){ res.send("Wrestling Buzz Free World server is running."); });
var server = http.createServer(app);
var gameServer = new colyseus.Server({transport: new WebSocketTransport({server: server, pingInterval: 3000, pingMaxRetries: 3})});
gameServer.define("freeworld", FreeWorldRoom);
gameServer.listen(PORT).then(function(){ console.log("Free World server listening on port " + PORT); });
