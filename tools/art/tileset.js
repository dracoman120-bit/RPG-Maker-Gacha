// Procedural tileset for the game: one A5 sheet (floors/walls, 8x16 tiles) and one B sheet
// (objects, 16x16 tiles). Exports tile ids + passability flags so maps can reference them by name.
'use strict';
var art = require('./canvas');
var Canvas = art.Canvas, col = art.col, shade = art.shade, mix = art.mix, alpha = art.alpha, rng = art.rng;

var T = 48;

// A5 tile ids start at 1536 (index = row * 8 + column); B tile ids are the index itself.
var A5_BASE = 1536;
var FLAG_SOLID = 0x0F, FLAG_STAR = 0x10, FLAG_DAMAGE = 0x100;

var A5 = [], B = [];   // { name, draw(c), flag }
function a5(name, flag, draw) { A5.push({ name: name, flag: flag || 0, draw: draw }); }
function b(name, flag, draw) { B.push({ name: name, flag: flag || 0, draw: draw }); }

var BOOKS = ['#a63d40', '#3f6fb0', '#4f9a5c', '#c9a13b', '#7c4fa3', '#d0783a', '#3a8f9a', '#8a8a96'];

// ---------------------------------------------------------------------------------------------
// A5 : ground and walls
// ---------------------------------------------------------------------------------------------
function slabs(c, base, grout, seed) {
    c.rect(0, 0, T, T, base);
    c.noise(0, 0, T, T, 6, seed);
    c.rect(0, 0, T, 2, grout); c.rect(0, 23, T, 2, grout);
    c.rect(0, 0, 2, 24, grout); c.rect(0, 24, 2, 24, grout);
    c.rect(23, 0, 2, 24, grout); c.rect(11, 24, 2, 24, grout); c.rect(35, 24, 2, 24, grout);
    c.rect(2, 2, 21, 1, shade(base, 0.12)); c.rect(2, 25, 9, 1, shade(base, 0.12)); c.rect(13, 25, 22, 1, shade(base, 0.12));
}

a5('floorStone', 0, function(c) { slabs(c, '#4b5273', '#2d3149', 11); });
a5('floorDark', 0, function(c) { slabs(c, '#363b58', '#22263a', 12); });
a5('floorWood', 0, function(c) {
    var r = rng(13), y, x;
    c.rect(0, 0, T, T, '#7a5232');
    for (y = 0; y < T; y += 12) {
        c.rect(0, y, T, 1, '#3e2716');
        c.rect(0, y + 1, T, 1, '#8d6340');
        for (x = 0; x < 3; x++) { c.rect(r() * T, y + 3 + r() * 7, 6 + r() * 12, 1, '#6a4527'); }
        c.rect(((y / 12) % 2) * 24 + 10, y, 1, 12, '#3e2716');
    }
    c.noise(0, 0, T, T, 5, 14);
});
a5('carpetRed', 0, function(c) {
    c.rect(0, 0, T, T, '#8c2f3b'); c.noise(0, 0, T, T, 8, 15);
    c.rect(0, 0, T, 3, '#d3a64a'); c.rect(0, T - 3, T, 3, '#d3a64a');
    c.rect(0, 3, T, 1, '#5e1822'); c.rect(0, T - 4, T, 1, '#5e1822');
    c.poly([[24, 12], [36, 24], [24, 36], [12, 24]], '#a53d4a');
    c.poly([[24, 18], [30, 24], [24, 30], [18, 24]], '#d3a64a');
});
a5('carpetBlue', 0, function(c) {
    c.rect(0, 0, T, T, '#2c4a86'); c.noise(0, 0, T, T, 8, 16);
    c.rect(0, 0, T, 3, '#c8b568'); c.rect(0, T - 3, T, 3, '#c8b568');
    c.poly([[24, 12], [36, 24], [24, 36], [12, 24]], '#3a5fa6');
    c.poly([[24, 18], [30, 24], [24, 30], [18, 24]], '#c8b568');
});
a5('grass', 0, function(c) {
    var r = rng(17), i;
    c.rect(0, 0, T, T, '#3f7a3c'); c.noise(0, 0, T, T, 9, 17);
    for (i = 0; i < 26; i++) {
        var x = r() * T, y = r() * T;
        c.line(x, y, x - 1, y - 4, 1.2, '#58a050');
    }
});
a5('path', 0, function(c) {
    var r = rng(18), i;
    c.rect(0, 0, T, T, '#8a6c46'); c.noise(0, 0, T, T, 9, 18);
    for (i = 0; i < 10; i++) { c.ellipse(r() * T, r() * T, 2 + r() * 2, 1.5, '#6d5334'); }
});
a5('water', 0, function(c) {
    c.gradV(0, 0, T, T, '#2c5f9a', '#1f4678');
    c.line(4, 12, 20, 12, 2, '#6aa5d8'); c.line(28, 30, 44, 30, 2, '#6aa5d8'); c.line(8, 40, 22, 40, 1.5, '#4f88c0');
    c.noise(0, 0, T, T, 4, 19);
});

