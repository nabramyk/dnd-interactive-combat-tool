app.component('listContainer', {
    bindings: {
        'elements': '<'
    },
    controller: ($scope, $rootScope, utils) => {

        $scope.elements = [];
        $scope.filteredElements = [];

        $scope.toggleActive = () => {
            utils.toggle('list_container');
        };

        $scope.highlightElement = (element) => {
            $rootScope.$broadcast('highlightElement', element);
        };

        $scope.unhighlightElement = (element) => {
            $rootScope.$broadcast('unhighlightElement', element);
        };

        $scope.clickListItem = (element) => {
            $rootScope.$broadcast('selectElementFromList', element);
        };

        $scope.editListItem = (element) => {
            console.log(element);
        };

        $scope.$on('addedElement', function(_, msg) {
            $scope.elements.push(msg.element.el.data);
        });

        $scope.$on('initializeCanvas', function(_, msg) {
            msg.elements.map(function(el) {
                $scope.elements.push(el.data);
            });
        });
    },
    templateUrl: '/js/lib/list_container.html'
});