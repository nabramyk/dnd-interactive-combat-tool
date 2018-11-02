var assert = require('assert');
var Annotation = require('../models/Annotation.js');

describe('Annotation Test', () => {

    context('Initialization', () => {
        var annotation = new Annotation(1, "title", "content", 0, 0, {"width" : 1, "height" : 1});
        it("New annotation is created with id:1, title:title, content:content, x:0, y:0, region.width:1, region.height:1", () => { 
            assert.deepStrictEqual(annotation, new Annotation(1, "title", "content", 0, 0, {"width" : 1, "height" : 1}))
        });
    });
});