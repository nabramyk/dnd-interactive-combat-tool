app.component('listContainer', {
    bindings: {
        'elements': '<'
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.elements = [];

        $scope.toggleActive = () => {
            utils.toggle('list_container');
        };

        $scope.$on('addedElement', function(_, msg) {
            $scope.elements.push(msg.element.el);
        });

        $scope.$on('initializeCanvas', function(_, msg) {
            msg.elements.map(function(el) {
                $scope.elements.push(el);
            });
        });
    },
    templateUrl: '/js/lib/list_container.html'
});