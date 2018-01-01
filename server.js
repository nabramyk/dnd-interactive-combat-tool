//This server requires the 'express' NodeJS server framework
var express = require('express');
var app = express();

var bodyParser = require('body-parser')

function coordinate_comparison(obj_1, obj_2) {
	return obj_1.x_coord == obj_2.x_coord && obj_1.y_coord == obj_2.y_coord;
}

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
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

/* Function for updating the users view when called
 * 
 * Recieves: a json array containing the list of elements which are currently displayed
 * on that individual page
 * 
 * Sends: a vector of actions which the page will use to correct itself to the servers model
 */
app.post('/update', function (req,res) {
	
	//Parse the user call and store the list of live objects from the user in an array
	var live_objects = JSON.parse(req.body.live_objects);	
	
	//Initialize the correction vector for returning the actions the webpage must take in
	//order to be up to date with the server model
	var correction_vector = [];
	
	//For each live element in the server model...
	cells.find(function(el, ind, arr) {
		//...if this live element does not exist in the user's grid...
		if(live_objects.findIndex(function (el2) { return coordinate_comparison(el,el2); }) == -1) {
			//...push to the correction vector so that it is added to the user's grid
			correction_vector.push({"action":"add","item":el});
		};
	});
	
	//For each live element in the user's model...
	live_objects.find(function(el, ind, arr) {
		//...if this live element does not exist in the server's grid...
		if(cells.findIndex(function (el2) { return coordinate_comparison(el,el2); }) == -1) {
			//push to the correction vector so that it is removed from the user's grid
			correction_vector.push({"action":"erase","item":el});
		};
	});
	
	//Return the correction vector as a json array
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(correction_vector));
});

//Function for modifying the servers internal model of the grid board
app.post('/push_change', function(req,res) {
	
	//Parse the input request and store it as a JSON object
	var input = {color: req.body.color, x_coord: req.body.x_coord, y_coord: req.body.y_coord, shape: req.body.object_type};
	
	//For each element in the internal state...
	for(var i=0; i < cells.length; i++) {
		if(cells[i].color==input.color && cells[i].x_coord==input.x_coord && cells[i].y_coord==input.y_coord) {
			res.setHeader('Content-Type', 'application/json');
			res.send("Done");
			cells.splice(i,1);
			return;
		}
	}
	
	cells.push(input);
	res.setHeader('Content-Type', 'application/json');
	res.send("Done");
});

//Main driver for booting up the server
var server = app.listen(8080, function() {
	var host = server.address().address
	var port = server.address().port
	
	console.log("%s:%s",host,port)
})
