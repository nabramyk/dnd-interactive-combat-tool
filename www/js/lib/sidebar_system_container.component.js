app.component('systemContainer', {
    templateUrl: '/js/lib/system_container.html',
    controller: ['$scope', '$rootScope', ($scope, $rootScope) => {
        $scope.toggleActive = (event) => {
            $(event).toggleClass('active');
        };

        $scope.export = () => {
            $rootScope.$broadcast('exportClutter', {});
        }
    }]
})