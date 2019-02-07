/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */
function drawTopRuler(pos) {
	for (var i = 1; i <= grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_top_ruler.addChild(rect);
		rect.sendToBack();

		var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), grid_size - (grid_size / 4)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i;
		group_top_ruler.addChild(text);
	}
	try { toprulerraster.remove(); } catch(e) {};
	toprulerraster = group_top_ruler.rasterize();
	group_top_ruler.removeChildren();
	paper.view.update();
}

function drawSelectedPositionTopRuler(pos) {
	var screen = paper.view.center._owner.topLeft; 

	if(isUndefined(top_ruler_cursor)) {
		top_ruler_cursor = paper.Shape.Rectangle(pos + (grid_size / 2), grid_line_width, grid_size, grid_size);
		top_ruler_cursor.strokeColor = grid_color;
		top_ruler_cursor.fillColor = grid_highlight;
		toprulerraster.addChild(top_ruler_cursor);

		top_ruler_number = new paper.PointText(new paper.Point(pos, grid_size - (grid_size / 4)));
		top_ruler_number.fillColor = 'white';
		top_ruler_number.justification = 'center';
		toprulerraster.addChild(top_ruler_number);
	}

	top_ruler_number.content = ((pos - grid_line_width) / grid_size) - 0.5;
	top_ruler_number.position = new paper.Point(pos, (screen.y > -40 ? screen.y + 50 : 10));
	top_ruler_cursor.position = new paper.Point(pos, (screen.y > -40 ? screen.y + 50 : 10));

	paper.view.update();
}

function drawLeftRuler(pos) {
	for (var i = 1; i <= grid_count_height; i++) {
		var rect = paper.Shape.Rectangle(grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_left_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point(grid_size / 2, i * grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i;
		group_left_ruler.addChild(text);
	}
	try { leftrulerraster.remove(); } catch(e) {};
	leftrulerraster = group_left_ruler.rasterize();
	group_left_ruler.removeChildren();
	paper.view.update();
}

function drawSelectedPositionLeftRuler(pos) {
	var screen = paper.view.center._owner.topLeft; 

	if(isUndefined(left_ruler_cursor)) {
		left_ruler_cursor = paper.Shape.Rectangle(grid_line_width, pos, grid_size, grid_size);
		left_ruler_cursor.strokeColor = grid_color;
		left_ruler_cursor.fillColor = grid_highlight;
		leftrulerraster.addChild(left_ruler_cursor);

		left_ruler_number = new paper.PointText(new paper.Point(grid_size, pos));
		left_ruler_number.fillColor = 'white';
		left_ruler_number.justification = 'center';
		leftrulerraster.addChild(left_ruler_number);
	}

	left_ruler_number.content = ((pos - grid_line_width) / grid_size) - 0.5;
	left_ruler_number.position = new paper.Point((screen.x > 0 ? screen.x + 10 : 10), pos);
	left_ruler_cursor.position = new paper.Point((screen.x > 0 ? screen.x + 10 : 10), pos);
	left_ruler_number.bringToFront();
	
	paper.view.update();
}

function drawElements() {
	local_stored_grid_space.forEach(function(el) {
		draw_item(el);
	});
	try { elementsraster.remove() } catch(e) {};
	elementsraster = group_elements.rasterize();
	group_elements.removeChildren();
	paper.view.update();
}

/**
 * Draws the input element to the canvas 
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
	switch (element[1].type) {
	case "rectangle":		
		var ele = paper.Shape.Rectangle(element[1]);
		ele.fillColor = element[1].fillColor;
		group_elements.addChild(ele);
		break;
	case "circle":		
		element[1].radius *= grid_size;
		var ele = paper.Shape.Circle(element[1]);
		ele.fillColor = element[1].fillColor;
		group_elements.addChild(ele);
		break;
	case "line":
		ctx.strokeStyle = "#" + element.color;
		ctx.lineWidth = element.size;
		ctx.beginPath();
		x = element.x.map(function(e) {
			return gridPoint2Pixel(e)
		});
		y = element.y.map(function(e) {
			return gridPoint2Pixel(e)
		});
		ctx.moveTo(x[0] + grid_line_width, y[0] + grid_line_width);
		for (var i = 1; i < x.length; i++) {
			ctx.lineTo(x[i] + grid_line_width, y[i] + grid_line_width);
		}
		ctx.stroke();
		break;
	}
	paper.view.update();
}

/**
 * Function for drawing the grid board
 */
function drawScreen() {
	for (var i = 1; i <= grid_count_height; i++) {
		for (var j = 1; j <= grid_count_width; j++) {
			var rect = paper.Shape.Rectangle(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
			rect.strokeColor = grid_color;
			group_grid.addChild(rect);
		}
	}
	try { gridraster.remove(); } catch(e) {};
	gridraster = group_grid.rasterize();
	group_grid.removeChildren();

	paper.view.update();
}

/**
 * Draws the ping
 */
function drawPing(ping) {
	group_overlay.addChild(paper.Shape.Circle({ 
		center: [ping.position[1], ping.position[2]],
		radius: ping.size[1] / 2,
		fillColor: "#f44242",
		onFrame: function(event) {
			if(event.count >= 100) {
				this.remove();
			}
			paper.view.update();
		}
	}));
}