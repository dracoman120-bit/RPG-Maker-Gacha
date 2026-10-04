// Structural validator for the generated project. It checks what the MV editor would normally guarantee:
// references between data files, event command structure, map integrity, reachability, assets and plugin syntax.
// Usage: node tools/validate.js   (exit code 1 when problems are found)
'use strict';
var fs = require('fs');
var path = require('path');
var vm = require('vm');

var root = path.join(__dirname, '..');
function readJson(f) { return JSON.parse(fs.readFileSync(path.join(root, 'data', f), 'utf8')); }
var errors = [], warnings = [];
function err(where, msg) { errors.push(where + ': ' + msg); }
function warn(where, msg) { warnings.push(where + ': ' + msg); }

var ids = require('./src/ids');
var tilesetMod = require('./art/tileset');
var maplib = require('./src/maplib');

var D = {};
['Actors', 'Classes', 'Skills', 'Items', 'Weapons', 'Armors', 'Enemies', 'Troops', 'States', 'CommonEvents', 'Tilesets', 'MapInfos', 'System'].forEach(function(n) { D[n] = readJson(n + '.json'); });
function has(table, id) { return typeof id === 'number' && id >= 1 && id < D[table].length && D[table][id]; }

// ---- database references ---------------------------------------------------------------------------
D.Actors.forEach(function(a) {
    if (!a) { return; }
    var w = 'Actor ' + a.id + ' ' + a.name;
    if (!has('Classes', a.classId)) { err(w, 'bad class ' + a.classId); }
    if (a.equips.length !== 5) { err(w, 'equips must have 5 entries'); }
    if (a.equips[0] && !has('Weapons', a.equips[0])) { err(w, 'bad weapon'); }
    if (a.equips[0] && has('Classes', a.classId)) {
        var cls = D.Classes[a.classId], wt = D.Weapons[a.equips[0]].wtypeId;
        if (!cls.traits.some(function(t) { return t.code === 51 && t.dataId === wt; })) { err(w, 'starting weapon type ' + wt + ' not equippable by its class'); }
    }
});
D.Classes.forEach(function(c) {
    if (!c) { return; }
    var w = 'Class ' + c.id + ' ' + c.name;
    if (c.params.length !== 8) { err(w, 'params need 8 rows'); }
    c.params.forEach(function(r, i) { if (r.length !== 100) { err(w, 'param ' + i + ' needs 100 levels'); } });
    c.learnings.forEach(function(l) { if (!has('Skills', l.skillId)) { err(w, 'bad skill ' + l.skillId); } });
});
var STATE_OK = function(id) { return has('States', id); };
function checkEffects(w, effects) {
    effects.forEach(function(f) {
        if (f.code === 21 || f.code === 22) { if (!STATE_OK(f.dataId)) { err(w, 'effect state ' + f.dataId); } }
        if (f.code === 44 && !has('CommonEvents', f.dataId)) { err(w, 'effect common event ' + f.dataId); }
    });
}
D.Skills.forEach(function(s) {
    if (!s) { return; }
    var w = 'Skill ' + s.id + ' ' + s.name;
    checkEffects(w, s.effects);
    try { new Function('a', 'b', 'v', 'return ' + s.damage.formula); } catch (e) { err(w, 'bad formula ' + s.damage.formula); }
    if ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].indexOf(s.scope) < 0) { err(w, 'bad scope'); }
    if (s.stypeId === 2 && !s.tpCost) { warn(w, 'burst skill without TP cost'); }
    if (s.damage.type > 0 && s.damage.formula === '0') { err(w, 'damaging skill with zero formula'); }
});
D.Items.forEach(function(i) { if (i) { checkEffects('Item ' + i.name, i.effects); } });
D.Enemies.forEach(function(e) {
    if (!e) { return; }
    var w = 'Enemy ' + e.id + ' ' + e.name;
    if (!e.actions.length) { err(w, 'no actions'); }
    e.actions.forEach(function(a) { if (!has('Skills', a.skillId)) { err(w, 'bad skill ' + a.skillId); } });
    e.dropItems.forEach(function(d) { if (d.kind === 1 && !has('Items', d.dataId)) { err(w, 'bad drop'); } });
    // side-view battles (the default) load img/sv_enemies, front-view loads img/enemies
    ['enemies', 'sv_enemies'].forEach(function(dir) {
        if (!fs.existsSync(path.join(root, 'img', dir, e.battlerName + '.png'))) { err(w, 'missing battler image img/' + dir + '/' + e.battlerName + '.png'); }
    });
    if (e.params.length !== 8) { err(w, 'params'); }
    if (!/<Shards: \d+>/.test(e.note)) { warn(w, 'no shards note'); }
});
D.Troops.forEach(function(t) {
    if (!t) { return; }
    t.members.forEach(function(m) { if (!has('Enemies', m.enemyId)) { err('Troop ' + t.name, 'bad enemy'); } });
});

