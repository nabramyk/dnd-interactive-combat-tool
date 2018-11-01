"use strict";

module.exports = class Annotation {
    constructor(id, title, content, x, y, region) {
        this.id = id;
        this.title = title;
        this.content = content;
        this.x = x;
        this.y = y;
        this.region = region;
    };
}