// walls ------------------------------------------------------------------------------------------
function brick(c, base, mortar, seed) {
    c.rect(0, 0, T, T, base); c.noise(0, 0, T, T, 7, seed);
    var y, x, off;
    for (y = 0; y < T; y += 12) {
        c.rect(0, y, T, 2, mortar);
        off = (y / 12) % 2 ? 12 : 0;
        for (x = -off; x < T; x += 24) { c.rect(x, y, 2, 12, mortar); }
    }
    c.gradV(0, 34, T, 14, alpha('#000', 0), alpha('#000', 0.45));
}
a5('wallBrick', FLAG_SOLID, function(c) { brick(c, '#7a7f9c', '#3b3f58', 21); });
a5('wallDark', FLAG_SOLID, function(c) { brick(c, '#4d5170', '#262940', 22); });

function shelf(c, palette, seed) {
    var r = rng(seed), row, x, bw, bh;
    c.rect(0, 0, T, T, '#2a1a10');
    for (row = 0; row < 3; row++) {
        x = 3;
        var base = 14 + row * 15;
        while (x < T - 6) {
            bw = 4 + Math.floor(r() * 4);
            bh = 9 + Math.floor(r() * 5);
            if (x + bw > T - 3) { break; }
            var bc = palette[Math.floor(r() * palette.length)];
            c.rect(x, base - bh, bw, bh, bc);
            c.rect(x, base - bh, 1, bh, shade(bc, 0.25));
            c.rect(x + bw - 1, base - bh, 1, bh, shade(bc, -0.3));
            if (r() < 0.5) { c.rect(x + 1, base - bh + 3, bw - 2, 1, '#e8d9a0'); }
            x += bw;
        }
        c.rect(0, base, T, 3, '#5b3a24'); c.rect(0, base, T, 1, '#7a5233');
    }
    c.rect(0, 0, 3, T, '#5b3a24'); c.rect(T - 3, 0, 3, T, '#5b3a24'); c.rect(0, 0, T, 3, '#6c4529');
    c.gradV(0, 0, T, T, alpha('#000', 0), alpha('#000', 0.18));
}
a5('shelfA', FLAG_SOLID, function(c) { shelf(c, BOOKS, 23); });
a5('shelfB', FLAG_SOLID, function(c) { shelf(c, ['#3f6fb0', '#3a8f9a', '#8a8a96', '#7c4fa3', '#c9a13b'], 24); });

