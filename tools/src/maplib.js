// Map construction: a paint API (rooms, corridors, objects, events), MV map JSON output,
// a PNG previewer and a walkability analysis used by the validator.
'use strict';
var art = require('../art/canvas');
var Canvas = art.Canvas;
var T = 48;

var FLOOR = { '.': 'floorStone', ',': 'floorDark', 'w': 'floorWood', '=': 'carpetRed', '-': 'carpetBlue', 'g': 'grass', 'p': 'path', '~': 'water',
              'L': 'floorLight', 'R': 'runeFloor', 'c': 'crackFloor', 'm': 'mossStone', 'i': 'inkPool', 'x': 'erased', '#': 'wallBrick',
              'D': 'wallDark', 'B': 'shelfA', 'b': 'shelfB', ' ': 'void', 'T': 'wallTop' };
var WALLS = '#DBb T~x';       // characters that are solid terrain
var OBJ = { 'o': 'pillar', 'f': 'torch', 't': 'tree', 'u': 'bush', 'a': 'barrel', 'r': 'crate', 'k': 'bookPile', 'n': 'inkBlot', 'y': 'banner', 'q': 'candelabra',
            'z': 'statue', 'l': 'lamp', 'e': 'plant', 'h': 'hall', 'v': 'bones', 'M': 'mushroom', 'K': 'hollowCrack', 'j': 'rug', 'Z': 'table', 'C': 'chair',
            'N': 'bed', 's': 'sign', 'A': 'altar', 'd': 'desk', 'S': 'lectern', 'P': 'press', 'G': 'gate', 'X': 'crystal', 'F': 'inkwell', 'O': 'rift',
            'E': 'pedestal', 'W': 'scroll' };

function MapCanvas(id, name, w, h, fill) {
    this.id = id; this.name = name; this.w = w; this.h = h;
    this.floor = []; this.obj = []; this.events = [];
    var x, y;
    for (y = 0; y < h; y++) {
        this.floor.push([]); this.obj.push([]);
        for (x = 0; x < w; x++) { this.floor[y].push(fill || '#'); this.obj[y].push(null); }
    }
    this.meta = {};
}

MapCanvas.prototype.inside = function(x, y) { return x >= 0 && y >= 0 && x < this.w && y < this.h; };
MapCanvas.prototype.fill = function(x, y, w, h, ch) {
    var i, j;
    for (j = y; j < y + h; j++) { for (i = x; i < x + w; i++) { if (this.inside(i, j)) { this.floor[j][i] = ch; } } }
    return this;
};
MapCanvas.prototype.line = function(x1, y1, x2, y2, ch) {
    var x, y;
    for (x = Math.min(x1, x2); x <= Math.max(x1, x2); x++) { for (y = Math.min(y1, y2); y <= Math.max(y1, y2); y++) { if (this.inside(x, y)) { this.floor[y][x] = ch; } } }
    return this;
};
MapCanvas.prototype.put = function(x, y, ch) {
    if (!OBJ[ch]) { throw new Error('unknown object char ' + ch); }
    if (!this.inside(x, y)) { throw new Error('object outside map ' + x + ',' + y + ' on ' + this.name); }
    this.obj[y][x] = ch;
    return this;
};
MapCanvas.prototype.putAll = function(list) { list.forEach(function(p) { this.put(p[0], p[1], p[2]); }, this); return this; };
MapCanvas.prototype.isSolidTerrain = function(x, y) { return WALLS.indexOf(this.floor[y][x]) >= 0; };

// Convert solid terrain into a believable look: wall tiles that face a walkable tile below become
// a front face (shelves / bricks), everything else becomes dark wall-top.
MapCanvas.prototype.autoWalls = function(front) {
    var x, y, n = 0;
    for (y = 0; y < this.h; y++) {
        for (x = 0; x < this.w; x++) {
            if (this.floor[y][x] !== '#') { continue; }
            var below = y + 1 < this.h ? this.floor[y + 1][x] : '#';
            if (WALLS.indexOf(below) < 0) { this.floor[y][x] = front[(x * 7 + y * 3 + n++) % front.length]; } else { this.floor[y][x] = 'T'; }
        }
    }
    return this;
};

