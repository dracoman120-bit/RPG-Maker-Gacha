// Battlebacks and title screen, drawn procedurally.
'use strict';
var art = require('./canvas');
var Canvas = art.Canvas, shade = art.shade, mix = art.mix, alpha = art.alpha, rng = art.rng;

var BOOKS = ['#a63d40', '#3f6fb0', '#4f9a5c', '#c9a13b', '#7c4fa3', '#d0783a', '#3a8f9a', '#8a8a96'];

function floorLines(c, horizon, color, n) {
    var i, w = c.w, h = c.h;
    for (i = 0; i <= n; i++) {                       // lines converging to a vanishing point
        var x = -w * 0.6 + (w * 2.2) * i / n;
        c.line(w / 2 + (x - w / 2) * 0.12, horizon, x, h, 2, color);
    }
    for (i = 1; i < 9; i++) {                        // horizontal bands, closer = further apart
        var y = horizon + Math.pow(i / 9, 1.8) * (h - horizon);
        c.line(0, y, w, y, 2, color);
    }
}

function shelfRow(c, x, y, w, h, seed) {
    var r = rng(seed), row, bx, bw, bh;
    c.rect(x, y, w, h, '#2a1a10');
    for (row = 0; row < 4; row++) {
        var base = y + 40 + row * (h - 20) / 4, shelfTop;
        bx = x + 6;
        while (bx < x + w - 12) {
            bw = 8 + Math.floor(r() * 9); bh = 30 + Math.floor(r() * 26);
            if (bx + bw > x + w - 6) { break; }
            var bc = BOOKS[Math.floor(r() * BOOKS.length)];
            c.rect(bx, base - bh, bw, bh, shade(bc, -0.25));
            c.rect(bx, base - bh, 2, bh, bc);
            bx += bw;
        }
        c.rect(x, base, w, 6, '#5b3a24');
    }
    c.rect(x, y, 8, h, '#6c4529'); c.rect(x + w - 8, y, 8, h, '#6c4529'); c.rect(x, y, w, 8, '#6c4529');
}

var SCENES = {};

SCENES.StacksFloor = function() {
    var c = new Canvas(1000, 740);
    c.gradV(0, 0, 1000, 380, '#14122a', '#2a2040');
    c.gradV(0, 380, 1000, 360, '#3a2c3c', '#1e1626');
    c.noise(0, 380, 1000, 360, 5, 3);
    floorLines(c, 380, alpha('#0a0614', 0.6), 18);
    c.glow(500, 420, 420, '#e8a85a', 0.18);
    return c;
};
SCENES.StacksWall = function() {
    var c = new Canvas(1000, 740), i;
    for (i = 0; i < 4; i++) { shelfRow(c, 10 + i * 250, 70, 230, 310, 40 + i); }
    [0, 500, 1000].forEach(function(x) {
        c.rect(x - 14, 0, 28, 392, '#8d92ad'); c.rect(x - 14, 0, 7, 392, '#c8cce0'); c.rect(x - 24, 376, 48, 16, '#8d92ad');
    });
    c.rect(0, 0, 1000, 70, '#1a1630');
    [250, 750].forEach(function(x) { c.glow(x, 60, 150, '#ffb347', 0.4); c.rect(x - 4, 0, 8, 40, '#3a3a48'); c.rect(x - 22, 40, 44, 22, '#ffd98a'); });
    return c;
};