a5('void', FLAG_SOLID, function(c) { c.rect(0, 0, T, T, '#0b0b16'); c.noise(0, 0, T, T, 3, 25); });
a5('inkPool', FLAG_DAMAGE, function(c) {
    c.rect(0, 0, T, T, '#0e0a1f'); c.noise(0, 0, T, T, 4, 26);
    c.ellipse(16, 18, 10, 5, alpha('#6a4fc0', 0.45)); c.ellipse(32, 32, 9, 4, alpha('#6a4fc0', 0.4));
    c.ellipse(14, 17, 4, 2, alpha('#b8a2ff', 0.5));
    c.rect(0, 0, T, 2, '#4b2f8a'); c.rect(0, T - 2, T, 2, '#4b2f8a'); c.rect(0, 0, 2, T, '#4b2f8a'); c.rect(T - 2, 0, 2, T, '#4b2f8a');
});
a5('runeFloor', 0, function(c) {
    slabs(c, '#424a6e', '#272b43', 27);
    c.ring(24, 24, 15, 2, '#5fe0d0'); c.ring(24, 24, 9, 1.5, '#5fe0d0');
    c.line(24, 6, 24, 42, 1.5, '#5fe0d0'); c.line(8, 24, 40, 24, 1.5, '#5fe0d0');
    c.glow(24, 24, 22, '#5fe0d0', 0.25);
});
a5('crackFloor', 0, function(c) {
    slabs(c, '#4b5273', '#2d3149', 28);
    c.line(6, 4, 20, 22, 2, '#161826'); c.line(20, 22, 18, 34, 2, '#161826'); c.line(20, 22, 38, 30, 2, '#161826'); c.line(18, 34, 28, 46, 1.5, '#161826');
});
a5('floorLight', 0, function(c) {
    c.rect(0, 0, T, T, '#c7c9d8'); c.noise(0, 0, T, T, 5, 29);
    c.rect(0, 0, T, 2, '#9a9db4'); c.rect(0, 0, 2, T, '#9a9db4'); c.rect(0, 2, T, 1, '#e6e7f0');
    c.line(10, 40, 30, 16, 1, '#b2b5c9');
});
a5('erased', FLAG_SOLID, function(c) {
    c.rect(0, 0, T, T, '#e9e9ef'); c.noise(0, 0, T, T, 6, 30);
    var y; for (y = 10; y < T; y += 12) { c.rect(0, y, T, 1, '#d2d2dc'); }
    c.rect(0, 0, T, 1, '#fff'); 
});
a5('wallTop', FLAG_SOLID, function(c) {
    c.rect(0, 0, T, T, '#1d2038'); c.noise(0, 0, T, T, 4, 31);
    c.rect(0, T - 3, T, 3, '#3b3f60');
});
a5('mossStone', 0, function(c) {
    slabs(c, '#44604e', '#25352b', 32);
    c.ellipse(12, 12, 8, 5, alpha('#6aa05a', 0.5)); c.ellipse(36, 34, 7, 4, alpha('#6aa05a', 0.45));
});

// ---------------------------------------------------------------------------------------------
// B : objects (transparent background)
// ---------------------------------------------------------------------------------------------
function contactShadow(c, cx, cy, rx, ry) { c.ellipse(cx, cy, rx, ry, [0, 0, 0, 80]); }