// ---- events ------------------------------------------------------------------------------------
// page options: cond {sw, self, v:[id, value], actor, item}, img {char:[sheet, idx, dir]} | {tile:'name'},
// trigger 0 action / 1 player touch / 2 event touch / 3 autorun / 4 parallel, priority 0/1/2, through, move {type, speed, freq}
MapCanvas.prototype.event = function(x, y, name, pages, note) {
    if (!this.inside(x, y)) { throw new Error('event outside map: ' + name + ' at ' + x + ',' + y + ' on ' + this.name); }
    var ev = { id: this.events.length + 1, name: name, x: x, y: y, pages: Array.isArray(pages) ? pages : [pages], note: note || '' };
    this.events.push(ev);
    return ev;
};

function pageJSON(p, tileIds) {
    var c = p.cond || {};
    var conditions = {
        actorId: c.actor || 1, actorValid: !!c.actor, itemId: c.item || 1, itemValid: !!c.item, selfSwitchCh: c.self || 'A', selfSwitchValid: !!c.self,
        switch1Id: c.sw || 1, switch1Valid: !!c.sw, switch2Id: c.sw2 || 1, switch2Valid: !!c.sw2, variableId: c.v ? c.v[0] : 1, variableValid: !!c.v,
        variableValue: c.v ? c.v[1] : 0
    };
    var image = { tileId: 0, characterName: '', direction: 2, pattern: 0, characterIndex: 0 };
    if (p.img && p.img.char) { image = { tileId: 0, characterName: p.img.char[0], direction: p.img.char[2] || 2, pattern: 1, characterIndex: p.img.char[1] }; }
    if (p.img && p.img.tile) {
        var tid = tileIds.b[p.img.tile];
        if (tid === undefined) { throw new Error('unknown tile image ' + p.img.tile); }
        image = { tileId: tid, characterName: '', direction: 2, pattern: 0, characterIndex: 0 };
    }
    var mv = p.move || {};
    return {
        conditions: conditions, directionFix: !!p.dirFix, image: image, list: p.list, moveFrequency: mv.freq || 3,
        moveRoute: { list: [{ code: 0, parameters: [] }], repeat: true, skippable: false, wait: false }, moveSpeed: mv.speed || 3, moveType: mv.type || 0,
        priorityType: p.priority === undefined ? 1 : p.priority, stepAnime: !!p.stepAnime, through: !!p.through, trigger: p.trigger || 0, walkAnime: p.walkAnime !== false
    };
}

MapCanvas.prototype.toJSON = function(tileIds, tilesetId) {
    var self = this, w = this.w, h = this.h, data = new Array(w * h * 6).fill(0), x, y;
    for (y = 0; y < h; y++) {
        for (x = 0; x < w; x++) {
            var fch = this.floor[y][x], name = FLOOR[fch];
            if (!name) { throw new Error('unknown floor char "' + fch + '" at ' + x + ',' + y + ' on ' + this.name); }
            data[(0 * h + y) * w + x] = tileIds.a5[name];
            var o = this.obj[y][x];
            if (o) { data[(2 * h + y) * w + x] = tileIds.b[OBJ[o]]; }
        }
    }
    var m = this.meta;
    var events = [null].concat(this.events.map(function(e) {
        return { id: e.id, name: e.name, note: e.note, pages: e.pages.map(function(p) { return pageJSON(p, tileIds); }), x: e.x, y: e.y };
    }));
    return {
        autoplayBgm: !!m.bgm, autoplayBgs: false, battleback1Name: m.bb1 || '', battleback2Name: m.bb2 || '',
        bgm: { name: m.bgm || '', pan: 0, pitch: 100, volume: 80 }, bgs: { name: '', pan: 0, pitch: 100, volume: 90 }, disableDashing: false,
        displayName: m.display === undefined ? this.name : m.display, encounterList: (m.encounters || []).map(function(e) {
            return { regionSet: [], troopId: e[0], weight: e[1] };
        }), encounterStep: m.encounterStep || 30, height: h, note: '', parallaxLoopX: false, parallaxLoopY: false, parallaxName: '', parallaxShow: true,
        parallaxSx: 0, parallaxSy: 0, scrollType: 0, specifyBattleback: !!m.bb1, tilesetId: tilesetId, width: w, data: data, events: events
    };
};

