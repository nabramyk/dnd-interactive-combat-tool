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
	var correction_vector = [];
	
	cells.find(function(el, ind, arr) {
		if(live_objects.findIndex(function (el2) { return JSON.stringify(el) == JSON.stringify(el2); }) == -1) {
			correction_vector.push({"action":"add","item":el});
		};
	});
	
	live_objects.find(function(el, ind, arr) {
		if(cells.findIndex(function (el2) { return JSON.stringify(el) == JSON.stringify(el2); }) == -1) {
			correction_vector.push({"action":"delete","item":el});
		};
	});
		
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(correction_vector));
});

app.post('/push_change', function(req,res) {
	var input = {color: req.body.color, x_coord: req.body.x_coord, y_coord: req.body.y_coord};
	for(var i=0; i < cells.length; i++) {
		if(cells[i].color==input.color && cells[i].x_coord==input.x_coord && cells[i].y_coord==input.y_coord) {
			res.setHeader('Content-Type', 'application/json');
			res.send(JSON.stringify({color: '#FFFFFF', x_coord: input.x_coord, y_coord: input.y_coord}));
			cells.splice(i,1);
			return;
		}
	}
	cells.push(input);
	res.setHeader('Content-Type', 'application/json');
	res.send(JSON.stringify(input));
});

var server = app.listen(8080, function() {
	var host = server.address().address
	var port = server.address().port
	
	console.log("%s:%s",host,port)
})
