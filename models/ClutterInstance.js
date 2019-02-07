"use strict";

var isUndefined = require("../utils.js").isUndefined;

/**
 * 
 */
module.exports = class ClutterInstance {

    constructor() {
        this.grid_id_counter = 1;
        this.grid_space = [];
        this.createGridSpace();
    }

    init() {
        return {
			"size": this.grid_space[0].size,
			"elements": this.grid_space[0].elements,
			"annotations": this.grid_space[0].annotations,
			"spaces": this.grid_space.map((el) => { return { "id": el.id, "name": el.name } })
		};
    }

    resize(msg) {
        // var temp = this.grid_space.find((el) => { return msg.grid_id == el.id });
        // temp.resize(msg.size);
        // return {
        //     "grid_id": msg.grid_id,
        //     "size": msg.size,
        //     "elements": temp.elements
        // };
    }

    resizeHeight(msg) {
        this.grid_space.find((el) => { return el.id == msg.grid_id}).size.height = msg.height;
		// var temp = this.grid_space.find((el) => { return msg.grid_id == el.id });
        // temp.resizeHeight(msg.height);
        // return {
		// 	"grid_id": msg.grid_id,
		// 	"height": msg.height,
		// 	"elements": temp.elements
		// };
    }

    resizeWidth(msg) {
        this.grid_space.find((el) => { return el.id == msg.grid_id}).size.width = msg.width;
        // temp.resizeWidth(msg.width);
        // return {
		// 	"grid_id": msg.grid_id,
		// 	"width": msg.width,
		// 	"elements": temp.elements
		// };
    }

    moveElement(msg) {
		// var movedElement = this.grid_space.find((el) => { return msg.grid_id == el.id }).nudgeElement(msg.x, msg.y, msg.direction);
        // if (typeof movedElement === 'undefined') 
        //     return undefined;
        // else 
        //     return movedElement;
    }

    warpElement(msg) {
        // var movedElement = this.grid_space.find((el) => { return msg.grid_id == el.id }).warpElement(msg.x, msg.y, msg.dest_x, msg.dest_y);
        // if (typeof movedElement === 'undefined') 
        //     return undefined;
        // else 
        //     return movedElement;
    }

    addElement(msg) {
        this.grid_space.find((el) => { return el.id == msg[1].data.space}).elements.push(msg);
        console.log(this.grid_space[0].elements);
		// return this.grid_space
		// 	.find((el) => { return el.id == msg.grid_id })
		// 	.addElementToGridSpace(input);
    }

    deleteElement(msg) {
        // this.grid_space.find((el) => { return el.id == msg.grid_id }).removeElementFromGridSpace(msg.element_id);
    }

    editElement(msg) {
        // msg.size = { "width" : JSON.parse(msg.size.width), "height" : JSON.parse(msg.size.height) };
		// msg.x = JSON.parse(msg.x);
        // msg.y = JSON.parse(msg.y);
        // return this.grid_space.find((el) => { return el.id == msg.grid_id }).mutateElementInGridSpace(msg);
    }

    randomize(msg) {
        // return this.grid_space.find((el) => { return el.id == msg.grid_id }).generateRandomBoardElements();
    }

    reset(msg) {
        // this.grid_space.find((el) => { return el.id == msg.grid_id }).removeAllElementsFromGridSpace();
        // return { "grid_id": msg.grid_id };
    }

    createGridSpace() {
        this.grid_space.push(
            { "size" : { "width" : 1, "height": 1 },
             "id" : this.grid_id_counter++,
             "name" : Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7), 
             "elements" : [], 
             "annotations" : [] }
        );
    }

    findGridSpace(msg) {
        // return this.grid_space.find((el) => { return el.id == msg.id; });
    }

    deleteGridSpace(msg) {
        // this.grid_space.splice(this.grid_space.indexOf(this.grid_space.find((el) => { return msg.grid_id == el.id; })), 1);
        // return { "grid_id": msg.grid_id };
    }

    renameGrid(msg) {
        // this.grid_space.find((el) => { return el.id == msg.grid_id }).name = msg.grid_name;
        // return msg;
    }

    addAnnotation(msg) {
        // return { "grid_id": msg.grid_id, "annotation": this.grid_space.find((el) => { return el.id == msg.grid_id }).addAnnotationToGridSpace(msg) };
    }

    deleteAnnotation(msg) {
        // return { "grid_id": msg.grid_id, "annotation_id": this.grid_space.find((el) => { return el.id == msg.grid_id }).removeAnnotationFromGridSpace(msg.annotation_id) };
    }

    undo(msg) {
		// var space = this.grid_space.find((el) => { return el.id == msg.grid_id });
		// var frame = space.historyUndo();
		// switch (frame.action) {
		// 	case "create":
		// 		io.emit('removed_element', { "grid_id": msg.grid_id, "element_id": space.removeElementFromGridSpace(frame.frame.id).id });
		// 		break;
		// 	case "edit": break;
		// 	case "delete": break;
		// }
    }

    redo(msg) {
		// var frame = this.grid_space.find((el) => { return el.id == msg.grid_id }).historyRedo();
		// switch (frame.action) {
		// 	case "create": break;
		// 	case "edit": break;
		// 	case "delete": break;
		// }
    }
}