/**
 * @fileoverview Should handle all of the jquery interface stuff
 * @returns
 */
function bindEventHandlers() {
	$("#grid_size_vertical").val(grid_count_height);
	$("#grid_size_horizontal").val(grid_count_width);

	$("#grid_size_vertical").change(function() {
		grid_count_height = $("#grid_size_vertical").val();
		socket.emit('resize_height', {
			"grid_id": grid_id,
			"height": grid_count_height
		});
	});

	$("#grid_size_horizontal").change(function() {
		grid_count_width = $("#grid_size_horizontal").val();
		socket.emit('resize_width', {
			"grid_id": grid_id,
			"width": grid_count_width
		});
	});

	$("#grid_name").change(function() {
		socket.emit('rename_grid', {
			"grid_id": grid_id,
			"grid_name": $("#grid_name").val()
		});
	});

	//$("#overlay_canvas")
	// .mousedown(function(evt) {
	// 	canvasClicked(evt.offsetX, evt.offsetY);
	// })
	// .mousemove(function(evt) {
	// 	clearPlayerName();
	// 	clearTimeout(hoverTimer);
	// 	local_stored_grid_space.forEach(function(el) {
	// 		if (gridPoint2Pixel(el.x) < evt.offsetX && gridPoint2Pixel(el.x + el.size) > evt.offsetX &&
	// 				gridPoint2Pixel(el.y) < evt.offsetY && gridPoint2Pixel(el.y + el.size) > evt.offsetY) {
	// 			if (prehandledByTouchEvent) {
	// 				prehandledByTouchEvent = false;
	// 				return;
	// 			}
	// 			showPlayerName(evt.offsetX + $("#overlay_canvas").offset().left, evt.offsetY + $("#overlay_canvas").offset().top - 40, el.name);
	// 		}
	// 	});
	// })
	// .mouseleave(function(evt) {
	// 	clearPlayerName();
	// 	clearTimeout(hoverTimer);
	// })
	// .contextmenu(function(evt) {
	// 	if (selected_grid_x == -1 && selected_grid_y == -1) return;
	// 	clearPlayerName();
	// 	evt.preventDefault();
	// 	var temp = local_stored_grid_space.find(function(el) {
	// 		return gridPoint2Pixel(el.x) < evt.offsetX && gridPoint2Pixel(el.x + el.size) > evt.offsetX && gridPoint2Pixel(el.y) < evt.offsetY && gridPoint2Pixel(el.y + el.size) > evt.offsetY;
	// 	});
	// 	showLongHoldMenu(evt.pageX - (evt.clientX % grid_size) - ($("#grid_canvas_scrolling_container").scrollLeft() % grid_size) + grid_size, evt.pageY - (evt.clientY % grid_size) - ($("#grid_canvas_scrolling_container").scrollTop() % grid_size) + grid_size, (isUndefined(temp) ? -1 : temp.id));
	// })
	// .on('touchstart', function(evt) {
	// 	prehandledByTouchEvent = true;
	// 	var touch_x = evt.originalEvent.touches[0].clientX - $("#overlay_canvas").offset().left;
	// 	var touch_y = evt.originalEvent.touches[0].clientY - $("#overlay_canvas").offset().top;
	// 	canvasClicked(touch_x, touch_y);
	// 	var temp = local_stored_grid_space.find(function(el) {
	// 		return gridPoint2Pixel(el.x) < touch_x && gridPoint2Pixel(el.x + el.size) > touch_x && gridPoint2Pixel(el.y) < touch_y && gridPoint2Pixel(el.y + el.size) > touch_y;
	// 	});
	// 	holdTimer = window.setTimeout(function() {
	// 		showLongHoldMenu(touch_x - (touch_x % grid_size) + grid_size + $("#overlay_canvas").offset().left, touch_y - (touch_y % grid_size) + $("#overlay_canvas").offset().top, isUndefined(temp) ? -1 : temp.id);
	// 	}, 1000);
	// 	return true;
	// })
	// .on('touchend', function(evt) {
	// 	clearTimeout(holdTimer);
	// 	return false;
	// })
	// .on('touchmove', function(evt) {
	// 	clearPlayerName();
	// 	clearTimeout(holdTimer);
	// 	return true;
	// })

	$('#place_element_button').click(function() {
		if ($("#place_element_button").text() === "Add" || $("#place_element_button").text() === "Add Vertex") {
			switch ($("#selected_shape").val()) {
			case "square":
			case "circle":
				add_element_to_server($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val(), $("#element_name").val(), { "width": $("#element_size").val(), "height": $("#element_size").val() }, $("#element_category").val());
				break;
			case "rectangle":
				add_element_to_server($("#element_color").val(), selected_grid_x, selected_grid_y, $("#selected_shape").val(), $("#element_name").val(),  { "width" : $("#element_width").val(), "height" : $("#element_height").val() }, $("#element_category").val());
				break;
			case "line":
				x_vertices.push(selected_grid_x);
				y_vertices.push(selected_grid_y);
				if (x_vertices.length === 1 && y_vertices.length === 1)
					$("#start_new_line_button").toggle();
				break;
			}
		} else {
			socket.emit('edit_element_on_server', {
				"grid_id": grid_id,
				"id": selected_element.id,
				"name": $("#element_name").val(),
				"shape": $("#selected_shape").val(),
				"color": $("#element_color").val(),
				"x": selected_element.x,
				"y": selected_element.y,
				"size": $("#element_size").val(),
				"category": $("#element_category").val()
			});
		}
	});

	$('#b_rotate_left').click(function() {
		socket.emit('edit_element_on_server', {
			"grid_id": grid_id,
			"id": selected_element.id,
			"name": selected_element.name,
			"shape": selected_element.shape,
			"color": selected_element.color,
			"x": selected_element.x,
			"y": selected_element.y,
			"size": { "width" : selected_element.size.height, "height" : selected_element.size.width },
			"category": selected_element.category
		});
	});

	$('#b_rotate_right').click(function() {
		socket.emit('edit_element_on_server', {
			"grid_id": grid_id,
			"id": selected_element.id,
			"name": selected_element.name,
			"shape": selected_element.shape,
			"color": selected_element.color,
			"x": selected_element.x,
			"y": selected_element.y,
			"size": { "width" : selected_element.size.height, "height" : selected_element.size.width },
			"category": selected_element.category
		});
	});

	$('#reset_board_button').click(function() {
		if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
			socket.emit('reset_board', {
				"grid_id": grid_id
			});
			$("#reset_board_button").prop("disabled", true);
			refresh_elements_list();
		}
	});

	$("#start_new_line_button").click(function() {
		temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);

		if (selected_grid_x !== x_vertices[x_vertices.length - 1] || selected_grid_y !== y_vertices[y_vertices.length - 1]) {
			x_vertices.push(selected_grid_x);
			y_vertices.push(selected_grid_y);
		}

		if (x_vertices.length > 1 && y_vertices.length > 1)
			add_element_to_server($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val(), null, $("#element_size").val(), $("#element_category").val());

		x_vertices = [];
		y_vertices = [];
		$("#start_new_line_button").toggle();
	});

	$("#move_inc_up")
	.mousedown(function() {
		incremental_move_element("up");
		movementTimer = window.setInterval(function() {
			incremental_move_element("up");
		}, movementInterval);
	})
	.mouseup(function() {
		window.clearInterval(movementTimer);
	})
	.on("touchstart", function(evt) {
		incremental_move_element("up");
		movementTimer = window.setInterval(function() {
			incremental_move_element("up");
		}, movementInterval);
	})
	.on("touchend", function(evt) {
		window.clearInterval(movementTimer);
	});

	$("#move_inc_down")
	.mousedown(function() {
		incremental_move_element("down");
		movementTimer = setInterval(function() {
			incremental_move_element("down");
		}, movementInterval);
	})
	.mouseup(function() {
		clearInterval(movementTimer);
	})
	.on("touchstart", function(evt) {
		incremental_move_element("down");
		movementTimer = window.setInterval(function() {
			incremental_move_element("down");
		}, movementInterval);
	})
	.on("touchend", function(evt) {
		window.clearInterval(movementTimer)
	});

	$("#move_inc_left")
	.mousedown(function() {
		incremental_move_element("left");
		movementTimer = setInterval(function() {
			incremental_move_element("left");
		}, movementInterval);
	})
	.mouseup(function() {
		clearInterval(movementTimer);
	})
	.on("touchstart", function(evt) {
		incremental_move_element("left");
		movementTimer = window.setInterval(function() {
			incremental_move_element("left");
		}, movementInterval);
	})
	.on("touchend", function(evt) {
		window.clearInterval(movementTimer);
	});

	$("#move_inc_right")
	.mousedown(function() {
		incremental_move_element("right");
		movementTimer = setInterval(function() {
			incremental_move_element("right");
		}, movementInterval);
	})
	.mouseup(function() {
		clearInterval(movementTimer);
	})
	.on("touchstart", function(evt) {
		incremental_move_element("right");
		movementTimer = window.setInterval(function() {
			incremental_move_element("right");
		}, movementInterval);
	})
	.on("touchend", function(evt) {
		window.clearInterval(movementTimer)
	});

	$("#selected_shape").change(function(el) {
		switch ($("#selected_shape").val()) {
		case 'line':
			$('#place_element_button').html("Add Vertex");
			break;
		case "square":
		case "circle":
			$('#place_element_button').html("Add");
			$('#start_new_line_button').hide();
			break;
		}
		if (selected_grid_x == -1 && selected_grid_y == -1) {
			return;
		}

		for (var i = 1; i < x_vertices.length; i++) {
			clear_item("line", [x_vertices[i - 1], x_vertices[i]], [y_vertices[i - 1], y_vertices[i]], {}, 0);
		}

		x_vertices.length = [];
		y_vertices.length = [];

		clear_prev_cursor_position();
		draw_cursor_at_position(selected_grid_x, selected_grid_y);
	});

	$("#drawing_controls_button").click(function() {
		$("#drawing_controls").toggle();
		$("#movement_controls").hide();
		$("#settings_controls").hide();
		$("#editing_controls").hide();
	});

	$("#movement_controls_button").click(function() {
		$("#movement_controls").toggle();
		$("#drawing_controls").hide();
		$("#settings_controls").hide();
		$("#editing_controls").hide();
	});

	$("#settings_controls_button").click(function() {
		$("#settings_controls").toggle();
		$("#drawing_controls").hide();
		$("#movement_controls").hide();
		$("#editing_controls").hide();
	});

	$("#grid_down").click(function() {
		$("#grid_space_dropdown").toggle();
	});

	$("#drawing_controls_btn").click(function() {
		$("#drawing_controls").toggle();
	});

	$("#editing_controls_btn").click(function() {
		$("#editing_controls").toggle();
	});

	$("#movement_controls_btn").click(function() {
		$("#movement_controls").toggle();
	});

	$("#settings_controls_btn").click(function() {
		$("#settings_controls").toggle();
	});

	$("#element_list_btn").click(function() {
		$("#element_list_dropdown").toggle();
	});

	$("#editing_controls_done").click(function() {

		socket.emit('edit_element_on_server', {
			"grid_id": grid_id,
			"id": $("#edit_element_id").val(),
			"name": $("#edit_name").val(),
			"type": $("#edit_shape").val(),
			"color": $("#edit_color").val(),
			"size": $("#edit_size").val(),
			"category": $("#edit_category").val()
		});

		removeEditMenu();
	});

	$("#randomize").click(function() {
		socket.emit('randomize', {
			"grid_id": grid_id
		});
	});

	$(".element_filter").click(function() {
		refresh_elements_list();
	});

	$("#addition_tab").click(function() {
		socket.emit('create_grid_space', {});
	});

	$("#list_header_elements").click(function() {
		$("#list_header_elements").css("background", "#345eb2");
		$("#list_header_elements").css("color", "white");
		$("#list_header_annotations").css("background", " #dddddd");
		$("#list_header_annotations").css("color", "black");

		$("#annotations_list_container").hide();
		$("#element_list_container").show();
	});

	$("#list_header_annotations").click(function() {
		$("#list_header_annotations").css("background", "#345eb2");
		$("#list_header_annotations").css("color", "white");
		$("#list_header_elements").css("background", " #dddddd");
		$("#list_header_elements").css("color", "black");

		$("#element_list_container").hide();
		$("#annotations_list_container").show();
	});

	$("#annotations_display").change(function() {
		$(".grid_canvas_annotation").toggle();
	});

	$(document)
	.on('click', '#tab_row .grid-name', function(evt) {
		$(".tab").removeClass("active");
		$(this).parent().addClass("active");
		grid_id = $(this).val();
		socket.emit('request_grid_space', {
			"id": $(this).val()
		}, function(msg) {
			grid_count_height = msg.grid_space.height;
			resizeGridHeight(grid_count_height);
			grid_count_width = msg.grid_space.width;
			resizeGridWidth(grid_count_width);
			clearPlayerName();
			local_stored_grid_space = [];
			local_stored_annotations = [];
			local_stored_pings = [];
			$("#grid_name").val(msg.grid_space.name);

			if (msg.grid_space.elements.length !== 0) {
				local_stored_grid_space = msg.grid_space.elements;
				$("#reset_board_button").prop("disabled", false);
				drawElements();
			}

			if (msg.grid_space.annotations.length !== 0) {
				local_stored_annotations = msg.grid_space.annotations;
			}

			refresh_elements_list();
			refresh_annotations_list();

			$("#options_add_or_edit_button").hide();
			$("#options_annotate_button").hide();
			$("#options_delete_button").hide();
			$("#options_copy_button").hide();
			$("#options_paste_button").hide();
			$("#options_movement_button").hide();
		});
	})
	.on('click', '#context_editing_controls_done', function(evt) {
		socket.emit('edit_element_on_server', {
			"grid_id": grid_id,
			"id": $("#context_edit_element_id").val(),
			"name": $("#context_edit_name").val(),
			"type": $("#context_edit_shape").val(),
			"color": $("#context_edit_color").val(),
			"size": $("#context_edit_size").val(),
			"category": $("#context_edit_category").val()
		});
	})
	.on('click', '#context_annotation_controls_done', function(evt) {
		socket.emit('add_annotation_to_server', {
			"grid_id": grid_id,
			"title": "",
			"content": $("#annotation_content").val(),
			"x": selected_grid_x,
			"y": selected_grid_y
		});
	})
	.on("mousedown", "#dragging_element_icon", function(evt) {
		mouse_down = true;
	})
	.on("touchstart", "#dragging_element_icon", function(evt) {
		touch_start = true;
	})
	.mousemove(function(evt) {
		if (mouse_down) {
			$("#dragging_element_icon").css("top", evt.clientY - (grid_size / 2));
			$("#dragging_element_icon").css("left", evt.clientX - (grid_size / 2));
			temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
			draw_temporary_cursor_at_position(evt.clientX - (evt.clientX % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size - ($("#grid_canvas_scrolling_container").scrollLeft() % grid_size), evt.clientY - (evt.clientY % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size - ($("#grid_canvas_scrolling_container").scrollTop() % grid_size), cursor_size);
		}
	})
	.on("touchmove", "#dragging_element_icon", function(evt) {
		if (touch_start) {
			$("#dragging_element_icon").css("top", evt.originalEvent.touches[0].clientY - (grid_size / 2));
			$("#dragging_element_icon").css("left", evt.originalEvent.touches[0].clientX - (grid_size / 2));
			temporary_drawing_ctx.clearRect(0, 0, temporary_drawing_canvas.width, temporary_drawing_canvas.height);
			draw_temporary_cursor_at_position(evt.originalEvent.touches[0].clientX - (evt.originalEvent.touches[0].clientX % grid_size) - $("#temporary_drawing_canvas").offset().left + grid_size, evt.originalEvent.touches[0].clientY - (evt.originalEvent.touches[0].clientY % grid_size) - $("#temporary_drawing_canvas").offset().top + grid_size, cursor_size);
		}
	})
	.on("mouseup", "#dragging_element_icon", function(evt) {
		dragElement(evt.clientX, evt.clientY, evt.pageX, evt.pageY);
		mouse_down = false;
	})
	.on("touchend", "#dragging_element_icon", function(evt) {
		dragElement(evt.originalEvent.changedTouches[0].clientX,
				evt.originalEvent.changedTouches[0].clientY,
				evt.originalEvent.changedTouches[0].pageX,
				evt.originalEvent.changedTouches[0].pageY);
		touch_start = false;
	})
	.on('click', '#tab_row .grid-space-delete', function(evt) {
		if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
			socket.emit("delete_grid_space_from_server", {
				"grid_id": $(this).val()
			});
		}
	});

	$("#grid_canvas").focus();
	$(document).keydown(function(e) {
		switch (e.which) {
		case 37:
			e.preventDefault();
			$("#move_inc_left").mousedown().mouseup();
			break;
		case 38:
			e.preventDefault();
			$("#move_inc_up").mousedown().mouseup();
			break;
		case 39:
			e.preventDefault();
			$("#move_inc_right").mousedown().mouseup();
			break;
		case 40:
			e.preventDefault();
			$("#move_inc_down").mousedown().mouseup();
			break;
		}
	});

	$("#overlapping_back_button").click(function(evt) {
		$("#overlapping_back_button").hide();
		getContextMenu();
	});
}

