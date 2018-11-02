var assert = require('assert');
var Element = require('../models/Element.js');
var GridSpace = require('../models/GridSpace.js');
var Annotation = require('../models/Annotation.js');

describe('Grid Space Test', () => {
    context('Initialization', () => {
        var gridSpace = new GridSpace(0, 0, 1);
        it("New grid space has a width of 0", () => { assert.equal(gridSpace.width, 0)});
        it("New grid space has a height of 0", () => { assert.equal(gridSpace.height, 0)});
        it("New grid space has an id of 1", () => { assert.equal(gridSpace.id, 1)});
        it("New grid space has an elementIdCounter of 1", () => { assert.equal(gridSpace.elementIdCounter, 1)});
        it("New grid space has an annotationsIdCounter of 1", () => { assert.equal(gridSpace.annotationsIdCounter, 1)});
        it("New grid space has an empty history array", () => { assert.equal(gridSpace.history.length, 0)});
        it("New grid space has an empty temporary history array", () => { assert.equal(gridSpace.temporaryHistory.length, 0)});
        it("New grid space has an empty elements array", () => { assert.equal(gridSpace.elements.length, 0)});
        it("New grid space has an empty annotations array", () => { assert.equal(gridSpace.annotations.length, 0)});
        it("New grid space has a randomly generated name", () => { assert.notEqual(gridSpace.name, "")});
    });

    context('Resize Width', function() {
        var gridSpace = new GridSpace(0, 0, 1);
        it("Grid space should have a width of 1", () => { assert(gridSpace.resizeWidth(1), 1)});
    });

    context('Resize Height', function() {
        var gridSpace = new GridSpace(0, 0, 1);
        it("Grid space should have a width of 1", () => { assert(gridSpace.resizeHeight(1), 1)});
    });

    context('Add Element to Grid Space', () => {
        context('1 Element', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            var element = gridSpace.addElementToGridSpace(new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            it("Grid space elements array should be incremented", () => { assert.equal(gridSpace.elements.length, 1)});
            it("New element should be added to the grid space", () => { assert.equal(element.id, gridSpace.elements[0].id)});   
        });

        context('2 Elements, different position', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            var element = gridSpace.addElementToGridSpace(new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            var element2 = gridSpace.addElementToGridSpace(new Element(1, 1, 1, "circle", "FFFFFF", { "width" : 1, "height" : 1}, "player", "mutated element", 0));
            it("Grid space elements array should be 2", () => { assert.equal(2, gridSpace.elements.length)});
            it("New element 1 should be added to the grid space", () => { assert.equal(element.id, gridSpace.elements[0].id)}); 
            it("New element 2 should be added to the grid space", () => { assert.equal(element2.id, gridSpace.elements[1].id)}); 
        });

        context('2 Elements, same position', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            var element = gridSpace.addElementToGridSpace(new Element(0, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            var element2 = gridSpace.addElementToGridSpace(new Element(1, 0, 0, "circle", "FFFFFF", { "width" : 1, "height" : 1}, "player", "mutated element", 0));
            it("Grid space elements array should be 1", () => { assert.equal(1, gridSpace.elements.length)});
            it("New element 1 should be added to the grid space", () => { assert.equal(element.id, gridSpace.elements[0].id)}); 
            it("New element 2 should not be added to the grid space", () => { assert.equal(element2, undefined)}); 
        });
    });

    context('Find Element by Id', () => {
        context('No Elements', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            it("No elements to find", () => { assert.equal(undefined, gridSpace.findElementById(1))});
        })

        context('1 Element', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            gridSpace.addElementToGridSpace(new Element(1, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            it("Find element with id 1", () => { assert.equal(1, gridSpace.findElementById(1).id)});
        });

        context('2 Elements', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            gridSpace.addElementToGridSpace(new Element(1, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            gridSpace.addElementToGridSpace(new Element(2, 1, 1, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            it("Find element with id 1", () => { assert.deepStrictEqual(gridSpace.elements[0], gridSpace.findElementById(1))});
            it("Find element with id 2", () => { assert.equal(2, gridSpace.findElementById(2).id)});
        });
    });

    context('Mutate Element in Grid Space', () => {
        context('1 element, no rotation, no collision', () => {
            var gridSpace = new GridSpace(0, 0, 1);
            gridSpace.addElementToGridSpace(new Element(1, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
            var element = gridSpace.mutateElementInGridSpace(new Element(1, 0, 0, "circle", "FFFFFF", { "width" : 2, "height" : 2}, "player", "mutated element", 0));
            it("Element in grid space has a shape circle", () => { assert.equal("circle", element.shape)});
            it("Element in grid space has the color FFFFFF", () => { assert.equal("FFFFFF", element.color)});
            it("Element in grid space is in category player", () => { assert.equal("player", element.category)});
            it("Element in grid space has the name mutated element", () => { assert.equal("mutated element", element.name)});
            it("Element in grid space has width 2", () => { assert.equal(2, element.size.width)});
            it("Element in grid space has height 2", () => { assert.equal(2, element.size.height)});
        });

        context('2 elements, rotation, no collision', () => {
            var gridSpace = new GridSpace(0, 0, 1);
        });
    });

    context('Remove Element from Grid Space', () => {
        var gridSpace = new GridSpace(0, 0, 1);
        gridSpace.addElementToGridSpace(new Element(1, 0, 0, "square", "000000", { "width" : 1, "height" : 1}, "npc", "test element", 0));
        it("Element in grid space should be removed", () => { assert.equal(1, gridSpace.removeElementFromGridSpace(1).id)});
        it("Grid space should have a size of 0", () => { assert.equal(0, gridSpace.elements.length)});
    });

    context('Add Annotation to Grid Space', () => {
        var gridSpace = new GridSpace(0, 0, 1);
        var temp = gridSpace.addAnnotationToGridSpace(new Annotation(1, "title", "content", 0, 0, { "region" : 1 }));
        it("Grid space should have 1 annotation", () => {
            assert.deepStrictEqual(temp, gridSpace.annotations[0]);
        });
    });

    context('Remove Annotation from Grid Space', () => {
        var gridSpace = new GridSpace(0, 0, 1);
        var temp = gridSpace.addAnnotationToGridSpace(new Annotation(1, "title", "content", 0, 0, { "region" : 1 }));
        var removedElement = gridSpace.removeAnnotationFromGridSpace(temp.id);
        it("Grid space should have an empty annotations array", () => { assert.deepStrictEqual([], gridSpace.annotations)});
        it("Grid space should have removed the corresponding annotation", () => { assert.deepStrictEqual(temp.id, removedElement)});
    });
});