// ---- event command structure --------------------------------------------------------------------------
var CLOSERS = { 111: 412, 112: 413, 102: 404, 301: 604 };
function checkList(w, list, ctx) {
    var i, prev = null, depth = [], textOpen = false;
    if (!list.length || list[list.length - 1].code !== 0 || list[list.length - 1].indent !== 0) { err(w, 'list must end with an indent-0 terminator'); }
    list.forEach(function(c, idx) {
        var here = w + ' cmd#' + idx + ' (code ' + c.code + ')';
        if (c.indent === undefined || c.parameters === undefined) { err(here, 'missing indent/parameters'); return; }
        if (prev && c.indent > prev.indent + 1) { err(here, 'indent jumps from ' + prev.indent + ' to ' + c.indent); }
        if (c.code === 401 && !(prev && (prev.code === 101 || prev.code === 401))) { err(here, '401 without 101'); }
        if (c.code === 101 && prev && prev.code === 101) { err(here, 'empty text box'); }
        if (c.code === 401) {
            var vis = String(c.parameters[0]).replace(/\\[A-Za-z.]+(\[\d+\])?/g, '');
            var withFace = false, k = idx; while (k >= 0 && list[k].code !== 101) { k--; }
            if (k >= 0 && list[k].parameters[0]) { withFace = true; }
            if (vis.length > (withFace ? 40 : 52)) { warn(here, 'long text line (' + vis.length + ' chars): ' + vis.slice(0, 40) + '...'); }
        }
        [CLOSERS].forEach(function(cl) { if (cl[c.code]) { depth.push({ open: c.code, indent: c.indent }); } });
        if (c.code === 412 || c.code === 413 || c.code === 404 || c.code === 604) {
            var top = depth.pop();
            if (!top || CLOSERS[top.open] !== c.code || top.indent !== c.indent) { err(here, 'mismatched block close'); }
        }
        if (c.code === 111 || c.code === 112 || c.code === 102 || c.code === 301) { /* handled above */ }
        if (c.code === 117 && !has('CommonEvents', c.parameters[0])) { err(here, 'bad common event ' + c.parameters[0]); }
        if (c.code === 301 && c.parameters[0] === 0 && !has('Troops', c.parameters[1])) { err(here, 'bad troop'); }
        if (c.code === 302 || c.code === 605) {
            var p = c.parameters, tbl = ['Items', 'Weapons', 'Armors'][p[0]];
            if (!tbl || !has(tbl, p[1])) { err(here, 'bad shop item'); }
        }
        if (c.code === 126 && !has('Items', c.parameters[0])) { err(here, 'bad item'); }
        if (c.code === 127 && !has('Weapons', c.parameters[0])) { err(here, 'bad weapon'); }
        if (c.code === 128 && !has('Armors', c.parameters[0])) { err(here, 'bad armor'); }
        if (c.code === 129 && !has('Actors', c.parameters[0])) { err(here, 'bad actor'); }
        if (c.code === 121 || c.code === 122) { for (var s = c.parameters[0]; s <= c.parameters[1]; s++) { if (s < 1 || s > 40) { err(here, 'switch/variable id out of range ' + s); } } }
        if (c.code === 111 && c.parameters[0] === 0 && (c.parameters[1] < 1 || c.parameters[1] > 40)) { err(here, 'bad switch condition'); }
        if (c.code === 111 && c.parameters[0] === 1 && (c.parameters[1] < 1 || c.parameters[1] > 40)) { err(here, 'bad variable condition'); }
        if ((c.code === 355 || c.code === 111 && c.parameters[0] === 12) ) {
            var js = c.code === 355 ? c.parameters[0] : c.parameters[1], full = js;
            if (c.code === 355) { var j = idx + 1; while (list[j] && list[j].code === 655) { full += '\n' + list[j].parameters[0]; j++; } }
            try { new vm.Script(full); } catch (e) { err(here, 'script syntax: ' + e.message + ' in ' + full.slice(0, 60)); }
        }
        if (c.code === 122 && c.parameters[3] === 4) { try { new vm.Script(c.parameters[4]); } catch (e) { err(here, 'variable script syntax'); } }
        if (c.code === 201) { ctx.transfers.push({ where: here, map: c.parameters[1], x: c.parameters[2], y: c.parameters[3] }); }
        prev = c;
    });
    if (depth.length) { err(w, 'unclosed block(s)'); }
}

