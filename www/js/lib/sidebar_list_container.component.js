app.component('listContainer', {
    templateUrl: '/js/lib/list_container.html',
    controller: ($scope, $rootScope) => {
        $scope.toggleActive = () => {
            $("#list_container").toggleClass('active');
        }

        $(".element_filter").click(function () {
            refresh_elements_list();
        });
    
        $("#list_header_elements").click(function () {
            $("#list_header_elements").css("background", "#345eb2");
            $("#list_header_elements").css("color", "white");
            $("#list_header_annotations").css("background", " #dddddd");
            $("#list_header_annotations").css("color", "black");
    
            $("#annotations_list_container").hide();
            $("#element_list_container").show();
        });
    
        $("#list_header_annotations").click(function () {
            $("#list_header_annotations").css("background", "#345eb2");
            $("#list_header_annotations").css("color", "white");
            $("#list_header_elements").css("background", " #dddddd");
            $("#list_header_elements").css("color", "black");
    
            $("#element_list_container").hide();
            $("#annotations_list_container").show();
        });
    
        $("#annotations_display").change(function () {
            $(".grid_canvas_annotation").toggle();
        });

        function showAnnotations() {
            local_stored_annotations.forEach(function (el) {
                $("#grid_canvas_scrolling_container").append("<span class=\"grid_canvas_annotation\" style=\"position: absolute; top: " + (gridPoint2Pixel(el.y) + $("#temporary_drawing_canvas").offset().top) + "px; left: " + (gridPoint2Pixel(el.x) + $("#temporary_drawing_canvas").offset().left) + "px; z-index: 2;\">&#x2139;</span>");
            });
            if (!$("#annotations_display").attr("checked")) $(".grid_canvas_annotations").hide();
        }
        
        function hideAnnotations() {
            $("#grid_canvas_scrolling_container .grid_canvas_annotation").remove();
        }
        
        function editElementRow(id) {
            console.log("TODO: Find selected element");
        
            $("#overlapping_container").hide();
            $("#add_container").show();
        
            $("#selected_shape").val(selected_element.shape);
            $("#element_color").spectrum("set", selected_element.color);
            $("#element_width").val(selected_element.size.width);
            $("#element_height").val(selected_element.size.height);
            $("#element_category").val(selected_element.category);
            $("#element_name").val(selected_element.name);
        
            $("#vertices_list").empty();
            if (selected_element.shape === "line") {
                selected_element.x.forEach(function (_, ind) {
                    $("#vertices_list").append("<p>" + selected_element.x[ind] + "," + selected_element.y[ind] + "</p>");
                });
            }
        
            $("#place_element_button").text("Submit");
        }

        /**
         * Move the cursor to the element that was selected from the list of elements
         *
         * @param {int} id - the unique ID of the selected element
         */
        function clicked_element_list(id) {
            try {
                selected_element.selected = false;
            } catch (e) {
                console.log(e);
            }

            selected_element = group_elements.children.find(function (el) { return el.data.id === id });
            console.log(selected_element);
            selected_element.selected = true;
            paper.view.update();
        }

        function clicked_annotation_list(id) {
            var temp = local_stored_annotations.find(function (el) {
                return el.id == id;
            });
            draw_cursor_at_position(temp.x, temp.y, 1);
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