b('empty', 0, function() {});
b('pillar', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 15, 4);
    c.rect(12, 38, 24, 7, '#8d92ad'); c.rect(15, 4, 18, 36, '#a9aec8');
    c.rect(15, 4, 5, 36, '#c8cce0'); c.rect(29, 4, 4, 36, '#7a7f9c');
    c.rect(11, 2, 26, 6, '#8d92ad'); c.rect(11, 2, 26, 2, '#c8cce0');
    c.rect(12, 38, 24, 2, '#c8cce0');
});
b('torch', FLAG_SOLID, function(c) {
    c.rect(21, 22, 6, 16, '#5a3a22'); c.rect(18, 36, 12, 4, '#3a3a48');
    c.poly([[24, 4], [32, 20], [28, 26], [20, 26], [16, 20]], '#ff9a2e');
    c.poly([[24, 11], [29, 21], [26, 25], [22, 25], [19, 21]], '#ffe27a');
    c.glow(24, 18, 22, '#ffb347', 0.45);
});
b('tree', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 44, 14, 4);
    c.rect(20, 28, 8, 17, '#5a3d24'); c.rect(20, 28, 3, 17, '#76512f');
    c.ellipse(24, 18, 17, 15, '#2f6a35'); c.ellipse(17, 20, 10, 9, '#3b7d3f'); c.ellipse(30, 14, 9, 8, '#4a9650');
});
b('bush', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 40, 15, 4);
    c.ellipse(24, 30, 17, 11, '#2f6a35'); c.ellipse(16, 30, 9, 8, '#3b7d3f'); c.ellipse(32, 28, 8, 7, '#4a9650');
});
b('barrel', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 14, 4);
    c.rrect(11, 8, 26, 34, 7, '#8a5a30'); c.rect(11, 14, 26, 3, '#4a4a56'); c.rect(11, 32, 26, 3, '#4a4a56');
    c.rect(14, 9, 3, 32, '#a8733d'); c.ellipse(24, 9, 13, 4, '#6a4424');
});
b('crate', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 17, 4);
    c.rect(8, 10, 32, 32, '#9a6c3a'); c.rect(8, 10, 32, 3, '#c28d52'); c.rect(8, 39, 32, 3, '#6c4824');
    c.line(10, 12, 38, 40, 3, '#6c4824'); c.line(38, 12, 10, 40, 3, '#6c4824');
    c.rect(8, 10, 3, 32, '#6c4824'); c.rect(37, 10, 3, 32, '#6c4824');
});
b('chestClosed', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 42, 17, 4);
    c.rect(8, 20, 32, 20, '#8a5530'); c.rrect(8, 12, 32, 12, 6, '#a56a3a');
    c.rect(8, 24, 32, 3, '#d6b04a'); c.rect(21, 22, 6, 9, '#f0cf6a'); c.rect(23, 25, 2, 3, '#5a3a1a');
    c.rect(8, 20, 3, 20, '#d6b04a'); c.rect(37, 20, 3, 20, '#d6b04a');
});
b('chestOpen', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 42, 17, 4);
    c.rect(8, 22, 32, 18, '#8a5530'); c.rect(10, 24, 28, 6, '#2a1a10');
    c.poly([[8, 22], [40, 22], [36, 8], [12, 8]], '#a56a3a');
    c.rect(8, 22, 3, 18, '#d6b04a'); c.rect(37, 22, 3, 18, '#d6b04a');
    c.ellipse(24, 27, 9, 3, '#f0cf6a');
});
b('doorClosed', FLAG_SOLID, function(c) {
    c.rrect(8, 4, 32, 42, 12, '#4a2f1b'); c.rrect(11, 7, 26, 39, 10, '#7a4f2c');
    c.rect(23, 8, 2, 38, '#4a2f1b'); c.ellipse(30, 28, 2.5, 2.5, '#d6b04a'); c.ellipse(18, 28, 2.5, 2.5, '#d6b04a');
    c.rect(11, 18, 26, 2, '#4a2f1b'); c.rect(11, 34, 26, 2, '#4a2f1b');
});
b('doorOpen', 0, function(c) {
    c.rrect(8, 4, 32, 42, 12, '#4a2f1b'); c.rrect(12, 8, 24, 38, 9, '#0c0a14');
    c.glow(24, 30, 18, '#5fe0d0', 0.18);
});
b('stairsDown', 0, function(c) {
    var i; c.rect(4, 4, 40, 42, '#1b1e32');
    for (i = 0; i < 5; i++) {
        c.rect(4, 6 + i * 8, 40, 7, mix('#6d7394', '#12142a', i / 4));
        c.rect(4, 6 + i * 8, 40, 1, mix('#a0a6c8', '#2a2e4a', i / 4));
    }
});
b('stairsUp', 0, function(c) {
    var i; c.rect(4, 4, 40, 42, '#1b1e32');
    for (i = 0; i < 5; i++) {
        c.rect(4, 38 - i * 8, 40, 7, mix('#6d7394', '#a0a6c8', i / 4));
        c.rect(4, 38 - i * 8, 40, 1, '#c8cce0');
    }
});
b('altar', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 18, 4);
    c.rect(8, 34, 32, 10, '#8d92ad'); c.rect(12, 26, 24, 10, '#a9aec8'); c.rect(8, 34, 32, 2, '#c8cce0');
    c.glow(24, 16, 22, '#5fe0d0', 0.5);
    c.poly([[24, 2], [32, 14], [24, 28], [16, 14]], '#5fe0d0');
    c.poly([[24, 2], [28, 14], [24, 28]], '#a6fff4'); c.poly([[24, 2], [16, 14], [20, 14]], '#e6fffb');
});
b('desk', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 21, 4);
    c.rect(2, 20, 44, 8, '#8a5a30'); c.rect(2, 20, 44, 2, '#b5804a');
    c.rect(4, 28, 6, 15, '#6a4424'); c.rect(38, 28, 6, 15, '#6a4424'); c.rect(10, 28, 28, 5, '#5a3a1f');
    c.rect(8, 12, 14, 8, '#e8d9a0'); c.rect(10, 14, 10, 1, '#8a7a50'); c.rect(10, 17, 8, 1, '#8a7a50');
    c.line(34, 20, 38, 6, 2, '#e8e8f0'); c.ellipse(32, 18, 4, 2.5, '#223');
});
b('lectern', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 13, 4);
    c.rect(19, 24, 10, 19, '#6a4424'); c.rect(14, 40, 20, 4, '#5a3a1f');
    c.poly([[10, 24], [38, 24], [34, 10], [14, 10]], '#8a5a30');
    c.poly([[14, 12], [34, 12], [31, 22], [17, 22]], '#e8d9a0'); c.rect(23, 12, 2, 10, '#8a7a50');
});
b('press', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 19, 4);
    c.rect(6, 32, 36, 12, '#4a4e66'); c.rect(6, 32, 36, 2, '#7a7f9c');
    c.rect(10, 18, 28, 14, '#5d627e'); c.rect(18, 8, 12, 10, '#7a7f9c'); c.rect(22, 2, 4, 8, '#a9aec8');
    c.glow(24, 26, 16, '#ffb347', 0.4); c.rect(14, 22, 20, 5, '#ff9a2e');
});
b('bed', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 20, 4);
    c.rect(4, 14, 40, 28, '#5a3a22'); c.rect(7, 18, 34, 22, '#3f6fb0'); c.rect(7, 18, 34, 6, '#e8e8f0');
    c.rect(4, 8, 40, 8, '#6a4424');
});
b('table', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 20, 4);
    c.rect(4, 18, 40, 8, '#8a5a30'); c.rect(4, 18, 40, 2, '#b5804a');
    c.rect(7, 26, 5, 16, '#6a4424'); c.rect(36, 26, 5, 16, '#6a4424');
});
b('chair', 0, function(c) {
    contactShadow(c, 24, 43, 12, 3);
    c.rect(14, 8, 20, 16, '#7a4f2c'); c.rect(14, 24, 20, 6, '#a56a3a'); c.rect(15, 30, 4, 13, '#5a3a1f'); c.rect(29, 30, 4, 13, '#5a3a1f');
});
b('rug', 0, function(c) {
    c.rrect(3, 8, 42, 32, 6, '#8c2f3b'); c.rrect(7, 12, 34, 24, 4, '#c8574a');
    c.poly([[24, 14], [34, 24], [24, 34], [14, 24]], '#d3a64a');
});
b('candelabra', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 11, 3);
    c.rect(22, 20, 4, 22, '#c9a13b'); c.rect(15, 40, 18, 4, '#c9a13b'); c.rect(11, 18, 26, 3, '#c9a13b');
    [13, 24, 35].forEach(function(x) { c.rect(x - 1.5, 10, 3, 9, '#e8e0cc'); c.poly([[x, 3], [x + 3, 9], [x - 3, 9]], '#ffb347'); c.glow(x, 8, 12, '#ffb347', 0.3); });
});
b('bookPile', 0, function(c) {
    contactShadow(c, 24, 42, 16, 3);
    c.rect(10, 32, 28, 8, '#a63d40'); c.rect(12, 24, 24, 8, '#3f6fb0'); c.rect(14, 17, 20, 7, '#c9a13b');
    c.rect(10, 32, 28, 1, '#d98a8c'); c.rect(12, 24, 24, 1, '#8fb4e8'); c.rect(14, 17, 20, 1, '#f0d98a');
});
b('inkBlot', 0, function(c) {
    c.ellipse(24, 28, 16, 9, '#12102a'); c.ellipse(15, 24, 7, 5, '#12102a'); c.ellipse(34, 33, 7, 4, '#12102a');
    c.ellipse(19, 25, 4, 2, alpha('#9a86ff', 0.45));
});
b('banner', 0, function(c) {
    c.rect(10, 2, 28, 3, '#c9a13b'); c.poly([[12, 5], [36, 5], [36, 36], [24, 44], [12, 36]], '#2c4a86');
    c.poly([[24, 12], [30, 22], [24, 32], [18, 22]], '#c9a13b');
});
b('crystal', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 14, 3);
    c.rect(14, 36, 20, 8, '#6d7394'); c.glow(24, 22, 24, '#9ad0ff', 0.5);
    c.poly([[24, 2], [34, 18], [24, 38], [14, 18]], '#9ad0ff'); c.poly([[24, 2], [28, 18], [24, 38]], '#d6eeff'); c.poly([[24, 2], [14, 18], [19, 18]], '#ffffff');
});
b('lamp', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 8, 3);
    c.rect(22, 14, 4, 30, '#3a3a48'); c.rect(15, 4, 18, 12, '#ffd98a'); c.rect(15, 4, 18, 2, '#3a3a48'); c.rect(15, 14, 18, 2, '#3a3a48');
    c.glow(24, 10, 26, '#ffd98a', 0.4);
});
b('sign', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 10, 3);
    c.rect(22, 22, 4, 21, '#5a3a22'); c.rrect(8, 6, 32, 20, 3, '#8a5a30'); c.rect(12, 11, 24, 2, '#e8d9a0'); c.rect(12, 16, 18, 2, '#e8d9a0');
});
b('gate', FLAG_SOLID, function(c) {
    c.rect(4, 6, 8, 40, '#8d92ad'); c.rect(36, 6, 8, 40, '#8d92ad'); c.rect(4, 4, 40, 8, '#a9aec8');
    c.rect(12, 12, 24, 34, '#0e1030'); c.glow(24, 30, 22, '#8a7aff', 0.6);
    c.ring(24, 30, 9, 2, '#b8a8ff'); c.ring(24, 30, 4, 1.5, '#e0d8ff');
});
b('quill', 0, function(c) {
    c.glow(24, 26, 22, '#ffe08a', 0.35);
    c.rrect(10, 20, 28, 20, 3, '#6a3a8a'); c.rect(10, 20, 3, 20, '#4a2562'); c.rect(14, 22, 22, 16, '#e8d9a0');
    c.poly([[26, 20], [40, 2], [36, 22]], '#f0f0f8'); c.line(26, 20, 40, 2, 1.5, '#9a9ab8');
    c.rect(18, 25, 14, 1, '#8a7a50'); c.rect(18, 29, 11, 1, '#8a7a50');
});
b('statue', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 14, 4);
    c.rect(12, 36, 24, 8, '#8d92ad'); c.rect(18, 20, 12, 18, '#a9aec8'); c.ellipse(24, 14, 7, 8, '#b9bed4'); c.rect(14, 22, 20, 5, '#a9aec8');
    c.rect(18, 20, 3, 18, '#d6daea');
});
b('rift', FLAG_SOLID, function(c) {
    c.glow(24, 26, 26, '#7a4fd0', 0.7);
    c.ellipse(24, 26, 14, 20, '#0a0618'); c.ring(24, 26, 15, 3, '#8a5fe8'); c.ring(24, 26, 9, 2, '#b49aff');
    c.line(10, 8, 18, 16, 2, '#8a5fe8'); c.line(38, 40, 31, 33, 2, '#8a5fe8');
});
b('pedestal', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 14, 4);
    c.rect(12, 28, 24, 16, '#8d92ad'); c.rect(10, 26, 28, 4, '#c8cce0');
    c.glow(24, 18, 16, '#ffe08a', 0.5); c.rect(16, 10, 16, 16, '#f0e4b8'); c.rect(18, 14, 12, 1, '#8a7a50'); c.rect(18, 18, 9, 1, '#8a7a50');
});
b('bones', 0, function(c) {
    c.ellipse(16, 34, 6, 5, '#e8e8dc'); c.rect(13, 33, 2, 2, '#223'); c.rect(18, 33, 2, 2, '#223');
    c.line(24, 40, 40, 28, 3, '#e8e8dc'); c.line(22, 30, 38, 42, 3, '#d4d4c4');
});
b('inkwell', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 15, 4);
    c.ellipse(24, 30, 15, 13, '#2a2a48'); c.ellipse(24, 22, 12, 5, '#0e0a1f'); c.ellipse(20, 21, 4, 1.5, alpha('#b8a2ff', 0.6));
    c.line(36, 26, 44, 6, 2, '#e8e8f0'); c.poly([[44, 6], [40, 14], [46, 12]], '#e8e8f0');
});
b('mushroom', 0, function(c) {
    c.glow(24, 28, 18, '#5fe0d0', 0.4);
    c.rect(22, 28, 4, 12, '#cfe8e0'); c.ellipse(24, 28, 11, 8, '#3aa89a'); c.ellipse(21, 26, 3, 2, '#bff5ec');
    c.rect(11, 34, 3, 6, '#cfe8e0'); c.ellipse(12.5, 34, 5, 4, '#3aa89a');
});
b('lorePage', 0, function(c) {
    c.glow(24, 28, 16, '#ffe08a', 0.45);
    c.poly([[14, 38], [34, 40], [36, 18], [16, 16]], '#f4ead0');
    c.line(19, 22, 31, 23, 1.5, '#8a7a50'); c.line(19, 27, 31, 28, 1.5, '#8a7a50'); c.line(19, 32, 27, 33, 1.5, '#8a7a50');
});
b('hollowCrack', 0, function(c) {
    c.glow(24, 28, 20, '#7a4fd0', 0.4);
    c.line(8, 14, 20, 26, 3, '#0a0618'); c.line(20, 26, 16, 40, 3, '#0a0618'); c.line(20, 26, 40, 30, 3, '#0a0618'); c.line(40, 30, 44, 44, 2, '#0a0618');
});
b('pillarTop', FLAG_STAR, function(c) {
    c.rect(15, 24, 18, 24, '#a9aec8'); c.rect(15, 24, 5, 24, '#c8cce0'); c.rect(29, 24, 4, 24, '#7a7f9c');
    c.rect(11, 22, 26, 6, '#8d92ad'); c.rect(11, 22, 26, 2, '#c8cce0');
});
b('plant', FLAG_SOLID, function(c) {
    contactShadow(c, 24, 43, 11, 3);
    c.rect(16, 32, 16, 12, '#a0583a'); c.rect(14, 30, 20, 4, '#b86a46');
    c.ellipse(18, 22, 5, 10, '#3b7d3f'); c.ellipse(30, 22, 5, 10, '#2f6a35'); c.ellipse(24, 18, 5, 12, '#4a9650');
});
b('scroll', 0, function(c) {
    c.rrect(8, 18, 32, 14, 6, '#e8d9a0'); c.ellipse(10, 25, 4, 7, '#c8b878'); c.ellipse(38, 25, 4, 7, '#c8b878');
    c.rect(14, 22, 20, 1, '#8a7a50'); c.rect(14, 26, 16, 1, '#8a7a50');
});
b('hall', FLAG_SOLID, function(c) {   // framed picture of the Archive tower, wall decoration
    c.rect(8, 4, 32, 34, '#6a4424'); c.rect(11, 7, 26, 28, '#1d2a4a');
    c.rect(21, 12, 6, 20, '#c8cce0'); c.poly([[19, 12], [29, 12], [24, 5]], '#c8cce0'); c.glow(24, 14, 10, '#ffe08a', 0.7);
});


