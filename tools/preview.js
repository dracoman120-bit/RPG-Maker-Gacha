// Renders every map to a PNG (events overlaid as coloured markers) and prints a reachability report.
// Usage: node tools/preview.js [outDir]
'use strict';
var fs = require('fs');
var path = require('path');
var tileset = require('./art/tileset');
var db = require('./src/db');
var common = require('./src/story_common');
var maps = require('./src/maps');
var maplib = require('./src/maplib');

var out = process.argv[2] || path.join(__dirname, '..', 'docs', 'maps');
fs.mkdirSync(out, { recursive: true });
var ts = tileset.build();
var d = db.build({ commonEvents: common.specs() });
var list = maps.buildMaps(d.ID);

list.forEach(function(m) {
    var file = path.join(out, 'Map' + ('00' + m.id).slice(-3) + '.png');
    fs.writeFileSync(file, m.render(ts, ts.ids).png());
    console.log('wrote ' + path.relative(process.cwd(), file) + '  (' + m.name + ')');
});
