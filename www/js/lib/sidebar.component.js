app.component('sidebar', {
    templateUrl: '/js/lib/sidebar.html',
    controller: ['$scope', '$rootScope', ($scope, $rootScope) => {
        $scope.toggleActive = (event) => {
            $(event).toggleClass('active');
        };

        $scope.toggleSidebar = () => {
            $("#sidebar").toggleClass('active');
        };

        $scope.pingPosition = () => {
            $rootScope.$broadcast('ping', [$rootScope._cursor, $("#username").val()]);
        };
    }]
})