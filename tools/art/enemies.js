// Procedural enemy battlers (transparent PNGs) for the Hollow and its ink creatures.
'use strict';
var art = require('./canvas');
var Canvas = art.Canvas, shade = art.shade, alpha = art.alpha, rng = art.rng;

var EDGE = '#0a0816';

function eyes(c, x, y, gap, r, color, pupil) {
    c.glow(x - gap, y, r * 3, color, 0.5); c.glow(x + gap, y, r * 3, color, 0.5);
    c.ellipse(x - gap, y, r, r * 1.25, color); c.ellipse(x + gap, y, r, r * 1.25, color);
    if (pupil) { c.ellipse(x - gap, y + 1, r * 0.4, r * 0.8, pupil); c.ellipse(x + gap, y + 1, r * 0.4, r * 0.8, pupil); }
}

var ENEMIES = {};

ENEMIES.InkWisp = function() {
    var c = new Canvas(200, 240);
    c.glow(100, 140, 95, '#6a4fc0', 0.5);
    c.poly([[100, 10], [150, 110], [160, 160], [100, 215], [40, 160], [50, 110]], '#1d1640');
    c.ellipse(100, 150, 58, 62, '#1d1640');
    c.ellipse(100, 150, 40, 44, '#2c2260');
    c.poly([[100, 40], [128, 110], [100, 120], [74, 110]], '#2c2260');
    c.ellipse(82, 122, 10, 18, alpha('#a690ff', 0.35));
    eyes(c, 100, 150, 20, 10, '#ffffff', '#1d1640');
    c.ellipse(100, 185, 14, 5, '#0a0816');
    [[60, 205, 7], [140, 212, 6], [100, 226, 5]].forEach(function(d) { c.ellipse(d[0], d[1], d[2] * 0.7, d[2], '#1d1640'); });
    return c.outline(EDGE, 2);
};

ENEMIES.PageMite = function() {
    var c = new Canvas(220, 170), i;
    [-1, 1].forEach(function(s) {
        for (i = 0; i < 3; i++) {
            c.line(110 + s * 30, 100 + i * 14, 110 + s * (80 + i * 8), 120 + i * 18, 6, '#8a7a50');
            c.line(110 + s * (80 + i * 8), 120 + i * 18, 110 + s * (96 + i * 8), 150, 5, '#6a5a38');
        }
    });
    c.ellipse(110, 95, 74, 52, '#e8d9a0');
    c.ellipse(110, 95, 74, 52, '#e8d9a0');
    for (i = 0; i < 5; i++) { c.line(60 + i * 25, 62, 56 + i * 25, 130, 2, '#b8a870'); }
    c.line(110, 46, 110, 140, 3, '#a89860');
    c.poly([[40, 70], [70, 40], [64, 74]], '#f4ead0');
    c.ellipse(166, 84, 36, 34, '#d8c88c');
    eyes(c, 172, 80, 12, 6, '#d94a4a', '#400');
    c.line(190, 62, 214, 36, 4, '#6a5a38'); c.line(180, 60, 196, 30, 4, '#6a5a38');
    c.line(160, 112, 184, 118, 3, '#400');
    return c.outline(EDGE, 2);
};

ENEMIES.HuskScribe = function() {
    var c = new Canvas(240, 330);
    c.poly([[120, 40], [190, 120], [215, 315], [25, 315], [50, 120]], '#2a2848');
    c.poly([[120, 40], [150, 120], [120, 315], [90, 120]], '#35335a');
    c.ellipse(120, 82, 42, 50, '#1a1830');
    c.ellipse(120, 88, 30, 38, '#f0f0f6');     // blank mask
    c.line(104, 84, 112, 90, 3, '#a8a8c0'); c.line(128, 90, 136, 84, 3, '#a8a8c0');
    c.glow(120, 90, 50, '#a690ff', 0.2);
    c.line(180, 140, 210, 205, 12, '#2a2848');           // arm
    c.ellipse(212, 210, 11, 11, '#f0f0f6');
    c.line(214, 212, 232, 170, 3, '#e8e8f0'); c.poly([[232, 170], [226, 184], [238, 180]], '#e8e8f0');   // quill
    c.rrect(30, 190, 50, 60, 4, '#6a3a8a'); c.rect(34, 194, 42, 52, '#e8d9a0');   // book
    return c.outline(EDGE, 2);
};