// ---- walkability -------------------------------------------------------------------------------
// flags: tileset flags array. Returns a 2D boolean grid of cells the player can stand on (ignoring events).
MapCanvas.prototype.walkGrid = function(tileIds, flags) {
    var grid = [], x, y;
    for (y = 0; y < this.h; y++) {
        grid.push([]);
        for (x = 0; x < this.w; x++) {
            var f = flags[tileIds.a5[FLOOR[this.floor[y][x]]]], o = this.obj[y][x], of = o ? flags[tileIds.b[OBJ[o]]] : 0x10;
            // MV checks layers top to bottom: a star tile (0x10) is skipped, otherwise the first layer decides
            var ok;
            if (!(of & 0x10)) { ok = (of & 0x0F) === 0; }
            else if (!(f & 0x10)) { ok = (f & 0x0F) === 0; }
            else { ok = true; }
            grid[y].push(ok);
        }
    }
    return grid;
};

// events that block movement (visible character or tile image on the same priority level, not through)
MapCanvas.prototype.blockingEvents = function(tileIds, flags) {
    var out = {};
    this.events.forEach(function(e) {
        var p = e.pages[0];
        if (p.through || (p.priority !== undefined && p.priority !== 1)) { return; }
        if (!p.img) { return; }
        if (p.img.tile && !(flags[tileIds.b[p.img.tile]] & 0x0F)) { return; }
        out[e.x + ',' + e.y] = true;
    });
    return out;
};

// breadth-first reachability from (sx, sy). Cells in `blocked` ("x,y") are not entered.
function reach(grid, sx, sy, blocked) {
    var h = grid.length, w = grid[0].length, seen = {}, q = [[sx, sy]];
    seen[sx + ',' + sy] = true;
    while (q.length) {
        var c = q.shift(), d = [[1, 0], [-1, 0], [0, 1], [0, -1]], i;
        for (i = 0; i < 4; i++) {
            var nx = c[0] + d[i][0], ny = c[1] + d[i][1], k = nx + ',' + ny;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h || seen[k] || !grid[ny][nx] || (blocked && blocked[k])) { continue; }
            seen[k] = true; q.push([nx, ny]);
        }
    }
    return seen;
}

// ---- preview -----------------------------------------------------------------------------------
function tileCanvas(sheets, tileId) {
    var c = new Canvas(T, T), sx, sy, sheet;
    if (tileId >= 1536 && tileId < 2048) { sheet = sheets.a5; sx = (tileId % 8) * T; sy = (Math.floor((tileId - 1536) / 8) % 16) * T; }
    else { sheet = sheets.b; sx = (((tileId >> 7) & 1) * 8 + (tileId % 8)) * T; sy = ((tileId >> 3) & 15) * T; }
    var px, py;
    for (py = 0; py < T; py++) {
        for (px = 0; px < T; px++) {
            var i = ((sy + py) * sheet.w + sx + px) * 4;
            c.data.set(sheet.data.subarray(i, i + 4), (py * T + px) * 4);
        }
    }
    return c;
}

var KIND_COLOR = { npc: '#4cd964', battle: '#ff3b30', transfer: '#32ade6', chest: '#ffcc00', auto: '#ff2d92', touch: '#af52de', object: '#ff9500' };

MapCanvas.prototype.render = function(sheets, tileIds, scale) {
    var s = scale || 1, c = new Canvas(this.w * T, this.h * T), x, y, cache = {};
    function tile(id) { return cache[id] || (cache[id] = tileCanvas(sheets, id)); }
    for (y = 0; y < this.h; y++) {
        for (x = 0; x < this.w; x++) {
            c.blit(tile(tileIds.a5[FLOOR[this.floor[y][x]]]), x * T, y * T);
            if (this.obj[y][x]) { c.blit(tile(tileIds.b[OBJ[this.obj[y][x]]]), x * T, y * T); }
        }
    }
    this.events.forEach(function(e) {
        var p = e.pages[e.pages.length > 1 && e.pages[0].cond ? 0 : 0];
        if (p.img && p.img.tile) { c.blit(tile(tileIds.b[p.img.tile]), e.x * T, e.y * T); }
        var kind = e.kind || 'object';
        if (p.img && p.img.char) { kind = 'npc'; }
        c.rect(e.x * T + 2, e.y * T + 2, 12, 12, KIND_COLOR[e.kind || kind] || '#fff');
        if (p.img && p.img.char) { c.ellipse(e.x * T + 24, e.y * T + 26, 11, 15, KIND_COLOR.npc); c.ellipse(e.x * T + 24, e.y * T + 14, 8, 8, '#f3d9b1'); }
    });
    return c;
};

module.exports = { MapCanvas: MapCanvas, FLOOR: FLOOR, OBJ: OBJ, WALLS: WALLS, reach: reach, pageJSON: pageJSON };