b('wisp', FLAG_SOLID, function(c) {
    c.glow(24, 28, 22, '#6a4fc0', 0.5);
    c.poly([[24, 6], [36, 26], [38, 36], [24, 46], [10, 36], [12, 26]], '#1d1640');
    c.ellipse(24, 34, 13, 13, '#1d1640'); c.ellipse(24, 34, 9, 9, '#2c2260');
    c.ellipse(19, 33, 3, 4, '#ffffff'); c.ellipse(29, 33, 3, 4, '#ffffff'); c.ellipse(19, 34, 1.2, 2, '#1d1640'); c.ellipse(29, 34, 1.2, 2, '#1d1640');
});
b('lever', FLAG_SOLID, function(c) {
    c.rect(10, 28, 28, 14, '#4a4e66'); c.rect(10, 28, 28, 2, '#7a7f9c'); c.rect(20, 32, 8, 6, '#2a2c40');
    c.line(24, 32, 33, 12, 4, '#c9a13b'); c.ellipse(33, 11, 5, 5, '#e05a4a');
});
b('husk', FLAG_SOLID, function(c) {
    c.glow(24, 28, 22, '#6a4fc0', 0.4);
    c.poly([[24, 6], [40, 22], [44, 46], [4, 46], [8, 22]], '#2a2848'); c.ellipse(24, 18, 9, 10, '#1a1830'); c.ellipse(24, 19, 6, 7, '#f0f0f6');
    c.rect(20, 18, 2, 2, '#6a4fc0'); c.rect(26, 18, 2, 2, '#6a4fc0');
    c.rect(2, 32, 10, 8, '#a63d40'); c.rect(36, 32, 10, 8, '#3f6fb0');
});
b('warden', FLAG_SOLID, function(c) {
    c.glow(24, 28, 24, '#7a4fd0', 0.5);
    c.poly([[24, 4], [42, 26], [46, 47], [2, 47], [6, 26]], '#1c1838'); c.poly([[14, 22], [34, 22], [36, 36], [12, 36]], '#3c3c5a');
    c.ellipse(24, 14, 8, 9, '#4b4b70'); c.rect(18, 12, 12, 4, '#0a0618'); c.rect(20, 13, 8, 2, '#b49aff');
    c.poly([[24, 0], [27, 8], [21, 8]], '#7a4fd0');
});