ENEMIES.TomeMimic = function() {
    var c = new Canvas(250, 230), i;
    c.rrect(25, 100, 200, 100, 10, '#7a2530');                  // lower cover
    c.rect(35, 160, 180, 30, '#e8d9a0');                        // pages
    for (i = 0; i < 6; i++) { c.rect(35, 163 + i * 5, 180, 1, '#b8a870'); }
    c.poly([[25, 100], [225, 100], [200, 20], [50, 20]], '#a03a48'); // upper cover raised
    c.poly([[40, 100], [210, 100], [190, 36], [60, 36]], '#2a0a10');   // mouth
    for (i = 0; i < 6; i++) {
        c.poly([[52 + i * 26, 100], [66 + i * 26, 100], [59 + i * 26, 74]], '#f4f0e0');
        c.poly([[60 + i * 26, 38], [74 + i * 26, 38], [67 + i * 26, 62]], '#f4f0e0');
    }
    c.ellipse(125, 90, 38, 12, '#d9506a');
    eyes(c, 125, 40, 38, 7, '#ffd24a', '#400');
    c.rect(218, 120, 8, 40, '#d3a64a'); c.rect(25, 120, 8, 40, '#d3a64a');
    return c.outline(EDGE, 2);
};

ENEMIES.InkSlime = function() {
    var c = new Canvas(240, 190);
    c.ellipse(120, 130, 100, 52, '#12102a');
    c.poly([[40, 130], [75, 50], [120, 30], [170, 55], [200, 130]], '#12102a');
    c.ellipse(120, 95, 70, 55, '#12102a');
    c.ellipse(95, 72, 24, 12, alpha('#b8a2ff', 0.5)); c.ellipse(86, 66, 8, 4, alpha('#ffffff', 0.7));
    eyes(c, 120, 100, 24, 9, '#ffffff', '#12102a');
    c.ellipse(120, 126, 16, 5, '#7a4fd0');
    [[40, 165, 8], [205, 168, 7]].forEach(function(d) { c.ellipse(d[0], d[1], d[2], d[2] * 0.6, '#12102a'); });
    return c.outline('#4b2f8a', 2);
};

ENEMIES.DrownedClerk = function() {
    var c = new Canvas(240, 330);
    c.glow(120, 170, 120, '#3a8fb0', 0.35);
    c.poly([[120, 50], [185, 130], [200, 300], [40, 300], [55, 130]], alpha('#5fa8c8', 0.85));
    c.poly([[120, 50], [145, 130], [120, 300], [95, 130]], alpha('#8ad0e8', 0.6));
    c.ellipse(120, 76, 38, 40, alpha('#9ad8ea', 0.95));
    c.ring(104, 74, 10, 3, '#e8e8f0'); c.ring(136, 74, 10, 3, '#e8e8f0'); c.line(114, 74, 126, 74, 3, '#e8e8f0');  // spectacles
    eyes(c, 120, 76, 16, 3.5, '#0a2a40');
    c.rect(100, 170, 40, 54, '#e8d9a0'); c.line(105, 180, 135, 180, 2, '#8a7a50'); c.line(105, 190, 135, 190, 2, '#8a7a50');   // ledger
    [[70, 250], [160, 270], [130, 290]].forEach(function(d) { c.ellipse(d[0], d[1], 5, 8, alpha('#ffffff', 0.6)); });
    return c.outline('#1a4a6a', 2);
};

ENEMIES.BlotHound = function() {
    var c = new Canvas(330, 230), i;
    c.ellipse(165, 130, 95, 55, '#161232');
    c.ellipse(255, 100, 44, 38, '#161232');                       // head
    c.poly([[225, 70], [235, 25], [255, 62]], '#161232'); c.poly([[262, 62], [284, 28], [284, 76]], '#161232');
    c.poly([[290, 100], [326, 118], [290, 124]], '#161232');      // snout
    for (i = 0; i < 4; i++) {
        var x = [90, 130, 210, 245][i];
        c.rect(x - 10, 150, 20, 66, '#161232'); c.ellipse(x, 216, 16, 7, '#161232');
    }
    c.poly([[75, 110], [10, 70], [18, 110], [60, 150]], '#161232');  // tail
    c.glow(165, 120, 100, '#6a4fc0', 0.25);
    eyes(c, 268, 92, 8, 5, '#ffffff', '#161232');
    for (i = 0; i < 4; i++) { c.ellipse(110 + i * 38, 150 + (i % 2) * 6, 5, 9, '#161232'); }
    c.line(300, 120, 312, 124, 3, '#e8e8f0');
    return c.outline('#4b2f8a', 2);
};

ENEMIES.HollowKnight = function() {
    var c = new Canvas(270, 370);
    c.glow(135, 160, 130, '#7a4fd0', 0.3);
    c.rect(88, 220, 36, 130, '#2a2a40'); c.rect(146, 220, 36, 130, '#2a2a40');
    c.rect(80, 340, 50, 18, '#1a1a2c'); c.rect(140, 340, 50, 18, '#1a1a2c');
    c.poly([[70, 90], [200, 90], [210, 230], [60, 230]], '#3c3c5a');
    c.poly([[135, 90], [200, 90], [210, 230], [135, 230]], '#32324e');
    c.ellipse(66, 100, 28, 22, '#4b4b70'); c.ellipse(204, 100, 28, 22, '#4b4b70');
    c.ellipse(135, 62, 36, 40, '#4b4b70');
    c.rect(112, 56, 46, 12, '#0a0618'); c.rect(117, 59, 36, 4, '#b49aff');
    c.poly([[135, 4], [145, 28], [125, 28]], '#7a4fd0');
    c.line(210, 120, 250, 250, 10, '#4b4b70');
    c.poly([[244, 120], [262, 60], [258, 250], [246, 258]], '#c8cce0');
    c.poly([[250, 66], [258, 250], [252, 250]], '#ffffff');
    c.line(66, 110, 40, 210, 12, '#4b4b70'); c.ellipse(36, 226, 12, 12, '#2a2a40');
    c.line(100, 150, 170, 210, 2, '#7a4fd0');
    return c.outline(EDGE, 2);
};

