app.component('addContainer', {
    bindings: {
        shape: '=',
        width: '=',
        height: '=',
        category: '=',
        name: '=',
        fillColour: '=',
        strokeColour: '=',
        strokeThickness: '=',
        diameter: '='
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.shapes = ["rectangle", "circle", "line", "freehand", "room"];
        $scope.categories = ["environment", "player", "enemy", "npc"];

        $scope.shape = 'rectangle';
        $scope.category = 'environment';
        $scope.name = '';

        $scope.width = 1;
        $scope.height = 1;
        $scope.diameter = 1;
        $scope.fillColour = '#000000';

        $scope.strokeColour = '#000000';
        $scope.strokeThickness = 1;

        $scope.addMode = true;

        $rootScope._drawing_option = $scope.shapes[0];

        function drawTemporaryElement() {
            $rootScope.$broadcast('drawTemporaryElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fill.colour
            });
        };

        $scope.toggleActive = () => {
            utils.toggle('add_container');
        };

        $scope.placeElementAction = () => {
            $rootScope.$broadcast('add_element_to_server', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour,
                'strokeColor': $scope.strokeColour,
                'strokeThickness': $scope.strokeThickness,
                'diameter': $scope.diameter
            });
        };

        $scope.updateElementAction = () => {
            $rootScope.$broadcast('updateLocalElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour,
                'strokeColor': $scope.strokeColour,
                'strokeThickness': $scope.strokeThickness,
                'diameter': $scope.diameter
            });
        };

        $scope.$on('canvasClicked', () => {
            if ($rootScope._selected_element == null) {
                $scope.addMode = true;
                return;
            }
            //not sure why I have to do this here and nowhere else
            $scope.$apply(() => {
                $scope.shape = $rootScope._selected_element.shape;
                $scope.category = $rootScope._selected_element.data.category;
                $scope.name = $rootScope._selected_element.data.name;

                try {
                    $scope.width = $rootScope._selected_element.size.width / $rootScope._grid_size;
                    $scope.height = $rootScope._selected_element.size.height / $rootScope._grid_size;
                    $scope.fillColour = $rootScope._selected_element.fillColor.toCSS(true);
                } catch (e) {}

                try {
                    $scope.strokeColour = $rootScope._selected_element.strokeColor.toCSS(true);
                    $scope.strokeThickness = $rootScope._selected_element.strokeWidth.toCSS(true);
                } catch (e) {}

                try {
                    $scope.diameter = $rootScope._selected_element.radius / $rootScope._grid_size * 2;
                } catch (e) {
                    console.log(e);
                }

                $scope.addMode = false;
            });
        });

        $scope.changeOfShape = () => {
            $rootScope._drawing_option = $scope.shape;
            $rootScope.$broadcast('changeOfShape', { 'value': $scope.shape });
        };

        $scope.rotateElement = (angle) => {
            console.log(angle);
            //$rootScope.$broadcast();
        }

        $scope.drawingLines = () => {
            return $rootScope._drawing_option == 'line' || $rootScope._drawing_option == 'freehand';
        }
    },
    templateUrl: 'components/add_container/add_container.html'
})