var ctx = { transfers: [] };
D.CommonEvents.forEach(function(c) { if (c) { checkList('CommonEvent ' + c.name, c.list, ctx); } });
D.Troops.forEach(function(t) { if (t) { t.pages.forEach(function(p, i) { checkList('Troop ' + t.name + ' page ' + i, p.list, ctx); }); } });

// ---- maps ----------------------------------------------------------------------------------------------
var ts = tilesetMod.build();
var tsFlags = D.Tilesets[1].flags;
if (tsFlags.length !== 8192) { err('Tilesets', 'flags must have 8192 entries'); }
if (tsFlags[0] !== 0x10) { err('Tilesets', 'flags[0] must be 0x10 so empty layers never decide passability'); }
['ArchiveA5', 'ArchiveB'].forEach(function(n) { if (!fs.existsSync(path.join(root, 'img', 'tilesets', n + '.png'))) { err('Tilesets', 'missing image ' + n); } });

var maps = {};
D.MapInfos.forEach(function(info) {
    if (!info) { return; }
    var f = 'Map' + ('00' + info.id).slice(-3) + '.json';
    if (!fs.existsSync(path.join(root, 'data', f))) { err('MapInfos', 'missing ' + f); return; }
    maps[info.id] = readJson(f);
});

function tileAt(m, x, y, z) { return m.data[(z * m.height + y) * m.width + x]; }
function mapGrid(m) {
    var g = [], x, y;
    for (y = 0; y < m.height; y++) {
        g.push([]);
        for (x = 0; x < m.width; x++) {
            var ok = true, decided = false, z;
            for (z = 3; z >= 0 && !decided; z--) {
                var t = tileAt(m, x, y, z), f = tsFlags[t];
                if (f & 0x10) { continue; }
                ok = (f & 0x0F) === 0; decided = true;
            }
            if (!decided) { ok = false; }
            g[y].push(ok);
        }
    }
    return g;
}

var arrivals = {};   // mapId -> [[x, y]]
function arrive(map, x, y) { (arrivals[map] = arrivals[map] || []).push([x, y]); }
arrive(D.System.startMapId, D.System.startX, D.System.startY);

