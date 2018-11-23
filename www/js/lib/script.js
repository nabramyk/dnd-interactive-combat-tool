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

	paper.setup(document.getElementById('ruler_left'));
	paper.setup(document.getElementById('ruler_top'));
	paper.setup(underlay_canvas);

	group_grid = new paper.Group();
	group_elements = new paper.Group();
	group_overlay = new paper.Group();

	console.log(paper.projects);

	paper.projects[2].activate();
	paper.projects[2].view.setViewSize(screenWidth(), screenHeight());

	cPosX = (window.innerWidth - underlay_canvas.width) < 0 ? 0 : Math.ceil((window.innerWidth - underlay_canvas.width) / 2);
	cPosY = (window.innerHeight - underlay_canvas.height) < 60 ? 60 : Math.ceil((window.innerHeight - underlay_canvas.height) / 2);

	$('#underlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
	$('#ruler_left').css({transform : 'translate(' + (cPosX - 20 < 0 ? 0 : cPosX - 20) + 'px,' + cPosY + 'px)'});
	$('#ruler_top').css({transform : 'translate(' + cPosX + 'px,' + (cPosY - 20 < 40 ? 40 : cPosY - 20) + 'px)'});

	var hammer = new Hammer(document.getElementById('grid_canvas_scrolling_container'), null);
	var tab_row = new Hammer(document.getElementById('tab_row'), null);

	hammer.get('pinch').set({ enable: true });

	hammer.on('pan', function(evt) {
		cPosX += Math.ceil(evt.deltaX * 0.03);
		cPosY += Math.ceil(evt.deltaY * 0.03);
		$('#underlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});

		$('#ruler_left').css({transform : 'translate(' + (cPosX - 20 < 0 ? 0 : cPosX - 20) + 'px,' + cPosY + 'px)'});
		$('#ruler_top').css({transform : 'translate(' + cPosX + 'px,' + (cPosY - 20 < 40 ? 40 : cPosY - 20) + 'px)'});
	});

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
	}

	tab_row.on('pan', function(evt) {
		$("#tab_row").scrollLeft($("#tab_row").scrollLeft() - 50 * ( evt.deltaX / $("#tab_row")[0].scrollWidth));
	});

	//drawTopRuler();
	//drawLeftRuler();

	drawScreen();
}