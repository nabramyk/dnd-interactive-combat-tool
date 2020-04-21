'use strict';

/**
 * @author Nathan Abramyk
 * @version 1.0.0
 */
window.addEventListener('load', eventWindowLoaded, false);

function eventWindowLoaded() {
	canvasApp();
}

function canvasApp() {
	$("loading_div").show();
}

var app = angular.module('clutterApp', ['btford.socket-io']);
app.factory('socket', function (socketFactory) {
	return socketFactory({
		prefix: '',
		ioSocket: io.connect()
	});
});

app.directive('keypressEvents', ['$rootScope', '$document', function ( $rootScope, $document) {
    return {
        restrict: 'A',
        link: function () {
            $document.bind('keydown', function (e) {
                switch (e.key) {
					case "ArrowUp": $rootScope.$broadcast('incrementalMoveElement', "up"); break;
					case "ArrowRight": $rootScope.$broadcast('incrementalMoveElement', "right"); break;
					case "ArrowDown": $rootScope.$broadcast('incrementalMoveElement', "down"); break;
					case "ArrowLeft": $rootScope.$broadcast('incrementalMoveElement', "left"); break;
				}
            });
        }
    }
}]);

function interfaceInitialization() {
	underlay_canvas = document.getElementById('canvas');

	$("#movement_controls").hide();
	$("#reset_board_button").prop("disabled", true);
	$("#start_new_line_button").hide();
	$("#lost_connection_div").hide();
}
