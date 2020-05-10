app.component('systemContainer', {
    templateUrl: '/js/lib/system_container.html',
    controller: ['$scope', '$rootScope', 'utils', ($scope, $rootScope, utils) => {
        $scope.toggleActive = (event) => {
            utils.toggle('system_container');
        };

        $scope.export = () => {
            $rootScope.$broadcast('exportClutter', {});
        };
    }]
})