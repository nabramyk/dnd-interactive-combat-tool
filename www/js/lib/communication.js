function bindSocketListeners() {

	socket.on('connect', function(msg) {
		$("#lost_connection_div").hide();

		socket.emit('init', {}, function(msg) {
			grid_count_height = msg.size.height;
			resizeGridHeight(grid_count_height);
			grid_count_width = msg.size.width;
			resizeGridWidth(grid_count_width);

			selected_grid_x = -1;
			selected_grid_y = -1;

			$("#element_list").empty();
			refresh_elements_list();

			$(".tab").remove();
			grid_id = msg.spaces[0].id;
			$("#grid_name").val(msg.spaces[0].name);

			msg.spaces.forEach(function(el) {
				$("<div class=\"tab\"><button class=\"grid-name\" value=\"" + el.id + "\">" + el.name + "</button><button class=\"grid-space-delete\" value=\"" + el.id + "\">&times</button></div>").insertBefore("#addition_tab");
			});

			$(".tab").first().addClass("active");

			if (msg.elements.length !== 0) {
				local_stored_grid_space = msg.elements;
				$("#reset_board_button").prop("disabled", false);
				drawElements();
			} else {
				local_stored_grid_space = [];
			}

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

	});

	socket.on('disconnect', function() {
		$("#lost_connection_div").show();
		$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
	});

	socket.on('resize', function(msg) {
		if (grid_id != msg.grid_id) return;
		grid_count_width = msg.size.width;
		grid_count_height = msg.size.height;
		resizeGridWidth(grid_count_width);
		resizeGridHeight(grid_count_height);
		local_stored_grid_space = msg.elements;
		drawElements();
	});

	socket.on('added_element', function(msg) {
		if (msg.grid_id != grid_id) return;
		$("#reset_board_button").prop("disabled", false);
		local_stored_grid_space.push(msg.element);
		drawElements();
		refresh_elements_list();
	});

	socket.on('added_elements', function(msg) {
		if (msg.grid_id != grid_id) return;
		$("#reset_board_button").prop("disabled", false);
		ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		local_stored_grid_space = local_stored_grid_space.concat(msg.element);
		drawElements();
		refresh_elements_list();
	});

	socket.on('removed_element', function(msg) {
		if (msg.grid_id != grid_id) return;
		local_stored_grid_space.splice(local_stored_grid_space.findIndex(function(el) {
			if(el.id == msg.element_id) {
				el.ele.remove();
				return true;
			} else {
				return false;
			}
		}), 1);
		drawElements();
		$("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
		refresh_elements_list();
	});

	socket.on('move_element', function(msg) {
		if (msg.grid_id != grid_id) return;
		var element = local_stored_grid_space[local_stored_grid_space.indexOf(
				local_stored_grid_space.find(
						function(el) {
							return msg.element.id == el.id
						}
				)
		)];
		element.x = msg.element.x;
		element.y = msg.element.y;
		drawElements();
		$("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
	});

	socket.on('edited_element', function(msg) {
		if (msg.grid_id != grid_id) return;
		local_stored_grid_space[local_stored_grid_space.indexOf(
				local_stored_grid_space.find(
						function(el) {
							return msg.element.id == el.id
						}
				)
		)] = msg.element;
		drawElements();
		$("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
	});

	socket.on('new_grid_space', function(msg) {
		$("<div class=\"tab\"><button class=\"grid-name\" value=\"" + msg.id + "\">" + msg.name + "</button><button class=\"grid-space-delete\" value=\"" + msg.id + "\">&times</button></div>").insertBefore("#addition_tab");
	});

	socket.on('reset_grid', function(msg) {
		if (grid_id != msg.grid_id) return;
		ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		local_stored_grid_space = [];
	});

	socket.on('delete_grid_space', function(msg) {
		$("button[class=\"grid-space-delete\"][value=\"" + msg.grid_id + "\"]").parent().remove();
		if (msg.grid_id == grid_id) {
			alert("Well, someone decided that you don't need to be here anymore.");
			ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
			socket.emit('init', {});
		}
	});

	socket.on('renaming_grid', function(msg) {
		$("button[class=\"grid-name\"][value=\"" + msg.grid_id + "\"]").text(msg.grid_name);
	});

	socket.on('added_annotation', function(msg) {
		if (grid_id != msg.grid_id) return;
		local_stored_annotations.push(msg.annotation);
		hideAnnotations();
		showAnnotations();
		refresh_annotations_list();
	});

	socket.on('deleted_annotation', function(msg) {
		if (grid_id != msg.grid_id) return;
		local_stored_annotations.splice(local_stored_annotations.findIndex(function(el) {
			return el.id == msg.annotation_id
		}), 1);
		refresh_annotations_list();
	});

	socket.on('ping_rcv', function(msg) {
		drawPing(msg);
	});

	socket.on('error_channel', function(msg) {
		alert(msg.message);
	});
}

function add_element_to_server(color, x, y, shape, name, size, category) {
	socket.emit('add_element_to_server', {
		"grid_id": grid_id,
		"color": color,
		"x": JSON.stringify(x),
		"y": JSON.stringify(y),
		"shape": shape,
		"name": name,
		"size": size,
		"category": category,
		"rotation": 1
	});
}

function pingPosition() {
	socket.emit('ping_snd', {
		position: cursor.position,
		size: cursor.size
	});
}

/**
 * Delete's a specific element from the server
 *
 * @param {int} id - the unique ID of the element to delete
 */
function delete_element_from_server(id) {
	socket.emit('delete_element_on_server', {
		"grid_id": grid_id,
		"element_id": id
	});
}

function delete_annotation_from_server(id) {
	socket.emit('delete_annotation_from_server', {
		"grid_id": grid_id,
		"annotation_id": id
	});
}

/**
 *
 */
function incremental_move_element(direction) {
	socket.emit('move_element', {
		"grid_id": grid_id,
		"x": pixel2GridPoint(selected_grid_x),
		"y": pixel2GridPoint(selected_grid_y),
		"direction": direction,
		"size": cursor_size
	}, function(msg) {
		cursor.remove();
		selected_grid_x = gridPoint2Pixel(msg.x) + grid_line_width;
		selected_grid_y = gridPoint2Pixel(msg.y) + grid_line_width;
		cursor = paper.Shape.Rectangle(selected_grid_x, selected_grid_y, grid_size * selected_element.size.width, grid_size * selected_element.size.height);
		cursor.strokeColor = grid_highlight;
		group_overlay.addChild(cursor);

		drawSelectedPositionTopRuler(Number(selected_grid_x + grid_size / 2));
		drawSelectedPositionLeftRuler(Number(selected_grid_y + grid_size / 2));

		$("#move_to_x").val(pixel2GridPoint(selected_grid_x) - 1);
		$("#move_to_y").val(pixel2GridPoint(selected_grid_y) - 1);
		
		paper.view.update();
	});
}

function refresh_annotations_list() {
	$("#annotations_list").empty();
	local_stored_annotations.forEach(function(el) {
		$("#annotations_list").append(composeAnnotationListRowElement(el));
	});
	hideAnnotations();
	showAnnotations();
	$(".grid_canvas_annotation").toggle(false);
}

function editAnnotationRow(id) {

}