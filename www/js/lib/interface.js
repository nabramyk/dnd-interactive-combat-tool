/**
 * @fileoverview Should handle all of the jquery interface stuff
 * @returns
 */
function bindEventHandlers() {

    $('#reset_board_button').click(function() {
        if (confirm("This will delete EVERYTHING on the board.\nAre you sure you want to do this?")) {
            socket.emit('reset_board', {
                "grid_id": grid_id
            });
            $("#reset_board_button").prop("disabled", true);
            refresh_elements_list();
        }
    });

    $("#element_erase").click(function() {
        line_path.remove();
        line_path = new paper.Path();
        try {
            temp_line.remove();
            temp_line = null;
        } catch (e) {
            console.log(e);
        }
        paper.view.update();
    });

    $("#tqa_ping").click(function() {
        pingPosition();
    });

    $("#tqa_copy").click(function() {
        copied_element = selected_element;
    });

    $("#tqa_paste_delete").click(function() {
        if ($("#paste_delete").text() == "Paste") {
            var newEl = copied_element.clone();
            newEl.position = new paper.Point(pixel2GridPoint(selected_grid_x), pixel2GridPoint(selected_grid_y));

            newEl.onMouseEnter = function() {
                if (isDragging) return;
                t = new paper.PointText(this.position.x, this.bounds.top - 10);
                t.content = this.data.name;
                t.pivot = paper.Shape.Rectangle.topLeft;
                b = paper.Shape.Rectangle(t.bounds);
                b.size.width += 10;
                b.size.height += 10;
                b.fillColor = 'white';
                b.strokeColor = "black";
                group_overlay.addChildren([b, t]);
                paper.view.update();
            }

            newEl.onMouseLeave = function() {
                t.remove();
                b.remove();
                paper.view.update();
            }

            paper.view.update();

            socket.emit('add_element_to_server', {
                "grid_id": grid_id,
                "element": newEl
            }, function(msg) {
                newEl.data.id = msg.id;
            });
        }
    });
}

function rotateElement(angle) {
    if (selected_element.size.width == selected_element.size.height) return;
    if (stored_edited_element_bounds == null) stored_edited_element_bounds = selected_element.bounds;

    selected_element.rotate(angle, stored_edited_element_bounds.topLeft);
    cursor.rotate(angle, stored_edited_element_bounds.topLeft);
    paper.view.update();

    socket.emit('edit_element_on_server', {
        "grid_id": grid_id,
        "id": selected_element.data.id,
        "el": selected_element
    });
}