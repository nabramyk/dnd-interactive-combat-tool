var assert = require('assert');
var Element = require('../models/Element.js');

describe('Element Test', function() {
    var element = new Element(0, 0, 0, "shapes[0]", "000000", "clutter.categories[0]", "test element", 0);
	it("should return true", function() { assert.equal(true, true)});
});