/**
 * Create an HTML DOM element
 *
 * @param {Element} el -
 * @return {string} An html element to display 
 */
function composeElementListRowElement(el) {
	return "<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.id + ")\" id=" + el.id + ">" +
	"<div style=\"width: 25%; display: inline-block;\">" +
	"<p style=\"font-size: smaller;\">" + el.name + "<\p>" +
	"</div>" +
	"<div style=\"width: 35%; display: inline-block;\">" +
	"<p style=\"font-size: smaller;\">" + el.category + "<\p>" +
	"</div>" +
	"<button id=\"element_row_edit\" onClick=\"editElementRow(" + el.id + ")\">&#x270E;</button>" +
	"<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.id + ")\">&times</button>" +
	"</div>";
}

function composeAnnotationListRowElement(el) {
	return "<div class=\"element_list_row\" onclick=\"clicked_annotation_list(" + el.id + ")\">" +
	"<p>" + el.content + "<\p>" +
	"<button id=\"element_row_edit\" onClick=\"editAnnotationRow(" + el.id + ")\">&#x270E;</button>" +
	"<button id=\"element_row_delete\" onclick=\"delete_annotation_from_server(" + el.id + ")\">&times</button>" +
	"</div>";
}

function showLongHoldMenu(x, y, id) {
	if (id != -1) $("body").append("<span id=\"dragging_element_icon\" class=\"glyphicon popup_items\" style=\"position:absolute;top:" + (y - grid_size) + "px;left:" + (x - grid_size * 2) + "px;width:" + grid_size + "px;height:" + grid_size + "px;font-size: 18px;\">&#xe068;</span>");
	getContextMenu();
}

function getContextMenu() {
	$("#overlapping_back_button").hide();
	$("#side_container_swap > *").hide();
	$("#options_container").show();
	$("#overlapping_side_container").show();
	$(".drawing_canvas").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "300px"));
	$("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "0"));
}