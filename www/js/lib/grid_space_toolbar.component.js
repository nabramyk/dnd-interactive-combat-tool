app.component('gridSpaceBar', {
    template: '<ul id="tab_row" class="nav nav-tabs">' +
                '<li id="addition_tab" ng-click="createGridSpace()">+</li>' +
                '</ul>',
    controller: ($scope, $rootScope) => {
        $scope.$on('generateGridTab', (_, args) => { generateGridTab(args) });

        this.generateGridTab = function(args) {
            $("<li class=\"tab\" href=\"javascript:;\" id=\"" + args.id + "\"><a class=\"grid-name\">" + args.name + "</li>").insertBefore("#addition_tab");
        }

        $scope.createGridSpace = function () {
            $rootScope.$broadcast('createGridSpace', {});
        }
    }
})