Object.keys(maps).forEach(function(mid) {
    var m = maps[mid], w = 'Map ' + mid + ' ' + (D.MapInfos[mid] && D.MapInfos[mid].name);
    if (m.data.length !== m.width * m.height * 6) { err(w, 'data length ' + m.data.length + ' != ' + m.width * m.height * 6); }
    var i, bad = 0;
    for (i = 0; i < m.data.length; i++) {
        var t = m.data[i];
        var okTile = t === 0 || (t >= 1536 && t < 1536 + 128 && ts.a5.w > 0) || (t > 0 && t < 256);
        if (!okTile) { bad++; }
    }
    if (bad) { err(w, bad + ' tile ids outside the A5/B ranges'); }
    if (m.tilesetId !== 1) { err(w, 'tileset id'); }
    m.encounterList.forEach(function(e) { if (!has('Troops', e.troopId)) { err(w, 'bad encounter troop'); } });
    ['battleback1Name', 'battleback2Name'].forEach(function(k, ki) {
        if (m[k] && !fs.existsSync(path.join(root, 'img', 'battlebacks' + (ki + 1), m[k] + '.png'))) { err(w, 'missing ' + k + ' ' + m[k]); }
    });
    var seen = {};
    m.events.forEach(function(e) {
        if (!e) { return; }
        var ew = w + ' event ' + e.id + ' ' + e.name;
        if (e.x < 0 || e.y < 0 || e.x >= m.width || e.y >= m.height) { err(ew, 'outside map'); }
        var key = e.x + ',' + e.y;
        if (seen[key]) { warn(ew, 'shares a tile with event ' + seen[key]); }
        seen[key] = e.id;
        e.pages.forEach(function(p, pi) {
            checkList(ew + ' page ' + pi, p.list, ctx);
            if (p.image.characterName && !/^(Actor|People|Evil|Monster|Nature|Object|Animal|Vehicle|SF_|Damage)/.test(p.image.characterName)) { warn(ew, 'unusual character sheet ' + p.image.characterName); }
            if (p.conditions.switch1Valid && (p.conditions.switch1Id < 1 || p.conditions.switch1Id > 40)) { err(ew, 'page switch out of range'); }
            if (p.conditions.actorValid && !has('Actors', p.conditions.actorId)) { err(ew, 'page actor'); }
        });
    });
});
ctx.transfers.forEach(function(t) {
    if (!maps[t.map]) { err(t.where, 'transfer to unknown map ' + t.map); return; }
    var m = maps[t.map];
    if (t.x < 0 || t.y < 0 || t.x >= m.width || t.y >= m.height) { err(t.where, 'transfer outside map'); return; }
    arrive(t.map, t.x, t.y);
});

