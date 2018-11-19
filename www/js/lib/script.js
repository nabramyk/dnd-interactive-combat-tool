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

	if (!canvasSupport(grid_canvas)) {
		return;
	}

	socket = io();
	bindSocketListeners();
	bindEventHandlers();
}

function interfaceInitialization() {
	grid_canvas = document.getElementById('grid_canvas');
	underlay_canvas = document.getElementById('underlay_canvas');
	overlay_canvas = document.getElementById('overlay_canvas');
	temporary_drawing_canvas = document.getElementById('temporary_drawing_canvas');

	$("#movement_controls").hide();
	$("#reset_board_button").prop("disabled", true);
	$("#start_new_line_button").hide();
	$("#lost_connection_div").hide();

	ctx = grid_canvas.getContext('2d');
	ctx2 = underlay_canvas.getContext('2d');
	overlay_ctx = overlay_canvas.getContext('2d');
	temporary_drawing_ctx = temporary_drawing_canvas.getContext('2d');

	grid_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	grid_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	underlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	underlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	overlay_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	overlay_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;
	temporary_drawing_canvas.width = grid_size * grid_count_width + 2 * grid_line_width;
	temporary_drawing_canvas.height = grid_size * grid_count_height + 2 * grid_line_width;

	cPosX = (window.innerWidth - grid_canvas.width) < 0 ? 0 : Math.ceil((window.innerWidth - grid_canvas.width) / 2);
	cPosY = (window.innerHeight - grid_canvas.height) < 60 ? 60 : Math.ceil((window.innerHeight - grid_canvas.height) / 2);

	$('#grid_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
	$('#underlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
	$('#overlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
	$('#temporary_drawing_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});

	$('#ruler_left').css({transform : 'translate(' + (cPosX - 20 < 0 ? 0 : cPosX - 20) + 'px,' + cPosY + 'px)'});
	$('#ruler_top').css({transform : 'translate(' + cPosX + 'px,' + (cPosY - 20 < 40 ? 40 : cPosY - 20) + 'px)'});

	var hammer = new Hammer(document.getElementById('grid_canvas_scrolling_container'), null);
	var overlay_canvas_hammer = new Hammer(document.getElementById('overlay_canvas'), null);
	var tab_row = new Hammer(document.getElementById('tab_row'), null);

	hammer.get('pinch').set({ enable: true });
	overlay_canvas_hammer.get('pinch').set({ enable: true });

	hammer.on('pan', function(evt) {
		cPosX += Math.ceil(evt.deltaX * 0.03);
		cPosY += Math.ceil(evt.deltaY * 0.03);
		$('#grid_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
		$('#underlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
		$('#overlay_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});
		$('#temporary_drawing_canvas').css({transform : 'translate(' + cPosX + 'px,' + cPosY + 'px)'});

		$('#ruler_left').css({transform : 'translate(' + (cPosX - 20 < 0 ? 0 : cPosX - 20) + 'px,' + cPosY + 'px)'});
		$('#ruler_top').css({transform : 'translate(' + cPosX + 'px,' + (cPosY - 20 < 40 ? 40 : cPosY - 20) + 'px)'});
	});

	hammer.on('swipe', function(evt) {
		console.log(evt);
	});

	hammer.on('tap', function(evt) {
		console.log(evt);
		//clear_prev_cursor_position();
	});

	hammer.on('pinch', function(evt) {
		//scaleX(),skewY(),skewX(),scaleY(),translateX(),translateY()
		//scale = evt.scale;
		//underlay_canvas.style.transform = "matrix(" + scale + ",0,0," + scale + "," + cPosX + "," + cPosY + ")";
	});

	overlay_canvas_hammer.on('tap', function(evt) {
		//alert(evt);
		canvasClicked(evt.center.x - $("#overlay_canvas").offset().left, evt.center.y - $("#overlay_canvas").offset().top);
	});

	overlay_canvas_hammer.on('pinch', function(evt) {
		console.log(evt);
		//grid_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		//underlay_canvas.style.transform = "scale(" + underlay_canvas.width * evt.scale + "," + underlay_canvas.width * evt.scale +")";
		//overlay_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
		//temporary_drawing_canvas.style.transform = "translate(" + cPosX + "px," + cPosY + "px)";
	});

	tab_row.on('pan', function(evt) {
		$("#tab_row").scrollLeft($("#tab_row").scrollLeft() - 50 * ( evt.deltaX / $("#tab_row")[0].scrollWidth));
	});

	drawTopRuler();
	drawLeftRuler();

	drawScreen();
}