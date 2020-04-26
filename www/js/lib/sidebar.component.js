app.component('sidebar', {
    controller: ['$scope', '$rootScope', ($scope, $rootScope) => {

        $scope.add_edit = "Add";
        $scope.paste_delete = "Delete";
        $scope.positionNotSelected = true;

        $scope.toggleActive = (event) => {
            $(event).toggleClass('active');
        };

        $scope.toggleSidebar = () => {
            $("#sidebar").toggleClass('active');
        };

        $scope.pingPosition = () => {
            $rootScope.$broadcast('ping', [$rootScope._cursor, $("#username").val()]);
        };

        $scope.$on('canvasClicked', () => {
            if($rootScope._selected_element != null) {
                $scope.add_edit = "Edit";
            } else {
                $scope.add_edit = "Add";
            }

            $scope.positionNotSelected = false;
        });
    }],
    templateUrl: '/js/lib/sidebar.html'
})