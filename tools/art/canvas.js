// Tiny software rasteriser + PNG encoder (no dependencies) used to generate the
// game's tilesets, enemy battlers, battlebacks and title screen.
'use strict';
var zlib = require('zlib');

// ---- colour helpers ---------------------------------------------------------
function col(c, a) {
    if (Array.isArray(c)) { return [c[0], c[1], c[2], c[3] === undefined ? (a === undefined ? 255 : a) : c[3]]; }
    var h = String(c).replace('#', '');
    if (h.length === 3) { h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; }
    var al = h.length === 8 ? parseInt(h.slice(6, 8), 16) : (a === undefined ? 255 : a);
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), al];
}
function shade(c, f) {          // f > 0 lighten toward white, f < 0 darken toward black
    c = col(c);
    var t = f >= 0 ? 255 : 0, k = Math.abs(f);
    return [Math.round(c[0] + (t - c[0]) * k), Math.round(c[1] + (t - c[1]) * k),
            Math.round(c[2] + (t - c[2]) * k), c[3]];
}
function mix(a, b, t) {
    a = col(a); b = col(b);
    return [Math.round(a[0] + (b[0] - a[0]) * t), Math.round(a[1] + (b[1] - a[1]) * t),
            Math.round(a[2] + (b[2] - a[2]) * t), Math.round(a[3] + (b[3] - a[3]) * t)];
}
function alpha(c, a) { c = col(c); return [c[0], c[1], c[2], Math.round(c[3] * a)]; }

function rng(seed) {
    var a = seed | 0;
    return function() {
        a = a + 0x6D2B79F5 | 0;
        var t = Math.imul(a ^ a >>> 15, 1 | a);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// ---- PNG encoder ------------------------------------------------------------
var CRC_TABLE = (function() {
    var t = [], n, k, c;
    for (n = 0; n < 256; n++) {
        c = n;
        for (k = 0; k < 8; k++) { c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1; }
        t[n] = c >>> 0;
    }
    return t;
})();
function crc32(buf) {
    var c = 0xFFFFFFFF, i;
    for (i = 0; i < buf.length; i++) { c = CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8); }
    return (c ^ 0xFFFFFFFF) >>> 0;
}
function chunk(type, data) {
    var len = Buffer.alloc(4), crc = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
    len.writeUInt32BE(data.length, 0);
    crc.writeUInt32BE(crc32(td), 0);
    return Buffer.concat([len, td, crc]);
}
function encodePNG(w, h, rgba) {
    var ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(w, 0); ihdr.writeUInt32BE(h, 4);
    ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
    var raw = Buffer.alloc((w * 4 + 1) * h), y;
    for (y = 0; y < h; y++) {
        raw[y * (w * 4 + 1)] = 0;
        Buffer.from(rgba.buffer, rgba.byteOffset + y * w * 4, w * 4).copy(raw, y * (w * 4 + 1) + 1);
    }
    return Buffer.concat([
        Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
        chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))
    ]);
}

// ---- canvas -----------------------------------------------------------------
var SS = 3;  // anti-alias samples per axis

function Canvas(w, h) {
    this.w = w; this.h = h;
    this.data = new Uint8ClampedArray(w * h * 4);
}

Canvas.prototype.blend = function(x, y, c, cov) {
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) { return; }
    var sa = c[3] / 255 * cov;
    if (sa <= 0) { return; }
    var i = (y * this.w + x) * 4, d = this.data, da = d[i + 3] / 255;
    var oa = sa + da * (1 - sa);
    d[i]     = (c[0] * sa + d[i]     * da * (1 - sa)) / oa;
    d[i + 1] = (c[1] * sa + d[i + 1] * da * (1 - sa)) / oa;
    d[i + 2] = (c[2] * sa + d[i + 2] * da * (1 - sa)) / oa;
    d[i + 3] = oa * 255;
};

// Fill every pixel for which inside(x, y) is true, anti-aliased by supersampling.
Canvas.prototype.shape = function(inside, x0, y0, x1, y1, color) {
    var c = col(color), px, py, sx, sy, n = SS * SS, hit, step = 1 / SS;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0));
    x1 = Math.min(this.w - 1, Math.ceil(x1)); y1 = Math.min(this.h - 1, Math.ceil(y1));
    for (py = y0; py <= y1; py++) {
        for (px = x0; px <= x1; px++) {
            hit = 0;
            for (sy = 0; sy < SS; sy++) {
                for (sx = 0; sx < SS; sx++) {
                    if (inside(px + (sx + 0.5) * step, py + (sy + 0.5) * step)) { hit++; }
                }
            }
            if (hit) { this.blend(px, py, c, hit / n); }
        }
    }
    return this;
};

Canvas.prototype.rect = function(x, y, w, h, color) {
    var c = col(color), px, py;
    for (py = Math.max(0, Math.floor(y)); py < Math.min(this.h, Math.ceil(y + h)); py++) {
        for (px = Math.max(0, Math.floor(x)); px < Math.min(this.w, Math.ceil(x + w)); px++) {
            this.blend(px, py, c, 1);
        }
    }
    return this;
};

Canvas.prototype.px = function(x, y, color) { this.blend(x, y, col(color), 1); return this; };

Canvas.prototype.ellipse = function(cx, cy, rx, ry, color) {
    return this.shape(function(x, y) {
        var dx = (x - cx) / rx, dy = (y - cy) / ry;
        return dx * dx + dy * dy <= 1;
    }, cx - rx, cy - ry, cx + rx, cy + ry, color);
};

