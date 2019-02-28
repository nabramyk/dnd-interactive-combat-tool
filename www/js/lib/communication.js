function bindSocketListeners() {

	socket.on('connect', function (msg) {
		$("#lost_connection_div").hide();

		socket.emit('init', {}, function (msg) {
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

			msg.spaces.forEach(function (el) {
				$("<div class=\"tab\"><button class=\"grid-name\" value=\"" + el.id + "\">" + el.name + "</button><button class=\"grid-space-delete\" value=\"" + el.id + "\">&times</button></div>").insertBefore("#addition_tab");
			});

			$(".tab").first().addClass("active");

			msg.elements.map(function(el) {
				draw_item(el.el);
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

	});

	socket.on('disconnect', function () {
		$("#lost_connection_div").show();
		$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
	});

	socket.on('resize', function (msg) {
		if (grid_id != msg.grid_id) return;
		grid_count_width = msg.size.width;
		grid_count_height = msg.size.height;
		resizeGridWidth(grid_count_width);
		resizeGridHeight(grid_count_height);
		drawElements();
	});

	socket.on('added_element', function (msg) {
		console.log(msg);
		if (msg.grid_id != grid_id) return;
		$("#reset_board_button").prop("disabled", false);
		draw_item(msg.element.el);
		refresh_elements_list();
	});

	socket.on('added_elements', function (msg) {
		if (msg.grid_id != grid_id) return;
		$("#reset_board_button").prop("disabled", false);
		ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
		drawElements();
		refresh_elements_list();
	});

	socket.on('removed_element', function (msg) {
		if (msg.grid_id != grid_id) return;

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

	socket.on('move_element', function (msg) {
		if (msg.grid_id != grid_id) return;
		var element = group_elements.children.find(function(el) { return el.data.id == msg.element.el.data.id; });
		element.matrix = msg.element.el.matrix;
		paper.view.update();
		$("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
	});

	socket.on('edited_element', function (msg) {
		if (msg.grid_id != grid_id) return;
		group_elements.children[group_elements.children.indexOf(
			group_elements.children.find(
				function (el) {
					return msg.element.id == el.id;
				}
			)
		)] = msg.element;
		drawElements();
		$("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
	});

	socket.on('new_grid_space', function (msg) {
		$("<div class=\"tab\"><button class=\"grid-name\" value=\"" + msg.id + "\">" + msg.name + "</button><button class=\"grid-space-delete\" value=\"" + msg.id + "\">&times</button></div>").insertBefore("#addition_tab");
	});

	socket.on('reset_grid', function (msg) {
		if (grid_id != msg.grid_id) return;
		group_elements.removeChildren();
		paper.view.draw();
	});

	socket.on('delete_grid_space', function (msg) {
		$("button[class=\"grid-space-delete\"][value=\"" + msg.grid_id + "\"]").parent().remove();
		if (msg.grid_id == grid_id) {
			alert("Well, someone decided that you don't need to be here anymore.");
			ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
			socket.emit('init', {});
		}
	});

	socket.on('renaming_grid', function (msg) {
		$("button[class=\"grid-name\"][value=\"" + msg.grid_id + "\"]").text(msg.grid_name);
	});

	socket.on('added_annotation', function (msg) {
		if (grid_id != msg.grid_id) return;
		local_stored_annotations.push(msg.annotation);
		hideAnnotations();
		showAnnotations();
		refresh_annotations_list();
	});

	socket.on('deleted_annotation', function (msg) {
		if (grid_id != msg.grid_id) return;
		local_stored_annotations.splice(local_stored_annotations.findIndex(function (el) {
			return el.id == msg.annotation_id
		}), 1);
		refresh_annotations_list();
	});

	socket.on('ping_rcv', function (msg) {
		drawPing(msg);
	});

	socket.on('error_channel', function (msg) {
		alert(msg.message);
	});
}

function add_element_to_server(color, x, y, shape, name, size, category) {
	var temp_new_ele = draw_local_item({ "color" : color, "x" : x, "y" : y, "shape": shape, "name" : name, "size": size, "category" : category});
	$("#reset_board_button").prop("disabled", false);
	socket.emit('add_element_to_server', {
		"grid_id": grid_id,
		"element": temp_new_ele
	}, function(msg) {
		temp_new_ele.data.id = msg.id;
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

function determinePoint(dir, el) {
	var out = { "x" : pixel2GridPoint(el.item.bounds.topLeft.x), "y" : pixel2GridPoint(el.item.bounds.topLeft.y)};
	console.log(el.item.bounds.topLeft.x);
	console.log("out:", out);
	switch (dir) {
		case "up": out.y -= 1; break;
		case "down": out.y += 1; break;
		case "left": out.x -= 1; break;
		case "right": out.x += 1;
	}
	return out;
}

function collide(e1, e2) {
	return e1.id != e2.id &&
		e1.x < e2.x + e2.size.width &&
		e1.x + e1.size.width > e2.x &&
		e1.y < e2.y + e2.size.height &&
		e1.y + e1.size.height > e2.y;
}

/**
 *
 */
function incremental_move_element(direction) {
	var temp = determinePoint(direction, selected_element);
	var out = undefined;
	if (out == undefined) {
		socket.emit('move_element', {
			"grid_id": grid_id,
			"id": selected_element.item.data.id,
			"direction": direction,
			"size": cursor_size
		}, function (msg) {
			console.log("TODO: incremental_move_element callback")
		});

		selected_grid_x = temp.x * grid_size + grid_line_width;
		selected_grid_y = temp.y * grid_size + grid_line_width;

		console.log(temp);

		var loc = new paper.Point(selected_grid_x, selected_grid_y);
		selected_element.item.bounds.topLeft = loc;
		cursor.bounds.topLeft = loc;

		group_overlay.addChild(cursor);
		paper.view.update();
	}
}

function refresh_annotations_list() {
	$("#annotations_list").empty();
	local_stored_annotations.forEach(function (el) {
		$("#annotations_list").append(composeAnnotationListRowElement(el));
	});
	hideAnnotations();
	showAnnotations();
	$(".grid_canvas_annotation").toggle(false);
}

function editAnnotationRow(id) {

}
