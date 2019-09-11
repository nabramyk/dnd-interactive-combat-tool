/**
 * @fileoverview Should just handle all of the canvas drawing stuff
 */

/**
 * Top ruler goes 1...[grid width] from left to right
 */
function drawTopRuler() {
	for (var i = 0; i < grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, 0 - grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_top_ruler.addChild(rect);
		rect.sendToBack();

		var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), 0 - grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i + 1;
		group_top_ruler.addChild(text);
	}
	try { toprulerraster.remove(); } catch (e) { };
	toprulerraster = group_top_ruler.rasterize();
	group_top_ruler.removeChildren();
	toprulerraster.bringToFront();
	paper.view.update();
}

/**
 *
 * @param {*} pos
 * @param {*} width
 */
function drawSelectedPositionTopRuler(pos) {
	var screen = paper.view.center._owner.topLeft;

	group_top_cursor.removeChildren();
	group_bottom_cursor.removeChildren();

	if (selected_element != null && isUndefined(selected_element.shape)) {
		return;
	}

	var top_ruler_cursor = paper.Shape.Rectangle(selected_grid_x, grid_line_width, 0, 0);
	top_ruler_cursor.fillColor = grid_highlight;
	top_ruler_cursor.size.height = grid_size;
	top_ruler_cursor.size.width = (selected_element == null) ? grid_size : selected_element.size.width;

	var bottom_ruler_cursor = top_ruler_cursor.clone();

	group_top_cursor.addChild(top_ruler_cursor);
	group_bottom_cursor.addChild(bottom_ruler_cursor);

	group_top_cursor.position = new paper.Point((selected_element == null) ? selected_grid_x : selected_element.position.x,
												toprulerraster.position.y);

	group_bottom_cursor.position.y = bottomrulerraster.position.y;
	group_bottom_cursor.position.x = group_top_cursor.position.x;

	if (selected_element != null) {
		for (var i = 0; i < selected_element.size.width / grid_size; i++) {
			var top_ruler_number = new paper.PointText(new paper.Point(grid_size, pos + (i * grid_size)));
			top_ruler_number.fillColor = 'white';
			top_ruler_number.justification = 'center';

			top_ruler_number.content = ((selected_element.bounds.left - 0.5) / grid_size) + i + 1;
			top_ruler_number.position = new paper.Point(selected_element.bounds.left + (i * grid_size) + (grid_size / 2), toprulerraster.position.y);

			var bottom_ruler_number = top_ruler_number.clone();
			bottom_ruler_number.content = (grid_count_width - top_ruler_number.content) + 1;
			bottom_ruler_number.position.y = bottomrulerraster.position.y;

			group_top_cursor.addChild(top_ruler_number);
			group_bottom_cursor.addChild(bottom_ruler_number);

			top_ruler_number.bringToFront();
			bottom_ruler_number.bringToFront();

			group_top_cursor.bringToFront();
			group_bottom_cursor.bringToFront();
		}
	} else {
		var top_ruler_number = new paper.PointText(grid_size, new paper.Point(pos + (i * grid_size)));
		top_ruler_number.fillColor = 'white';
		top_ruler_number.justification = 'center';

		top_ruler_number.content = ((pos - grid_line_width) / grid_size) + 0.5;
		top_ruler_number.position = new paper.Point(pos, (screen.y > -60 ? screen.y + 50 : -10));

		var bottom_ruler_number = top_ruler_number.clone();
		bottom_ruler_number.content = (grid_count_width - top_ruler_number.content) + 1;
		bottom_ruler_number.position.y = bottomrulerraster.position.y;

		group_top_cursor.addChild(top_ruler_number);
		group_bottom_cursor.addChild(bottom_ruler_number);

		top_ruler_number.bringToFront();
		bottom_ruler_number.bringToFront();

		group_top_cursor.bringToFront();
		group_bottom_cursor.bringToFront();
	}

	paper.view.update();
}

/**
 * Left ruler goes 1...grid height from top to bottom
 */
