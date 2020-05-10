app.component('sidebar', {
    bindings: { 
        'add_edit': '<',
        'paste_delete': '<',
        'positionNotSelected': '<' 
    },
    controller: ['$scope', '$rootScope', 'utils', ($scope, $rootScope, utils) => {
        $scope.add_edit = "Add";
        $scope.paste_delete = "Delete";
        $scope.positionNotSelected = true;

        $scope.toggleSection = (element) => {
            utils.toggle(element);
        };

        $scope.pingPosition = () => {
            $rootScope.$broadcast('ping', [$rootScope._cursor, $("#username").val()]);
        };

        $scope.clearCursor = () => {
            $scope.positionNotSelected = true;                
            $rootScope.$broadcast('clearCursor', {});
        };

        $scope.$watch('positionNotSelected', (v) => {});

        $scope.$on('canvasClicked', () => {
            $scope.$apply(() => {
                if ($rootScope._selected_element != null) {
                    $scope.add_edit = "Edit";
                } else {
                    $scope.add_edit = "Add";
                }

                $scope.positionNotSelected = false;
            })
        });
    }],
    templateUrl: '/js/lib/sidebar.html'
})