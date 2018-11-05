/**
 * @fileOverview A server for handling objects which are drawable on a canvas
 * @author Nathan Abramyk
 * @copyright Nathan Abramyk 2018
 * @version 1.0.0
 */

"use strict";

const GridSpace = require("./models/GridSpace.js");
const Element = require("./models/Element.js");

var app = require('express')();
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);
var bodyParser = require('body-parser')

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

var grid_id_counter = 1;

var grid_space = [new GridSpace(1, 1, grid_id_counter++)];

io.on('connection', (socket) => {
	console.log("a user connected");

	socket.on('init', (_, fn) => {
		fn({
			"grid_width": grid_space[0].width,
			"grid_height": grid_space[0].height,
			"elements": grid_space[0].elements,
			"annotations": grid_space[0].annotations,
			"spaces": grid_space.map((el) => { return { "id": el.id, "name": el.name } })
		});
	});

	socket.on('resize_height', (msg) => {
		var temp = grid_space.find((el) => { return msg.grid_id == el.id });
		temp.resizeHeight(msg.height);
		io.emit('resize_height', {
			"grid_id": msg.grid_id,
			"height": msg.height,
			"elements": temp.elements
		});
	});

	socket.on('resize_width', (msg) => {
		var temp = grid_space.find((el) => { return msg.grid_id == el.id });
		temp.resizeWidth(msg.width);
		io.emit('resize_width', {
			"grid_id": msg.grid_id,
			"width": msg.width,
			"elements": temp.elements
		});
	});

	socket.on('move_element', (msg, fn) => {
		var movedElement = grid_space.find((el) => { return msg.grid_id == el.id }).nudgeElement(msg.x, msg.y, msg.direction);
		if (typeof movedElement === 'undefined') return;

		io.emit('move_element', { "grid_id": msg.grid_id, "element": movedElement });
		fn({ "x": movedElement.x, "y": movedElement.y, "size": movedElement.size });
	});

	socket.on('warp_element', (msg, fn) => {
		var movedElement = grid_space.find((el) => { return msg.grid_id == el.id }).warpElement(msg.x, msg.y, msg.dest_x, msg.dest_y);
		if (typeof movedElement === 'undefined') {
			socket.emit('error_channel', { "message": "Somethings already there! " });
			return;
		}

		io.emit('move_element', { "grid_id": msg.grid_id, "element": movedElement });
		fn({ "x": movedElement.x, "y": movedElement.y, "size": movedElement.size });
	});

	/* ADD ELEMENT TO SERVER */
	socket.on('add_element_to_server', (msg) => {
		if(msg.category == "ping") {
			io.emit('added_element', { "grid_id" : msg.grid_id, "element" : new Element(0, JSON.parse(msg.x), JSON.parse(msg.y), "", "", "", "ping", "") });
			return;  
		}

		var input = new Element(0,
			JSON.parse(msg.x),
			JSON.parse(msg.y),
			msg.shape,
			msg.color,
			{ "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) },
			msg.category,
			isUndefined(msg.name) ? "object" : msg.name,
			msg.rotation);

		var output = grid_space
			.find((el) => { return el.id == msg.grid_id })
			.addElementToGridSpace(input);

		isUndefined(output) ? socket.emit('error_channel', { "message": "Cannot place an element where one already exists." }) : io.emit('added_element', { "grid_id": msg.grid_id, "element": output });
	});

	socket.on('delete_element_on_server', (msg) => {
		var temp = grid_space.find((el) => { return el.id == msg.grid_id }).removeElementFromGridSpace(msg.element_id);
		io.emit('removed_element', { "grid_id": msg.grid_id, "element_id": msg.element_id });
	});

	socket.on('edit_element_on_server', (msg) => {
		msg.size = { "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) };
		msg.x = JSON.parse(msg.x);
		msg.y = JSON.parse(msg.y);
		var temp = grid_space.find((el) => { return el.id == msg.grid_id }).mutateElementInGridSpace(msg);
		if(isUndefined(temp)) {
			socket.emit('error_channel', {"message" : "Unable to modify element properties."});
		} else {
			io.emit('edited_element', { "grid_id": msg.grid_id, "element": temp });
		}
	});

	socket.on('randomize', (msg) => {
		var temp = grid_space.find((el) => { return el.id == msg.grid_id }).generateRandomBoardElements();
		io.emit('added_elements', { "grid_id": msg.grid_id, "element": temp.elements });
	});

	socket.on('reset_board', (msg) => {
		grid_space.find((el) => { return el.id == msg.grid_id }).removeAllElementsFromGridSpace();
		io.emit('reset_grid', { "grid_id": msg.grid_id });
	});

	socket.on('create_grid_space', (msg) => {
		var newGridSpace = grid_space.push(new GridSpace(1, 1));
		io.emit('new_grid_space', { "id": grid_space[newGridSpace - 1].id, "name": grid_space[newGridSpace - 1].name });
	});

	socket.on('request_grid_space', (msg, fn) => {
		var grid = grid_space.find((el) => { return el.id == msg.id; });
		fn({ "grid_space": grid });
	});

	socket.on('delete_grid_space_from_server', (msg) => {
		if (grid_space.length <= 1) {
			socket.emit('error_channel', { "message": "Cannot have 0 grid spaces, you ass hat." });
			return;
		}

		grid_space.splice(grid_space.indexOf(grid_space.find((el) => { return msg.grid_id == el.id; })), 1);
		io.emit('delete_grid_space', { "grid_id": msg.grid_id });
	});

	socket.on('rename_grid', (msg) => {
		grid_space.find((el) => { return el.id == msg.grid_id }).name = msg.grid_name;
		io.emit('renaming_grid', msg);
	});

	socket.on('add_annotation_to_server', (msg) => {
		io.emit('added_annotation', { "grid_id": msg.grid_id, "annotation": grid_space.find((el) => { return el.id == msg.grid_id }).addAnnotationToGridSpace(msg) });
	});

	socket.on('delete_annotation_from_server', (msg) => {
		io.emit('deleted_annotation', { "grid_id": msg.grid_id, "annotation_id": grid_space.find((el) => { return el.id == msg.grid_id }).removeAnnotationFromGridSpace(msg.annotation_id) });
	});

	socket.on('undo', (msg) => {
		var space = grid_space.find((el) => { return el.id == msg.grid_id });
		var frame = space.historyUndo();
		switch (frame.action) {
			case "create":
				io.emit('removed_element', { "grid_id": msg.grid_id, "element_id": space.removeElementFromGridSpace(frame.frame.id).id });
				break;
			case "edit": break;
			case "delete": break;
		}
	});

	socket.on('redo', (msg) => {
		var frame = grid_space.find((el) => { return el.id == msg.grid_id }).historyRedo();
		switch (frame.action) {
			case "create": break;
			case "edit": break;
			case "delete": break;
		}
	});
});

//Main driver for booting up the server
http.listen(8080, () => {
	console.log("%s:%s", http.address().address, http.address().port)
});

/**
 * 
 * @param value
 * @returns { boolean } True if value is undefined, false otherwise
 */
function isUndefined(value) {
	return value === undefined;
}