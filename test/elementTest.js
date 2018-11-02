var assert = require('assert');
var Element = require('../models/Element.js');

describe('Element Test', () => {
    
    context('Initialization', () => {
        var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
        it("New element is created with id:0, x:0, y:0", () => { 
            assert.deepStrictEqual(element, new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0))
        });
    });

    context('Mutation', () => {
        var element = new Element(0, 0, 0, "square", "000000", 0, "npc", "test element", 0);
        element = element.mutate(new Element(0, 0, 0, "circle", "FFFFFF", 1, "player", "mutated element", 0));
        it("Element should now have shape set to 'circle'", () => { assert.equal(element.shape, "circle")});
        it("Element should now have name set to 'mutated element'", () => { assert.equal(element.name, "mutated element")});
        it("Element should now have category set to player", () => { assert.equal(element.category, "player")});
        it("Element should now have color set to 'FFFFFF", () => { assert.equal(element.color, "FFFFFF")});
        it("Element should now have size set to 1", () => { assert.equal(element.size, 1)});
    });

    context('Collision', () => {
        var element = new Element(0, 0, { "width" : 1, "height" : 1}, "square", "000000", 1, "npc", "test element", 0);
        it("Element not colliding", () => { assert.equal(element.collide(1, 1, { "width" : 1, "height" : 1}, 1), false)});
        it("Element is colliding", () => { assert.equal(element.collide(0, 0, { "width" : 1, "height" : 1}, 1), false)});
    });

    context('Nudging', () => {
        it("Element should be nudged to the right", () => { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("right", []);
            assert.equal(element.x, 1);
        });
        it("Element should be nudged to the left", () => { 
            var element = new Element(0, 1, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("left", []);
            assert.equal(element.x, 0);
        });
        it("Element should be nudged up", () => { 
            var element = new Element(0, 0, 1, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("up", []);
            assert.equal(element.y, 0);
        });
        it("Element should be nudged down", () => { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("down", []);
            assert.equal(element.y, 1);
        });
        it("Element should bump into an element to the right", () => { 
            var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            var element2 = new Element(1, 1, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
            element = element.nudge("right", [element2]);
            assert.equal(element, undefined)
        });
    });

    context('Within', () => {
        var element = new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0);
        it("Point is within the element space", function() { assert.equal(element.within(0, 0), true)});
        it("Point to the right is not within the element space", function() { assert.equal(element.within(1, 0), false)});
        it("Point below is not within the element space", function() { assert.equal(element.within(0, 1), false)});
    });
});