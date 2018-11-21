/**
 * @fileOverview A server for handling objects which are drawable on a canvas
 * @author Nathan Abramyk
 * @copyright Nathan Abramyk 2018
 * @version 1.0.0
 */

"use strict";

const ClutterInstance = require("./models/ClutterInstance.js");
const Element = require("./models/Element.js");

var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser');
var isUndefined = require('./utils.js').isUndefined;

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function (req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//Define the main path to index.html, which will be automatically loaded when
//the user visits for the
//first time
app.use(express.static('www'));

//Define the path for where the javscript files are located for the users
//webpage
app.use('/js', express.static(__dirname + '/www/js'))

//Define the path for where the css stylesheets are located for the users
//webpage
app.use('/css', express.static(__dirname + '/www/css'))

var clutter = new ClutterInstance();

io.on('connection', (socket) => {
	console.log("a user connected");

	socket.on('init', (_, fn) => {
		try {
			if(io.engine.clientsCount == 1) throw new Error();
			Object.keys(io.sockets.sockets).some(function(id) {
				
				if(id == socket.id) {
					return false;
				}

				io.sockets.sockets[id].emit('new_init', {}, (data) => {
					console.log(data);
					fn(data);
					return true;
				});
			})
		} catch(e) {
			fn(new ClutterInstance().init());
			console.log(e);
		}
	});

	socket.on('resize', (msg) => {
		io.emit('resize', clutter.resize(msg));
	});

	socket.on('move_element', (msg, fn) => {
		var movedElement = clutter.moveElement(msg);
		if(isUndefined(movedElement)) return;
		io.emit('move_element', { "grid_id": msg.grid_id, "element": movedElement });
		fn({ "x": movedElement.x, "y": movedElement.y, "size": movedElement.size });
	});

	socket.on('add_element_to_server', (msg) => {
		io.emit('added_element', { "grid_id" : msg.grid_id, "element": new Element(0,
			JSON.parse(msg.x),
			JSON.parse(msg.y),
			msg.shape,
			msg.color,
			{ "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) },
			msg.category,
			isUndefined(msg.name) ? "object" : msg.name,
			msg.rotation)});
	});

	socket.on('delete_element_on_server', (msg) => {
		clutter.deleteElement(msg);
		io.emit('removed_element', { "grid_id": msg.grid_id, "element_id": msg.element_id });
	});

	socket.on('edit_element_on_server', (msg) => {
		var temp = clutter.editElement(msg);
		if(isUndefined(temp)) {
			socket.emit('error_channel', {"message" : "Unable to modify element properties."});
		} else {
			io.emit('edited_element', { "grid_id": msg.grid_id, "element": temp });
		}
	});

	socket.on('randomize', (msg) => {
		io.emit('added_elements', { "grid_id": msg.grid_id, "element": clutter.randomize(msg).elements });
	});

	socket.on('reset_board', (msg) => {
		io.emit('reset_grid', clutter.reset(msg));
	});

	socket.on('create_grid_space', () => {
		io.emit('new_grid_space', clutter.createGridSpace());
	});

	socket.on('request_grid_space', (msg, fn) => {
		fn({ "grid_space": clutter.findGridSpace(msg) });
	});

	socket.on('delete_grid_space_from_server', (msg) => {
		io.emit('delete_grid_space', clutter.deleteGridSpace(msg));
	});

	socket.on('rename_grid', (msg) => {
		io.emit('renaming_grid', clutter.renameGrid(msg));
	});

	socket.on('add_annotation_to_server', (msg) => {
		io.emit('added_annotation', clutter.addAnnotation(msg));
	});

	socket.on('delete_annotation_from_server', (msg) => {
		io.emit('deleted_annotation', clutter.deleteAnnotation(msg));
	});

	socket.on('ping_snd', (msg) => {
		io.emit('ping_rcv', msg);
	})
});

//Main driver for booting up the server
http.listen(8080, () => {
	console.log("%s:%s", http.address().address, http.address().port)
});