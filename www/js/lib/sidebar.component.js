app.component('sidebar', {
    templateUrl: '/js/lib/sidebar.html',
    controller: ['$scope', '$rootScope', 'globals', ($scope, $rootScope, globals) => {
        $scope.toggleActive = (event) => {
            $(event).toggleClass('active');
        };

        $scope.toggleSidebar = () => {
            $("#sidebar").toggleClass('active');
        };

        $scope.pingPosition = () => {
            $rootScope.$broadcast('ping', [globals.getCursor(), $("#username").val()]);
        };
    }]
})