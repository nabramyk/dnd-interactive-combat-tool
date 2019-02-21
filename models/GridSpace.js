"use strict";
const Element = require("./Element.js")
const HistoryFrame = require("./HistoryFrame.js")
const Annotation = require("./Annotation.js")

const shapes = ["square", "rectangle", "circle", "oval", "line"];
const categories = ["npc", "environment", "enemy", "player"];

/**
 * @class
 * 
 * @constructor
 * @property {int} elementIdCounter
 * @property {int} id - unique numerical identifier for this grid space
 * @property {int} history -
 * @property {[Element]} - collection of displayable elements in this grid space
 * @property {int} width - amount of horizontal grid points in this space
 * @property {int} height - amount of vertical grid points in this space
 * @property {{ width: int, height: int }} size -
 */
module.exports = class GridSpace {

    constructor(size, id) {
        this.elementIdCounter = 1;
        this.annotationsIdCounter = 1;
        this.id = id;
        this.history = [];
        this.temporaryHistory = [];
        this.elements = [];
        this.annotations = [];
		this.size = size;
        this.name = Math.random().toString(36).replace(/[^a-z]+/g, '').substr(0, 7);
    }

	/**
	 * Set the grid space width
	 * 
	 * @param {int}
	 *            newWidth - the new width of the grid space
	 * @return {int} The new width of the grid space
	 */
	resizeWidth(newWidth) {
		this.width = newWidth;
		return this.width;
	};

	/**
	 * Set the grid space height
	 * 
	 * @param {int}
	 *            newHeight - the new height of the grid space
	 * @return {int} The new height of the grid space
	 */
	resizeHeight(newHeight) {
		this.height = newHeight;
		return this.height;
	};

	resize(size) {
		this.size = size;
		return this.size;
	}

	/**
	 * Find the element with the corresponding ID
	 * 
	 * @param {int}
	 *            id - the unique numerical identifier to search for
	 * @return {(Element|undefined)} The element with the matching id, or
	 *         undefined if no element with that id exists
	 */
	findElementById(id) {
		return this.elements.find(function (el) { return el.id == id; })
	};

	/**
	 * Find the element at the specified position
	 * 
	 * @param {int}
	 *            x - x grid point
	 * @param {int}
	 *            y - y grid point
	 * @return {(Element|undefined)} The element at this position, or undefined
	 *         if no element is there
	 */
	findElementByPosition(x, y) {
		return this.elements.find(function (el) { return el.within(x, y); });
	};

	/***/
	hasElementAtPosition(x, y) {
		return this.elements.find(function (el) { return el.within(x, y); }) !== undefined;
	}

	/**
	 * Generate a grid space of random elements
	 * 
	 * @return [Element] An array of drawables elements
	 */
	generateRandomBoardElements() {
		for (var w = 0; w < this.width; w++) {
			for (var h = 0; h < this.height; h++) {
				if (Math.random() < 0.1) {

					var type = shapes[Math.floor(Math.random() * shapes.length)];

					var y = [];
					var x = [];

					// todo uncomment in order to insert randomized lines
					if (type == "line") {
						while (Math.random() < 0.5) {
							x.push(Math.ceil(Math.random() * this.width));
							y.push(Math.ceil(Math.random() * this.height));
						}

						while (x.length < 2) {
							x.push(Math.ceil(Math.random() * this.width));
							y.push(Math.ceil(Math.random() * this.height));
						}
					} else {
						x = w + 1;
						y = h + 1;
					}

					var input = new Element(
						this.elementIdCounter++,
						x, // x
						y, // y
						type, // shape
						Math.floor(Math.random() * 16777215).toString(16), // color
						Math.round(Math.random() * 3) + 1, // size
						categories[Math.floor(Math.random() * categories.length)],
						("rando" + h * w)
					);

					if (this.elements.find(function (el) {
						return el.collide(input.x, input.y, input.size, input.id);
					}) === undefined) {
						this.elements.push(input);
					}
				}
			}
		}

		this.history.push(new HistoryFrame("randomize", this.elements));

		return this;
	};

	/**
	 * Add an element to the grid space
	 * 
	 * @param {Element}
	 *            obj - the element to add to the grid space
	 * @return {Element} the newly added element
	 */
	addElementToGridSpace(obj) {
		// if (this.hasElementAtPosition(obj.x, obj.y))
		// 	return undefined;

		console.log(obj);

		obj.data.id = this.elementIdCounter++;
		var newElement = new Element(obj);

		this.elements.push(newElement);
		this.history.push(new HistoryFrame("add", newElement));
		this.temporaryHistory = [];

		return newElement;
	};

	mutateElementInGridSpace(obj) {
		if (this.elements.find(function(el) { return el.collide(obj.x, obj.y, obj.size, obj.id); }) === undefined) {
			return this.elements.find(function(el) { return el.id === obj.id }).mutate(obj);
		} else {
			return undefined;
		}
	}

    /**
     * Add a new annotation to the grid space
     * 
     * @param {Annotation} obj - the new annotation to be added
     * 
     * @returns {Annotation} The newly added annotation 
     */
	addAnnotationToGridSpace(obj) {
		var newAnnotation = {
			"id": this.annotationsIdCounter++,
			"title": obj.title,
			"content": obj.content,
			"x": obj.x,
			"y": obj.y
		};

		this.annotations.push(newAnnotation);

		return newAnnotation;
	}

    /**
     * Delete an annotation from the grid space
     * 
     * @param {int} id - the unique numerical if of an annotation
     * 
     * @returns {int} The id of the removed annotation
     */
	removeAnnotationFromGridSpace(id) {
		var ind = this.annotations.findIndex(function (el) { return el.id === id });
		var return_annotation = this.annotations[ind];
		this.annotations.splice(ind, 1);
		return return_annotation.id;
	}

	/**
	 * Delete an element from the grid space
	 * 
	 * @param {int} id - the unique numerical id of an element
	 *
	 * @returns {Element} The removed element
	 */
	removeElementFromGridSpace(id) {
		var ind = this.elements.findIndex(function (el) { return el.id === id; });
		var return_element = this.elements[ind];
		this.elements.splice(ind, 1);

		this.history.push(new HistoryFrame("remove", return_element));
		this.temporaryHistory = [];

		return return_element;
	};

	/**
	 * Deletes all elements from the grid space
	 * 
	 * @return the newly emptied list
	 */
	removeAllElementsFromGridSpace() {
		var returnGridSpace = this.elements.slice();
		this.elements = [];
		return returnGridSpace;
	}

	/**
	 * Moves an element 1 grid unit
	 * 
	 * @param {int}
	 *            x - horizontal grid position
	 * @param {int}
	 *            y - vertical grid position
	 * @param {String}
	 *            direction - the direction to move the element
	 * @return {Element|undefined} The element at its new position, or undefined
	 */
	nudgeElement(x, y, direction) {
		try {
			return this.findElementByPosition(x, y).nudge(direction, this.elements);
		} catch (e) {
			return undefined;
		}
	}

	warpElementfunction (x, y, dest_x, dest_y) {
		try {
			return this.findElementByPosition(x, y).warp(dest_x, dest_y, this);
		} catch (e) {
			return undefined;
		}
	}

	gatherElementsWithinRegion(region) {

	}

	/**
	 * 
	 */
	historyUndo() {
		return temporaryHistory[temporaryHistory.push(history.pop())];
	}

	/**
	 * 
	 */
	historyRedo() {
		return history[history.push(temporaryHistory.pop())];
	}
}