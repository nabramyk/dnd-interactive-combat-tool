//This server requires the 'express' NodeJS server framework
var express = require('express');
var app = express();
var log4js = require('log4js');
var log = log4js.getLogger();

var bodyParser = require('body-parser')

var element_id_counter = 1;

function coordinate_comparison(obj_1, obj_2) {
	if (obj_1.x_coord instanceof Array)
		return obj_1.x_coord.every(function(u, i) {
				return u === obj_2.x_coord[i];
			}) &&
			obj_1.y_coord.every(function(u, i) {
				return u === obj_2.y_coord[i];
			});
	else
		return obj_1.x_coord === obj_2.x_coord && obj_1.y_coord === obj_2.y_coord;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: false
}));
app.use(function(req, res, next) {
	res.header("Access-Control-Allow-Origin", "*");
	res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
	next();
});

//Define the main path to index.html, which will be automatically loaded when the user visits for the
//first time
app.use(express.static('www'));

//Define the path for where the javscript files are located for the users webpage
app.use('/js', express.static(__dirname + '/www/js'))

//Define the path for where the css stylesheets are located for the users webpage
app.use('/css', express.static(__dirname + '/www/css'))

//Initialize the array for centralizing the model between multiple users
var cells = [];

var history = [];

var grid_width = 1;
var grid_height = 1;

/* Function for updating the users view when called
 * 
 * Recieves: a json array containing the list of elements which are currently displayed
 * on that individual page
 * 
 * Sends: a vector of actions which the page will use to correct itself to the servers model
 */
app.post('/update', function(req, res) {

	//Parse the user call and store the list of live objects from the user in an array
	var live_objects = JSON.parse(req.body.live_objects);

	//Initialize the correction vector for returning the actions the webpage must take in
	//order to be up to date with the server model
	var correction_vector = [];

	correction_vector.push({
		"width": grid_width,
		"height": grid_height
	});

	//For each live element in the user's model...
	live_objects.forEach(function(el, ind, arr) {
		//...if this live element does not exist in the server's grid...
		if (cells.findIndex(function(el2) {
				return coordinate_comparison(el, el2);
			}) == -1) {
			//push to the correction vector so that it is removed from the user's grid
			correction_vector.push({
				"action": "erase",
				"item": el
			});
		}

	});

	//For each live element in the server model...
	cells.forEach(function(el, ind, arr) {
		//...if this live element does not exist in the user's grid...
		if (live_objects.findIndex(function(el2) {
				return coordinate_comparison(el, el2);
			}) == -1) {
			//...push to the correction vector so that it is added to the user's grid
			correction_vector.push({
				"action": "add",
				"item": el
			});
		}

		if (live_objects.find(function(el2) {
				return (el2.name !== el.name ||
					el2.category !== el.category ||
					el2.color !== el.color ||
					el2.size !== el.size ||
					el2.shape !== el.shape) && coordinate_comparison(el, el2);
			})) {
			correction_vector.push({
				"action": "edit",
				"item": el
			})
		}
	});

	//Return the correction vector as a json array
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(correction_vector));
});

//Function for modifying the servers internal model of the grid board
app.post('/delete_element', function(req, res) {

	var id = JSON.parse(req.body.id);

	//For each element in the internal state...
	cells.find(function(el, ind, arr) {
		if (el.id == id) {
			console.log("Deleted: " + JSON.stringify(req.body));
			history.push({
				"action": "delete",
				"item": cells[ind]
			});
			cells.splice(ind, 1);
			return true;
		}
	});

	res.setHeader('Content-Type', 'application/json');
	res.send("Done");
});

app.post('/add_element', function(req, res) {
	//Parse the input request and store it as a JSON object
	var input = {
		"id": element_id_counter,
		"color": req.body.color,
		"x_coord": JSON.parse(req.body.x_coord),
		"y_coord": JSON.parse(req.body.y_coord),
		"shape": req.body.object_type,
		"name": req.body.name !== "" ? req.body.name : "object",
		"size": req.body.size,
		"category": req.body.category
	};

	console.log("Added: " + JSON.stringify(input));

	cells.push(input);
	history.push({
		"action": "add",
		"item": input
	});

	res.setHeader('Content-Type', 'application/json');
	res.send("Done");

	element_id_counter++;
});

app.post('/edit_element', function(req, res) {
	var id = JSON.parse(req.body.id);
	var ob = cells.find(function(el) {
		return el.id == id;
	});
	ob.name = req.body.name;
	ob.shape = req.body.shape;
	ob.color = req.body.color;
	ob.size = req.body.size;
	ob.category = req.body.category;
	console.log("Renamed: " + JSON.stringify(req.body));
	res.setHeader('Content-Type', 'application/json');
	res.send({
		message: "message"
	});
});

app.post('/move_element', function(req, res) {

	var ob = cells.find(function(el) {
		return el.x_coord == req.body.from_x && el.y_coord == req.body.from_y
	});

	if (typeof ob === 'undefined') {
		res.status(400).json({
			"error": req.body.from_x
		});
		return;
	}

	var direction = req.body.direction;
	var move_to_x = ob.x_coord;
	var move_to_y = ob.y_coord;
	var id = ob.id;

	do {
		if (direction == "right") move_to_x++;
		else if (direction == "left") move_to_x--;
		else if (direction == "up") move_to_y--;
		else if (direction == "down") move_to_y++;
	} while (cells.findIndex(function(element) {
			return coordinate_comparison(element, {
				"x_coord": move_to_x,
				"y_coord": move_to_y
			})
		}) != -1);

	ob.x_coord = move_to_x;
	ob.y_coord = move_to_y;

	console.log("Moved: " + JSON.stringify(req.body));

	res.status(200).json({
		"id": id,
		"position_x": ob.x_coord,
		"position_y": ob.y_coord
	});
});

app.post('/resize_grid', function(req, res) {
	grid_width = JSON.parse(req.body.width);
	grid_height = JSON.parse(req.body.height);
	console.log("Resized: " + JSON.stringify(req.body));

	res.status(200).json({
		"width": grid_width,
		"height": grid_height
	});
});

app.post('/undo_action', function(req, res) {
	res.status(200);
});

app.post('/redo_action', function(req, res) {
	res.status(200);
});

app.post('/draw_cursor_at_position', function(req, res) {
	var x = req.body.x;
	var y = req.body.y;
	var size = 1;
	cells.find(function(el) {
		if (coordinate_comparison(el, {
				"x_coord": x,
				"y_coord": y
			})) {
			size = el.size;
			return true;
		}
	})
	res.status(200).json({
		"x": x,
		"y": y,
		"size": size
	});
});

app.post('/randomize', function(req, res) {
	for (var w = 0; w < grid_width; w++) {
		for (var h = 0; h < grid_height; h++) {
			if (Math.random() < 0.5) {
					var input = {
						"id": element_id_counter,
						"color": "000000",
						"x_coord": w + 1,
						"y_coord": h + 1,
						"shape": "square",
						"name": "rando" + h * w,
						"size": 1,
						"category": "environment"
					};
				
					cells.push(input);
					element_id_counter++;
			}
		}
	}
});

app.post('/reset', function(req, res) {
	cells = [];
});

//Main driver for booting up the server
var server = app.listen(8080, function() {
	var host = server.address().address
	var port = server.address().port

	console.log("%s:%s", host, port)
})