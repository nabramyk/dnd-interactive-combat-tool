var assert = require('assert');
var Element = require('../models/Element.js');

describe('Element Test', function() {
    
    describe('Initialization', function() {
        var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
        it("New element has id of 0", function() { assert.equal(element.id, 0)});
        it("New element has x of 0", function() { assert.equal(element.x, 0)});
        it("New element has y of 0", function() { assert.equal(element.y, 0)});
        it("New element is a square", function() { assert.equal(element.shape, "square")});
        it("New element has a color of 000000", function() { assert.equal(element.color, "000000")});
        it("New element has a width of 1", function() { assert.equal(element.size.width, 1)});
        it("New element has a height of 1", function() { assert.equal(element.size.height, 1)});
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

    describe('Collision', function() {
        var element = new Element(0, 0, { "width" : 1, "height" : 1}, "square", "000000", 1, "npc", "test element", 0);
        it("Element not colliding", function() { assert.equal(element.collide(1, 1, { "width" : 1, "height" : 1}, 1), false)});
        it("Element is colliding", function() { assert.equal(element.collide(0, 0, { "width" : 1, "height" : 1}, 1), false)});
    });

    describe('Nudging', function() {
        it("Element should be nudged to the right", function() { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("right", []);
            assert.equal(element.x, 1);
        });
        it("Element should be nudged to the left", function() { 
            var element = new Element(0, 1, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("left", []);
            assert.equal(element.x, 0);
        });
        it("Element should be nudged up", function() { 
            var element = new Element(0, 0, 1, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("up", []);
            assert.equal(element.y, 0);
        });
        it("Element should be nudged down", function() { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("down", []);
            assert.equal(element.y, 1);
        });
        it("Element should bump into an element to the right", function() { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            var element2 = new Element(1, 1, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("right", [element2]);
            assert.equal(element, undefined)
        });
    });
});