// ---------------------------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------------------------
function build() {
    var sheetA5 = new Canvas(8 * T, 16 * T), sheetB = new Canvas(16 * T, 16 * T);
    var ids = { a5: {}, b: {} }, flags = new Array(8192).fill(0);
    var tmp;
    A5.forEach(function(t, i) {
        tmp = new Canvas(T, T);
        t.draw(tmp);
        sheetA5.blit(tmp, (i % 8) * T, Math.floor(i / 8) * T);
        ids.a5[t.name] = A5_BASE + i;
        flags[A5_BASE + i] = t.flag;
    });
    B.forEach(function(t, i) {
        tmp = new Canvas(T, T);
        t.draw(tmp);
        // MV lays B-E sheets out as two 8-column halves: ids 0-127 in columns 0-7, ids 128-255 in columns 8-15
        sheetB.blit(tmp, (((i >> 7) & 1) * 8 + (i % 8)) * T, ((i >> 3) & 15) * T);
        ids.b[t.name] = i;
        flags[i] = t.flag;
    });
    // B tile 0 is the empty tile: flag 0x10 ("no effect on passage") so empty upper layers never decide passability
    flags[0] = FLAG_STAR;
    return { a5: sheetA5, b: sheetB, ids: ids, flags: flags };
}

module.exports = { build: build, TILE: T };
