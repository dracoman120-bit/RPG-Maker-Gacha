// Builds the whole game into the repository: data/*.json, img/*, js/plugins/ArchiveData.js,
// GachaBanners.js and js/plugins.js. Usage: node tools/build.js
'use strict';
var fs = require('fs');
var path = require('path');
var tileset = require('./art/tileset');
var enemyArt = require('./art/enemies');
var sceneArt = require('./art/scenes');
var db = require('./src/db');
var common = require('./src/story_common');
var mapsMod = require('./src/maps');
var systemMod = require('./src/system');
var gen = require('./src/gen_plugins');
var ids = require('./src/ids');

var root = path.join(__dirname, '..');
function out(rel) { var p = path.join(root, rel); fs.mkdirSync(path.dirname(p), { recursive: true }); return p; }
function writeJson(rel, obj) { fs.writeFileSync(out(rel), JSON.stringify(obj)); }
function writeText(rel, text) { fs.writeFileSync(out(rel), text); }
function writePng(rel, canvas) { fs.writeFileSync(out(rel), canvas.png()); }

// ---- art ---------------------------------------------------------------------------------------------
var ts = tileset.build();
writePng('img/tilesets/ArchiveA5.png', ts.a5);
writePng('img/tilesets/ArchiveB.png', ts.b);
// MV loads enemy battlers from img/sv_enemies in side-view mode and img/enemies in front-view mode: provide both
Object.keys(enemyArt).forEach(function(n) {
    var c = enemyArt[n]();
    writePng('img/enemies/' + n + '.png', c);
    writePng('img/sv_enemies/' + n + '.png', c);
});
writePng('img/battlebacks1/StacksFloor.png', sceneArt.StacksFloor());
writePng('img/battlebacks2/StacksWall.png', sceneArt.StacksWall());
writePng('img/battlebacks1/InkFloor.png', sceneArt.InkFloor());
writePng('img/battlebacks2/InkWall.png', sceneArt.InkWall());
writePng('img/titles1/EchoesTitle.png', sceneArt.Title());

// ---- database ----------------------------------------------------------------------------------------
var d = db.build({ commonEvents: common.specs() });
writeJson('data/Actors.json', d.Actors);
writeJson('data/Classes.json', d.Classes);
writeJson('data/Skills.json', d.Skills);
writeJson('data/Items.json', d.Items);
writeJson('data/Weapons.json', d.Weapons);
writeJson('data/Armors.json', d.Armors);
writeJson('data/Enemies.json', d.Enemies);
writeJson('data/Troops.json', d.Troops);
writeJson('data/States.json', d.States);
writeJson('data/CommonEvents.json', d.CommonEvents);

// ---- tileset, maps -----------------------------------------------------------------------------------
writeJson('data/Tilesets.json', [null, {
    id: 1, flags: ts.flags, mode: 1, name: 'Archive', note: '',
    tilesetNames: ['', '', '', '', 'ArchiveA5', 'ArchiveB', '', '', '']
}]);
var maps = mapsMod.buildMaps(d.ID);
var infos = [null];
maps.forEach(function(m) {
    writeJson('data/Map' + ('00' + m.id).slice(-3) + '.json', m.toJSON(ts.ids, 1));
    infos[m.id] = { id: m.id, expanded: false, name: m.name, order: m.id, parentId: 0, scrollX: 0, scrollY: 0 };
});
writeJson('data/MapInfos.json', infos);

// ---- system & plugins ---------------------------------------------------------------------------------
writeJson('data/System.json', systemMod.build(d.ID));
writeText('js/plugins/ArchiveData.js', gen.archiveData(d.ID));
writeText('js/plugins/GachaBanners.js', gen.gachaBanners(d.ID));
writeText('js/plugins.js', gen.pluginsJs());

require('./gen_docs');
console.log('Built ' + maps.length + ' maps, ' + (d.Actors.length - 1) + ' actors, ' + (d.Skills.length - 1) + ' skills, ' +
    (d.Enemies.length - 1) + ' enemies, ' + (d.CommonEvents.length - 1) + ' common events.');
