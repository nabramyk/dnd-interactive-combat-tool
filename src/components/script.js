app.factory('socket', function(socketFactory) {
    return socketFactory({
        prefix: '',
        ioSocket: io.connect()
    });
});

app.factory('readFile', function($window, $q) {
        var readFile = function(file) {
            var deferred = $q.defer(),
                reader = new $window.FileReader();

            reader.onload = function(ev) {
                var content = ev.target.result;
                deferred.resolve(content);
            };

            reader.readAsText(file);
            return deferred.promise;
        };

        return readFile;
    })
    .directive('fileBrowser', function(readFile, $http, $location) {
        return {
            template: '<input type="file" style="display: none;" />' +
                '<ng-transclude></ng-transclude>',
            transclude: true,
            link: function(scope, element) {
                var fileInput = element.children('input[file]');

                fileInput.on('change', function(event) {
                    var file = event.target.files[0];
                    readFile(file).then(function(content) {
                        try {
                            $http.post("https://" + $location.host() + ":" + $location.port() + "/upload", content, () => {});
                        } catch (e) {
                            console.log(e);
                        }
                    });
                });

                element.on('click', function() {
                    fileInput[0].click();
                });
            }
        };
    });

app.directive('keypressEvents', ['$rootScope', '$document', function($rootScope, $document) {
    return {
        restrict: 'A',
        link: function() {
            $document.bind('keydown', function(e) {
                switch (e.key) {
                    case "ArrowUp":
                        $rootScope.$broadcast('incrementalMoveElement', 2);
                        break;
                    case "ArrowRight":
                        $rootScope.$broadcast('incrementalMoveElement', 0);
                        break;
                    case "ArrowDown":
                        $rootScope.$broadcast('incrementalMoveElement', 6);
                        break;
                    case "ArrowLeft":
                        $rootScope.$broadcast('incrementalMoveElement', 4);
                        break;
                    case "Delete":
                        $rootScope.$broadcast('deleteElement', {});
                        break;
                }
            });
        }
    }
}]);