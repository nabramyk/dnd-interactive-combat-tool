var express = require('express');
var app = express();

var bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

var cells = [];

app.get('/', function (req,res) {
	res.sendFile( __dirname + '/www/' + 'index.html');
});

app.post('/update', function (req,res) {
	var live_objects = JSON.parse(req.body.live_objects);
	res.setHeader('Content-Type', 'application/json');
	
	var correction_vector = new Array();
	
	//If something exists in the users grid that is not in the servers grid,
	//then delete it
	live_objects.forEach(function (item, index) {
		if(cells.indexOf(item)==-1) {
			
		};
	});
	
	//If something exists in the servers grid that is not in the users grid,
	//then add it
	cells.forEach(function(item, index) {
		if(live_objects.indexOf(item) == -1) {
			
		};
	});
});

app.post('/push_change', function(req,res) {
	var input = {color: req.body.color, x_coord: req.body.x_coord, y_coord: req.body.y_coord};
	console.log('Input: ' + input.color + ',' + input.x_coord + ',' + input.y_coord);
	for(var i=0; i < cells.length; i++) {
		if(cells[i].color==input.color && cells[i].x_coord==input.x_coord && cells[i].y_coord==input.y_coord) {
			console.log('Matched live cell at: ' + input.x_coord + ',' + input.y_coord);
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({color: '#FFFFFF', x_coord: input.x_coord, y_coord: input.y_coord}));
			cells.splice(i,i+1);
			return;
		}
	}
	cells.push(input);
	console.log("Pushed change, cells: " + cells.length);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(input));
});

var server = app.listen(8080, function() {
	var host = server.address().address
	var port = server.address().port
	
	console.log("%s:%s",host,port)
})
