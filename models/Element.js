/**
 * @class Objects which are representable in the grid space
 * 
 * @constructor
 * @property {int} id - unique numerical identifier of this element
 * @property {int} x - horizontal grid coordinate of the element
 * @property {int} y - vertical grid coordinate of the element
 * @property {string} type - the geometric shape this element represents
 * @property {string} color - the hexadecimal value of the element color
 * @property {int} size - the amount of grid spaces this elements spans across
 * @property {string} category - the meta group this element belongs to
 * @property {string} name - the unique name of this element
 * @property {int} rotation - the angle which this element is facing (values 1 - 4)
 */

"use strict";

module.exports = class Element {

    constructor(id, x, y, shape, color, size, category, name, rotation) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.shape = shape;
        this.color = color;
        this.size = size;
        this.category = category;
        this.name = name;
        this.rotation = rotation;
    }

	/**
	 * Move the element 1 unit in a specific direction
	 * 
	 * @param {String}
	 *            direction - the direction to move this element
	 * @return {Element|undefine} This element at its new position, or undefined
	 *         if it cannot move
	 */
    nudge(direction, gridSpace) {
		var moveToX = this.x, moveToY = this.y, moveToSize = this.size, moveToId = this.id;
		switch (direction) {
			case "right": // right
				moveToX++;
				break;
			case "up": // up
				moveToY--;
				break;
			case "left": // left
				moveToX--;
				break;
			case "down": // down
				moveToY++;
				break;
		}

		if (gridSpace.find(function (el) { return el.collide(moveToX, moveToY, moveToSize, moveToId); }) === undefined) {
			this.x = moveToX;
			this.y = moveToY;
			return this;
		} else {
			return undefined;
		}
	};

	/**
	 * Move the element to a new grid location
	 */
	warp(x, y, gridSpace) {
		var moveToSize = this.size;
        var moveToId = this.id;

        if (gridSpace.elements.find(function (el) { return el.collide(x, y, moveToSize, moveToId); })) {
			this.x = x;
			this.y = y;

			return this;
		} else {
			return undefined;
		}
	};

	/**
	 * Modify this elements properties
	 * 
	 */
	mutate(modifiedElement) {

		this.shape = modifiedElement.shape;
		this.name = modifiedElement.name;
		this.category = modifiedElement.category;
		this.color = modifiedElement.color;
		this.size = modifiedElement.size;
		return this;
	}

	/**
	 * Return this elements properties and stripped of its methods
	 * 
	 * @return {JSON} The properties of this element
	 */
	condense() {
		return {};
	}

	/**
	 * Determine if this element is colliding with another
	 * 
	 * @param {int}
	 *            x - horizontal coordinate of comparing element
	 * @param {int}
	 *            y - vertical coordinate of comparing element
	 * @param {int}
	 *            size - numerical span of comparing element
	 * @param {int}
	 *            id - unique identifier of comparing element
	 * @return {boolean} True if both elements collide, false otherwise
	 */
	collide(x, y, size, el_id) {
        console.log(x, y, size, el_id);
		return el_id != this.id &&
			x < this.x + this.size.width &&
			x + size.width > this.x &&
			y < this.y + this.size.height &&
			y + size.height > this.y;
	}

	/**
	 * Determine if a sinlge point is contained within this element
	 * 
	 * @param {int}
	 *            x - horizontal grid position
	 * @param {int}
	 *            y - vertical grid position
	 * @return {boolean} True if this point is is within this element, false
	 *         otherwise
	 */
	within(x, y) {
		return this.x <= x && this.x + this.size.width > x &&
			this.y <= y && this.y + this.size.height > y;
	}

	toString() {
		return "[id: " + this.id + ", x: " + this.x + ", y:" + this.y + ", shape: " + this.shape + ", color: " + this.color + ", size: " + this.size + ", category: " + this.category + ", name: " + this.name + "]";
	}
}