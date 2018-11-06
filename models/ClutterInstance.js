"use strict";

const GridSpace = require("./GridSpace.js");
const Element = require("./Element.js");

/**
 * 
 */
module.exports = class ClutterInstance {
    constructor() {
        this.grid_id_counter = 1;
        this.grid_space = [new GridSpace(1, 1, this.grid_id_counter++)];
    }

    init() {
        return {
			"grid_width": grid_space[0].width,
			"grid_height": grid_space[0].height,
			"elements": grid_space[0].elements,
			"annotations": grid_space[0].annotations,
			"spaces": grid_space.map((el) => { return { "id": el.id, "name": el.name } })
		};
    }

    resizeHeight(msg) {
		var temp = grid_space.find((el) => { return msg.grid_id == el.id });
        temp.resizeHeight(msg.height);
        return {
			"grid_id": msg.grid_id,
			"height": msg.height,
			"elements": temp.elements
		};
    }

    resizeWidth(msg) {
        var temp = grid_space.find((el) => { return msg.grid_id == el.id });
        temp.resizeWidth(msg.width);
        return {
			"grid_id": msg.grid_id,
			"width": msg.width,
			"elements": temp.elements
		};
    }

    moveElement(msg) {
		var movedElement = grid_space.find((el) => { return msg.grid_id == el.id }).nudgeElement(msg.x, msg.y, msg.direction);
        if (typeof movedElement === 'undefined') 
            return undefined;
        else 
            return movedElement;
    }

    warpElement(msg) {
        var movedElement = grid_space.find((el) => { return msg.grid_id == el.id }).warpElement(msg.x, msg.y, msg.dest_x, msg.dest_y);
        if (typeof movedElement === 'undefined') 
            return undefined;
        else 
            return movedElement;
    }

    addElement(msg) {
        if(msg.category == "ping") {
            return new Element(0, JSON.parse(msg.x), JSON.parse(msg.y), "", "", "", "ping", "");
        }

        var input = new Element(0,
			JSON.parse(msg.x),
			JSON.parse(msg.y),
			msg.shape,
			msg.color,
			{ "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) },
			msg.category,
			isUndefined(msg.name) ? "object" : msg.name,
			msg.rotation);

		return grid_space
			.find((el) => { return el.id == msg.grid_id })
			.addElementToGridSpace(input);
    }

    deleteElement(msg) {
        grid_space.find((el) => { return el.id == msg.grid_id }).removeElementFromGridSpace(msg.element_id);
    }

    editElement(msg) {
        msg.size = { "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) };
		msg.x = JSON.parse(msg.x);
        msg.y = JSON.parse(msg.y);
        return grid_space.find((el) => { return el.id == msg.grid_id }).mutateElementInGridSpace(msg);
    }

    randomize(msg) {
        return grid_space.find((el) => { return el.id == msg.grid_id }).generateRandomBoardElements();
    }

    reset(msg) {
        grid_space.find((el) => { return el.id == msg.grid_id }).removeAllElementsFromGridSpace();
        return { "grid_id": msg.grid_id };
    }

    createGridSpace() {
        var newGridSpace = grid_space.push(new GridSpace(1, 1));
        return { "id": grid_space[newGridSpace - 1].id, "name": grid_space[newGridSpace - 1].name };
    }

    findGridSpace(msg) {
        return grid_space.find((el) => { return el.id == msg.id; });
    }

    deleteGridSpace(msg) {
        grid_space.splice(grid_space.indexOf(grid_space.find((el) => { return msg.grid_id == el.id; })), 1);
        return { "grid_id": msg.grid_id };
    }

    renameGrid(msg) {
        grid_space.find((el) => { return el.id == msg.grid_id }).name = msg.grid_name;
        return msg;
    }

    addAnnotation(msg) {
        return { "grid_id": msg.grid_id, "annotation": grid_space.find((el) => { return el.id == msg.grid_id }).addAnnotationToGridSpace(msg) };
    }

    deleteAnnotation(msg) {
        return { "grid_id": msg.grid_id, "annotation_id": grid_space.find((el) => { return el.id == msg.grid_id }).removeAnnotationFromGridSpace(msg.annotation_id) };
    }

    undo(msg) {
		var space = grid_space.find((el) => { return el.id == msg.grid_id });
		var frame = space.historyUndo();
		switch (frame.action) {
			case "create":
				io.emit('removed_element', { "grid_id": msg.grid_id, "element_id": space.removeElementFromGridSpace(frame.frame.id).id });
				break;
			case "edit": break;
			case "delete": break;
		}
    }

    redo(msg) {
		var frame = grid_space.find((el) => { return el.id == msg.grid_id }).historyRedo();
		switch (frame.action) {
			case "create": break;
			case "edit": break;
			case "delete": break;
		}
    }
}