/**
 * @fileoverview Should handle all of the jquery interface stuff
 * @returns
 */
function bindEventHandlers() {
	
	$('#place_element_button').click(function () {
		if ($("#place_element_button").text() === "Add" || $("#place_element_button").text() === "Add Vertex") {
			switch ($("#selected_shape").val()) {
				case "circle":
				case "rectangle":
				case "freehand":
				case "room":
					add_element_to_server();
					break;
				case "line":
					line_path.add(new paper.Point(cursor.position.x, cursor.position.y));
					x_vertices.push(cursor.position.x);
					y_vertices.push(cursor.position.y);
					if (line_path.segments.length > 0) {
						$("#start_new_line_button").show();
					}
					break;
			}
		} else {
			//TODO: change of shape?

			var bounds = selected_element.bounds;

			selected_element.data.name = $("#element_name").val();
			selected_element.data.category = $("#element_category").val();

			if(selected_element.name == "room") {
				selected_element.strokeColor = $("#outline_color").spectrum("get").toHexString();
			} else {
				selected_element.fillColor = $("#element_color").spectrum("get").toHexString();
			}

			selected_element.size.width = $("#element_width").val() * grid_size;
			selected_element.size.height = $("#element_height").val() * grid_size;
			selected_element.bounds.topLeft = bounds.topLeft;

			draw_cursor();
			drawSelectedPositionTopRuler(Number(selected_grid_x));
			drawSelectedPositionLeftRuler(Number(selected_grid_y));

			socket.emit('edit_element_on_server', {
				"grid_id": grid_id,
				"id": selected_element.data.id,
				"el": selected_element
			});
			paper.view.update();
		}
	});

	$('#b_rotate_left').click(function () { rotateElement(-90); });
	$('#b_rotate_right').click(function () { rotateElement(90); });

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
		try {
			if (selected_grid_x !== x_vertices[x_vertices.length - 1] || selected_grid_y !== y_vertices[y_vertices.length - 1]) {
				x_vertices.push(cursor.position.x);
				y_vertices.push(cursor.position.y);
			}
		} catch (e) { }

		if (x_vertices.length > 1 && y_vertices.length > 1) {
			add_element_to_server($("#element_color").spectrum("get").toHexString(),
				x_vertices,
				y_vertices,
				$("#selected_shape").val(),
				$("#element_name").val(),
				{ "width": 0, "height": 0 },
				$("#element_category").val(),
				$("#outline_thickness").val()
			);
		}

		x_vertices = [];
		y_vertices = [];

		line_path.remove();
		line_path = new paper.Path();
		temp_line.remove();
		temp_line = null;

		paper.view.update();

		$("#start_new_line_button").toggle();
	});

	$("#element_erase").click(function () {
		line_path.remove();
		line_path = new paper.Path();
		try {
			temp_line.remove();
			temp_line = null;
		} catch (e) {
			console.log(e);
		}
		paper.view.update();
	});

	$("#selected_shape").change(function (el) {
		eraseCursor();
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
			case "freehand":
				$('#dimensions_container').hide();
				break;
			case "room":
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

	$(".element_filter").click(function () {
		refresh_elements_list();
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

	$("#delete_board_button").click(function () {
		if (confirm("Are you sure you want to delete this board? This action cannot be undone.")) {
			socket.emit("delete_grid_space_from_server", {
				"grid_id": grid_id
			});
		}
	});

	$("#tqa_ping").click(function () {
		pingPosition();
	});

	$("#tqa_copy").click(function () {
		copied_element = selected_element;
	});

	$("#tqa_paste_delete").click(function () {
		if ($("#paste_delete").text() == "Paste") {
			var newEl = copied_element.clone();
			newEl.position = new paper.Point(pixel2GridPoint(selected_grid_x), pixel2GridPoint(selected_grid_y));

			newEl.onMouseEnter = function () {
				if (isDragging) return;
				t = new paper.PointText(this.position.x, this.bounds.top - 10);
				t.content = this.data.name;
				t.pivot = paper.Shape.Rectangle.topLeft;
				b = paper.Shape.Rectangle(t.bounds);
				b.size.width += 10;
				b.size.height += 10;
				b.fillColor = 'white';
				b.strokeColor = "black";
				group_overlay.addChildren([b, t]);
				paper.view.update();
			}

			newEl.onMouseLeave = function () {
				t.remove();
				b.remove();
				paper.view.update();
			}

			paper.view.update();

			socket.emit('add_element_to_server', {
				"grid_id": grid_id,
				"element": newEl
			}, function (msg) {
				newEl.data.id = msg.id;
			});
		}
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
		"<p style=\"font-size: smaller; color: #000000;\">" + el.data.name + "<\p>" +
		"</div>" +
		"<div style=\"width: 35%; display: inline-block;\">" +
		"<p style=\"font-size: smaller; color: #000000;\">" + el.data.category + "<\p>" +
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
	$("#element_color").spectrum("set", selected_element.color);
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

/**
 * Move the cursor to the element that was selected from the list of elements
 *
 * @param {int} id - the unique ID of the selected element
 */
function clicked_element_list(id) {
	try {
		selected_element.selected = false;
	} catch (e) {
		console.log(e);
	}

	selected_element = group_elements.children.find(function (el) { return el.data.id === id });
	console.log(selected_element);
	selected_element.selected = true;
	paper.view.update();
}

function clicked_annotation_list(id) {
	var temp = local_stored_annotations.find(function (el) {
		return el.id == id;
	});
	draw_cursor_at_position(temp.x, temp.y, 1);
}

function rotateElement(angle) {
	if (selected_element.size.width == selected_element.size.height) return;
	if (stored_edited_element_bounds == null) stored_edited_element_bounds = selected_element.bounds;

	selected_element.rotate(angle, stored_edited_element_bounds.topLeft);
	cursor.rotate(angle, stored_edited_element_bounds.topLeft);
	paper.view.update();

	socket.emit('edit_element_on_server', {
		"grid_id": grid_id,
		"id": selected_element.data.id,
		"el": selected_element
	});
}