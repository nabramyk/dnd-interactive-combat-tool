/**
 * @author Nathan Abramyk
 * @version 1.0.0
 */
window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
	canvasApp();
}

function canvasSupport(e) {
	return !!e.getContext;
}

function canvasApp() {

	$("loading_div").show();

	interfaceInitialization();

	if (!canvasSupport(underlay_canvas)) {
		return;
	}

	socket = io();
	bindSocketListeners();
	bindEventHandlers();
}

/**
 * This function has A LOT of redundancy, needs major refactoring
 */
function interfaceInitialization() {
	underlay_canvas = document.getElementById('canvas');

	$("#movement_controls").hide();
	$("#reset_board_button").prop("disabled", true);
	$("#start_new_line_button").hide();
	$("#lost_connection_div").hide();

	paper.setup(underlay_canvas);

	group_grid = new paper.Group();
	group_elements = new paper.Group();
	group_overlay = new paper.Group();
	group_left_ruler = new paper.Group();
	group_top_ruler = new paper.Group();
	group_bottom_ruler = new paper.Group();
	group_right_ruler = new paper.Group();
	group_left_cursor = new paper.Group();
	group_right_cursor = new paper.Group();
	group_top_cursor = new paper.Group();
	group_bottom_cursor = new paper.Group();

	line_path = new paper.Path();

	//What happens when the user clicks the canvas...
	paper.view.onClick = function (event) {
		if (gridraster.hitTest(event.point) == null || isDragging) { return; }
		$('#place_element_button').prop('disabled', false);

		try {
			t.remove();
			b.remove();
		} catch (e) { };

		selected_grid_x = event.point.x - (event.point.x % grid_size) + (grid_size / 2) + grid_line_width;
		selected_grid_y = event.point.y - (event.point.y % grid_size) + (grid_size / 2) + grid_line_width;

		cursor_size = { "width": 1, "height": 1 };

		if (isUndefined(cursor)) {
			cursor = paper.Shape.Rectangle(selected_grid_x, selected_grid_y, grid_size * cursor_size.width, grid_size * cursor_size.height);
			cursor.strokeColor = grid_highlight;
		}

		selected_element = group_elements.hitTest(event.point);
		stored_edited_element_bounds = null;

		switch ($('#selected_shape').val()) {
			case "line":
				cursor.remove();
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
				cursor.remove();
				if (!isUndefined(selected_element) && selected_element != null) {
					if (selected_element.type == "stroke") {
						console.log("TODO: Handle selecting lines.");
					} else {
						cursor = paper.Shape.Rectangle(selected_element.item.bounds);
						cursor.position = new paper.Point(selected_element.item.position.x, selected_element.item.position.y);
						cursor.strokeColor = grid_highlight;
					}
				} else {
					cursor = paper.Shape.Rectangle(0, 0, grid_size * cursor_size.width, grid_size * cursor_size.height);
					cursor.position = new paper.Point(selected_grid_x, selected_grid_y);
					cursor.strokeColor = grid_highlight;
				}
				group_overlay.addChild(cursor);
		}

		$("#move_to_x").val(pixel2GridPoint(selected_grid_x) - 1);
		$("#move_to_y").val(pixel2GridPoint(selected_grid_y) - 1);

		drawSelectedPositionTopRuler(Number(selected_grid_x));
		drawSelectedPositionLeftRuler(Number(selected_grid_y));

		updateSideMenuContent();
		paper.view.update();
	}

	var toolPan = new paper.Tool();
	toolPan.activate();

	//Handles the redrawing on scrolling
	toolPan.onMouseDrag = function (event) {
		isDragging = true;
		paper.view.scrollBy(event.downPoint.subtract(event.point));
		var point = paper.view.center._owner.topLeft;

		//Stick the left ruler to the left side of the canvas when reaching scrolling overflow
		leftrulerraster.position.x = (point.x > -20 ? point.x + 10 : -10);
		group_left_cursor.position.x = (point.x > -20 ? point.x + 10 : -10);

		//Stick the top ruler to the top of the canvas when reaching scrolling overflow
		toprulerraster.position.y = (point.y > -64 ? point.y + 54 : -10);
		group_top_cursor.position.y = (point.y > -64 ? point.y + 54 : -10);

		//Stick the bottom ruler to the bottom of the canvas when reaching overflow
		bottomrulerraster.position.y = (paper.view.center._owner.bottom < grid_size * (Number(grid_count_height) + 1)
			? paper.view.center._owner.bottom - (grid_size / 2)
			: grid_count_height * grid_size + (grid_size / 2));
		group_bottom_cursor.position.y = bottomrulerraster.position.y;

		//Stick the right ruler to the right of the canvas when reaching overflow
		rightrulerraster.position.x = (paper.view.center._owner.right < grid_size * (Number(grid_count_width) + 1) + 30
			? paper.view.center._owner.right - (grid_size / 2) - 30
			: grid_count_width * grid_size + (grid_size / 2));
		
		group_right_cursor.position.x = rightrulerraster.position.x; //TODO this line is causing problems

		paper.view.update();
	}

	toolPan.onMouseUp = function (event) {
		isDragging = false;
	}

	paper.view.autoUpdate = false;

	drawScreen();

	var point = new paper.Point(0, 0);
	paper.view.scrollBy(point.subtract(paper.view.center));

	window.addEventListener('resize', function (evt) {
		paper.view.update();
	});
}