SCENES.InkFloor = function() {
    var c = new Canvas(1000, 740), i, r = rng(9);
    c.gradV(0, 0, 1000, 360, '#0a0818', '#16102e');
    c.gradV(0, 360, 1000, 380, '#1c1638', '#0a0818');
    c.noise(0, 360, 1000, 380, 5, 5);
    floorLines(c, 360, alpha('#3a2a78', 0.5), 16);
    for (i = 0; i < 9; i++) {
        var x = r() * 1000, y = 400 + r() * 320, w = 60 + r() * 150;
        c.ellipse(x, y, w, w * 0.18, alpha('#07050f', 0.9)); c.ellipse(x - w * 0.2, y - 2, w * 0.5, w * 0.06, alpha('#9a86ff', 0.35));
    }
    c.glow(500, 440, 440, '#7a4fd0', 0.22);
    return c;
};
SCENES.InkWall = function() {
    var c = new Canvas(1000, 740), i, r = rng(11);
    for (i = 0; i < 14; i++) {      // stalactites
        var x = i * 75 + r() * 40, h = 90 + r() * 220;
        c.poly([[x - 36, 0], [x + 36, 0], [x + 4, h]], '#120e26'); c.poly([[x - 36, 0], [x - 10, 0], [x + 1, h * 0.9]], '#1c1638');
        c.ellipse(x + 4, h + 10, 4, 8, alpha('#8a6fe8', 0.8));
    }
    c.rect(0, 0, 1000, 40, '#0a0818');
    for (i = 0; i < 7; i++) {      // glowing mushrooms along the back
        var mx = 80 + i * 150 + r() * 60, my = 350 + r() * 20;
        c.glow(mx, my, 70, '#5fe0d0', 0.3); c.rect(mx - 3, my, 6, 24, '#cfe8e0'); c.ellipse(mx, my, 20, 13, '#3aa89a'); c.ellipse(mx - 6, my - 4, 6, 3, '#bff5ec');
    }
    return c;
};

SCENES.Title = function() {
    var c = new Canvas(816, 624), i, r = rng(21);
    c.gradV(0, 0, 816, 624, '#07081a', '#1d1a40');
    for (i = 0; i < 120; i++) { c.ellipse(r() * 816, r() * 380, 0.8 + r() * 1.2, 0.8 + r() * 1.2, alpha('#ffffff', 0.3 + r() * 0.6)); }
    c.glow(408, 300, 380, '#5fe0d0', 0.22);
    // light beam from the tower
    c.poly([[400, 120], [416, 120], [560, 400], [260, 400]], alpha('#9ff3ea', 0.10));
    // tower
    c.poly([[384, 150], [432, 150], [440, 400], [376, 400]], '#262a52'); c.poly([[378, 150], [438, 150], [408, 96]], '#1a1d3e');
    c.rect(398, 175, 20, 40, '#ffe08a'); c.glow(408, 195, 70, '#ffe08a', 0.55); c.rect(398, 250, 20, 30, '#ffe08a');
    // sea
    c.gradV(0, 400, 816, 224, '#0e1030', '#04050f');
    for (i = 0; i < 18; i++) { c.line(r() * 700, 420 + r() * 180, 80 + r() * 700, 420 + r() * 180, 2, alpha('#6a7ae0', 0.18)); }
    // big open book in the foreground
    c.poly([[120, 470], [408, 520], [696, 470], [726, 560], [408, 610], [90, 560]], '#3a2218');
    c.poly([[140, 470], [408, 516], [408, 596], [130, 548]], '#e8d9a0'); c.poly([[676, 470], [408, 516], [408, 596], [686, 548]], '#f4ead0');
    for (i = 0; i < 6; i++) {
        c.line(170, 488 + i * 11, 380, 520 + i * 10, 2, alpha('#8a7a50', 0.8)); c.line(646, 488 + i * 11, 436, 520 + i * 10, 2, alpha('#8a7a50', 0.8));
    }
    c.line(408, 516, 408, 598, 3, '#a89860');
    // floating pages
    for (i = 0; i < 16; i++) {
        var px = 90 + r() * 640, py = 80 + r() * 350, a = r() * 0.8 - 0.4;
        c.poly([[px, py], [px + 22, py + 6 + a * 10], [px + 18, py + 30], [px - 4, py + 24 - a * 10]], alpha('#f4ead0', 0.5 + r() * 0.4));
    }
    // vignette
    c.glow(408, 312, 520, '#000000', 0);
    return c;
};

module.exports = SCENES;
