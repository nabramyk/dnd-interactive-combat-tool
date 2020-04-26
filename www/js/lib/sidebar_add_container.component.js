app.component('addContainer', {
    bindings: {
        shape: '=',
        width: '=',
        height: '=',
        category: '=',
        name: '=',
        fillColour: '='
    },
    controller: ($scope, $rootScope) => {

        $scope.shape = 'rectangle';
        $scope.width = 1;
        $scope.height = 1;
        $scope.category = 'environment';
        $scope.name = '';
        $scope.fillColour = '#000000';

        $scope.addMode = true;

        $scope.toggleActive = () => {
            $("#add_container").toggleClass('active');
        };

        $scope.placeElementAction = () => {
            $rootScope.$broadcast('add_element_to_server', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour
            });
        };

        $scope.updateElementAction = () => {
            $rootScope.$broadcast('updateLocalElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour
            });
        };

        $scope.$on('selectedElement', () => {
            if($rootScope._selected_element == null) {
                $scope.addMode = true;
                return;
            }
            //not sure why I have to do this here and nowhere else
            $scope.$apply(() => {
                $scope.shape = $rootScope._selected_element.shape;
                $scope.width = $rootScope._selected_element.size.width / $rootScope._grid_size;
                $scope.height = $rootScope._selected_element.size.height / $rootScope._grid_size;
                $scope.category = $rootScope._selected_element.data.category;
                $scope.name = $rootScope._selected_element.data.name;
                $scope.fillColour = $rootScope._selected_element.fillColor.toCSS(true);
                
                $scope.addMode = false;
            });
        });
    },
    templateUrl: '/js/lib/add_container.html'
})