ENEMIES.CuratorHusk = function() {
    var c = new Canvas(440, 480), i;
    c.glow(220, 250, 210, '#6a4fc0', 0.3);
    c.poly([[220, 90], [340, 200], [400, 460], [40, 460], [100, 200]], '#2a2848');
    c.poly([[220, 90], [270, 200], [220, 460], [170, 200]], '#35335a');
    for (i = 0; i < 6; i++) {            // pages crown
        var a = -Math.PI / 2 + (i - 2.5) * 0.28;
        c.poly([[220 + Math.cos(a) * 40, 70 + Math.sin(a) * 40], [220 + Math.cos(a - 0.12) * 100, 70 + Math.sin(a - 0.12) * 100], [220 + Math.cos(a + 0.12) * 100, 70 + Math.sin(a + 0.12) * 100]], '#e8d9a0');
    }
    c.ellipse(220, 110, 52, 60, '#1a1830');
    c.ellipse(220, 116, 38, 46, '#f0f0f6');
    eyes(c, 220, 112, 16, 8, '#6a4fc0', '#1a1830');
    c.line(206, 142, 234, 142, 3, '#a8a8c0');
    var arms = [[110, 230, 40, 260], [330, 230, 400, 260], [130, 300, 50, 340], [310, 300, 390, 340]];
    arms.forEach(function(a, k) {
        c.line(a[0], a[1], a[2], a[3], 18, '#2a2848');
        c.rrect(a[2] - 28, a[3] - 20, 56, 42, 4, BOOKCOL[k]); c.rect(a[2] - 24, a[3] - 16, 48, 34, '#e8d9a0');
    });
    c.glow(220, 300, 70, '#a690ff', 0.35);
    return c.outline(EDGE, 3);
};
var BOOKCOL = ['#a63d40', '#3f6fb0', '#4f9a5c', '#7c4fa3'];

ENEMIES.UnwrittenWarden = function() {
    var c = new Canvas(480, 520), i;
    c.glow(240, 270, 230, '#7a4fd0', 0.4);
    var r = rng(7);
    for (i = 0; i < 26; i++) {           // cape of fading text
        var x = 90 + r() * 300, y = 120 + r() * 340;
        c.rect(x, y, 14 + r() * 40, 3, alpha('#e8e8f0', 0.2 + r() * 0.45));
    }
    c.poly([[240, 120], [400, 230], [450, 510], [30, 510], [80, 230]], alpha('#1c1838', 0.96));
    c.poly([[240, 120], [300, 230], [240, 510], [180, 230]], alpha('#2a2450', 0.9));
    for (i = 0; i < 26; i++) {
        var x2 = 90 + r() * 300, y2 = 130 + r() * 340;
        c.rect(x2, y2, 10 + r() * 40, 3, alpha('#e8e8f0', 0.2 + r() * 0.5));
    }
    c.poly([[150, 190], [330, 190], [350, 320], [130, 320]], '#3c3c5a');
    c.ellipse(130, 192, 46, 30, '#4b4b70'); c.ellipse(350, 192, 46, 30, '#4b4b70');
    c.ellipse(240, 120, 56, 64, '#4b4b70');
    c.rect(200, 108, 80, 18, '#0a0618'); c.rect(208, 113, 64, 7, '#b49aff');
    c.poly([[240, 10], [256, 62], [224, 62]], '#7a4fd0');
    c.poly([[200, 22], [214, 66], [190, 62]], '#7a4fd0'); c.poly([[280, 22], [290, 62], [266, 66]], '#7a4fd0');
    for (i = 0; i < 5; i++) { c.ring(240, 400, 50 + i * 20, 3, alpha('#b49aff', 0.5 - i * 0.08)); }   // broken chain halo
    c.line(350, 210, 440, 400, 14, '#4b4b70');
    c.poly([[430, 200], [466, 100], [462, 410], [440, 420]], '#d6daea'); c.poly([[450, 110], [462, 410], [452, 410]], '#ffffff');
    c.line(130, 210, 60, 380, 14, '#4b4b70'); c.ellipse(54, 396, 18, 18, '#2a2a40');
    eyes(c, 190, 300, 0, 8, '#b49aff'); eyes(c, 290, 300, 0, 8, '#b49aff'); eyes(c, 240, 340, 0, 10, '#ffffff');
    return c.outline(EDGE, 3);
};

module.exports = ENEMIES;
