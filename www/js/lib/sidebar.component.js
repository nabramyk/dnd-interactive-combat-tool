app.component('sidebar', {
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

        $rootScope.$watch('_selected_element', (val1, val2) => {
            console.log(val1, val2); 
        });
    }],
    templateUrl: '/js/lib/sidebar.html'
})