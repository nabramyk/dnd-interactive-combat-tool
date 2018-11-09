var assert = require('assert');
var ClutterInstance = require('../models/ClutterInstance.js');

describe('Clutter Instance Test', () => {
    context('Initialization', () => {
        var clutter = new ClutterInstance();
        it("New clutter instance has grid id counter of 2", () => { assert.equal(2, clutter.grid_id_counter)});
        it("New clutter instance has a grid space array with one grid space", () => { assert.deepStrictEqual(1, clutter.grid_space.length)})
    })

    context('init', () => {
        var clutter = new ClutterInstance();
        it("size = 1,1", () => { assert.deepStrictEqual({ "width" : 1, "height" : 1}, clutter.init().size)});
        it("elements.length = 0", () => { assert.equal(0, clutter.init().elements.length)});
        it("annotations.length = 0", () => { assert.equal(0, clutter.init().annotations.length)});
        it("spaces.length = 1", () => { assert.equal(1, clutter.init().spaces.length)});
    })

    context('createGridSpace', () => {
        var clutter = new ClutterInstance();
        var output = clutter.createGridSpace();
        it("clutter.grid_space.length = 2", () => { assert.equal(2, clutter.grid_space.length)});
        it("output.id = 2", () => { assert.equal(2, output.id)});
        it("clutter.grid_space[1].name = output.name", () => { assert.equal(output.name, clutter.grid_space[1].name)});
    })
})