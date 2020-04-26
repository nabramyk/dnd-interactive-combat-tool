function bindSocketListeners() {

	// // socket.on('disconnect', function () {
	// // 	$("#lost_connection_div").show();
	// // 	$("#lost_connection_text").text("(ง'̀-'́)ง  The server could not be reached");
	// // });

	// socket.on('added_elements', function (msg) {
	// 	if (msg.grid_id != grid_id) return;
	// 	$("#reset_board_button").prop("disabled", false);
	// 	ctx.clearRect(0, 0, grid_canvas.width, grid_canvas.height);
	// 	drawElements();
	// 	refresh_elements_list();
	// });

	// 	temp.remove();

	// 	drawElements();
	// 	$("#reset_board_button").prop("disabled", msg.gridSpaceEmpty);
	// 	refresh_elements_list();
	// });

	// socket.on('reset_grid', function (msg) {
	// 	if (grid_id != msg.grid_id) return;
	// 	group_elements.removeChildren();
	// 	paper.view.draw();
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

app.controller('appController', ['$scope', '$rootScope', 'socket', '$location', '$window', '$http', function ($scope, $rootScope, socket, $location, $window, $http) {

    $rootScope._cursor = [];
    $rootScope._grid_id = 0;

    /** @global {int} grid_size - minimum height/width of a single grid tile (in pixels) */
    $rootScope._grid_size = 20;

    /** @global {int} cursor_size - the span of grid spaces the cursor overlays */
    $rootScope._cursor_size = 1;

    $rootScope._selected_element = null;

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

	socket.on('removed_element', function (msg) {
		$rootScope.$broadcast('removedElement', msg);
	});

	socket.on('move_element', function (msg) {
		$rootScope.$broadcast('move_element_rcv', msg);
	});

	socket.on('edited_element', function (msg) { 
		$rootScope.$broadcast('updateElement', msg);
	});

	socket.on('new_grid_space', function (msg) {
		$rootScope.$broadcast('generateGridTab', msg);
	});

	socket.on('renaming_grid', function (msg) {
		$rootScope.$broadcast('renamedGrid', msg);
	 });

	socket.on('reset_grid', function (msg) { });
	
	socket.on('delete_grid_space', function (msg) { 
		$rootScope.$broadcast('deletedGridSpace', msg);
	});

	socket.on('added_annotation', function (msg) { });
	socket.on('deleted_annotation', function (msg) { });
	socket.on('error_channel', function (msg) { });

	socket.on('upload', (msg) => {
		$rootScope.$broadcast('initializeCanvas', msg);
	});

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

	$scope.$on('changeGridSpaceSnd', (_, args) => {
		socket.emit('request_grid_space', {
			"id": args
		}, (msg) => {
			$rootScope.$broadcast('requestGridSpaceRcv', msg);
		});
	});

	$scope.$on('deleteElement', () => {
		socket.emit('delete_element_on_server', {
			"grid_id": $rootScope._grid_id,
			"element_id": $rootScope._selected_element.data.id
		});
	});

	$scope.$on('exportClutter', () => {
		socket.emit('export', {
		}, (msg) => {
			$window.open($location.host() + ":" + $location.port() + '/download');
		})
	});

	$scope.$on('changeGridName', (_, args) => {
		socket.emit('rename_grid', {
			"grid_id": $rootScope._grid_id,
			"grid_name": args.gridName
		});
	});

	$scope.$on('sendUpdatedElementToServer', (_, args) => {
		socket.emit('edit_element_on_server', {
			"grid_id": $rootScope._grid_id,
			"el": args
		});
	});

	$scope.$on('deleteSpace', () => {
		console.log($rootScope._grid_id);
		socket.emit('delete_grid_space_from_server', {'grid_id' : $rootScope._grid_id});
	});
}]);