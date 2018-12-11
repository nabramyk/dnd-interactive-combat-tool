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
	underlay_canvas = document.getElementById('underlay_canvas');

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

	var tab_row = new Hammer(document.getElementById('tab_row'), null);

	paper.view.onMouseDown = function(event) {
		selected_element = group_elements.hitTest(event.point);
		selected_grid_x = event.point.x - (event.point.x % grid_size) + ( grid_size / 2 ) + grid_line_width;
		selected_grid_y = event.point.y - (event.point.y % grid_size) + ( grid_size / 2 ) + grid_line_width;
		if(selected_element != null) {

		}

		cursor_size = {"width": 1, "height": 1};
		
		if(isUndefined(cursor)) {
			cursor = paper.Shape.Rectangle(selected_grid_x, selected_grid_y, grid_size * cursor_size.width, grid_size * cursor_size.height);
			cursor.strokeColor = grid_highlight;
			group_overlay.addChild(cursor);
		}
	
		switch ($('#selected_shape').val()) {
		case "line":
			// overlay_ctx.fillStyle = grid_highlight;
			// overlay_ctx.beginPath();
			// overlay_ctx.arc(gridPoint2Pixel(selected_grid_x) + grid_line_width, gridPoint2Pixel(selected_grid_y) + grid_line_width, 5, 0, 2 * Math.PI);
			// overlay_ctx.fill();
			break;
		default:
			cursor.position = new paper.Point(selected_grid_x, selected_grid_y);
		}
	
		$("#move_to_x").val(selected_grid_x);
		$("#move_to_y").val(selected_grid_y);
		
		updateSideMenuContent();
		paper.view.update();
	}

	var toolPan = new paper.Tool();
	toolPan.activate();

	toolPan.onMouseDrag = function(event) {
		paper.view.scrollBy(event.downPoint.subtract(event.point));
		var point = paper.view.center._owner.topLeft;
		leftrulerraster.position.x = (point.x > 0 ? point.x + 10 : 10);
		toprulerraster.position.y = (point.y > -40 ? point.y + 50 : 10);
		paper.view.update();
	}

	tab_row.on('pan', function(evt) {
		$("#tab_row").scrollLeft($("#tab_row").scrollLeft() - 50 * ( evt.deltaX / $("#tab_row")[0].scrollWidth));
	});

	drawTopRuler();
	drawLeftRuler();

	paper.view.autoUpdate = false;

	drawScreen();
}