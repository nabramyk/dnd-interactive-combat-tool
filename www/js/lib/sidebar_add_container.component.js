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

        $scope.shapes = ["rectangle", "circle", "line", "freehand", "room"];

        $scope.shape = 'rectangle';
        $scope.width = 1;
        $scope.height = 1;
        $scope.category = 'environment';
        $scope.name = '';
        $scope.fillColour = '#000000';

        $scope.addMode = true;

        function drawTemporaryElement() {
            $rootScope.$broadcast('drawTemporaryElement', {
                'shape': $scope.shape,
                'width': $scope.width,
                'height': $scope.height,
                'category': $scope.category,
                'name': $scope.name,
                'fillColor': $scope.fillColour
            });
        };

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
            if ($rootScope._selected_element == null) {
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

        $scope.changeOfShape = () => {
            $rootScope.$broadcast('changeOfShape', {'value' : $scope.shape });
        };

        $scope.rotateElement = (angle) => {
            console.log(angle);
            //$rootScope.$broadcast();
        }

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
    },
    templateUrl: '/js/lib/add_container.html'
})