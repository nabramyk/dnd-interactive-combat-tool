app.component('listContainer', {
    templateUrl: '/js/lib/list_container.html',
    controller: ($scope, $rootScope) => {
        $scope.toggleActive = () => {
            $("#list_container").toggleClass('active');
        }

        function composeElementListRowElement(el) {
            return "<div class=\"element_list_row\" onclick=\"clicked_element_list(" + el.data.id + ")\" id=" + el.data.id + ">" +
                "<div style=\"width: 25%; display: inline-block;\">" +
                "<p style=\"font-size: smaller; color: #000000;\">" + el.data.name + "<\p>" +
                "</div>" +
                "<div style=\"width: 35%; display: inline-block;\">" +
                "<p style=\"font-size: smaller; color: #000000;\">" + el.data.category + "<\p>" +
                "</div>" +
                "<button id=\"element_row_edit\" onClick=\"editElementRow(" + el.data.id + ")\">&#x270E;</button>" +
                "<button id=\"element_row_delete\" onclick=\"delete_element_from_server(" + el.data.id + ")\">&times</button>" +
                "</div>";
        }

        function composeAnnotationListRowElement(el) {
            return "<div class=\"element_list_row\" onclick=\"clicked_annotation_list(" + el.id + ")\">" +
                "<p>" + el.content + "<\p>" +
                "<button id=\"element_row_edit\" onClick=\"editAnnotationRow(" + el.id + ")\">&#x270E;</button>" +
                "<button id=\"element_row_delete\" onclick=\"delete_annotation_from_server(" + el.id + ")\">&times</button>" +
                "</div>";
        }
    }
});