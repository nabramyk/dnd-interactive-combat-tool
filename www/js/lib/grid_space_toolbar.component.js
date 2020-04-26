app.component('gridSpaceBar', {
    template: '<ul id="tab_row" class="nav nav-tabs">' +
                '<li id="addition_tab" ng-click="createGridSpace();">+</li>' +
                '</ul>',
    controller: ($scope, $rootScope, $compile) => {
        $scope.$on('generateGridTab', (_, args) => { generateGridTab(args) });

        this.generateGridTab = (args) => {
            var tab = $compile('<li class="tab" href="javascript:;" id="' + args.id + '" ng-click=\"changeGridSpace(' + args.id + ');\"><a class="grid-name">' + args.name + '</li>')($scope);
            $(tab).insertBefore('#addition_tab');
        }

        $scope.changeGridSpace = (args) => {
            $rootScope.$broadcast('changeGridSpaceSnd', args);
        }

        $scope.createGridSpace = () => {
            $rootScope.$broadcast('createGridSpace', {});
        }

        $scope.$on('requestGridSpaceRcv', (_, msg) => {
            $rootScope._grid_id = msg.grid_space.id;
            $(".tab").removeClass("active");
			$(".tab[id=" + msg.grid_space.id + "]").addClass("active");
        });
    }
})