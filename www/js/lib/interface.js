/**
 * @fileoverview Should handle all of the jquery interface stuff
 * @returns
 */
function bindEventHandlers() {

	$("#grid_size_vertical").val(grid_count_height);
	$("#grid_size_horizontal").val(grid_count_width);

	$("#grid_size_vertical").change(function () {
		grid_count_height = $("#grid_size_vertical").val();
		socket.emit('resize', {
			"grid_id": grid_id,
			"size": { "width": grid_count_width, "height": grid_count_height }
		});
	});

	$("#grid_size_horizontal").change(function () {
		grid_count_width = $("#grid_size_horizontal").val();
		socket.emit('resize', {
			"grid_id": grid_id,
			"size": { "width": grid_count_width, "height": grid_count_height }
		});
	});

	$("#grid_name").change(function () {
		socket.emit('rename_grid', {
			"grid_id": grid_id,
			"grid_name": $("#grid_name").val()
		});
	});

	$('#place_element_button').click(function () {
		if ($("#place_element_button").text() === "Add" || $("#place_element_button").text() === "Add Vertex") {
			switch ($("#selected_shape").val()) {
				case "circle":
					add_element_to_server($("#element_color").val(), pixel2GridPoint(selected_grid_x), pixel2GridPoint(selected_grid_y), $("#selected_shape").val(), $("#element_name").val(), { "width": $("#element_width").val(), "height": $("#element_width").val() }, $("#element_category").val(), {});
					break;
				case "rectangle":
					add_element_to_server($("#element_color").val(), pixel2GridPoint(selected_grid_x), pixel2GridPoint(selected_grid_y), $("#selected_shape").val(), $("#element_name").val(), { "width": $("#element_width").val(), "height": $("#element_height").val() }, $("#element_category").val(), {});
					break;
				case "line":
					line_path.add(new paper.Point(cursor.position.x, cursor.position.y));
					x_vertices.push(pixel2GridPoint(selected_grid_x));
					y_vertices.push(pixel2GridPoint(selected_grid_y));
					if (line_path.segments.length > 0) {
						$("#start_new_line_button").show();
					}
					break;
			}
		} else {
			socket.emit('edit_element_on_server', {
				"grid_id": grid_id,
				"id": selected_element.item.data.id,
				"name": $("#element_name").val(),
				"shape": $("#selected_shape").val(),
				"color": $("#element_color").val(),
				"x": selected_element.x,
				"y": selected_element.y,
				"size": { "width": $("#element_width").val(), "height": $("#element_height").val() },
				"category": $("#element_category").val()
			});
		}
	});

	$('#b_rotate_left').click(function () {
		selected_element.item.rotate(-90);
		paper.view.update();
	});

	$('#b_rotate_right').click(function () {
		selected_element.item.rotate(90);
		paper.view.update();
	});

	$('#reset_board_button').click(function () {
		if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
			socket.emit('reset_board', {
				"grid_id": grid_id
			});
			$("#reset_board_button").prop("disabled", true);
			refresh_elements_list();
		}
	});

	$("#start_new_line_button").click(function () {
		if (selected_grid_x !== x_vertices[x_vertices.length - 1] || selected_grid_y !== y_vertices[y_vertices.length - 1]) {
			x_vertices.push(pixel2GridPoint(selected_grid_x));
			y_vertices.push(pixel2GridPoint(selected_grid_y));
		}

		if (x_vertices.length > 1 && y_vertices.length > 1) add_element_to_server($("#element_color").val(), x_vertices, y_vertices, $("#selected_shape").val(), $("#element_name").val(), { "width": 0, "height": 0 }, $("#element_category").val(), {});

		x_vertices = [];
		y_vertices = [];

		line_path.remove();
		line_path = new paper.Path();
		temp_line.remove();

		paper.view.update();

		$("#start_new_line_button").toggle();
	});

	$("#move_inc_up")
		.mousedown(function () {
			incremental_move_element("up");
		})

	$("#move_inc_down")
		.mousedown(function () {
			incremental_move_element("down");
		})

	$("#move_inc_left")
		.mousedown(function () {
			incremental_move_element("left");
		})

	$("#move_inc_right")
		.mousedown(function () {
			incremental_move_element("right");
		})

	$("#selected_shape").change(function (el) {
		cursor.remove();
		top_ruler_cursor.remove();
		top_ruler_number.remove();
		left_ruler_number.remove();
		left_ruler_cursor.remove();
		selected_element = null;
		selected_grid_x = null;
		selected_grid_y = null;
		$('#place_element_button').prop('disabled', true);
		paper.view.update();
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
			//clear_item("line", [x_vertices[i - 1], x_vertices[i]], [y_vertices[i - 1], y_vertices[i]], {}, 0);
		}

		x_vertices.length = [];
		y_vertices.length = [];
	});

	$("#drawing_controls_button").click(function () {
		$("#drawing_controls").toggle();
		$("#movement_controls").hide();
		$("#settings_controls").hide();
		$("#editing_controls").hide();
	});

	$("#movement_controls_button").click(function () {
		$("#movement_controls").toggle();
		$("#drawing_controls").hide();
		$("#settings_controls").hide();
		$("#editing_controls").hide();
	});

	$("#settings_controls_button").click(function () {
		$("#settings_controls").toggle();
		$("#drawing_controls").hide();
		$("#movement_controls").hide();
		$("#editing_controls").hide();
	});

	$("#grid_down").click(function () {
		$("#grid_space_dropdown").toggle();
	});

	$("#drawing_controls_btn").click(function () {
		$("#drawing_controls").toggle();
	});

	$("#editing_controls_btn").click(function () {
		$("#editing_controls").toggle();
	});

	$("#movement_controls_btn").click(function () {
		$("#movement_controls").toggle();
	});

	$("#settings_controls_btn").click(function () {
		$("#settings_controls").toggle();
	});

	$("#element_list_btn").click(function () {
		$("#element_list_dropdown").toggle();
	});

	$("#editing_controls_done").click(function () {

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

	$("#randomize").click(function () {
		socket.emit('randomize', {
			"grid_id": grid_id
		});
	});

	$(".element_filter").click(function () {
		refresh_elements_list();
	});

	$("#addition_tab").click(function () {
		socket.emit('create_grid_space', {});
	});

	$("#list_header_elements").click(function () {
		$("#list_header_elements").css("background", "#345eb2");
		$("#list_header_elements").css("color", "white");
		$("#list_header_annotations").css("background", " #dddddd");
		$("#list_header_annotations").css("color", "black");

		$("#annotations_list_container").hide();
		$("#element_list_container").show();
	});

	$("#list_header_annotations").click(function () {
		$("#list_header_annotations").css("background", "#345eb2");
		$("#list_header_annotations").css("color", "white");
		$("#list_header_elements").css("background", " #dddddd");
		$("#list_header_elements").css("color", "black");

		$("#element_list_container").hide();
		$("#annotations_list_container").show();
	});

	$("#annotations_display").change(function () {
		$(".grid_canvas_annotation").toggle();
	});

	$(document)
		.on('click', '#tab_row .grid-name', function (evt) {
			$(".tab").removeClass("active");
			$(this).parent().addClass("active");
			grid_id = $(this).val();
			socket.emit('request_grid_space', {
				"id": $(this).val()
			}, function (msg) {
				grid_count_height = msg.grid_space.size.height;
				resizeGridHeight(grid_count_height);
				grid_count_width = msg.grid_space.size.width;
				resizeGridWidth(grid_count_width);
				clearPlayerName();
				local_stored_annotations = [];
				$("#grid_name").val(msg.grid_space.name);

				group_elements.removeChildren();
				group_overlay.removeChildren();

				try {
					cursor.remove();
					top_ruler_cursor.remove();
					top_ruler_cursor = undefined;
					left_ruler_cursor.remove();
					left_ruler_cursor = undefined;
					top_ruler_number.remove();
					top_ruler_number = undefined;
					left_ruler_number.remove();
					left_ruler_number = undefined;
				} catch (e) { }
				paper.view.update();

				if (msg.grid_space.elements.length !== 0) {
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
		.on('click', '#context_annotation_controls_done', function (evt) {
			socket.emit('add_annotation_to_server', {
				"grid_id": grid_id,
				"title": "",
				"content": $("#annotation_content").val(),
				"x": selected_grid_x,
				"y": selected_grid_y
			});
		})
		.on('click', '#tab_row .grid-space-delete', function (evt) {
			if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
				socket.emit("delete_grid_space_from_server", {
					"grid_id": $(this).val()
				});
			}
		});

	$("#grid_canvas").focus();
	$(document).keydown(function (e) {
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

	$("#overlapping_container_open").click(function (evt) {
		$("#side_container_swap > *").hide();
		$("#options_container").show();
		$("#overlapping_side_container").show();
		$("#overlapping_back_button").hide();
		$("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "200px" : "0px"));
	});

	$("#overlapping_back_button").click(function (evt) {
		$("#overlapping_back_button").hide();
		getContextMenu();
	});

	$("#tqa_ping").click(function () {
		pingPosition();
	});
}

/**
 * Create an HTML DOM element
 *
 * @param {Element} el -
 * @return {string} An html element to display 
 */
function composeElementListRowElement(el) {
	return "<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.data.id + ")\" id=" + el.data.id + ">" +
		"<div style=\"width: 25%; display: inline-block;\">" +
		"<p style=\"font-size: smaller;\">" + el.data.name + "<\p>" +
		"</div>" +
		"<div style=\"width: 35%; display: inline-block;\">" +
		"<p style=\"font-size: smaller;\">" + el.data.category + "<\p>" +
		"</div>" +
		"<button id=\"element_row_edit\" onClick=\"editElementRow(" + el.data.id + ")\">&#x270E;</button>" +
		"<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.data.id + ")\">&times</button>" +
		"</div>";
}

function composeAnnotationListRowElement(el) {
	return "<div class=\"element_list_row\" onclick=\"clicked_annotation_list(" + el.id + ")\">" +
		"<p>" + el.content + "<\p>" +
		"<button id=\"element_row_edit\" onClick=\"editAnnotationRow(" + el.id + ")\">&#x270E;</button>" +
		"<button id=\"element_row_delete\" onclick=\"delete_annotation_from_server(" + el.id + ")\">&times</button>" +
		"</div>";
}

function getContextMenu() {
	$("#overlapping_back_button").hide();
	$("#side_container_swap > *").hide();
	$("#options_container").show();
	$("#overlapping_side_container").show();
	$("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "500px" : "0"));
}

function updateSideMenuContent() {
	$("#options_add_or_edit_button").show();
	if (isUndefined(selected_element) || selected_element == null) {
		$("#options_add_or_edit_button").text("Add");
		$("#options_copy_button").hide();
		$("#options_paste_button").hide();
		$("#options_delete_button").hide();
		$("#options_movement_button").hide();
	} else {
		$("#options_add_or_edit_button").text("Edit");
		$("#options_copy_button").show();
		$("#options_paste_button").show();
		$("#options_delete_button").show();
		$("#options_movement_button").show();
	}

	if (copied_element === null) {
		$("#options_paste_button").hide();
	} else {
		$("#options_paste_button").show();
	}

	$("#options_annotate_button").show();
}

function selectedMenuOption(option) {
	switch (option) {
		case "lists":
			$("#overlapping_back_button").show();
			$("#options_container").hide();
			$("#overlapping_container").show();
			break;
		case "grid_space":
			$("#overlapping_back_button").show();
			$("#options_container").hide();
			$("#grid_space_container").show();
			break;
		case "add_or_edit":
			$("#overlapping_back_button").show();
			$("#options_container").hide();
			$("#add_container").show();
			var isAdd = $("#options_add_or_edit_button").text() === "Add";
			$("#selected_shape").val(isAdd ? "square" : selected_element.shape);
			$("#element_color").val(isAdd ? "000000" : selected_element.color);
			$("#element_color_changer")[0].jscolor.fromString(isAdd ? "#000000" : "#" + selected_element.color);
			$("#element_width").val(isAdd ? 1 : selected_element.item.size.width);
			$("#element_height").val(isAdd ? 1 : selected_element.item.size.height);
			$("#element_category").val(isAdd ? "environment" : selected_element.category);
			$("#element_name").val(isAdd ? "object" : selected_element.name);
			$("#place_element_button").text(isAdd ? "Add" : "Submit");
			break;
		case "movement":
			$("#overlapping_back_button").show();
			$("#options_container").hide();
			$("#movement_container").show();
			break;
		case "copy":
			console.log("TODO: Copy elements");
			break;
		case "paste":
			add_element_to_server(copied_element.color, pixel2GridPoint(selected_grid_x), pixel2GridPoint(selected_grid_y), copied_element.shape, copied_element.name, copied_element.size, copied_element.category, {});
			break;
		case "close":
			$("#overlapping_side_container").hide();
			$("#tab_row").css("padding-right", (($("#overlapping_side_container").css("display") == "block") ? "200px" : "0px"));
			break;
		case "delete":
			console.log(selected_element);
			socket.emit('delete_element_on_server', {
				"grid_id": grid_id,
				"element_id": selected_element.item.data.id
			});
			break;
		case "annotate":
			$("#overlapping_back_button").show();
			$("#options_container").hide();
			$("#annotations_container").show();
			break;
	}
}

function showAnnotations() {
	local_stored_annotations.forEach(function (el) {
		$("#grid_canvas_scrolling_container").append("<span class=\"grid_canvas_annotation\" style=\"position: absolute; top: " + (gridPoint2Pixel(el.y) + $("#temporary_drawing_canvas").offset().top) + "px; left: " + (gridPoint2Pixel(el.x) + $("#temporary_drawing_canvas").offset().left) + "px; z-index: 2;\">&#x2139;</span>");
	});
	if (!$("#annotations_display").attr("checked")) $(".grid_canvas_annotations").hide();
}

function hideAnnotations() {
	$("#grid_canvas_scrolling_container .grid_canvas_annotation").remove();
}


function showPlayerName(x, y, name) {
	$("body").append("<div id=\"popup_name\" class=\"popup_items\" style=\"top:" + y + "px; left:" + x + "px\"><p>" + name + "</p></div>");
}

function clearPlayerName() {
	$("#popup_name").remove();
}

function editElementRow(id) {
	console.log("TODO: Find selected element");

	$("#overlapping_container").hide();
	$("#add_container").show();

	$("#selected_shape").val(selected_element.shape);
	$("#element_color").val(selected_element.color);
	$("#element_color_changer")[0].jscolor.fromString(selected_element.color);
	$("#element_width").val(selected_element.size.width);
	$("#element_height").val(selected_element.size.height);
	$("#element_category").val(selected_element.category);
	$("#element_name").val(selected_element.name);

	$("#vertices_list").empty();
	if (selected_element.shape === "line") {
		selected_element.x.forEach(function (_, ind) {
			$("#vertices_list").append("<p>" + selected_element.x[ind] + "," + selected_element.y[ind] + "</p>");
		});
	}

	$("#place_element_button").text("Submit");
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

/**
 * Move the cursor to the element that was selected from the list of elements
 *
 * @param {int} id - the unique ID of the selected element
 */
function clicked_element_list(id) {
	//todo
	console.log("TODO: Implement clicking element list items.");
}

function clicked_annotation_list(id) {
	var temp = local_stored_annotations.find(function (el) {
		return el.id == id;
	});
	draw_cursor_at_position(temp.x, temp.y, 1);
}

function resizeGridWidth(width) {
	grid_count_width = width;
	$("#grid_size_horizontal").val(grid_count_width);
	drawScreen();
	drawTopRuler();
}

function resizeGridHeight(height) {
	grid_count_height = height;
	$("#grid_size_vertical").val(grid_count_height);
	drawScreen();
	drawLeftRuler();
}