Canvas.prototype.ring = function(cx, cy, r, thick, color) {
    var ro = r + thick / 2, ri = r - thick / 2;
    return this.shape(function(x, y) {
        var d = Math.sqrt((x - cx) * (x - cx) + (y - cy) * (y - cy));
        return d <= ro && d >= ri;
    }, cx - ro, cy - ro, cx + ro, cy + ro, color);
};

Canvas.prototype.rrect = function(x, y, w, h, r, color) {
    r = Math.min(r, w / 2, h / 2);
    return this.shape(function(px, py) {
        var qx = Math.max(x + r - px, 0, px - (x + w - r)), qy = Math.max(y + r - py, 0, py - (y + h - r));
        return px >= x && px <= x + w && py >= y && py <= y + h && qx * qx + qy * qy <= r * r;
    }, x, y, x + w, y + h, color);
};

Canvas.prototype.poly = function(pts, color) {
    var minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity, i;
    for (i = 0; i < pts.length; i++) {
        minx = Math.min(minx, pts[i][0]); maxx = Math.max(maxx, pts[i][0]);
        miny = Math.min(miny, pts[i][1]); maxy = Math.max(maxy, pts[i][1]);
    }
    return this.shape(function(x, y) {
        var inside = false, j = pts.length - 1, k;
        for (k = 0; k < pts.length; k++) {
            var xi = pts[k][0], yi = pts[k][1], xj = pts[j][0], yj = pts[j][1];
            if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) { inside = !inside; }
            j = k;
        }
        return inside;
    }, minx, miny, maxx, maxy, color);
};

Canvas.prototype.line = function(x1, y1, x2, y2, width, color) {
    var dx = x2 - x1, dy = y2 - y1, len2 = dx * dx + dy * dy, hw = width / 2;
    return this.shape(function(x, y) {
        var t = len2 ? ((x - x1) * dx + (y - y1) * dy) / len2 : 0;
        t = Math.max(0, Math.min(1, t));
        var qx = x1 + t * dx - x, qy = y1 + t * dy - y;
        return qx * qx + qy * qy <= hw * hw;
    }, Math.min(x1, x2) - hw, Math.min(y1, y2) - hw, Math.max(x1, x2) + hw, Math.max(y1, y2) + hw, color);
};

// Soft radial glow (additive-looking, alpha falls off with distance).
Canvas.prototype.glow = function(cx, cy, r, color, strength) {
    var c = col(color), px, py;
    for (py = Math.max(0, Math.floor(cy - r)); py <= Math.min(this.h - 1, Math.ceil(cy + r)); py++) {
        for (px = Math.max(0, Math.floor(cx - r)); px <= Math.min(this.w - 1, Math.ceil(cx + r)); px++) {
            var d = Math.sqrt((px + 0.5 - cx) * (px + 0.5 - cx) + (py + 0.5 - cy) * (py + 0.5 - cy)) / r;
            if (d < 1) { this.blend(px, py, c, Math.pow(1 - d, 2) * (strength === undefined ? 1 : strength)); }
        }
    }
    return this;
};

Canvas.prototype.gradV = function(x, y, w, h, c1, c2) {
    var j;
    for (j = 0; j < h; j++) { this.rect(x, y + j, w, 1, mix(c1, c2, h > 1 ? j / (h - 1) : 0)); }
    return this;
};

// Random per-pixel brightness variation inside a rectangle (keeps alpha).
Canvas.prototype.noise = function(x, y, w, h, amount, seed) {
    var r = rng(seed || 1), px, py, d = this.data, i, v;
    for (py = Math.max(0, y); py < Math.min(this.h, y + h); py++) {
        for (px = Math.max(0, x); px < Math.min(this.w, x + w); px++) {
            i = (py * this.w + px) * 4;
            if (d[i + 3] === 0) { continue; }
            v = (r() - 0.5) * 2 * amount;
            d[i] += v; d[i + 1] += v; d[i + 2] += v;
        }
    }
    return this;
};

// Copy another canvas onto this one (source-over).
Canvas.prototype.blit = function(src, dx, dy) {
    var px, py, i, c;
    for (py = 0; py < src.h; py++) {
        for (px = 0; px < src.w; px++) {
            i = (py * src.w + px) * 4;
            if (src.data[i + 3] === 0) { continue; }
            c = [src.data[i], src.data[i + 1], src.data[i + 2], src.data[i + 3]];
            this.blend(dx + px, dy + py, c, 1);
        }
    }
    return this;
};

// Darken everything that is not transparent around the edges of shapes already drawn.
Canvas.prototype.outline = function(color, thickness) {
    var w = this.w, h = this.h, src = new Uint8ClampedArray(this.data), c = col(color), t = thickness || 1;
    var px, py, dx, dy, near, i;
    for (py = 0; py < h; py++) {
        for (px = 0; px < w; px++) {
            i = (py * w + px) * 4;
            if (src[i + 3] > 40) { continue; }
            near = false;
            for (dy = -t; dy <= t && !near; dy++) {
                for (dx = -t; dx <= t; dx++) {
                    var nx = px + dx, ny = py + dy;
                    if (nx >= 0 && ny >= 0 && nx < w && ny < h && src[(ny * w + nx) * 4 + 3] > 200) { near = true; break; }
                }
            }
            if (near) { this.blend(px, py, c, 1); }
        }
    }
    return this;
};

Canvas.prototype.png = function() { return encodePNG(this.w, this.h, this.data); };

module.exports = { Canvas: Canvas, col: col, shade: shade, mix: mix, alpha: alpha, rng: rng, encodePNG: encodePNG };
