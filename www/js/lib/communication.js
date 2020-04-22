function bindSocketListeners() {

	// // socket.on('disconnect', function () {
	// // 	$("#lost_connection_div").show();
	// // 	$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
	// // });

	// socket.on('added_element', function (msg) {
	// 	if (msg.grid_id != grid_id) return;
	// 	$("#reset_board_button").prop("disabled", false);
	// 	draw_item(msg.element.el);
	// 	refresh_elements_list();
	// });

	// socket.on('added_elements', function (msg) {
	// 	if (msg.grid_id != grid_id) return;
	// 	$("#reset_board_button").prop("disabled", false);
	// 	ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
	// 	drawElements();
	// 	refresh_elements_list();
	// });

	// socket.on('removed_element', function (msg) {
	// 	if (msg.grid_id != grid_id) return;

	// 	var temp = group_elements.children[group_elements.children.indexOf(
	// 		group_elements.children.find(
	// 			function (el) {
	// 				return msg.element_id == el.data.id;
	// 			}
	// 		)
	// 	)];

	// 	temp.remove();

	// 	drawElements();
	// 	$("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
	// 	refresh_elements_list();
	// });

	// socket.on('move_element', function (msg) {
	// 	if (msg.grid_id != grid_id) return;
	// 	var element = group_elements.children.find(function(el) { return el.data.id == msg.element.data.id; });
	// 	element.matrix = msg.element.matrix;
	// 	if (selected_element != null && element === selected_element) {
	// 		selected_element = null;
	// 		eraseCursor();
	// 	}
	// 	paper.view.update();
	// 	$("#element_list>#" + msg.element.id).replaceWith(composeElementListRowElement(msg.element));
	// });

	// socket.on('edited_element', function (msg) {
	// 	if (msg.grid_id != grid_id) return;

	// 	var element = group_elements.getItem({ data: { id: msg.element.data.id } });
	// 	var bounds = element.bounds;

	// 	element.fillColor = msg.element.fillColor;
	// 	element.matrix = msg.element.matrix;
	// 	element.data = msg.element.data;
	// 	element.size = msg.element.size;
	// 	element.bounds.topLeft = bounds.topLeft;

	// 	paper.view.update();
	// 	$("#element_list>#" + element.data.id).replaceWith(composeElementListRowElement(element));
	// });

	// socket.on('new_grid_space', function (msg) {
	// 	generateGridTab(msg.id, msg.name)
	// });

	// socket.on('reset_grid', function (msg) {
	// 	if (grid_id != msg.grid_id) return;
	// 	group_elements.removeChildren();
	// 	paper.view.draw();
	// });

	// socket.on('delete_grid_space', function (msg) {
	// 	$("a[class=\"grid-space-delete\"][id=\"" + msg.grid_id + "\"]").parent().remove();
	// 	if (msg.grid_id == grid_id) {
	// 		alert("Well, someone decided that you don't need to be here anymore.");
	// 		ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
	// 		socket.emit('init', {});
	// 	}
	// });

	// socket.on('renaming_grid', function (msg) {
	// 	$("li[class~=\"tab\"][id=\"" + msg.grid_id + "\"] > a[class=\"grid-name\"]").text(msg.grid_name);
	// });

	// socket.on('added_annotation', function (msg) {
	// 	if (grid_id != msg.grid_id) return;
	// 	local_stored_annotations.push(msg.annotation);
	// 	hideAnnotations();
	// 	showAnnotations();
	// 	refresh_annotations_list();
	// });

	// socket.on('deleted_annotation', function (msg) {
	// 	if (grid_id != msg.grid_id) return;
	// 	local_stored_annotations.splice(local_stored_annotations.findIndex(function (el) {
	// 		return el.id == msg.annotation_id
	// 	}), 1);
	// 	refresh_annotations_list();
	// });

	// socket.on('error_channel', function (msg) {
	// 	alert(msg.message);
	// });
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

function collide(e1, e2) {
	return e1.id != e2.id &&
		e1.x < e2.x + e2.size.width &&
		e1.x + e1.size.width > e2.x &&
		e1.y < e2.y + e2.size.height &&
		e1.y + e1.size.height > e2.y;
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

app.controller('appController', ['$scope', '$rootScope', 'socket', 'globals', function ($scope, $rootScope, socket, globals) {
	socket.on('connect', function (msg) {
		socket.emit('init', {}, function (msg) {
			$("#loading_div").show();
			$rootScope.$broadcast('initializeCanvas', msg);
		});
	});

	socket.on('ping_rcv', function (msg) {
		$rootScope.$broadcast('drawPing', msg);
	});

	socket.on('resize', function (msg) {
		$rootScope.$broadcast('resizeRcv', msg);
	});

	socket.on('added_element', function (msg) {
		$rootScope.$broadcast('addedElement', msg);
	});

	socket.on('added_elements', function (msg) { });
	socket.on('removed_element', function (msg) { });
	socket.on('move_element', function (msg) { });
	socket.on('edited_element', function (msg) { });
	socket.on('new_grid_space', function (msg) { 
		$rootScope.$broadcast('generateGridTab', msg);
	});

	socket.on('reset_grid', function (msg) { });
	socket.on('delete_grid_space', function (msg) { });
	socket.on('renaming_grid', function (msg) { });
	socket.on('added_annotation', function (msg) { });
	socket.on('deleted_annotation', function (msg) { });
	socket.on('error_channel', function (msg) { });

	$scope.$on('resize', (_, args) => {
		socket.emit('resize', {
			"grid_id": args[0],
			"size": { "width": args[1], "height": args[2] }
		});
	});

	$scope.$on('ping', (_, args) => {
		socket.emit('ping_snd', {
			position: args[0].position,
			size: args[0].size,
			username: args[1]
		});
	});

	$scope.$on('addElementToServer', (_, args) => {
		socket.emit('add_element_to_server', {
			"grid_id": args.grid_id,
			"element": args.element
		}, function (msg) {
			args.element.data.id = msg.id;
		});
	});

	$scope.$on('move_element', (_, args) => {
		socket.emit('move_element', args, (msg) => {
			$rootScope.$broadcast('move_element_rcv', msg);
		});
	});

	$scope.$on('createGridSpace', (_) => {
		socket.emit('create_grid_space', {});
	});

	$scope.toggleSidebar = () => {
		$("#sidebar").toggleClass('active');
	};

	$scope.toggleActive = (event) => {
		$(event).toggleClass('active');
	};

	$scope.pingPosition = () => {
		$rootScope.$broadcast('ping', [globals.getCursor(), $("#username").val()]);
	};
}]);