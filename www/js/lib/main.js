app.controller('clutterController', ['$scope', '$rootScope', 'utils', function ($scope, $rootScope, utils) {
	var group_grid,
		group_elements,
		group_overlay,
		group_left_ruler,
		group_top_ruler,
		group_bottom_ruler,
		group_right_ruler,
		group_left_cursor,
		group_right_cursor,
		group_top_cursor,
		group_bottom_cursor,
		line_path;

	var leftrulerraster,
		toprulerraster,
		bottomrulerraster,
		rightrulerraster,
		gridraster,
		elementsraster,
		leftcursorraster,
		rightcursorraster;

	var grid_count_width = 0;
	var grid_count_height = 0;

	var cursor_size = $rootScope._cursor_size;
	var grid_size = $rootScope._grid_size;
	var selected_element = $rootScope._selected_element;

	$("#grid_size_vertical").val(grid_count_height);
	$("#grid_size_horizontal").val(grid_count_width);

	$scope.$on('initializeCanvas', function (_, msg) {
		group_elements.removeChildren();

		grid_count_height = msg.size.height;
		resizeGridHeight(grid_count_height);
		grid_count_width = msg.size.width;
		resizeGridWidth(grid_count_width);

		selected_grid_x = -1;
		selected_grid_y = -1;

		$("#element_list").empty();
		refresh_elements_list();

		$rootScope._grid_id = msg.spaces[0].id;
		$rootScope.$broadcast('generateGridTabs', msg.spaces);

		msg.elements.map(function (el) {
			draw_item(el);
		});

		local_stored_annotations = msg.annotations;
		showAnnotations();
		refresh_annotations_list();

		refresh_elements_list();

		$("#options_add_or_edit_button").hide();
		$("#options_annotate_button").hide();
		$("#options_delete_button").hide();
		$("#options_copy_button").hide();
		$("#options_paste_button").hide();
		$("#options_movement_button").hide();

		$("#loading_div").hide();
	});

	init();
	function init() {
		if (!$scope.paper) {
			$scope.paper = new paper.PaperScope();
			$scope.paper.setup('canvas');
		}

		group_grid = new $scope.paper.Group();
		group_elements = new $scope.paper.Group();
		group_left_ruler = new $scope.paper.Group();
		group_top_ruler = new $scope.paper.Group();
		group_bottom_ruler = new $scope.paper.Group();
		group_right_ruler = new $scope.paper.Group();
		group_left_cursor = new $scope.paper.Group();
		group_right_cursor = new $scope.paper.Group();
		group_top_cursor = new $scope.paper.Group();
		group_bottom_cursor = new $scope.paper.Group();
		group_overlay = new $scope.paper.Group();

		line_path = new $scope.paper.Path();

		$scope.paper.view.onClick = function (event) {
			if ($('#sidebar').hasClass('active') && $('#selected_shape').val() == "freehand") { return; }
			if (gridraster.hitTest(event.point) == null || isDragging) { return; }

			try {
				t.remove();
				b.remove();
			} catch (e) { };

			selected_grid_x = event.point.x - (event.point.x % grid_size) + (grid_size / 2) + grid_line_width;
			selected_grid_y = event.point.y - (event.point.y % grid_size) + (grid_size / 2) + grid_line_width;

			cursor_size = { "width": 1, "height": 1 };

			var cursor = $rootScope._cursor;
			if (isUndefined(cursor)) {
				cursor = paper.Shape.Rectangle(selected_grid_x, selected_grid_y, grid_size * cursor_size.width, grid_size * cursor_size.height);
				cursor.strokeColor = grid_highlight;
				$rootScope._cursor = cursor;
			}

			if (selected_element != null) selected_element.selected = false;

			try {
				selected_element = group_elements.hitTest(event.point).item;
			} catch (e) {
				selected_element = null;
			}

			$rootScope._selected_element = selected_element;
			$rootScope.$broadcast('selectedElement');
			$rootScope.$broadcast('canvasClicked');

			stored_edited_element_bounds = null;

			draw_cursor();

			//$("#move_to_x").val(utils.pixel2GridPoint(selected_grid_x) - 1);
			//$("#move_to_y").val(utils.pixel2GridPoint(selected_grid_y) - 1);

			drawSelectedPositionTopRuler(Number(selected_grid_x));
			drawSelectedPositionLeftRuler(Number(selected_grid_y));

			
			$scope.paper.view.update();
		}

		var toolPan = new $scope.paper.Tool();
		toolPan.activate();

		toolPan.onMouseDrag = function (event) {
			if ($('#add_container').hasClass('active') && $('#selected_shape').val() == "freehand") {
				if (gridraster.hitTest(event.point) != null) {
					if (temp_line == null) {
						temp_line = new paper.Path({
							strokeColor: '#000000',
							strokeWidth: $("#outline_thickness").val()
						})
						temp_line.moveTo(event.point);
						x_vertices.push(event.point.x);
						y_vertices.push(event.point.y);
						temp_line.fullySelected = true;
					} else {
						temp_line.lineTo(event.point);
						x_vertices.push(event.point.x);
						y_vertices.push(event.point.y);
						temp_line.smooth();
					}
					$("#start_new_line_button").show();
					$("#element_erase").show();
				}
			} else {
				isDragging = true;
				$scope.paper.view.scrollBy(event.downPoint.subtract(event.point));
				var point = $scope.paper.view.center._owner.topLeft;

				//Stick the left ruler to the left side of the canvas when reaching scrolling overflow
				leftrulerraster.position.x = (point.x > -20 ? point.x + 10 : -10);
				group_left_cursor.position.x = (point.x > -20 ? point.x + 10 : -10);

				//Stick the top ruler to the top of the canvas when reaching scrolling overflow
				toprulerraster.position.y = (point.y > -64 ? point.y + 54 : -10);
				group_top_cursor.position.y = (point.y > -64 ? point.y + 54 : -10);

				//Stick the bottom ruler to the bottom of the canvas when reaching overflow
				bottomrulerraster.position.y = ($scope.paper.view.center._owner.bottom < grid_size * (Number(grid_count_height) + 1)
					? $scope.paper.view.center._owner.bottom - (grid_size / 2)
					: grid_count_height * grid_size + (grid_size / 2));
				group_bottom_cursor.position.y = bottomrulerraster.position.y;

				//Stick the right ruler to the right of the canvas when reaching overflow
				rightrulerraster.position.x = ($scope.paper.view.center._owner.right < grid_size * (Number(grid_count_width) + 1)
					? $scope.paper.view.center._owner.right - (grid_size / 2)
					: grid_count_width * grid_size + (grid_size / 2));

				group_right_cursor.position.x = rightrulerraster.position.x;

			}
			$scope.paper.view.update();
		}

		toolPan.onMouseUp = function (event) {
			try {
				temp_line.simplify();
				paper.view.update();
			} catch (e) { }
			isDragging = false;
		}

		$scope.paper.view.autoUpdate = false;
		drawScreen();

		var point = new $scope.paper.Point(0, 0);
		$scope.paper.view.scrollBy(point.subtract($scope.paper.view.center));

		window.addEventListener('resize', function (evt) {
			$scope.paper.view.update();
		});
	};

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

		$scope.paper.view.update();
	};

	function resizeGridHeight(height) {
		grid_count_height = height;
		$("#grid_size_vertical").val(grid_count_height);
		drawScreen();
		drawLeftRuler();
		drawRightRuler();
		drawBottomRuler();
	};

	function resizeGridWidth(width) {
		grid_count_width = width;
		$("#grid_size_horizontal").val(grid_count_width);
		drawScreen();
		drawTopRuler();
		drawBottomRuler();
		drawRightRuler();
	};

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
		$scope.paper.view.update();
	};

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
		$scope.paper.view.update();
	};

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
		$scope.paper.view.update();
	};

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
		$scope.paper.view.update();
	}

	function refresh_elements_list() {
		var filters = document.querySelectorAll(".element_filter:checked");
		var filter = [];
		for (var i = 0; i <= filters.length - 1; i++) {
			filter[i] = filters[i].value;
		}

		if (filters.length !== 0) {
			$("#element_list").empty();
			group_elements.children
				.filter(function (el) {
					return filter.indexOf(el.data.category) != -1;
				})
				.forEach(function (el) {
					$("#element_list").append(composeElementListRowElement(el))
				});
		} else {
			$("#element_list").empty();
		}
	}

	function draw_cursor() {
		if ($("#sidebar").hasClass("active")) {

		}

		var cursor;
		try {
			cursor = $rootScope._cursor;
			cursor.remove();
		} catch (e) { }

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
					selected_element.selected = true;
					selected_element.selectedColor = grid_highlight;
				} else {
					cursor = paper.Shape.Rectangle(0, 0, grid_size * cursor_size.width, grid_size * cursor_size.height);
					cursor.position = new paper.Point(selected_grid_x, selected_grid_y);
					cursor.strokeColor = grid_highlight;
					group_overlay.addChild(cursor);
				}
		}

		$rootScope._cursor = cursor;
	}

	function drawSelectedPositionTopRuler(pos) {
		var screen = $scope.paper.view.center._owner.topLeft;

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

		$scope.paper.view.update();
	}

	function drawSelectedPositionLeftRuler(pos) {
		var screen = $scope.paper.view.center._owner.topLeft;

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

		$scope.paper.view.update();
	}

	function drawElements() {
		try { elementsraster.remove() } catch (e) { };
		$scope.paper.view.update();
	}

	function draw_local_item(args) {
		var x = utils.pixel2GridPoint(Number(selected_grid_x));
		var y = utils.pixel2GridPoint(Number(selected_grid_y));

		var ele;

		switch ($("#selected_shape").val()) {
			case "rectangle":
				ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
				ele.fillColor = args.fillColor;
				ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
				ele.name = "rectangle";
				break;
			case "circle":
				ele = new paper.Shape.Circle(x + cursor_line_width / 2, y + cursor_line_width / 2, JSON.parse(args.width) * (grid_size / 2));
				ele.bounds.topLeft = new paper.Point(x - (grid_size / 2), y - (grid_size / 2));
				ele.fillColor = args.fillColor;
				ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
				ele.name = "circle";
				break;
			case "line":
			case "freehand":
				ele = temp_line.clone();
				ele.fullySelected = false;
				temp_line.remove();
				ele.name = "line";
				break;
			case "room":
				ele = new paper.Shape.Rectangle(x - (grid_size / 2), y - (grid_size / 2), JSON.parse(args.width) * grid_size, JSON.parse(args.height) * grid_size);
				ele.strokeColor = args.fillColor;
				ele.strokeWidth = 10;
				ele.pivot = $scope.paper.Shape.Rectangle.topLeft;
				ele.name = "room";
				break;
		}

		ele.data.name = args.name;
		ele.data.category = args.category;

		ele.onMouseEnter = function (evt) {
			if (isDragging) return;
			t = new paper.PointText(evt.point.x, evt.point.y - 20);
			t.content = this.data.name;
			t.pivot = $scope.paper.Shape.Rectangle.topLeft;
			b = $scope.paper.Shape.Rectangle(t.bounds);
			b.size.width += 10;
			b.size.height += 10;
			b.fillColor = 'white';
			b.strokeColor = "black";
			b.bringToFront();
			t.bringToFront();
			$scope.paper.view.update();
		}

		ele.onMouseLeave = function () {
			t.remove();
			b.remove();
			$scope.paper.view.update();
		}

		ele.onMouseMove = function (evt) {
			t.position = new paper.Point(evt.point.x, evt.point.y - 20);
			b.position = new paper.Point(evt.point.x, evt.point.y - 20);
			$scope.paper.view.update();
		}

		group_elements.addChild(ele);
		try {
			selected_element.selected = false;
		} catch (e) {
			console.log(e);
		}
		selected_element = ele;

		ele.selected = false;

		draw_cursor();
		drawSelectedPositionTopRuler(Number(selected_grid_x));
		drawSelectedPositionLeftRuler(Number(selected_grid_y));

		$scope.paper.view.update();
		return ele;
	}

	/**
	 * Draws the input element to the canvas
	 *
	 * @param {Element} element
	 * @returns
	 */
	function draw_item(element) {
		var ele;

		switch (element.type) {
			case "square":
			case "rectangle":
				ele = new paper.Shape.Rectangle(element);
				break;
			case "circle":
			case "oval":
				ele = new paper.Shape.Circle(element);
				break;
			default:
				ele = new paper.Path(element);
				break;
		}

		ele.onMouseEnter = function (evt) {
			if (isDragging) return;
			t = new paper.PointText(evt.point.x, evt.point.y - 20);
			t.content = this.data.name;
			t.pivot = $scope.paper.Shape.Rectangle.topLeft;
			b = $scope.paper.Shape.Rectangle(t.bounds);
			b.size.width += 10;
			b.size.height += 10;
			b.fillColor = 'white';
			b.strokeColor = "black";
			b.bringToFront();
			t.bringToFront();
			$scope.paper.view.update();
		}

		ele.onMouseLeave = function () {
			t.remove();
			b.remove();
			$scope.paper.view.update();
		}

		ele.onMouseMove = function (evt) {
			t.position = new paper.Point(evt.point.x, evt.point.y - 20);
			b.position = new paper.Point(evt.point.x, evt.point.y - 20);
			$scope.paper.view.update();
		}

		ele.selected = false;

		group_elements.addChild(ele);
		$scope.paper.view.update();
		return element;
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

	$scope.$on('drawPing', function (_, ping) {
		group_overlay.addChildren(paper.Shape.Circle({
			center: [ping.position[1], ping.position[2]],
			radius: ping.size[1] / 2,
			fillColor: "#f44242",
			onFrame: function (event) {
				if (event.count >= 100) {
					this.remove();
				}
				$scope.paper.view.update();
			}
		}),
			new paper.PointText({
				content: ping.username,
				position: [ping.position[1], ping.position[2] - ping.size[2]],
				fontWeight: 'bold',
				fontSize: 16,
				strokeColor: 'white',
				strokeWidth: 0.5,
				onFrame: function (event) {
					if (event.count >= 100) {
						this.remove();
					}
					$scope.paper.view.update();
				}
			})
		);
	});

	$scope.$on('resizeRcv', function (_, msg) {
		if ($rootScope._grid_id != msg.grid_id) return;
		grid_count_width = msg.size.width;
		grid_count_height = msg.size.height;
		resizeGridWidth(grid_count_width);
		resizeGridHeight(grid_count_height);
		drawElements();
	});

	$scope.$on('addedElement', function (_, msg) {
		if (msg.grid_id != $rootScope._grid_id) return;
		$("#reset_board_button").prop("disabled", false);
		draw_item(msg.element.el);
		refresh_elements_list();
	});

	$scope.$on('move_element_rcv', (_, msg) => {
		if (msg.grid_id != $rootScope._grid_id) return;
		var element = group_elements.children.find(function (el) { return el.data.id == msg.element.data.id; });
		element.matrix = msg.element.matrix;
		//if (selected_element != null && element === selected_element) {
		//	selected_element = null;
		//	eraseCursor();
		//}
		$scope.paper.view.update();
	});

	$scope.$on('requestGridSpaceRcv', (_, msg) => {
		grid_count_height = msg.grid_space.size.height;
		resizeGridHeight(grid_count_height);
		grid_count_width = msg.grid_space.size.width;
		resizeGridWidth(grid_count_width);
		clearPlayerName();
		local_stored_annotations = [];
		$("#grid_name").val(msg.grid_space.name);

		group_elements.removeChildren();
		group_overlay.removeChildren();

		eraseCursor();

		if (msg.grid_space.elements.length !== 0) {
			$("#reset_board_button").prop("disabled", false);
			msg.grid_space.elements.forEach(function (el) { draw_item(el); });
		}

		if (msg.grid_space.annotations.length !== 0) {
			local_stored_annotations = msg.grid_space.annotations;
		}

		refresh_elements_list();
		refresh_annotations_list();

		$scope.paper.view.update();
	});

	$scope.$on('drawLocalElement', (_, args) => {
		var temp_new_ele = draw_local_item(args);
		$("#reset_board_button").prop("disabled", false);
		$rootScope.$broadcast('addElementToServer', { 'grid_id': $rootScope._grid_id, 'element': temp_new_ele });
	});

	$scope.$on('removedElement', (_, msg) => {
		if (msg.grid_id != $rootScope._grid_id) return;

		var temp = group_elements.children[group_elements.children.indexOf(
			group_elements.children.find(
				function (el) {
					return msg.element_id == el.data.id;
				}
			)
		)];

		temp.remove();

		drawElements();
		$("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
		refresh_elements_list();
	});

	$scope.$on('updateElement', (_, msg) => {
		if (msg.grid_id != grid_id) return;

		var element = group_elements.getItem({ data: { id: msg.element.data.id } });
		var bounds = element.bounds;

		element.fillColor = msg.element.fillColor;
		element.matrix = msg.element.matrix;
		element.data = msg.element.data;
		element.size = msg.element.size;
		element.bounds.topLeft = bounds.topLeft;

		$scope.paper.view.update();
	});

	$scope.$on('updateLocalElement', (_, msg) => {
		var element = group_elements.getItem({ data: { id: msg.element.data.id } });

		element.fillColor = msg.element.fillColor;
		element.matrix = msg.element.matrix;
		element.data = msg.element.data;
		element.size = msg.element.size;
		element.bounds.topLeft = bounds.topLeft;

		$rootScope.$broadcast('sendUpdatedElementToServer', element);
	});

	/**
	 * Determine if the value is undefined 
	 *
	 * @param value - input which may be undefined
	 * @returns {boolean} True if undefined, false otherwise
	 */
	function isUndefined(value) {
		return value === undefined;
	}
}]);