// reachability from every arrival point
Object.keys(maps).forEach(function(mid) {
    var m = maps[mid], w = 'Map ' + mid + ' ' + D.MapInfos[mid].name, g = mapGrid(m);
    var starts = arrivals[mid] || [];
    if (!starts.length) { warn(w, 'no arrival point (unreachable map?)'); return; }
    var blocked = {};
    m.events.forEach(function(e) {
        if (!e) { return; }
        var p = e.pages[0];
        if (p.through || p.priorityType !== 1) { return; }
        var img = p.image;
        if (!(img.tileId || img.characterName)) { return; }
        if (img.tileId && !(tsFlags[img.tileId] & 0x0F)) { return; }
        blocked[e.x + ',' + e.y] = true;
    });
    // events that wander (random movers) are not obstacles for the analysis
    m.events.forEach(function(e) { if (e && e.pages[0].moveType === 1) { delete blocked[e.x + ',' + e.y]; } });
    var reachAll = {};
    starts.forEach(function(s) {
        if (!g[s[1]] || !g[s[1]][s[0]]) { err(w, 'arrival point ' + s + ' is not walkable'); return; }
        var r = maplib.reach(g, s[0], s[1], blocked);
        Object.keys(r).forEach(function(k) { reachAll[k] = true; });
    });
    m.events.forEach(function(e) {
        if (!e) { return; }
        var near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(function(d) { return reachAll[(e.x + d[0]) + ',' + (e.y + d[1])]; });
        if (!near) { err(w + ' event ' + e.id + ' ' + e.name, 'cannot be reached from any arrival point'); }
    });
    // gating: with the lever doors closed, the lever must be reachable from the primary arrival point
    var lever = m.events.filter(function(e) { return e && e.name === 'Lever'; })[0];
    if (lever) {
        var first = starts[0];
        var r1 = maplib.reach(g, first[0], first[1], blocked);
        var leverNear = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(function(d) { return r1[(lever.x + d[0]) + ',' + (lever.y + d[1])]; });
        if (!leverNear) { err(w, 'the lever is not reachable before the door is opened'); }
        var doors = m.events.filter(function(e) { return e && e.name === 'Gate Door'; });
        doors.forEach(function(dr) {
            if (!blocked[dr.x + ',' + dr.y]) { err(w, 'a gate door at ' + dr.x + ',' + dr.y + ' does not block movement'); }
        });
        var down = m.events.filter(function(e) { return e && e.name === 'Stairs Down'; })[0];
        if (down) {
            var reachableDown = [[1, 0], [-1, 0], [0, 1], [0, -1], [0, 0]].some(function(d) { return r1[(down.x + d[0]) + ',' + (down.y + d[1])]; });
            if (reachableDown) { err(w, 'the stairs down can be reached without pulling the lever'); }
        }
    }

    // every walkable cell should be connected to an arrival (flags decorative pockets)
    var total = 0, reached = 0;
    g.forEach(function(row, y) { row.forEach(function(ok, x) { if (ok && !blocked[x + ',' + y]) { total++; if (reachAll[x + ',' + y]) { reached++; } } }); });
    if (reached < total) { warn(w, (total - reached) + ' walkable cells are unreachable (sealed pockets)'); }
});

// ---- plugins & banners -----------------------------------------------------------------------------------
var pluginsSrc = fs.readFileSync(path.join(root, 'js', 'plugins.js'), 'utf8');
var $plugins;
try { $plugins = new Function(pluginsSrc + '; return $plugins;')(); } catch (e) { err('plugins.js', e.message); $plugins = []; }
$plugins.forEach(function(p) {
    var f = path.join(root, 'js', 'plugins', p.name + '.js');
    if (!fs.existsSync(f)) { err('plugins.js', 'missing plugin file ' + p.name); return; }
    try { new vm.Script(fs.readFileSync(f, 'utf8'), { filename: f }); } catch (e) { err('plugin ' + p.name, 'syntax error: ' + e.message); }
});
var banners = (function() {
    var ctxv = { Gacha: { Banners: [] } };
    vm.runInNewContext(fs.readFileSync(path.join(root, 'js', 'plugins', 'GachaBanners.js'), 'utf8'), ctxv);
    return ctxv.Gacha.Banners;
})();
var TBL = { item: 'Items', weapon: 'Weapons', armor: 'Armors', actor: 'Actors' };
banners.forEach(function(b) {
    var rars = ['N', 'R', 'SR', 'SSR', 'UR'];
    rars.forEach(function(r) {
        ((b.pool || {})[r] || []).forEach(function(e) {
            if (e.type !== 'gold' && !has(TBL[e.type], e.id)) { err('Banner ' + b.id, 'bad ' + e.type + ' ' + e.id + ' in ' + r); }
        });
    });
    if (b.switchId && (b.switchId < 1 || b.switchId > 40)) { err('Banner ' + b.id, 'bad switch'); }
});

// ---- report -------------------------------------------------------------------------------------------------
warnings.forEach(function(w) { console.log('warn  ' + w); });
errors.forEach(function(e) { console.log('ERROR ' + e); });
console.log('\n' + errors.length + ' error(s), ' + warnings.length + ' warning(s).');
process.exit(errors.length ? 1 : 0);
