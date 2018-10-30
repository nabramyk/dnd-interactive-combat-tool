var assert = require('assert');
var Element = require('../models/Element.js');

describe('Element Test', function() {
    
    describe('Initialization', function() {
        var element = new Element(0, 0, 0, "square", "000000", 0, "npc", "test element", 0);
        it("New element has id of 0", function() { assert.equal(element.id, 0)});
        it("New element has x of 0", function() { assert.equal(element.x, 0)});
        it("New element has y of 0", function() { assert.equal(element.y, 0)});
        it("New element is a square", function() { assert.equal(element.shape, "square")});
        it("New element has a color of 000000", function() { assert.equal(element.color, "000000")});
        it("New element has a size of 0", function() { assert.equal(element.size, 0)});
        it("New element is in category npc", function() { assert.equal(element.category, "npc")});
        it("New element has name 'test element'", function() { assert.equal(element.name, "test element")});
        it("New element has a rotation of 0", function() { assert.equal(element.rotation, 0)});
    });

    describe('Mutation', function() {
        var element = new Element(0, 0, 0, "square", "000000", 0, "npc", "test element", 0);
        element = element.mutate(new Element(0, 0, 0, "circle", "FFFFFF", 1, "player", "mutated element", 0));
        it("Element should now have shape set to 'circle'", function() { assert.equal(element.shape, "circle")});
        it("Element should now have name set to 'mutated element'", function() { assert.equal(element.name, "mutated element")});
        it("Element should now have category set to player", function() { assert.equal(element.category, "player")});
        it("Element should now have color set to 'FFFFFF", function() { assert.equal(element.color, "FFFFFF")});
        it("Element should now have size set to 1", function() { assert.equal(element.size, 1)});
    });
});