"use strict";

/**
 * @class Objects which are representable in the grid space
 */
module.exports = class Element {

	constructor(el) {
		this.el = el;
	}

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
	 * @return {Element}
	 */
	mutate(modifiedElement) {
		console.log(modifiedElement);

		this.el = modifiedElement.el[1];

		return this.el;
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