function drawLeftRuler() {
	for (var i = 0; i < grid_count_height; i++) {
		var rect = paper.Shape.Rectangle(0 - grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_left_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point(0 - grid_size / 2, i * grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = i + 1;
		group_left_ruler.addChild(text);
	}
	try { leftrulerraster.remove(); } catch (e) { };
	leftrulerraster = group_left_ruler.rasterize();
	group_left_ruler.removeChildren();
	leftrulerraster.bringToFront();
	paper.view.update();
}

function drawSelectedPositionLeftRuler(pos) {
	var screen = paper.view.center._owner.topLeft;

	group_left_cursor.removeChildren();
	group_right_cursor.removeChildren();

	if (selected_element != null && isUndefined(selected_element.shape)) {
		return;
	}

	var left_ruler_cursor = paper.Shape.Rectangle(grid_line_width, pos, 0, 0);
	left_ruler_cursor.fillColor = grid_highlight;
	left_ruler_cursor.size.height = (selected_element == null) ? grid_size : selected_element.size.height;
	left_ruler_cursor.size.width = grid_size;

	var right_ruler_cursor = left_ruler_cursor.clone();

	group_left_cursor.addChild(left_ruler_cursor);
	group_right_cursor.addChild(right_ruler_cursor);

	group_left_cursor.position = new paper.Point(leftrulerraster.position.x,
		((selected_element == null) ? selected_grid_y : selected_element.position.y));

	group_right_cursor.position.x = rightrulerraster.position.x;
	group_right_cursor.position.y = group_left_cursor.position.y;

	if (selected_element != null) {
		for (var i = 0; i < selected_element.size.height / grid_size; i++) {
			var left_ruler_number = new paper.PointText(new paper.Point(grid_size, group_left_cursor.position + (i * grid_size)));
			left_ruler_number.fillColor = 'white';
			left_ruler_number.justification = 'center';

			left_ruler_number.content = ((selected_element.bounds.top - 0.5) / grid_size) + i + 1;
			left_ruler_number.position = new paper.Point(leftrulerraster.position.x, selected_element.bounds.top + (i * grid_size) + (grid_size / 2));

			var right_ruler_number = left_ruler_number.clone();
			right_ruler_number.content = (grid_count_height - left_ruler_number.content) + 1;
			right_ruler_number.position.x = rightrulerraster.position.x;

			group_left_cursor.addChild(left_ruler_number);
			group_right_cursor.addChild(right_ruler_number);

			left_ruler_number.bringToFront();
			right_ruler_number.bringToFront();

			group_left_cursor.bringToFront();
			group_right_cursor.bringToFront();
		}
	} else {
		var left_ruler_number = new paper.PointText(new paper.Point(grid_size, 0));
		left_ruler_number.fillColor = 'white';
		left_ruler_number.justification = 'center';

		left_ruler_number.content = ((pos - grid_line_width) / grid_size) + 0.5;
		left_ruler_number.position = new paper.Point((screen.x > -10 ? screen.x + 10 : -10), pos);

		var right_ruler_number = left_ruler_number.clone();
		right_ruler_number.content = (grid_count_height - left_ruler_number.content) + 1;
		right_ruler_number.position = new paper.Point(right_ruler_cursor.position.x, pos);

		group_left_cursor.addChild(left_ruler_number);
		group_right_cursor.addChild(right_ruler_number);

		left_ruler_number.bringToFront();
		right_ruler_number.bringToFront();

		group_left_cursor.bringToFront();
		group_right_cursor.bringToFront();
	}

	paper.view.update();
}

/**
 * Bottom ruler goes grid width...1 from left to right
 */
function drawBottomRuler() {
	for (var i = 0; i < grid_count_width; i++) {
		var rect = paper.Shape.Rectangle(i * grid_size + grid_line_width, (grid_count_height * grid_size) + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_bottom_ruler.addChild(rect);
		rect.sendToBack();

		var text = new paper.PointText(new paper.Point(i * grid_size + (grid_size / 2), (grid_count_height * grid_size) + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = grid_count_width - i;
		group_bottom_ruler.addChild(text);
	}
	try { bottomrulerraster.remove(); } catch (e) { };
	bottomrulerraster = group_bottom_ruler.rasterize();
	group_bottom_ruler.removeChildren();
	bottomrulerraster.bringToFront();
	paper.view.update();
}

/**
 * Right ruler goes grid height...1 from top to bottom
 */
function drawRightRuler() {
	for (var i = 0; i < grid_count_height; i++) {
		var rect = paper.Shape.Rectangle((grid_count_width * grid_size) + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
		rect.strokeColor = grid_color;
		rect.fillColor = "#f5f5f5";
		group_right_ruler.addChild(rect);

		var text = new paper.PointText(new paper.Point((grid_count_width * grid_size) + grid_size / 2, i * grid_size + (grid_size / 1.5)));
		text.fillColor = 'black';
		text.justification = 'center';
		text.content = grid_count_height - i;
		group_right_ruler.addChild(text);
	}
	try { rightrulerraster.remove(); } catch (e) { };
	rightrulerraster = group_right_ruler.rasterize();
	group_right_ruler.removeChildren();
	rightrulerraster.bringToFront();
	paper.view.update();
}

function drawElements() {
	try { elementsraster.remove() } catch (e) { };
	paper.view.update();
}

function draw_local_item() {
	var x = pixel2GridPoint(selected_grid_x)
	var y = pixel2GridPoint(selected_grid_y)

	var w = $("#element_width").val()
	var h = $("#element_height").val()

	switch ($("#selected_shape").val()) {
		case "rectangle":
			ele = paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(w) * grid_size, JSON.parse(h) * grid_size);
			ele.fillColor = $("#element_color").spectrum("get").toHexString();
			ele.pivot = paper.Shape.Rectangle.topLeft;
			break;
		case "circle":
			ele = paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(w) * (grid_size / 2));
			ele.bounds.topLeft = new paper.Point(x - (grid_size / 2), y - (grid_size / 2));
			ele.fillColor = $("#element_color").spectrum("get").toHexString();
			ele.pivot = paper.Shape.Rectangle.topLeft;
			break;
		case "line":
		case "freehand":
			ele = temp_line.clone();
			ele.fullySelected = false;
			temp_line.remove();
			ele.strokeColor = $("#element_color").spectrum("get").toHexString();
			ele.strokeWidth = 1;
			break;
	}

	ele.data.name = $("#element_name").val();
	ele.data.category = $("#element_category").val();

	ele.onMouseEnter = function () {
		if(isDragging) return;
		t = new paper.PointText(this.position.x, this.bounds.top - 10);
		t.content = this.data.name;
		t.pivot = paper.Shape.Rectangle.topLeft;
		b = paper.Shape.Rectangle(t.bounds);
		b.size.width += 10;
		b.size.height += 10;
		b.fillColor = 'white';
		b.strokeColor = "black";
		group_overlay.addChildren([b, t]);
		group_overlay.bringToFront();
		paper.view.update();
	}

	ele.onMouseLeave = function () {
		t.remove();
		b.remove();
		paper.view.update();
	}

	group_elements.addChild(ele);
	selected_element = ele;

	draw_cursor();
	drawSelectedPositionTopRuler(Number(selected_grid_x));
	drawSelectedPositionLeftRuler(Number(selected_grid_y));

	paper.view.update();
	return ele;
}

function draw_cursor() {
	console.log($("#sidebar").hasClass("active"));
	if($("#sidebar").hasClass("active")) {

	}

	try {
		cursor.remove();
	} catch(e) {}

	switch ($('#selected_shape').val()) {
		case "line":
			cursor = paper.Shape.Circle(new paper.Point(selected_grid_x - (grid_size / 2), selected_grid_y - (grid_size / 2)), 5);
			cursor.fillColor = grid_highlight;
			group_overlay.addChild(cursor);
			if (line_path.segments.length > 0) {
				try { temp_line.remove(); } catch (e) { console.log(e) };
				temp_line = new paper.Path(line_path.segments);
				temp_line.add(cursor.position);
				temp_line.strokeColor = "#ff0000";
				group_overlay.addChild(temp_line);
			}
			break;
		default:
			if (!isUndefined(selected_element) && selected_element != null) {
				if (selected_element.type == "stroke") {
					console.log("TODO: Handle selecting lines.");
				} else {
					cursor = paper.Shape.Rectangle(selected_element.bounds);
					cursor.position = new paper.Point(selected_element.position.x, selected_element.position.y);
					cursor.strokeColor = grid_highlight;
				}
			} else {
				cursor = paper.Shape.Rectangle(0, 0, grid_size * cursor_size.width, grid_size * cursor_size.height);
				cursor.position = new paper.Point(selected_grid_x, selected_grid_y);
				cursor.strokeColor = grid_highlight;
			}
			group_overlay.addChild(cursor);
	}
}

/**
 * Draws the input element to the canvas
 *
 * @param {Element} element
 * @returns
 */
function draw_item(element) {
	switch (element.type) {
		case "square":
		case "rectangle":
			ele = paper.Shape.Rectangle(element);
			break;
		case "circle":
		case "oval":
			ele = paper.Shape.Circle(element);
			break;
		default:
			ele = new paper.Path(element);
			break;
	}

	ele.onMouseEnter = function () {
		if(isDragging) return;
		t = new paper.PointText(this.position.x, this.bounds.top - 10);
		t.content = this.data.name;
		t.pivot = paper.Shape.Rectangle.topLeft;
		b = paper.Shape.Rectangle(t.bounds);
		b.size.width += 10;
		b.size.height += 10;
		b.fillColor = 'white';
		b.strokeColor = "black";
		group_overlay.addChildren([b, t]);
		group_overlay.bringToFront();
		paper.view.update();
	}

	ele.onMouseLeave = function () {
		t.remove();
		b.remove();
		paper.view.update();
	}

	group_elements.addChild(ele);
	paper.view.update();
	return element;
}

/**
 * Function for drawing the grid board
 */
function drawScreen() {
	for (var i = 0; i < grid_count_height; i++) {
		for (var j = 0; j < grid_count_width; j++) {
			var rect = paper.Shape.Rectangle(j * grid_size + grid_line_width, i * grid_size + grid_line_width, grid_size, grid_size);
			rect.strokeColor = grid_color;
			group_grid.addChild(rect);
		}
	}
	try { gridraster.remove(); } catch (e) { };
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
		onFrame: function (event) {
			if (event.count >= 100) {
				this.remove();
			}
			paper.view.update();
		}
	}));
}

function eraseCursor() {
	try {
		cursor.remove();

		group_top_cursor.removeChildren();
		group_left_cursor.removeChildren();		
		group_bottom_cursor.removeChildren();
		group_right_cursor.removeChildren();		
	} catch (e) {
		console.log(e);
	}
}
