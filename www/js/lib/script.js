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

app.factory('readFile', function ($window, $q) {
    var readFile = function (file) {
        var deferred = $q.defer(),  
            reader = new $window.FileReader();

        reader.onload = function (ev) {
            var content = ev.target.result;
            deferred.resolve(content);
        };

        reader.readAsText(file);
        return deferred.promise;
    };

    return readFile;
})
.directive('fileBrowser', function (readFile, $http, $location) {
    return {
        template: '<input type="file" style="display: none;" />' +
            '<ng-transclude></ng-transclude>',
        transclude: true,
        link: function (scope, element) {
            var fileInput = element.children('input[file]');
            
            fileInput.on('change', function (event) {
                var file = event.target.files[0];
                readFile(file).then(function (content) {
					$http.post("http://" + $location.host() + ":" + $location.port() + "/upload", content, () => {
                        
                    });
                });
            });
            
            element.on('click', function () {
                fileInput[0].click();
            });
        }
    };
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
					case "Delete": $rootScope.$broadcast('deleteElement', {}); break;
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
