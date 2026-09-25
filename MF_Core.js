//=============================================================================
// MF_Core.js
//=============================================================================
//-----------------------------------------------------------------------------
// Copyright (c) 2026 MesaFer. All rights reserved.
// License: MF Plugins License 1.1 (LICENSE.md).
//   One license per developer, unlimited projects, free updates. As is,
//   without warranty.
//   ALLOWED: use in commercial and non-commercial RPG Maker MZ games;
//            modifying this file for your own projects;
//            MF_Core and MF_SimpleVisual may be included in game builds.
//   FORBIDDEN: selling or redistributing this file or parts of it (also for
//            free, also in packs or templates); copying the code into other
//            projects; distributing modified versions; removing this header.
//   MF_SimpleVisualEditor must NOT be distributed, not even in game builds.
//-----------------------------------------------------------------------------
/*:
 * @target MZ
 * @plugindesc [v1.2.0] MF Core — base library for MF_* plugins.
 * @author MesaFer
 * @url
 *
 * @param debug
 * @text Debug Mode
 * @type boolean
 * @on Enabled
 * @off Disabled
 * @default false
 * @desc Print MF_* debug messages to the console.
 *
 * @param allowScript
 * @text Allow Scripts
 * @type boolean
 * @on Allowed
 * @off Forbidden
 * @default false
 * @desc Allow executing JS code from data ("script" conditions and actions).
 *
 * @help MF_Core.js  v1.2.0
 * ============================================================================
 * Base library for the MF_* plugin family.
 * Must be placed ABOVE all other MF_* plugins in the plugin list.
 * ============================================================================
 *
 * Global namespace: MF
 *
 *   MF.Core        — plugin registration, dependency and version checks
 *   MF.Log         — prefixed logging
 *   MF.Utils       — type checks, clone, merge, paths, equality, uid
 *   MF.Math        — clamp, lerp, remap, snap, rectangles, easing
 *   MF.Units       — parsing of "240", "50%", "100%-240", "auto"; functions
 *                    (min, max, clamp, lerp, angle, sind...), comparisons, ? :
 *   MF.Anchor      — anchor points (top-left, center, bottom-right, ...)
 *   MF.Color       — color parsing and conversion
 *   MF.Hook        — safe method overriding (alias/before/after)
 *   MF.Events      — EventEmitter and global bus MF.Events.bus
 *   MF.Condition   — condition evaluation (switches, variables, ...)
 *   MF.Script      — execution of JS code from data (access-controlled)
 *   MF.FS          — file access (NW.js), JSON loading, downloads
 *   MF.Data        — extra data/*.json files loaded by DataManager
 *   MF.Migration   — data format version migrations
 *   MF.History     — Undo/Redo stack
 *   MF.Deprecation — deprecation warnings and API redirects
 *   MF.Schema      — validation and normalization of structured data
 *   MF.Save        — plugin state stored inside save files
 *   MF.Config      — plugin settings stored in config.rmmzsave
 *   MF.I18n        — localization
 *   MF.Ticker      — per-frame update runner
 *   MF.Tween       — property animation
 *   MF.Timer       — frame-based waits, delays, intervals
 *   MF.Queue       — sequential async task queue
 *   MF.Layout      — Units + Anchor layout for display objects   [experimental]
 *   MF.UI          — Window / Sprite / Container with layout     [experimental]
 *   MF.Text        — custom escape codes, message helpers, word wrap
 *   MF.Input       — actions, raw keys, shortcuts, pointer, drag  (drag: [experimental])
 *   MF.Assets      — batch preloading with progress
 *   MF.Document    — editable JSON document: undo + validation + save [experimental]
 *   MF.Registry    — named extension registries
 *   MF.Services    — plugin-to-plugin APIs with versions (provide/use/when)
 *   MF.Notetag     — typed notetags, blocks, battler sources
 *   MF.GameEvents  — game:* events (variables, gold, items, battle, map...)
 *   MF.Commands    — plugin commands with argument schema and async wait
 *   MF.Options     — shared Scene_Options entries stored in MF.Config
 *   MF.Modifiers   — stacking stat modifiers (param, costs, rewards)
 *   MF.Random      — seeded random, streams saved with the game
 *
 *   Text codes: \TR[ns:key] \SAVE[key:path] \W[n] \SE[name,vol,pitch,pan]
 *               \FACE[name,index] \SPD[n]
 *
 * ----------------------------------------------------------------------------
 * Versioning policy (semver: MAJOR.MINOR.PATCH)
 * ----------------------------------------------------------------------------
 *   PATCH — bug fixes only, no API changes.
 *   MINOR — new API, fully backward compatible.
 *   MAJOR — breaking changes (only removals of previously deprecated API).
 *
 *   An API is never removed or changed incompatibly at once:
 *     1. The new API is added; the old one keeps working and redirects to it
 *        through MF.Deprecation (one-time console warning).
 *     2. The deprecation is listed in the changelog with the version where
 *        the old API will be removed (at least the next MAJOR).
 *     3. Removal happens only in that MAJOR release.
 *   APIs marked [experimental] may change in a MINOR release; such changes
 *   are always listed in the changelog as "Experimental change".
 *
 *   Dependent plugins must declare the minimum MF_Core version they were
 *   written against, both in code and in their @help:
 *     MF.Core.register("MF_QuestLog", "0.1.0", { requires: { MF_Core: "1.0.0" } });
 *
 *   Changelog: docs/MF_Core/CHANGELOG.md
 *   Reference: docs/MF_Core/index.html
 *
 * ----------------------------------------------------------------------------
 * License (full text: LICENSE.md)
 * ----------------------------------------------------------------------------
 *   Allowed: commercial and non-commercial RPG Maker MZ games; including this
 *   file in game builds. Forbidden: selling or redistributing the plugin or
 *   parts of it, copying its code into other projects, distributing modified
 *   versions, removing the license header. Copyright (c) 2026 MesaFer.
 *
 * This plugin has no plugin commands.
 */

(() => {
    "use strict";

    const PLUGIN_NAME = "MF_Core";
    const PLUGIN_VERSION = "1.2.0";

    const MF = (window.MF = window.MF || {});
    if (MF.Core && MF.Core.VERSION) {
        console.warn(`[MF_Core] loaded twice (v${MF.Core.VERSION} is already active); the second copy is ignored.`);
        return;
    }

    //=========================================================================
    // Parameters
    //=========================================================================

    const rawParams = PluginManager.parameters(PLUGIN_NAME);
    const params = {
        debug: rawParams.debug === "true",
        allowScript: rawParams.allowScript === "true"
    };

    //=========================================================================
    // MF.Log
    //=========================================================================

    const Log = {
        prefix(tag) {
            return `[${tag || "MF"}]`;
        },
        debug(tag, ...args) {
            if (params.debug) console.log(this.prefix(tag), ...args);
        },
        info(tag, ...args) {
            console.info(this.prefix(tag), ...args);
        },
        warn(tag, ...args) {
            console.warn(this.prefix(tag), ...args);
        },
        error(tag, ...args) {
            console.error(this.prefix(tag), ...args);
        }
    };

    //=========================================================================
    // MF.Utils
    //=========================================================================

    let uidCounter = 0;

    const Utils = {
        isNumber(v) {
            return typeof v === "number" && Number.isFinite(v);
        },
        isString(v) {
            return typeof v === "string";
        },
        isFunction(v) {
            return typeof v === "function";
        },
        isObject(v) {
            return v !== null && typeof v === "object" && !Array.isArray(v);
        },
        isPlainObject(v) {
            if (!this.isObject(v)) return false;
            const proto = Object.getPrototypeOf(v);
            return proto === Object.prototype || proto === null;
        },
        isEmpty(v) {
            if (v == null) return true;
            if (Array.isArray(v) || this.isString(v)) return v.length === 0;
            if (this.isObject(v)) return Object.keys(v).length === 0;
            return false;
        },

        isTest() {
            return Utils_isOption("test");
        },
        isBattleTest() {
            return Utils_isOption("btest");
        },
        isEventTest() {
            return Utils_isOption("etest");
        },
        isNwjs() {
            return window.Utils ? window.Utils.isNwjs() : typeof require === "function";
        },

        /** Deep clone of plain data (objects, arrays, primitives). */
        clone(value) {
            if (Array.isArray(value)) return value.map(v => this.clone(v));
            if (this.isPlainObject(value)) {
                const out = {};
                for (const key of Object.keys(value)) out[key] = this.clone(value[key]);
                return out;
            }
            return value;
        },

        /**
         * Deep merge. Arrays are replaced as a whole.
         * undefined values in a source are skipped, null is written.
         * Returns a new object; arguments are not mutated.
         */
        merge(...sources) {
            const result = {};
            for (const src of sources) {
                if (!this.isObject(src)) continue;
                for (const key of Object.keys(src)) {
                    const value = src[key];
                    if (value === undefined) continue;
                    if (this.isPlainObject(value) && this.isPlainObject(result[key])) {
                        result[key] = this.merge(result[key], value);
                    } else {
                        result[key] = this.clone(value);
                    }
                }
            }
            return result;
        },

        /** Deep equality of plain data. */
        equals(a, b) {
            if (a === b) return true;
            if (typeof a !== typeof b || a == null || b == null) return false;
            if (Array.isArray(a)) {
                if (!Array.isArray(b) || a.length !== b.length) return false;
                return a.every((v, i) => this.equals(v, b[i]));
            }
            if (this.isObject(a) && this.isObject(b)) {
                const ka = Object.keys(a);
                const kb = Object.keys(b);
                if (ka.length !== kb.length) return false;
                return ka.every(k => Object.prototype.hasOwnProperty.call(b, k) && this.equals(a[k], b[k]));
            }
            return Number.isNaN(a) && Number.isNaN(b);
        },

        /**
         * Diff: fields of target that differ from base (to store only changes).
         * Always returns an object; nested objects without changes are omitted.
         * Overlay semantics: merge(base, diff(base, target)) equals target
         * as long as target does not REMOVE keys present in base
         * (removals are not representable; use explicit values like visible:false).
         */
        diff(base, target) {
            const d = this._diffValue(base, target);
            return d === undefined ? {} : d;
        },
        _diffValue(base, target) {
            if (this.isObject(base) && this.isObject(target)) {
                const out = {};
                let changed = false;
                for (const key of Object.keys(target)) {
                    const d = this._diffValue(base[key], target[key]);
                    if (d !== undefined) {
                        out[key] = d;
                        changed = true;
                    }
                }
                return changed ? out : undefined;
            }
            return this.equals(base, target) ? undefined : this.clone(target);
        },

        /** Path: "a.b.0.c" or ["a", "b", 0, "c"]. */
        toPath(path) {
            if (Array.isArray(path)) return path;
            if (path == null || path === "") return [];
            return String(path).split(".");
        },
        get(obj, path, fallback) {
            let cur = obj;
            for (const key of this.toPath(path)) {
                if (cur == null) return fallback;
                cur = cur[key];
            }
            return cur === undefined ? fallback : cur;
        },
        set(obj, path, value) {
            const keys = this.toPath(path);
            if (keys.length === 0) return obj;
            let cur = obj;
            for (let i = 0; i < keys.length - 1; i++) {
                const key = keys[i];
                if (cur[key] == null || typeof cur[key] !== "object") {
                    cur[key] = /^\d+$/.test(keys[i + 1]) ? [] : {};
                }
                cur = cur[key];
            }
            cur[keys[keys.length - 1]] = value;
            return obj;
        },
        has(obj, path) {
            let cur = obj;
            for (const key of this.toPath(path)) {
                if (cur == null || !Object.prototype.hasOwnProperty.call(cur, key)) return false;
                cur = cur[key];
            }
            return true;
        },
        unset(obj, path) {
            const keys = this.toPath(path);
            if (keys.length === 0) return false;
            const parent = this.get(obj, keys.slice(0, -1));
            if (parent == null) return false;
            return delete parent[keys[keys.length - 1]];
        },

        /** Session-unique id. */
        uid(prefix = "mf") {
            uidCounter++;
            return `${prefix}_${Date.now().toString(36)}${uidCounter.toString(36)}`;
        },

        /** Name unique among existing ones: "window", "window_2", ... */
        uniqueName(base, existing) {
            const set = existing instanceof Set ? existing : new Set(existing || []);
            if (!set.has(base)) return base;
            let i = 2;
            while (set.has(`${base}_${i}`)) i++;
            return `${base}_${i}`;
        },

        /**
         * Recursive parsing of MZ plugin parameters
         * (structs and arrays arrive as JSON strings).
         */
        parseParams(value) {
            if (this.isString(value)) {
                const trimmed = value.trim();
                if (trimmed === "") return value;
                if (trimmed === "true") return true;
                if (trimmed === "false") return false;
                if (/^-?(0|[1-9]\d*)(\.\d+)?$/.test(trimmed)) return Number(trimmed);
                if (/^[[{"]/.test(trimmed)) {
                    try {
                        return this.parseParams(JSON.parse(trimmed));
                    } catch (e) {
                        return value;
                    }
                }
                return value;
            }
            if (Array.isArray(value)) return value.map(v => this.parseParams(v));
            if (this.isObject(value)) {
                const out = {};
                for (const key of Object.keys(value)) out[key] = this.parseParams(value[key]);
                return out;
            }
            return value;
        },

        /** Compares versions "1.2.3". Returns -1, 0, 1. */
        compareVersions(a, b) {
            const pa = String(a).split(".").map(n => parseInt(n, 10) || 0);
            const pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
            const len = Math.max(pa.length, pb.length);
            for (let i = 0; i < len; i++) {
                const d = (pa[i] || 0) - (pb[i] || 0);
                if (d !== 0) return d > 0 ? 1 : -1;
            }
            return 0;
        },

        /** Debounce by real time (ms). */
        debounce(fn, wait) {
            let timer = null;
            const wrapped = function(...args) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    timer = null;
                    fn.apply(this, args);
                }, wait);
            };
            wrapped.cancel = () => {
                clearTimeout(timer);
                timer = null;
            };
            return wrapped;
        },

        /** JSON.parse that never throws. */
        parseJson(text, fallback = null) {
            try {
                return JSON.parse(text);
            } catch (e) {
                return fallback;
            }
        },

        /** Template substitution: "Hello {name}" + {name: "World"}. */
        format(template, data) {
            return String(template).replace(/\{([\w.]+)\}/g, (m, key) => {
                const v = this.get(data, key);
                return v === undefined ? m : String(v);
            });
        }
    };

    function Utils_isOption(name) {
        return !!(window.Utils && window.Utils.isOptionValid && window.Utils.isOptionValid(name));
    }

    //=========================================================================
    // MF.Math
    //=========================================================================

    const MathX = {
        EPSILON: 1e-6,

        clamp(v, min, max) {
            return v < min ? min : v > max ? max : v;
        },
        clamp01(v) {
            return this.clamp(v, 0, 1);
        },
        lerp(a, b, t) {
            return a + (b - a) * t;
        },
        invLerp(a, b, v) {
            return a === b ? 0 : (v - a) / (b - a);
        },
        remap(v, inMin, inMax, outMin, outMax) {
            return this.lerp(outMin, outMax, this.invLerp(inMin, inMax, v));
        },
        /** Round to step: roundTo(13, 5) -> 15. */
        roundTo(v, step = 1) {
            return step > 0 ? Math.round(v / step) * step : v;
        },
        floorTo(v, step = 1) {
            return step > 0 ? Math.floor(v / step) * step : v;
        },
        ceilTo(v, step = 1) {
            return step > 0 ? Math.ceil(v / step) * step : v;
        },
        /** Round to n decimal places. */
        toFixed(v, digits = 2) {
            const k = Math.pow(10, digits);
            return Math.round(v * k) / k;
        },
        approx(a, b, eps = this.EPSILON) {
            return Math.abs(a - b) <= eps;
        },
        /** Wrap value into [min, max). */
        wrap(v, min, max) {
            const range = max - min;
            if (range <= 0) return min;
            return ((((v - min) % range) + range) % range) + min;
        },
        randomInt(min, max) {
            return Math.floor(Math.random() * (max - min + 1)) + min;
        },
        randomFloat(min, max) {
            return Math.random() * (max - min) + min;
        },
        distance(x1, y1, x2, y2) {
            return Math.hypot(x2 - x1, y2 - y1);
        },
        degToRad(d) {
            return (d * Math.PI) / 180;
        },
        radToDeg(r) {
            return (r * 180) / Math.PI;
        },

        /**
         * Snap value to the nearest target if distance <= threshold.
         * Returns { value, snapped, target }.
         */
        snap(value, targets, threshold) {
            let best = null;
            let bestDist = threshold;
            for (const t of targets) {
                const d = Math.abs(value - t);
                if (d <= bestDist) {
                    bestDist = d;
                    best = t;
                }
            }
            return best === null
                ? { value, snapped: false, target: null }
                : { value: best, snapped: true, target: best };
        },

        //--- Rectangles: { x, y, width, height } -----------------------------

        rect(x = 0, y = 0, width = 0, height = 0) {
            return { x, y, width, height };
        },
        rectRight(r) {
            return r.x + r.width;
        },
        rectBottom(r) {
            return r.y + r.height;
        },
        rectCenter(r) {
            return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
        },
        rectContains(r, px, py) {
            return px >= r.x && py >= r.y && px < r.x + r.width && py < r.y + r.height;
        },
        rectIntersects(a, b) {
            return a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;
        },
        rectIntersection(a, b) {
            const x = Math.max(a.x, b.x);
            const y = Math.max(a.y, b.y);
            const r = Math.min(a.x + a.width, b.x + b.width);
            const bt = Math.min(a.y + a.height, b.y + b.height);
            return r > x && bt > y ? this.rect(x, y, r - x, bt - y) : null;
        },
        rectUnion(a, b) {
            const x = Math.min(a.x, b.x);
            const y = Math.min(a.y, b.y);
            const r = Math.max(a.x + a.width, b.x + b.width);
            const bt = Math.max(a.y + a.height, b.y + b.height);
            return this.rect(x, y, r - x, bt - y);
        },
        /** Normalize a rectangle with negative size. */
        rectNormalize(r) {
            const x = Math.min(r.x, r.x + r.width);
            const y = Math.min(r.y, r.y + r.height);
            return this.rect(x, y, Math.abs(r.width), Math.abs(r.height));
        },
        /** Keep a rectangle inside bounds. */
        rectClampInside(r, bounds) {
            const width = Math.min(r.width, bounds.width);
            const height = Math.min(r.height, bounds.height);
            return this.rect(
                this.clamp(r.x, bounds.x, bounds.x + bounds.width - width),
                this.clamp(r.y, bounds.y, bounds.y + bounds.height - height),
                width,
                height
            );
        },
        rectEquals(a, b) {
            return a.x === b.x && a.y === b.y && a.width === b.width && a.height === b.height;
        },

        //--- Easing (t in [0, 1]) -------------------------------------------

        easing: {
            linear: t => t,
            easeInQuad: t => t * t,
            easeOutQuad: t => t * (2 - t),
            easeInOutQuad: t => (t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t),
            easeInCubic: t => t * t * t,
            easeOutCubic: t => --t * t * t + 1,
            easeInOutCubic: t => (t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1),
            easeInSine: t => 1 - Math.cos((t * Math.PI) / 2),
            easeOutSine: t => Math.sin((t * Math.PI) / 2),
            easeInOutSine: t => -(Math.cos(Math.PI * t) - 1) / 2,
            easeOutBack: t => {
                const c1 = 1.70158;
                const c3 = c1 + 1;
                return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
            },
            easeOutBounce: t => {
                const n1 = 7.5625;
                const d1 = 2.75;
                if (t < 1 / d1) return n1 * t * t;
                if (t < 2 / d1) return n1 * (t -= 1.5 / d1) * t + 0.75;
                if (t < 2.5 / d1) return n1 * (t -= 2.25 / d1) * t + 0.9375;
                return n1 * (t -= 2.625 / d1) * t + 0.984375;
            }
        },
        ease(name, t) {
            const fn = this.easing[name] || this.easing.linear;
            return fn(this.clamp01(t));
        },
        /** Interpolation with easing: tween(0, 100, 0.5, "easeOutQuad"). */
        tween(a, b, t, easingName = "linear") {
            return this.lerp(a, b, this.ease(easingName, t));
        }
    };

    //=========================================================================
    // MF.Units — "240", "50%", "100%-240", "(100%-20)/2", "auto", "clamp(50%, 100, 400)"
    //=========================================================================
    //  Grammar:
    //    ternary := or ('?' ternary ':' ternary)?
    //    or      := and ('||' and)*          and := cmp ('&&' cmp)*
    //    cmp     := expr (('<'|'>'|'<='|'>='|'=='|'!=') expr)*
    //    expr    := term (('+' | '-') term)*
    //    term    := unary (('*' | '/') unary)*
    //    unary   := '-' unary | '!' unary | power      power := factor ('^' unary)?
    //    factor  := NUMBER '%'? | NUMBER 'px' | '(' ternary ')' | NAME '(' args ')' | CONST
    //  Functions: UNIT_FUNCS (min, max, clamp, lerp, atan2, angle, sind...). Constants: pi, e.
    //  Percentages are relative to base. eval is not used.
    //=========================================================================

    const unitCache = new Map();
    const unitWarned = new Set();

    function tokenizeUnits(src) {
        const tokens = [];
        const re = /\s*(?:(\d+(?:\.\d+)?|\.\d+)(%|px)?|([A-Za-z_]\w*)|(<=|>=|==|!=|&&|\|\||[+\-*/()<>!?:,^]))/y;
        let pos = 0;
        while (pos < src.length) {
            re.lastIndex = pos;
            const m = re.exec(src);
            if (!m) {
                if (/^\s*$/.test(src.slice(pos))) break;
                throw new Error(`MF.Units: unexpected symbol "${src[pos]}" at ${pos} in "${src}"`);
            }
            if (m[1] !== undefined) {
                tokens.push({ type: m[2] === "%" ? "pct" : "num", value: parseFloat(m[1]) });
            } else if (m[3] !== undefined) {
                tokens.push({ type: "id", value: m[3] });
            } else {
                tokens.push({ type: "op", value: m[4] });
            }
            pos = re.lastIndex;
        }
        return tokens;
    }

    const D2R = Math.PI / 180;
    /** Functions of expressions: [min args, max args, fn]. Trigonometry in radians; *d variants in degrees. */
    const UNIT_FUNCS = {
        min: [1, Infinity, (...a) => Math.min(...a)],
        max: [1, Infinity, (...a) => Math.max(...a)],
        abs: [1, 1, Math.abs],
        sign: [1, 1, Math.sign],
        floor: [1, 1, Math.floor],
        ceil: [1, 1, Math.ceil],
        round: [1, 2, (v, d = 0) => { const k = Math.pow(10, d); return Math.round(v * k) / k; }],
        trunc: [1, 1, Math.trunc],
        sqrt: [1, 1, v => (v < 0 ? 0 : Math.sqrt(v))],
        pow: [2, 2, Math.pow],
        exp: [1, 1, Math.exp],
        log: [1, 1, v => (v > 0 ? Math.log(v) : 0)],
        mod: [2, 2, (a, b) => (b === 0 ? 0 : ((a % b) + b) % b)],
        clamp: [3, 3, (v, a, b) => Math.min(Math.max(v, Math.min(a, b)), Math.max(a, b))],
        lerp: [3, 3, (a, b, t) => a + (b - a) * t],
        step: [2, 2, (edge, v) => (v >= edge ? 1 : 0)],
        between: [3, 3, (v, a, b) => (v >= Math.min(a, b) && v <= Math.max(a, b) ? 1 : 0)],
        if: [3, 3, (c, a, b) => (c ? a : b)],
        hypot: [1, Infinity, (...a) => Math.hypot(...a)],
        dist: [4, 4, (x1, y1, x2, y2) => Math.hypot(x2 - x1, y2 - y1)],
        sin: [1, 1, Math.sin],
        cos: [1, 1, Math.cos],
        tan: [1, 1, Math.tan],
        asin: [1, 1, v => Math.asin(Math.max(-1, Math.min(1, v)))],
        acos: [1, 1, v => Math.acos(Math.max(-1, Math.min(1, v)))],
        atan: [1, 1, Math.atan],
        atan2: [2, 2, Math.atan2],
        sind: [1, 1, v => Math.sin(v * D2R)],
        cosd: [1, 1, v => Math.cos(v * D2R)],
        tand: [1, 1, v => Math.tan(v * D2R)],
        atan2d: [2, 2, (y, x) => Math.atan2(y, x) / D2R],
        /** Angle in degrees from (x1, y1) to (x2, y2): 0 = right, 90 = down. */
        angle: [4, 4, (x1, y1, x2, y2) => Math.atan2(y2 - y1, x2 - x1) / D2R],
        deg: [1, 1, v => v / D2R],
        rad: [1, 1, v => v * D2R]
    };
    const UNIT_CONSTS = { pi: Math.PI, PI: Math.PI, e: Math.E, true: 1, false: 0 };

    function compileUnits(src) {
        const tokens = tokenizeUnits(src);
        let i = 0;
        const peek = () => tokens[i];
        const take = () => tokens[i++];
        const isOp = (t, v) => t && t.type === "op" && t.value === v;

        function ternary() {
            const c = or();
            if (!isOp(peek(), "?")) return c;
            take();
            const a = ternary();
            if (!isOp(take(), ":")) throw new Error(`MF.Units: missing ":" in "${src}"`);
            const b = ternary();
            return x => (c(x) ? a(x) : b(x));
        }
        function or() {
            let left = and();
            while (isOp(peek(), "||")) {
                take();
                const l = left;
                const r = and();
                left = b => (l(b) || r(b) ? 1 : 0);
            }
            return left;
        }
        function and() {
            let left = cmp();
            while (isOp(peek(), "&&")) {
                take();
                const l = left;
                const r = cmp();
                left = b => (l(b) && r(b) ? 1 : 0);
            }
            return left;
        }
        const CMP = {
            "<": (a, b) => a < b, ">": (a, b) => a > b, "<=": (a, b) => a <= b, ">=": (a, b) => a >= b,
            "==": (a, b) => Math.abs(a - b) < 1e-9, "!=": (a, b) => Math.abs(a - b) >= 1e-9
        };
        function cmp() {
            let left = expr();
            while (peek() && peek().type === "op" && CMP[peek().value]) {
                const f = CMP[take().value];
                const l = left;
                const r = expr();
                left = b => (f(l(b), r(b)) ? 1 : 0);
            }
            return left;
        }
        function expr() {
            let left = term();
            while (isOp(peek(), "+") || isOp(peek(), "-")) {
                const op = take().value;
                const l = left;
                const r = term();
                left = op === "+" ? b => l(b) + r(b) : b => l(b) - r(b);
            }
            return left;
        }
        function term() {
            let left = unary();
            while (isOp(peek(), "*") || isOp(peek(), "/")) {
                const op = take().value;
                const l = left;
                const r = unary();
                left = op === "*" ? b => l(b) * r(b) : b => {
                    const d = r(b);
                    return d === 0 ? 0 : l(b) / d;
                };
            }
            return left;
        }
        function unary() {
            if (isOp(peek(), "-")) {
                take();
                const v = unary();
                return b => -v(b);
            }
            if (isOp(peek(), "+")) {
                take();
                return unary();
            }
            if (isOp(peek(), "!")) {
                take();
                const v = unary();
                return b => (v(b) ? 0 : 1);
            }
            return power();
        }
        function power() {
            const base = factor();
            if (!isOp(peek(), "^")) return base;
            take();
            const e = unary();
            return b => Math.pow(base(b), e(b));
        }
        function factor() {
            const t = take();
            if (!t) throw new Error(`MF.Units: unexpected end in "${src}"`);
            if (t.type === "num") return () => t.value;
            if (t.type === "pct") return b => (b * t.value) / 100;
            if (t.type === "id") {
                if (isOp(peek(), "(")) {
                    const def = UNIT_FUNCS[t.value];
                    if (!def) throw new Error(`MF.Units: unknown function "${t.value}" in "${src}"`);
                    take();
                    const args = [];
                    if (!isOp(peek(), ")")) {
                        args.push(ternary());
                        while (isOp(peek(), ",")) {
                            take();
                            args.push(ternary());
                        }
                    }
                    if (!isOp(take(), ")")) throw new Error(`MF.Units: missing ")" after ${t.value}( in "${src}"`);
                    if (args.length < def[0] || args.length > def[1]) throw new Error(`MF.Units: ${t.value}() expects ${def[0] === def[1] ? def[0] : `${def[0]}+`} argument(s) in "${src}"`);
                    const fn = def[2];
                    if (t.value === "if") return b => (args[0](b) ? args[1](b) : args[2](b));
                    return b => fn(...args.map(a => a(b)));
                }
                if (Object.prototype.hasOwnProperty.call(UNIT_CONSTS, t.value)) {
                    const c = UNIT_CONSTS[t.value];
                    return () => c;
                }
                throw new Error(`MF.Units: unknown name "${t.value}" in "${src}"`);
            }
            if (isOp(t, "(")) {
                const v = ternary();
                if (!isOp(take(), ")")) throw new Error(`MF.Units: missing ")" in "${src}"`);
                return v;
            }
            throw new Error(`MF.Units: unexpected token "${t.value}" in "${src}"`);
        }

        const fn = ternary();
        if (i < tokens.length) throw new Error(`MF.Units: unexpected token "${tokens[i].value}" in "${src}"`);
        return fn;
    }

    const Units = {
        AUTO: "auto",
        /** @since 1.1.0 Names of expression functions and constants (for editors / autocompletion). */
        FUNCTIONS: Object.freeze(Object.keys(UNIT_FUNCS)),
        CONSTANTS: Object.freeze(Object.keys(UNIT_CONSTS)),
        /** @since 1.1.0 Arity of a function: { min, max } or null. */
        arity(name) {
            const d = Object.prototype.hasOwnProperty.call(UNIT_FUNCS, name) ? UNIT_FUNCS[name] : null;
            return d ? { min: d[0], max: d[1] } : null;
        },

        isAuto(value) {
            return value === "auto";
        },
        /** Whether the value contains relative units (%). */
        isRelative(value) {
            return Utils.isString(value) && value.includes("%");
        },
        /** Syntax check without evaluation. */
        isValid(value) {
            if (value == null || Utils.isNumber(value) || this.isAuto(value)) return true;
            try {
                this.compile(value);
                return true;
            } catch (e) {
                return false;
            }
        },
        compile(value) {
            const key = String(value);
            let fn = unitCache.get(key);
            if (fn instanceof Error) throw fn;
            if (!fn) {
                if (unitCache.size > 1000) unitCache.clear();
                try {
                    fn = compileUnits(key);
                } catch (e) {
                    unitCache.set(key, e);
                    throw e;
                }
                unitCache.set(key, fn);
            }
            return fn;
        },
        /**
         * Evaluate a value.
         * @param value   number | expression string | "auto" | null
         * @param base    base for percentages (container width/height)
         * @param options { auto: number or function for "auto", fallback, round }
         */
        resolve(value, base, options = {}) {
            const fallback = options.fallback !== undefined ? options.fallback : 0;
            let result;
            if (value == null || value === "") {
                result = fallback;
            } else if (Utils.isNumber(value)) {
                result = value;
            } else if (this.isAuto(value)) {
                const auto = options.auto;
                result = Utils.isFunction(auto) ? auto() : auto !== undefined ? auto : fallback;
            } else {
                try {
                    result = this.compile(value)(base || 0);
                } catch (e) {
                    if (!unitWarned.has(e.message)) {
                        if (unitWarned.size > 1000) unitWarned.clear();
                        unitWarned.add(e.message);
                        Log.warn(PLUGIN_NAME, e.message);
                    }
                    result = fallback;
                }
            }
            if (!Number.isFinite(result)) result = fallback;
            return options.round === false ? result : Math.round(result);
        },
        /** Convert pixels to percent (to store relative layouts). */
        toPercent(px, base, digits = 2) {
            return base ? `${MathX.toFixed((px / base) * 100, digits)}%` : "0%";
        }
    };

    //=========================================================================
    // MF.Anchor
    //=========================================================================

    const ANCHORS = {
        "top-left": [0, 0],
        top: [0.5, 0],
        "top-right": [1, 0],
        left: [0, 0.5],
        center: [0.5, 0.5],
        right: [1, 0.5],
        "bottom-left": [0, 1],
        bottom: [0.5, 1],
        "bottom-right": [1, 1]
    };

    const Anchor = {
        DEFAULT: "top-left",
        names() {
            return Object.keys(ANCHORS);
        },
        isValid(name) {
            return Object.prototype.hasOwnProperty.call(ANCHORS, name);
        },
        /** Factors [ax, ay] in range 0..1. */
        factors(name) {
            return ANCHORS[name] || ANCHORS[this.DEFAULT];
        },
        /**
         * Absolute coordinates of the element's top-left corner.
         * x/y is an offset from the container's anchor point; the element is aligned
         * by the same point (anchor "center" + x=0 => element is centered).
         */
        toAbsolute(name, x, y, width, height, containerW, containerH) {
            const [ax, ay] = this.factors(name);
            return {
                x: Math.round(containerW * ax - width * ax + x),
                y: Math.round(containerH * ay - height * ay + y)
            };
        },
        /** Inverse: absolute coordinates to anchor offset. */
        toRelative(name, absX, absY, width, height, containerW, containerH) {
            const [ax, ay] = this.factors(name);
            return {
                x: Math.round(absX - (containerW * ax - width * ax)),
                y: Math.round(absY - (containerH * ay - height * ay))
            };
        }
    };

    //=========================================================================
    // MF.Color
    //=========================================================================

    const Color = {
        /** Parse "#rgb", "#rrggbb", "#rrggbbaa", "rgb()", "rgba()" -> {r,g,b,a}. */
        parse(value) {
            if (value && Utils.isObject(value) && "r" in value) {
                return { r: value.r, g: value.g, b: value.b, a: value.a !== undefined ? value.a : 1 };
            }
            if (!Utils.isString(value)) return null;
            const s = value.trim().toLowerCase();
            let m = /^#([0-9a-f]{3,8})$/.exec(s);
            if (m) {
                let hex = m[1];
                if (hex.length === 3 || hex.length === 4) hex = hex.replace(/./g, c => c + c);
                if (hex.length !== 6 && hex.length !== 8) return null;
                return {
                    r: parseInt(hex.slice(0, 2), 16),
                    g: parseInt(hex.slice(2, 4), 16),
                    b: parseInt(hex.slice(4, 6), 16),
                    a: hex.length === 8 ? parseInt(hex.slice(6, 8), 16) / 255 : 1
                };
            }
            m = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)\s*(?:,\s*([\d.]+)\s*)?\)$/.exec(s);
            if (m) {
                return {
                    r: +m[1],
                    g: +m[2],
                    b: +m[3],
                    a: m[4] !== undefined ? +m[4] : 1
                };
            }
            return null;
        },
        isValid(value) {
            return this.parse(value) !== null;
        },
        toHex(c, withAlpha = false) {
            const col = this.parse(c);
            if (!col) return null;
            const h = n => MathX.clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
            return `#${h(col.r)}${h(col.g)}${h(col.b)}${withAlpha ? h(col.a * 255) : ""}`;
        },
        toRgba(c) {
            const col = this.parse(c);
            if (!col) return null;
            return `rgba(${Math.round(col.r)}, ${Math.round(col.g)}, ${Math.round(col.b)}, ${MathX.toFixed(col.a, 3)})`;
        },
        /** Number 0xRRGGBB (for PIXI tint). */
        toNumber(c) {
            const col = this.parse(c);
            if (!col) return 0xffffff;
            return (Math.round(col.r) << 16) | (Math.round(col.g) << 8) | Math.round(col.b);
        },
        lerp(a, b, t) {
            const ca = this.parse(a);
            const cb = this.parse(b);
            if (!ca || !cb) return null;
            return this.toRgba({
                r: MathX.lerp(ca.r, cb.r, t),
                g: MathX.lerp(ca.g, cb.g, t),
                b: MathX.lerp(ca.b, cb.b, t),
                a: MathX.lerp(ca.a, cb.a, t)
            });
        },
        withAlpha(c, alpha) {
            const col = this.parse(c);
            return col ? this.toRgba({ ...col, a: alpha }) : null;
        },
        /** Array [r, g, b, gray] for Sprite.setColorTone / setBlendColor. */
        toTone(c, gray = 0) {
            const col = this.parse(c);
            return col ? [col.r, col.g, col.b, gray] : [0, 0, 0, gray];
        }
    };

    //=========================================================================
    // MF.Hook
    //=========================================================================

    const hookRegistry = [];

    /** Wraps fn so its own errors are logged once and yield undefined. */
    function guard(fn, owner, name) {
        let reported = false;
        return function(...args) {
            try {
                return fn.apply(this, args);
            } catch (e) {
                if (!reported) {
                    reported = true;
                    Log.error(PLUGIN_NAME, `Safe hook ${owner || "unknown"} -> ${name} failed (further errors suppressed):`, e);
                }
                return undefined;
            }
        };
    }

    const Hook = {
        /**
         * Wraps a method. wrapper(original, ...args) is called with the object's this.
         * Calling original() without arguments passes the original arguments.
         * If the method is inherited (not an own property of target), original()
         * calls the parent's implementation as it is at call time.
         *   MF.Hook.alias(Scene_Menu.prototype, "create", function(orig) {
         *       orig();
         *       ...
         *   }, "MF_UIEditor");
         */
        alias(target, name, wrapper, owner = "unknown") {
            if (!target) {
                Log.error(PLUGIN_NAME, `Hook.alias: target is undefined (${owner}.${name})`);
                return false;
            }
            const original = target[name];
            if (original !== undefined && !Utils.isFunction(original)) {
                Log.error(PLUGIN_NAME, `Hook.alias: "${name}" is not a function (${owner})`);
                return false;
            }
            const noop = function() {};
            // Inherited method (not own): call the parent's CURRENT implementation at call time,
            // so plugins that patch the parent later are not bypassed.
            const own = Object.prototype.hasOwnProperty.call(target, name);
            const parent = Object.getPrototypeOf(target);
            const base = !original
                ? noop
                : own || !parent
                    ? original
                    : function(...a) {
                        const fn = parent[name];
                        return Utils.isFunction(fn) ? fn.apply(this, a) : undefined;
                    };
            target[name] = function(...args) {
                return wrapper.call(this, (...a) => base.apply(this, a.length ? a : args), ...args);
            };
            target[name]._mfOriginal = base;
            target[name]._mfOwner = owner;
            hookRegistry.push({ target, name, owner });
            Log.debug(PLUGIN_NAME, `hook ${owner} -> ${name}`);
            return true;
        },
        /**
         * Calls fn before the original. If fn returns false, the original is skipped.
         * options.safe — see Hook.after.
         */
        before(target, name, fn, owner, options = {}) {
            const call = options.safe ? guard(fn, owner, name) : fn;
            return this.alias(target, name, function(orig, ...args) {
                if (call.apply(this, args) === false) return undefined;
                return orig(...args);
            }, owner);
        },
        /**
         * Calls fn after the original: fn(result, ...args). A return !== undefined replaces the result.
         *
         * Error policy:
         *   By default errors propagate (like any MZ alias): the game shows the error
         *   screen, which is what a developer wants for bugs in core logic.
         *   options.safe = true isolates errors thrown by fn itself: they are logged
         *   (once per hook) and the original result is kept. Errors thrown by the
         *   original method and by other plugins in the chain are never swallowed.
         *   Use safe mode for optional, cosmetic extensions only.
         */
        after(target, name, fn, owner, options = {}) {
            const call = options.safe ? guard(fn, owner, name) : fn;
            return this.alias(target, name, function(orig, ...args) {
                const result = orig(...args);
                const replaced = call.call(this, result, ...args);
                return replaced === undefined ? result : replaced;
            }, owner);
        },
        /** List of installed hooks (for compatibility debugging). */
        list() {
            return hookRegistry.map(h => ({ name: h.name, owner: h.owner }));
        }
    };

    //=========================================================================
    // MF.Events
    //=========================================================================

    class EventEmitter {
        constructor() {
            this._listeners = new Map();
        }
        on(event, fn, context) {
            if (!this._listeners.has(event)) this._listeners.set(event, []);
            const entry = { fn, context, once: false };
            this._listeners.get(event).push(entry);
            return () => this._remove(event, entry);
        }
        once(event, fn, context) {
            const off = this.on(event, fn, context);
            const list = this._listeners.get(event);
            list[list.length - 1].once = true;
            return off;
        }
        off(event, fn) {
            if (!event) {
                this._listeners.clear();
                return;
            }
            if (!fn) {
                this._listeners.delete(event);
                return;
            }
            const list = this._listeners.get(event);
            if (!list) return;
            this._listeners.set(event, list.filter(e => e.fn !== fn));
        }
        emit(event, ...args) {
            const list = this._listeners.get(event);
            if (!list || list.length === 0) return false;
            for (const entry of list.slice()) {
                if (entry.once) this._remove(event, entry);
                try {
                    entry.fn.apply(entry.context, args);
                } catch (e) {
                    Log.error(PLUGIN_NAME, `Event "${event}" handler failed:`, e);
                }
            }
            return true;
        }
        listenerCount(event) {
            const list = this._listeners.get(event);
            return list ? list.length : 0;
        }
        _remove(event, entry) {
            const list = this._listeners.get(event);
            if (!list) return;
            const idx = list.indexOf(entry);
            if (idx >= 0) list.splice(idx, 1);
        }
    }

    const Events = {
        EventEmitter,
        bus: new EventEmitter()
    };

    //=========================================================================
    // MF.Script
    //=========================================================================

    const scriptCache = new Map();
    const scriptIssues = new Map(); // code -> { type, code, message, count }

    /**
     * Records a script problem. The console message and the bus event are
     * emitted only once per unique code+type, so per-frame conditions
     * do not flood the console. Occurrences are still counted.
     */
    function reportScriptIssue(type, code, message, error) {
        const key = `${type}|${code}`;
        const issue = scriptIssues.get(key);
        if (issue) {
            issue.count++;
            return;
        }
        const entry = { type, code, message, count: 1 };
        scriptIssues.set(key, entry);
        if (type === "blocked") {
            Log.warn(PLUGIN_NAME, `${message}\n  Code: ${code}`);
            Events.bus.emit("mf:scriptBlocked", { ...entry });
        } else {
            Log.error(PLUGIN_NAME, `${message}\n  Code: ${code}`, error);
            Events.bus.emit("mf:scriptError", { ...entry });
        }
    }

    const Script = {
        isAllowed() {
            return params.allowScript;
        },
        /**
         * Compiles an expression/code block. Keys of context are available
         * as variables. Example: MF.Script.run("a + b", { a: 1, b: 2 }).
         */
        compile(code, argNames = []) {
            const key = `${argNames.join(",")}|${code}`;
            let fn = scriptCache.get(key);
            if (!fn) {
                if (/^\s*return\b/.test(code)) {
                    fn = new Function(...argNames, code);
                } else {
                    try {
                        fn = new Function(...argNames, `return (${code.replace(/;\s*$/, "")}\n);`);
                    } catch (e) {
                        fn = new Function(...argNames, code);
                    }
                }
                scriptCache.set(key, fn);
            }
            return fn;
        },
        /**
         * Syntax check without execution. Works even when scripts are disabled,
         * so editors can validate input and warn the author up front.
         * Returns { ok: true } or { ok: false, message }.
         */
        validate(code, argNames = []) {
            try {
                this.compile(code, argNames);
                return { ok: true };
            } catch (e) {
                return { ok: false, message: e.message };
            }
        },
        run(code, context = {}, fallback) {
            if (!Utils.isString(code) || code.trim() === "") return fallback;
            if (!this.isAllowed()) {
                reportScriptIssue(
                    "blocked",
                    code,
                    `Script skipped: execution is disabled (MF_Core parameter "Allow Scripts"). Returning fallback: ${String(fallback)}.`
                );
                return fallback;
            }
            const names = Object.keys(context);
            try {
                return this.compile(code, names).apply(context.self || null, names.map(n => context[n]));
            } catch (e) {
                reportScriptIssue("error", code, `Script failed: ${e.message}`, e);
                return fallback;
            }
        },
        /**
         * Collected problems: [{ type: "blocked" | "error", code, message, count }].
         * Intended for editor/debug UIs that explain why a condition is false.
         */
        issues() {
            return Array.from(scriptIssues.values(), i => ({ ...i }));
        },
        clearIssues() {
            scriptIssues.clear();
        }
    };

    //=========================================================================
    // MF.Condition
    //=========================================================================
    //  { switch: 1 }                         — switch is ON
    //  { switch: 1, value: false }           — switch is OFF
    //  { variable: 5, op: ">=", value: 3 }   — variable comparison
    //  { selfSwitch: [mapId, eventId, "A"] } — self switch
    //  { partyHas: 3 }                       — actor 3 is in the party
    //  { item: 7, count: 2 }                 — party has >= 2 of item 7
    //  { gold: 100 }                         — gold >= 100
    //  { script: "$gameParty.size() > 1" }
    //  { all: [...] } / { any: [...] } / { not: {...} }
    //  true / false / null (null = true)
    //=========================================================================

    const COMPARATORS = {
        "==": (a, b) => a === b,
        "===": (a, b) => a === b,
        "!=": (a, b) => a !== b,
        "!==": (a, b) => a !== b,
        ">": (a, b) => a > b,
        ">=": (a, b) => a >= b,
        "<": (a, b) => a < b,
        "<=": (a, b) => a <= b
    };

    const conditionTypes = new Map();
    const conditionWarnings = new Set();

    /** Logs a condition problem once per unique message+condition (conditions run every frame). */
    function warnConditionOnce(message, cond, error) {
        let key;
        try {
            key = message + JSON.stringify(cond);
        } catch (e) {
            key = message;
        }
        if (conditionWarnings.has(key)) return;
        conditionWarnings.add(key);
        if (error) Log.error(PLUGIN_NAME, message, cond, error);
        else Log.warn(PLUGIN_NAME, message, cond);
    }

    const Condition = {
        compare(a, op, b) {
            const fn = COMPARATORS[op || "=="];
            if (!fn) {
                Log.warn(PLUGIN_NAME, `Unknown comparator "${op}"`);
                return false;
            }
            return fn(a, b);
        },
        /**
         * Registers a condition type. The type is detected by the presence of key.
         *   MF.Condition.register("level", (c, ctx) => ...);
         */
        register(key, fn) {
            conditionTypes.set(key, fn);
        },
        evaluate(cond, context = {}) {
            if (cond == null || cond === true) return true;
            if (cond === false) return false;
            if (Array.isArray(cond)) return cond.every(c => this.evaluate(c, context));
            if (!Utils.isObject(cond)) return !!cond;
            for (const [key, fn] of conditionTypes) {
                if (Object.prototype.hasOwnProperty.call(cond, key)) {
                    try {
                        return !!fn(cond, context);
                    } catch (e) {
                        warnConditionOnce(`Condition "${key}" failed:`, cond, e);
                        return false;
                    }
                }
            }
            warnConditionOnce("Unknown condition:", cond);
            return false;
        },
        /** Collects switch/variable ids the condition depends on. */
        dependencies(cond, out = { switches: new Set(), variables: new Set() }) {
            if (Array.isArray(cond)) {
                cond.forEach(c => this.dependencies(c, out));
            } else if (Utils.isObject(cond)) {
                if (cond.switch != null) out.switches.add(cond.switch);
                if (cond.variable != null) out.variables.add(cond.variable);
                if (cond.all) this.dependencies(cond.all, out);
                if (cond.any) this.dependencies(cond.any, out);
                if (cond.not) this.dependencies(cond.not, out);
            }
            return out;
        }
    };

    Condition.register("all", (c, ctx) => c.all.every(x => Condition.evaluate(x, ctx)));
    Condition.register("any", (c, ctx) => c.any.some(x => Condition.evaluate(x, ctx)));
    Condition.register("not", (c, ctx) => !Condition.evaluate(c.not, ctx));
    Condition.register("switch", c => {
        if (!window.$gameSwitches) return false;
        const expected = c.value === undefined ? true : !!c.value;
        return $gameSwitches.value(c.switch) === expected;
    });
    Condition.register("variable", c => {
        if (!window.$gameVariables) return false;
        const value = c.valueVariable != null ? $gameVariables.value(c.valueVariable) : c.value;
        return Condition.compare($gameVariables.value(c.variable), c.op, value);
    });
    Condition.register("selfSwitch", c => {
        if (!window.$gameSelfSwitches) return false;
        const expected = c.value === undefined ? true : !!c.value;
        return $gameSelfSwitches.value(c.selfSwitch) === expected;
    });
    Condition.register("partyHas", c => {
        if (!window.$gameParty) return false;
        return $gameParty.members().some(a => a.actorId() === c.partyHas);
    });
    Condition.register("item", c => {
        if (!window.$gameParty || !window.$dataItems) return false;
        return $gameParty.numItems($dataItems[c.item]) >= (c.count || 1);
    });
    Condition.register("weapon", c => {
        if (!window.$gameParty || !window.$dataWeapons) return false;
        return $gameParty.numItems($dataWeapons[c.weapon]) >= (c.count || 1);
    });
    Condition.register("armor", c => {
        if (!window.$gameParty || !window.$dataArmors) return false;
        return $gameParty.numItems($dataArmors[c.armor]) >= (c.count || 1);
    });
    Condition.register("gold", c => {
        if (!window.$gameParty) return false;
        return Condition.compare($gameParty.gold(), c.op || ">=", c.gold);
    });
    Condition.register("script", (c, ctx) => Script.run(c.script, ctx, false));

    //=========================================================================
    // MF.FS
    //=========================================================================

    const FS = {
        isAvailable() {
            return Utils.isNwjs() && typeof require === "function";
        },
        _node(name) {
            return this.isAvailable() ? require(name) : null;
        },
        /**
         * Project root folder (where index.html is). Cached.
         * Resolution order:
         *   1. process.mainModule.filename (what MZ core uses; deprecated in newer Node)
         *   2. window.location when it is a file:// URL
         *   3. process.cwd()
         */
        projectRoot() {
            if (this._root !== undefined) return this._root;
            const path = this._node("path");
            if (!path) return (this._root = "");
            let root = "";
            try {
                if (process.mainModule && process.mainModule.filename) {
                    root = path.dirname(process.mainModule.filename);
                }
            } catch (e) {
                root = "";
            }
            if (!root) {
                try {
                    if (window.location && window.location.protocol === "file:") {
                        let p = decodeURIComponent(window.location.pathname);
                        if (/^\/[A-Za-z]:/.test(p)) p = p.slice(1); // "/C:/..." on Windows
                        root = path.dirname(path.normalize(p));
                    }
                } catch (e) {
                    root = "";
                }
            }
            if (!root) {
                try {
                    root = process.cwd();
                } catch (e) {
                    root = "";
                }
            }
            if (!root) Log.warn(PLUGIN_NAME, "FS.projectRoot: unable to determine project root.");
            return (this._root = root);
        },
        /** Absolute path from project root: resolve("data/UILayouts.json"). */
        resolve(relPath) {
            const path = this._node("path");
            return path ? path.join(this.projectRoot(), relPath) : relPath;
        },
        exists(relPath) {
            const fs = this._node("fs");
            return !!fs && fs.existsSync(this.resolve(relPath));
        },
        ensureDir(relDir) {
            const fs = this._node("fs");
            if (!fs) return false;
            const abs = this.resolve(relDir);
            if (!fs.existsSync(abs)) fs.mkdirSync(abs, { recursive: true });
            return true;
        },
        readText(relPath) {
            const fs = this._node("fs");
            if (!fs) return null;
            const abs = this.resolve(relPath);
            return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
        },
        readJson(relPath, fallback = null) {
            const text = this.readText(relPath);
            return text == null ? fallback : Utils.parseJson(text, fallback);
        },
        /**
         * Atomic text write: temp file -> rename.
         * options.backup — keep the previous version as *.bak.
         */
        writeText(relPath, text, options = {}) {
            const fs = this._node("fs");
            const path = this._node("path");
            if (!fs || !path) {
                Log.warn(PLUGIN_NAME, "FS.writeText: file system is not available.");
                return false;
            }
            const abs = this.resolve(relPath);
            try {
                const dir = path.dirname(abs);
                if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
                if (options.backup && fs.existsSync(abs)) {
                    const ext = path.extname(abs);
                    const bak = abs.slice(0, abs.length - ext.length) + ".bak" + ext;
                    fs.copyFileSync(abs, bak);
                }
                const tmp = abs + ".tmp";
                fs.writeFileSync(tmp, text, "utf8");
                fs.renameSync(tmp, abs);
                return true;
            } catch (e) {
                Log.error(PLUGIN_NAME, `FS.writeText failed: ${relPath}`, e);
                return false;
            }
        },
        writeJson(relPath, data, options = {}) {
            const indent = options.indent !== undefined ? options.indent : 2;
            return this.writeText(relPath, JSON.stringify(data, null, indent), options);
        },
        remove(relPath) {
            const fs = this._node("fs");
            if (!fs) return false;
            const abs = this.resolve(relPath);
            if (fs.existsSync(abs)) fs.unlinkSync(abs);
            return true;
        },
        listFiles(relDir, extension) {
            const fs = this._node("fs");
            if (!fs) return [];
            const abs = this.resolve(relDir);
            if (!fs.existsSync(abs)) return [];
            return fs.readdirSync(abs).filter(f => !extension || f.toLowerCase().endsWith(extension.toLowerCase()));
        },

        /**
         * Async JSON loading by URL (works everywhere, including browsers).
         * Rejected errors carry err.code:
         *   "notFound" — 404, empty file:// response or network error
         *   "http"     — other HTTP error status
         *   "parse"    — file exists but contains invalid JSON
         */
        loadJson(url) {
            const fail = (code, message) => {
                const err = new Error(message);
                err.code = code;
                err.url = url;
                return err;
            };
            return new Promise((resolve, reject) => {
                const xhr = new XMLHttpRequest();
                xhr.open("GET", url);
                xhr.overrideMimeType("application/json");
                xhr.onload = () => {
                    if (xhr.status < 400 && (xhr.status !== 0 || xhr.responseText)) {
                        try {
                            resolve(JSON.parse(xhr.responseText));
                        } catch (e) {
                            reject(fail("parse", `Invalid JSON: ${url} (${e.message})`));
                        }
                    } else if (xhr.status === 404 || xhr.status === 0) {
                        reject(fail("notFound", `Not found: ${url}`));
                    } else {
                        reject(fail("http", `HTTP ${xhr.status}: ${url}`));
                    }
                };
                xhr.onerror = () => reject(fail("notFound", `Network error: ${url}`));
                xhr.send();
            });
        },

        /** Browser file download (fallback when fs is unavailable). */
        download(filename, text, mime = "application/json") {
            const blob = new Blob([text], { type: mime });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        },

        /** Save via fs when available, otherwise download. */
        saveJson(relPath, data, options = {}) {
            if (this.isAvailable()) return this.writeJson(relPath, data, options);
            const indent = options.indent !== undefined ? options.indent : 2;
            this.download(relPath.split(/[\\/]/).pop(), JSON.stringify(data, null, indent));
            return true;
        }
    };

    //=========================================================================
    // MF.Migration
    //=========================================================================

    const migrations = new Map();

    const Migration = {
        /**
         * Registers a migration step for format key from version from to from + 1.
         *   MF.Migration.register("UILayouts", 1, data => { ...; return data; });
         */
        register(key, fromVersion, fn) {
            if (!migrations.has(key)) migrations.set(key, new Map());
            migrations.get(key).set(fromVersion, fn);
        },
        /** Applies migrations up to targetVersion. Version field: data.version. */
        migrate(key, data, targetVersion) {
            if (!Utils.isObject(data)) return data;
            const steps = migrations.get(key);
            let version = Utils.isNumber(data.version) ? data.version : 0;
            let result = data;
            while (version < targetVersion) {
                const step = steps && steps.get(version);
                if (!step) {
                    Log.warn(PLUGIN_NAME, `No migration for "${key}" v${version} -> v${version + 1}`);
                    break;
                }
                result = step(result) || result;
                version++;
                result.version = version;
                Log.info(PLUGIN_NAME, `Migrated "${key}" to v${version}`);
            }
            return result;
        }
    };

    //=========================================================================
    // MF.Data — additional database files
    //=========================================================================

    const dataFiles = [];
    const dataErrors = [];

    const Data = {
        /**
         * Registers file data/<src> to be loaded together with the database.
         *   MF.Data.register("$dataUILayouts", "UILayouts.json", {
         *       optional: true,           // missing file is not an error
         *       default: { version: 1 },  // value used when the file is missing
         *       onLoad: data => data      // post-processing (migrations etc.)
         *   });
         *
         * Error handling:
         *   optional + file missing      -> default value, debug log only
         *   optional + invalid JSON/HTTP -> default value, console error,
         *                                   status().error is set, "mf:dataError" emitted
         *   required + any error         -> standard MZ load error screen with Retry;
         *                                   the database is NOT reported as loaded
         *   onLoad throws                -> treated as an invalid file (see above)
         */
        register(globalName, src, options = {}) {
            if (dataFiles.some(f => f.name === globalName)) {
                Log.warn(PLUGIN_NAME, `Data file "${globalName}" is already registered.`);
                return;
            }
            dataFiles.push({
                name: globalName,
                src,
                optional: options.optional !== false,
                defaultValue: options.default !== undefined ? options.default : {},
                onLoad: options.onLoad || null,
                state: "idle", // idle | pending | loaded | failed
                error: null,
                usedDefault: false
            });
            window[globalName] = null;
        },
        isLoaded() {
            return dataFiles.every(f => f.state === "loaded");
        },
        /**
         * Load status of a file:
         *   { state, error, usedDefault }
         * error is { code, message } or null. usedDefault is true when the
         * global holds the default value instead of file contents.
         * Editors must check this before overwriting a file that failed to parse.
         */
        status(globalName) {
            const file = dataFiles.find(f => f.name === globalName);
            if (!file) return null;
            return {
                state: file.state,
                error: file.error ? { ...file.error } : null,
                usedDefault: file.usedDefault
            };
        },
        /**
         * Forced reload (e.g. after saving in the editor).
         * Resolves with the new value; rejects on any error except
         * "optional file not found".
         */
        reload(globalName) {
            const file = dataFiles.find(f => f.name === globalName);
            if (!file) return Promise.reject(new Error(`Data file "${globalName}" is not registered.`));
            return this._load(file).then(() => {
                if (file.error && !(file.optional && file.error.code === "notFound")) {
                    const err = new Error(file.error.message);
                    err.code = file.error.code;
                    throw err;
                }
                return window[file.name];
            });
        },
        /** Throws a pending required-file error in the format SceneManager expects. */
        checkError() {
            if (dataErrors.length === 0) return;
            const { file, url } = dataErrors.shift();
            throw ["LoadError", url, () => this._load(file)];
        },
        _loadAll() {
            for (const file of dataFiles) this._load(file);
        },
        /** Always resolves; the outcome is stored in file.state / file.error. */
        _load(file) {
            file.state = "pending";
            file.error = null;
            file.usedDefault = false;
            const url = "data/" + file.src;
            return FS.loadJson(url)
                .then(data => this._process(file, data))
                .then(
                    value => this._succeed(file, value, false),
                    err => this._fail(file, url, err)
                );
        },
        _process(file, data) {
            if (!file.onLoad) return data;
            try {
                const processed = file.onLoad(data);
                return processed !== undefined ? processed : data;
            } catch (e) {
                const err = new Error(`onLoad failed for "${file.src}": ${e.message}`);
                err.code = "process";
                throw err;
            }
        },
        _succeed(file, value, usedDefault) {
            window[file.name] = value;
            file.state = "loaded";
            file.usedDefault = usedDefault;
            Events.bus.emit("mf:dataLoaded", file.name, value);
        },
        _fail(file, url, err) {
            file.error = { code: err.code || "unknown", message: err.message };
            if (file.optional) {
                if (err.code === "notFound") {
                    Log.debug(PLUGIN_NAME, `Optional data "${file.src}" not found, using default.`);
                } else {
                    Log.error(PLUGIN_NAME, `Data "${file.src}" is invalid, using default. ${err.message}`);
                    Events.bus.emit("mf:dataError", file.name, file.error);
                }
                this._succeed(file, Utils.clone(file.defaultValue), true);
                return;
            }
            file.state = "failed";
            Log.error(PLUGIN_NAME, `Required data "${file.src}" failed to load. ${err.message}`);
            Events.bus.emit("mf:dataError", file.name, file.error);
            dataErrors.push({ file, url });
        }
    };

    Hook.after(DataManager, "loadDatabase", function() {
        Data._loadAll();
    }, PLUGIN_NAME);

    Hook.alias(DataManager, "isDatabaseLoaded", function(orig) {
        Data.checkError();
        const loaded = orig();
        return loaded && Data.isLoaded();
    }, PLUGIN_NAME);

    //=========================================================================
    // MF.History — Undo/Redo
    //=========================================================================
    //  Command: { label?, do(), undo(), merge?(next) -> bool }
    //  merge allows combining consecutive changes of the same kind
    //  (e.g. dragging a window) into a single entry.
    //=========================================================================

    class History extends EventEmitter {
        constructor(limit = 100) {
            super();
            this._limit = limit;
            this._undo = [];
            this._redo = [];
            this._savedIndex = 0;
            this._batch = null;
        }
        execute(command) {
            command.do();
            this.push(command);
        }
        /** Adds an already executed command. */
        push(command) {
            if (this._batch) {
                this._batch.push(command);
                return;
            }
            if (this._savedIndex > this._undo.length) this._savedIndex = -1; // saved state was in the discarded redo branch
            const last = this._undo[this._undo.length - 1];
            if (last && Utils.isFunction(last.merge) && this._undo.length !== this._savedIndex && last.merge(command)) {
                this._redo.length = 0;
                this.emit("change");
                return;
            }
            this._undo.push(command);
            this._redo.length = 0;
            if (this._undo.length > this._limit) {
                this._undo.shift();
                this._savedIndex--;
            }
            this.emit("change");
        }
        /** Groups several commands into a single entry. */
        beginBatch() {
            if (!this._batch) {
                this._batch = [];
                this._batchDepth = 0;
            }
            this._batchDepth++;
        }
        endBatch(label = "batch") {
            if (!this._batch || --this._batchDepth > 0) return;
            const list = this._batch;
            this._batch = null;
            if (!list || list.length === 0) return;
            this.push({
                label,
                do: () => list.forEach(c => c.do()),
                undo: () => list.slice().reverse().forEach(c => c.undo())
            });
        }
        undo() {
            const cmd = this._undo.pop();
            if (!cmd) return false;
            cmd.undo();
            this._redo.push(cmd);
            this.emit("change");
            return true;
        }
        redo() {
            const cmd = this._redo.pop();
            if (!cmd) return false;
            cmd.do();
            this._undo.push(cmd);
            this.emit("change");
            return true;
        }
        canUndo() {
            return this._undo.length > 0;
        }
        canRedo() {
            return this._redo.length > 0;
        }
        clear() {
            this._undo.length = 0;
            this._redo.length = 0;
            this._savedIndex = 0;
            this.emit("change");
        }
        markSaved() {
            this._savedIndex = this._undo.length;
            this.emit("change");
        }
        isDirty() {
            return this._undo.length !== this._savedIndex;
        }
    }

    //=========================================================================
    // MF.Deprecation
    //=========================================================================
    //  Keeps old API working while it is phased out (see Versioning policy):
    //    MF.Deprecation.method(MF.Utils, "oldName", {
    //        since: "1.1.0", removeIn: "2.0.0",
    //        replacement: "MF.Utils.newName", fn: MF.Utils.newName
    //    });
    //=========================================================================

    const deprecations = new Map();

    function deprecationMessage(d) {
        let msg = `${d.id} is deprecated`;
        if (d.since) msg += ` since ${d.owner} ${d.since}`;
        if (d.removeIn) msg += ` and will be removed in ${d.removeIn}`;
        msg += ".";
        if (d.replacement) msg += ` Use ${d.replacement} instead.`;
        if (d.note) msg += ` ${d.note}`;
        return msg;
    }

    const Deprecation = {
        /**
         * Reports use of a deprecated API. Logged and emitted once per id;
         * further calls are only counted.
         * info: { since, removeIn, replacement, owner, note }
         */
        warn(id, info = {}) {
            let entry = deprecations.get(id);
            if (!entry) {
                entry = {
                    id,
                    since: info.since || null,
                    removeIn: info.removeIn || null,
                    replacement: info.replacement || null,
                    owner: info.owner || PLUGIN_NAME,
                    note: info.note || null,
                    count: 0
                };
                deprecations.set(id, entry);
            }
            entry.count++;
            if (entry.count === 1) {
                Log.warn(entry.owner, deprecationMessage(entry));
                Events.bus.emit("mf:deprecated", { ...entry });
            }
        },
        /**
         * Keeps obj[oldName] callable with a warning.
         *   info.fn set  -> obj[oldName] redirects to info.fn (renamed API)
         *   info.fn unset -> the existing obj[oldName] is wrapped (API to be removed)
         * info.id defaults to oldName; use a full name like "MF.Utils.oldName".
         */
        method(obj, oldName, info = {}) {
            const impl = info.fn || obj[oldName];
            if (!Utils.isFunction(impl)) {
                Log.error(PLUGIN_NAME, `Deprecation.method: "${oldName}" has no implementation.`);
                return false;
            }
            const id = info.id || oldName;
            obj[oldName] = function(...args) {
                Deprecation.warn(id, info);
                return impl.apply(this, args);
            };
            obj[oldName]._mfDeprecated = true;
            return true;
        },
        /** Redirects property obj[oldName] to obj[newName] (get and set). */
        property(obj, oldName, newName, info = {}) {
            const id = info.id || oldName;
            const full = { replacement: newName, ...info };
            Object.defineProperty(obj, oldName, {
                configurable: true,
                enumerable: false,
                get() {
                    Deprecation.warn(id, full);
                    return this[newName];
                },
                set(value) {
                    Deprecation.warn(id, full);
                    this[newName] = value;
                }
            });
            return true;
        },
        /** All deprecated APIs used in this session: [{ id, since, removeIn, replacement, owner, count }]. */
        list() {
            return Array.from(deprecations.values(), d => ({ ...d }));
        }
    };

    //=========================================================================
    // MF.Schema — validation and normalization
    //=========================================================================
    //  Schema fields:
    //    type        any | number | integer | string | boolean | array | object
    //                | units | color | anchor | condition | <registered type>
    //    default     value or function; applied by normalize() when missing
    //    required    (object properties) value must be present
    //    nullable    null is allowed
    //    enum        list of allowed values
    //    oneOf       list of alternative schemas
    //    validate    fn(value) -> true | error message
    //    number:  min, max          string: minLength, maxLength, pattern
    //    array:   items, minItems, maxItems
    //    object:  properties, additionalProperties (true | false | schema)
    //=========================================================================

    const schemaTypes = new Map();

    function schemaPath(path, key) {
        if (typeof key === "number") return `${path}[${key}]`;
        return path ? `${path}.${key}` : String(key);
    }

    function schemaDefault(schema) {
        return Utils.isFunction(schema.default) ? schema.default() : Utils.clone(schema.default);
    }

    function schemaCoerce(value, type) {
        if (!Utils.isString(value)) return value;
        const s = value.trim();
        switch (type) {
            case "number":
            case "integer":
                return s !== "" && Number.isFinite(Number(s)) ? Number(s) : value;
            case "boolean":
                return s === "true" ? true : s === "false" ? false : value;
            case "array":
            case "object":
                return /^[[{]/.test(s) ? Utils.parseJson(s, value) : value;
            default:
                return value;
        }
    }

    function schemaWalk(value, schema, path, errors, normalize) {
        if (!schema) return value;
        if (value === undefined) {
            return normalize && schema.default !== undefined ? schemaDefault(schema) : undefined;
        }
        if (value === null) {
            if (!schema.nullable) errors.push({ path, message: "must not be null" });
            return value;
        }
        if (normalize && schema.coerce !== false) value = schemaCoerce(value, schema.type);

        if (Array.isArray(schema.oneOf)) {
            for (const alt of schema.oneOf) {
                const altErrors = [];
                const v = schemaWalk(value, alt, path, altErrors, normalize);
                if (altErrors.length === 0) return v;
            }
            errors.push({ path, message: "does not match any allowed variant" });
            return value;
        }

        const type = schema.type || "any";
        const handler = schemaTypes.get(type);
        if (!handler) {
            errors.push({ path, message: `unknown schema type "${type}"` });
            return value;
        }
        const ctx = {
            path,
            normalize,
            error: message => {
                errors.push({ path, message });
            },
            child: (v, s, key) => schemaWalk(v, s, schemaPath(path, key), errors, normalize),
            errors
        };
        const before = errors.length;
        const result = handler(value, schema, ctx);
        if (result !== undefined) value = result;
        if (errors.length > before) return value;

        if (Array.isArray(schema.enum) && !schema.enum.some(e => Utils.equals(e, value))) {
            errors.push({ path, message: `must be one of ${JSON.stringify(schema.enum)}` });
        } else if (Utils.isFunction(schema.validate)) {
            const r = schema.validate(value);
            if (r !== true && r !== undefined && r !== null) errors.push({ path, message: String(r) });
        }
        return value;
    }

    const Schema = {
        /**
         * Registers a type: handler(value, schema, ctx) -> normalized value | undefined.
         * Report problems with ctx.error(message); validate nested values with
         * ctx.child(value, schema, key).
         */
        register(type, handler) {
            schemaTypes.set(type, handler);
        },
        /** Validation only. Returns { ok, errors: [{ path, message }] }. */
        validate(value, schema) {
            const errors = [];
            schemaWalk(value, schema, "", errors, false);
            return { ok: errors.length === 0, errors };
        },
        /**
         * Validation + defaults + coercion of string values ("12" -> 12, "true" -> true).
         * Returns { ok, value, errors }. The input is not mutated.
         */
        normalize(value, schema) {
            const errors = [];
            const result = schemaWalk(Utils.clone(value), schema, "", errors, true);
            return { ok: errors.length === 0, value: result, errors };
        },
        /** Like normalize(), but throws an Error listing all problems. */
        assert(value, schema, label = "value") {
            const r = this.normalize(value, schema);
            if (!r.ok) throw new Error(`${label} is invalid:\n${this.format(r.errors)}`);
            return r.value;
        },
        /** Human-readable error list. */
        format(errors) {
            return errors.map(e => `  - ${e.path || "(root)"}: ${e.message}`).join("\n");
        }
    };

    Schema.register("any", () => undefined);
    Schema.register("number", (v, s, ctx) => {
        if (!Utils.isNumber(v)) return ctx.error("must be a number");
        if (s.min !== undefined && v < s.min) ctx.error(`must be >= ${s.min}`);
        if (s.max !== undefined && v > s.max) ctx.error(`must be <= ${s.max}`);
    });
    Schema.register("integer", (v, s, ctx) => {
        if (!Number.isInteger(v)) return ctx.error("must be an integer");
        if (s.min !== undefined && v < s.min) ctx.error(`must be >= ${s.min}`);
        if (s.max !== undefined && v > s.max) ctx.error(`must be <= ${s.max}`);
    });
    Schema.register("string", (v, s, ctx) => {
        if (!Utils.isString(v)) return ctx.error("must be a string");
        if (s.minLength !== undefined && v.length < s.minLength) ctx.error(`must have at least ${s.minLength} characters`);
        if (s.maxLength !== undefined && v.length > s.maxLength) ctx.error(`must have at most ${s.maxLength} characters`);
        if (s.pattern) {
            const re = s.pattern instanceof RegExp ? s.pattern : new RegExp(s.pattern);
            if (!re.test(v)) ctx.error(`must match ${re}`);
        }
    });
    Schema.register("boolean", (v, s, ctx) => {
        if (typeof v !== "boolean") ctx.error("must be a boolean");
    });
    Schema.register("array", (v, s, ctx) => {
        if (!Array.isArray(v)) return ctx.error("must be an array");
        if (s.minItems !== undefined && v.length < s.minItems) ctx.error(`must have at least ${s.minItems} items`);
        if (s.maxItems !== undefined && v.length > s.maxItems) ctx.error(`must have at most ${s.maxItems} items`);
        return s.items ? v.map((item, i) => ctx.child(item, s.items, i)) : v;
    });
    Schema.register("object", (v, s, ctx) => {
        if (!Utils.isObject(v)) return ctx.error("must be an object");
        const props = s.properties || {};
        const out = {};
        for (const key of Object.keys(props)) {
            const propSchema = props[key];
            if (v[key] === undefined && propSchema.required) {
                ctx.errors.push({ path: schemaPath(ctx.path, key), message: "is required" });
                continue;
            }
            const r = ctx.child(v[key], propSchema, key);
            if (r !== undefined) out[key] = r;
        }
        const extra = s.additionalProperties === undefined ? true : s.additionalProperties;
        for (const key of Object.keys(v)) {
            if (Object.prototype.hasOwnProperty.call(props, key)) continue;
            if (extra === false) {
                ctx.errors.push({ path: schemaPath(ctx.path, key), message: "is not allowed" });
            } else if (Utils.isObject(extra)) {
                out[key] = ctx.child(v[key], extra, key);
            } else {
                out[key] = v[key];
            }
        }
        return out;
    });
    Schema.register("units", (v, s, ctx) => {
        if (!Utils.isNumber(v) && !Utils.isString(v)) return ctx.error("must be a number or a units expression");
        if (!Units.isValid(v)) ctx.error(`invalid units expression "${v}"`);
    });
    Schema.register("color", (v, s, ctx) => {
        if (!Color.isValid(v)) ctx.error(`invalid color "${v}"`);
    });
    Schema.register("anchor", (v, s, ctx) => {
        if (!Anchor.isValid(v)) ctx.error(`invalid anchor "${v}" (expected ${Anchor.names().join(", ")})`);
    });
    Schema.register("condition", (v, s, ctx) => {
        if (!(typeof v === "boolean" || Array.isArray(v) || Utils.isObject(v))) {
            ctx.error("must be a condition object, array or boolean");
        }
    });

    //=========================================================================
    // MF.Save — plugin state stored inside save files
    //=========================================================================
    //  Stored in the save contents as contents.mf = { key: { v, data } }.
    //  Data should be plain JSON-like (class instances survive only if their
    //  constructor is a global, as with any MZ save data).
    //=========================================================================

    const SAVE_KEY = "mf";
    const saveEntries = new Map();
    let saveStore = {};
    let saveOrphans = {};

    function saveMakeDefault(entry) {
        const d = entry.defaultValue;
        if (Utils.isFunction(d)) return d();
        return d === undefined ? {} : Utils.clone(d);
    }

    const Save = {
        /**
         * Registers a save slot for a plugin.
         *   MF.Save.register("MF_QuestLog", {
         *       default: () => ({ quests: {} }),   // value or factory
         *       version: 2,                         // data format version
         *       migrate: (data, fromVersion) => data,
         *       mergeDefaults: true,                // add new default fields to old saves
         *       onSave: data => data,               // before writing (return a copy to transform)
         *       onLoad: data => data                // after reading
         *   });
         */
        register(key, options = {}) {
            if (saveEntries.has(key)) {
                Log.warn(PLUGIN_NAME, `Save key "${key}" is already registered.`);
                return;
            }
            saveEntries.set(key, {
                key,
                version: options.version || 1,
                defaultValue: options.default,
                migrate: options.migrate || null,
                mergeDefaults: options.mergeDefaults !== false,
                onSave: options.onSave || null,
                onLoad: options.onLoad || null
            });
        },
        isRegistered(key) {
            return saveEntries.has(key);
        },
        /** Current data of a key (mutable reference). */
        get(key) {
            const entry = saveEntries.get(key);
            if (!entry) {
                Log.warn(PLUGIN_NAME, `Save key "${key}" is not registered.`);
                return undefined;
            }
            if (!Object.prototype.hasOwnProperty.call(saveStore, key)) saveStore[key] = saveMakeDefault(entry);
            return saveStore[key];
        },
        set(key, value) {
            if (!saveEntries.has(key)) {
                Log.warn(PLUGIN_NAME, `Save key "${key}" is not registered.`);
                return;
            }
            saveStore[key] = value;
        },
        reset(key) {
            const entry = saveEntries.get(key);
            if (entry) saveStore[key] = saveMakeDefault(entry);
        },
        keys() {
            return Array.from(saveEntries.keys());
        },

        _resetAll() {
            saveStore = {};
            saveOrphans = {};
            for (const entry of saveEntries.values()) saveStore[entry.key] = saveMakeDefault(entry);
        },
        _serialize() {
            // Data of plugins that are currently disabled is preserved, not dropped.
            const out = Utils.clone(saveOrphans);
            for (const entry of saveEntries.values()) {
                let data = this.get(entry.key);
                if (entry.onSave) {
                    try {
                        const r = entry.onSave(data);
                        if (r !== undefined) data = r;
                    } catch (e) {
                        Log.error(PLUGIN_NAME, `Save onSave failed for "${entry.key}":`, e);
                    }
                }
                out[entry.key] = { v: entry.version, data };
            }
            return out;
        },
        _deserialize(stored) {
            this._resetAll();
            if (!Utils.isObject(stored)) return; // save made without MF_Core
            for (const key of Object.keys(stored)) {
                const record = stored[key];
                const entry = saveEntries.get(key);
                if (!entry) {
                    saveOrphans[key] = record;
                    continue;
                }
                if (!Utils.isObject(record)) continue;
                let data = record.data;
                const version = Utils.isNumber(record.v) ? record.v : 1;
                try {
                    if (version < entry.version && entry.migrate) {
                        const r = entry.migrate(data, version);
                        if (r !== undefined) data = r;
                    } else if (version > entry.version) {
                        Log.warn(PLUGIN_NAME, `Save data "${key}" v${version} is newer than supported v${entry.version}.`);
                    }
                    if (entry.mergeDefaults && Utils.isPlainObject(data)) {
                        const def = saveMakeDefault(entry);
                        if (Utils.isPlainObject(def)) data = Utils.merge(def, data);
                    }
                    if (entry.onLoad) {
                        const r = entry.onLoad(data);
                        if (r !== undefined) data = r;
                    }
                } catch (e) {
                    // Keep the raw data: replacing it with defaults would lose it on the next save.
                    Log.error(PLUGIN_NAME, `Save data "${key}" failed to load; raw data kept.`, e);
                    Events.bus.emit("mf:saveError", key, e);
                    data = record.data;
                }
                saveStore[key] = data;
            }
            Events.bus.emit("mf:saveLoaded");
        }
    };

    Hook.after(DataManager, "createGameObjects", function() {
        Save._resetAll();
    }, PLUGIN_NAME);

    Hook.after(DataManager, "makeSaveContents", function(contents) {
        if (contents) contents[SAVE_KEY] = Save._serialize();
    }, PLUGIN_NAME);

    Hook.after(DataManager, "extractSaveContents", function(result, contents) {
        Save._deserialize(contents ? contents[SAVE_KEY] : null);
    }, PLUGIN_NAME);

    //=========================================================================
    // MF.Config — plugin settings stored in config.rmmzsave
    //=========================================================================

    const CONFIG_KEY = "mf";
    const configEntries = new Map();
    let configRaw = {};
    const configValues = {};

    const Config = {
        /**
         * Registers a global (not per-save) setting.
         *   MF.Config.register("MF_UIEditor.theme", "default");
         * options.schema — validated on load; invalid stored values fall back to the default.
         */
        register(key, defaultValue, options = {}) {
            if (configEntries.has(key)) {
                Log.warn(PLUGIN_NAME, `Config key "${key}" is already registered.`);
                return;
            }
            const entry = { key, defaultValue, schema: options.schema || null };
            configEntries.set(key, entry);
            configValues[key] = this._readRaw(entry);
        },
        isRegistered(key) {
            return configEntries.has(key);
        },
        get(key) {
            if (!configEntries.has(key)) {
                Log.warn(PLUGIN_NAME, `Config key "${key}" is not registered.`);
                return undefined;
            }
            return configValues[key];
        },
        /** options.save — write config.rmmzsave immediately. */
        set(key, value, options = {}) {
            if (!configEntries.has(key)) {
                Log.warn(PLUGIN_NAME, `Config key "${key}" is not registered.`);
                return;
            }
            const old = configValues[key];
            configValues[key] = value;
            if (!Utils.equals(old, value)) Events.bus.emit("mf:configChanged", key, value, old);
            if (options.save) this.save();
        },
        reset(key, options = {}) {
            const entry = configEntries.get(key);
            if (entry) this.set(key, Utils.clone(entry.defaultValue), options);
        },
        save() {
            if (window.ConfigManager && ConfigManager.save) ConfigManager.save();
        },
        keys() {
            return Array.from(configEntries.keys());
        },
        _readRaw(entry) {
            if (!Object.prototype.hasOwnProperty.call(configRaw, entry.key)) return Utils.clone(entry.defaultValue);
            const value = configRaw[entry.key];
            if (entry.schema) {
                const r = Schema.normalize(value, entry.schema);
                if (!r.ok) {
                    Log.warn(PLUGIN_NAME, `Config "${entry.key}" is invalid, using default.\n${Schema.format(r.errors)}`);
                    return Utils.clone(entry.defaultValue);
                }
                return r.value;
            }
            return value;
        },
        _makeData() {
            // Unknown keys (disabled plugins) are preserved.
            const out = Utils.clone(configRaw);
            for (const key of configEntries.keys()) out[key] = Utils.clone(configValues[key]);
            return out;
        },
        _applyData(stored) {
            configRaw = Utils.isObject(stored) ? stored : {};
            for (const entry of configEntries.values()) configValues[entry.key] = this._readRaw(entry);
            Events.bus.emit("mf:configLoaded");
        }
    };

    if (window.ConfigManager) {
        Hook.after(ConfigManager, "makeData", function(config) {
            if (config) config[CONFIG_KEY] = Config._makeData();
        }, PLUGIN_NAME);

        Hook.after(ConfigManager, "applyData", function(result, config) {
            Config._applyData(config ? config[CONFIG_KEY] : null);
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.I18n — localization
    //=========================================================================
    //  Keys: "namespace:path.to.key".
    //  Locale chain: current ("ru-RU") -> language ("ru") -> fallback ("en").
    //  Plural forms: { one: "...", few: "...", many: "...", other: "..." }
    //  selected by params.count (Intl.PluralRules); optional "zero".
    //=========================================================================

    const LOCALE_CONFIG_KEY = "MF_Core.locale";
    const i18nDicts = {}; // locale -> namespace -> dictionary
    const i18nMissing = new Set();
    let i18nLocale = null;

    function normalizeLocale(locale) {
        if (!Utils.isString(locale) || locale === "") return "";
        const parts = locale.replace(/_/g, "-").split("-");
        const lang = parts[0].toLowerCase();
        return parts.length > 1 ? `${lang}-${parts[1].toUpperCase()}` : lang;
    }

    function pluralCategory(locale, count) {
        try {
            return new Intl.PluralRules(locale).select(count);
        } catch (e) {
            return count === 1 ? "one" : "other";
        }
    }

    const I18n = {
        fallbackLocale: "en",

        /**
         * Registers translations of a namespace:
         *   MF.I18n.register("MF_QuestLog", {
         *       en: { title: "Quests", count: { one: "{count} quest", other: "{count} quests" } },
         *       pl: { title: "Zadania", count: { one: "{count} zadanie", few: "{count} zadania", many: "{count} zadan" } }
         *   });
         * Repeated registration deep-merges.
         */
        register(namespace, byLocale) {
            for (const loc of Object.keys(byLocale || {})) {
                const key = normalizeLocale(loc);
                i18nDicts[key] = i18nDicts[key] || {};
                i18nDicts[key][namespace] = Utils.merge(i18nDicts[key][namespace] || {}, byLocale[loc]);
            }
        },
        /** Loads data from a JSON file into namespace/locale. */
        load(namespace, locale, url) {
            return FS.loadJson(url).then(data => {
                this.register(namespace, { [locale]: data });
                return data;
            });
        },
        /** Detected locale: $dataSystem.locale, then browser language, then fallback. */
        detectLocale() {
            const sys = window.$dataSystem && $dataSystem.locale;
            const nav = window.navigator && navigator.language;
            return normalizeLocale(sys || nav || this.fallbackLocale);
        },
        /** Current locale: setLocale() > saved player choice > detected. */
        locale() {
            if (i18nLocale) return i18nLocale;
            const saved = Config.get(LOCALE_CONFIG_KEY);
            return saved ? normalizeLocale(saved) : this.detectLocale();
        },
        /** options.persist — remember the choice in config.rmmzsave. */
        setLocale(locale, options = {}) {
            const old = this.locale();
            i18nLocale = normalizeLocale(locale) || null;
            if (options.persist) Config.set(LOCALE_CONFIG_KEY, i18nLocale, { save: true });
            if (old !== this.locale()) Events.bus.emit("mf:localeChanged", this.locale(), old);
        },
        /** Locales that have at least one registered namespace. */
        locales() {
            return Object.keys(i18nDicts);
        },
        /** Lookup chain for a locale. */
        chain(locale = this.locale()) {
            const list = [locale, locale.split("-")[0], normalizeLocale(this.fallbackLocale)];
            return list.filter((l, i) => l && list.indexOf(l) === i);
        },
        _lookup(key) {
            const idx = key.indexOf(":");
            const ns = idx >= 0 ? key.slice(0, idx) : "global";
            const path = idx >= 0 ? key.slice(idx + 1) : key;
            for (const loc of this.chain()) {
                const dict = i18nDicts[loc] && i18nDicts[loc][ns];
                const value = dict ? Utils.get(dict, path) : undefined;
                if (value !== undefined) return { value, locale: loc };
            }
            return null;
        },
        has(key) {
            return this._lookup(key) !== null;
        },
        /**
         * Translates a key. params are substituted into "{name}" placeholders.
         * Missing keys return options.fallback or the key itself (warned once).
         */
        t(key, params = {}, options = {}) {
            const found = this._lookup(key);
            if (!found) {
                if (!i18nMissing.has(key)) {
                    i18nMissing.add(key);
                    Log.warn(PLUGIN_NAME, `I18n: missing key "${key}" for locale "${this.locale()}".`);
                }
                return options.fallback !== undefined ? options.fallback : key;
            }
            let value = found.value;
            if (Utils.isObject(value)) {
                const count = params.count;
                if (Utils.isNumber(count)) {
                    if (count === 0 && value.zero !== undefined) value = value.zero;
                    else {
                        const form = value[pluralCategory(found.locale, count)];
                        value = form !== undefined ? form : value.other;
                    }
                } else {
                    value = value.other;
                }
            }
            return value === undefined ? key : Utils.format(value, params);
        },
        /** Namespaced translator: const t = MF.I18n.translator("MF_QuestLog"); t("title"). */
        translator(namespace) {
            return (key, params, options) => this.t(`${namespace}:${key}`, params, options);
        },
        /** Keys reported missing in this session. */
        missing() {
            return Array.from(i18nMissing);
        }
    };

    Config.register(LOCALE_CONFIG_KEY, null);

    //=========================================================================
    // MF.Ticker — per-frame update runner
    //=========================================================================
    //  Runs while the current scene is started and the game window is active,
    //  once per game frame (60 fps). Entries are bound to the scene in which
    //  they were created and are cancelled on scene change unless persistent.
    //=========================================================================

    const tickers = [];

    function currentScene() {
        return window.SceneManager ? SceneManager._scene : null;
    }

    const Ticker = {
        frame: 0,

        /**
         * Adds fn(frame) called every frame. Return false from fn to stop.
         * options: { persistent, context, onCancel }
         * Returns a handle { remove(), isActive() }.
         */
        add(fn, options = {}) {
            const entry = {
                fn,
                context: options.context || null,
                scene: options.persistent ? null : (options.scene || currentScene()),
                persistent: !!options.persistent,
                onCancel: options.onCancel || null,
                active: true
            };
            tickers.push(entry);
            return {
                remove: () => this._remove(entry, false),
                isActive: () => entry.active
            };
        },
        update() {
            this.frame++;
            const scene = currentScene();
            for (const entry of tickers.slice()) {
                if (!entry.active) continue;
                if (!entry.persistent && entry.scene !== scene) {
                    this._remove(entry, true);
                    continue;
                }
                let result;
                try {
                    result = entry.fn.call(entry.context, this.frame);
                } catch (e) {
                    Log.error(PLUGIN_NAME, "Ticker callback failed and was removed:", e);
                    this._remove(entry, true);
                    continue;
                }
                if (result === false) this._remove(entry, false);
            }
        },
        count() {
            return tickers.length;
        },
        /** Cancels everything (onCancel callbacks are called). */
        clear() {
            for (const entry of tickers.slice()) this._remove(entry, true);
        },
        _remove(entry, cancelled) {
            if (!entry.active) return;
            entry.active = false;
            const idx = tickers.indexOf(entry);
            if (idx >= 0) tickers.splice(idx, 1);
            if (cancelled && entry.onCancel) {
                try {
                    entry.onCancel();
                } catch (e) {
                    Log.error(PLUGIN_NAME, "Ticker onCancel failed:", e);
                }
            }
        }
    };

    if (window.SceneManager) {
        Hook.after(SceneManager, "updateScene", function() {
            const scene = this._scene;
            const active = !Utils.isFunction(this.isGameActive) || this.isGameActive();
            if (scene && scene.isStarted() && active) Ticker.update();
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Tween — property animation
    //=========================================================================
    //  Durations are in frames (60 = one second).
    //    await MF.Tween.to(sprite, { x: 300, opacity: 0 }, { duration: 30, easing: "easeOutQuad" });
    //=========================================================================

    const activeTweens = new Set();

    class Tween {
        /**
         * @param target  object to animate
         * @param to      { prop: endValue } — props may be paths: "scale.x"
         * @param options { duration=30, delay=0, easing="linear", repeat=0 (-1 = infinite),
         *                  yoyo=false, round=false, from, persistent, group,
         *                  onStart, onUpdate(progress), onRepeat, onComplete }
         */
        constructor(target, to, options = {}) {
            this.target = target;
            this.options = options;
            this.group = options.group || null;
            this._duration = Math.max(0, options.duration !== undefined ? options.duration : 30);
            this._delay = Math.max(0, options.delay || 0);
            this._easing = options.easing || "linear";
            this._repeat = options.repeat || 0;
            this._yoyo = !!options.yoyo;
            this._round = !!options.round;
            this._to = { ...to };
            this._from = options.from ? { ...options.from } : null;
            this._elapsed = 0;
            this._cycle = 0;
            this._reversed = false;
            this._started = false;
            this._paused = false;
            this._state = "running"; // running | done | stopped
            this.promise = new Promise(resolve => (this._resolve = resolve));
            if (this._from) this._apply(this._from); // immediate render of start values
            this._ticker = Ticker.add(() => this._step(), {
                persistent: options.persistent,
                scene: options.scene,
                onCancel: () => this._end(false)
            });
            activeTweens.add(this);
        }
        /** Promise-like: await tween / tween.then(...). Resolves true on completion, false if stopped. */
        then(onFulfilled, onRejected) {
            return this.promise.then(onFulfilled, onRejected);
        }
        isActive() {
            return this._state === "running";
        }
        isPaused() {
            return this._paused;
        }
        pause() {
            this._paused = true;
            return this;
        }
        resume() {
            this._paused = false;
            return this;
        }
        /** Stops at the current values. */
        stop() {
            this._end(false);
            return this;
        }
        /** Jumps to the end values and completes. */
        finish() {
            if (this._state !== "running") return this;
            if (!this._started) this._begin();
            this._apply(this._endValues());
            this._end(true);
            return this;
        }

        _endValues() {
            // With yoyo the final position depends on the direction of the last cycle.
            if (this._repeat === -1) return this._to;
            const lastReversed = this._yoyo && this._repeat % 2 === 1;
            return lastReversed ? this._from : this._to;
        }
        _begin() {
            this._started = true;
            if (!this._from) {
                this._from = {};
                for (const key of Object.keys(this._to)) this._from[key] = Utils.get(this.target, key);
            }
            for (const key of Object.keys(this._to)) {
                if (!Utils.isNumber(this._from[key]) || !Utils.isNumber(this._to[key])) {
                    Log.warn(PLUGIN_NAME, `Tween: property "${key}" is not numeric and is skipped.`);
                    delete this._to[key];
                    delete this._from[key];
                }
            }
            this._call("onStart");
        }
        _step() {
            if (this._state !== "running") return false;
            if (this.target && (this.target.destroyed || this.target._destroyed)) {
                this._end(false);
                return false;
            }
            if (this._paused) return true;
            if (this._delay > 0) {
                this._delay--;
                return true;
            }
            if (!this._started) this._begin();
            this._elapsed++;
            const t = this._duration === 0 ? 1 : Math.min(1, this._elapsed / this._duration);
            const k = MathX.ease(this._easing, this._reversed ? 1 - t : t);
            this._interpolate(k);
            this._call("onUpdate", t);
            if (t < 1) return true;

            if (this._repeat === -1 || this._cycle < this._repeat) {
                this._cycle++;
                this._elapsed = 0;
                if (this._yoyo) this._reversed = !this._reversed;
                this._call("onRepeat", this._cycle);
                return true;
            }
            this._end(true);
            return false;
        }
        _interpolate(k) {
            const values = {};
            for (const key of Object.keys(this._to)) values[key] = MathX.lerp(this._from[key], this._to[key], k);
            this._apply(values);
        }
        _apply(values) {
            for (const key of Object.keys(values)) {
                const v = values[key];
                Utils.set(this.target, key, this._round && Utils.isNumber(v) ? Math.round(v) : v);
            }
        }
        _call(name, ...args) {
            const fn = this.options[name];
            if (!Utils.isFunction(fn)) return;
            try {
                fn.call(this, ...args);
            } catch (e) {
                Log.error(PLUGIN_NAME, `Tween ${name} failed:`, e);
            }
        }
        _end(completed) {
            if (this._state !== "running") return;
            this._state = completed ? "done" : "stopped";
            activeTweens.delete(this);
            if (this._ticker) this._ticker.remove();
            if (completed) this._call("onComplete");
            this._resolve(completed);
        }

        //--- Static API -----------------------------------------------------

        static to(target, to, options) {
            return new Tween(target, to, options);
        }
        static from(target, from, options = {}) {
            const to = {};
            for (const key of Object.keys(from)) to[key] = Utils.get(target, key);
            return new Tween(target, to, { ...options, from });
        }
        static fromTo(target, from, to, options = {}) {
            return new Tween(target, to, { ...options, from });
        }
        /** Tweens a plain number: MF.Tween.value(0, 100, { duration: 20 }, v => ...). */
        static value(from, to, options = {}, onValue) {
            const proxy = { value: from };
            return new Tween(proxy, { value: to }, {
                ...options,
                from: { value: from },
                onUpdate(progress) {
                    if (onValue) onValue(proxy.value, progress);
                    if (options.onUpdate) options.onUpdate.call(this, progress);
                }
            });
        }
        /** Stops all tweens of a target (optionally jumping to their end). */
        static killTweensOf(target, finish = false) {
            for (const tw of Array.from(activeTweens)) {
                if (tw.target === target) finish ? tw.finish() : tw.stop();
            }
        }
        static isTweening(target) {
            for (const tw of activeTweens) if (tw.target === target) return true;
            return false;
        }
        /** Stops all tweens, or all of a group. */
        static stopAll(group) {
            for (const tw of Array.from(activeTweens)) {
                if (group === undefined || tw.group === group) tw.stop();
            }
        }
        static count() {
            return activeTweens.size;
        }
    }

    //=========================================================================
    // MF.Timer — frame-based waits and delays
    //=========================================================================

    const Timer = {
        /**
         * Promise resolved after n frames: true when elapsed,
         * false if cancelled by a scene change (unless options.persistent).
         */
        wait(frames, options = {}) {
            return new Promise(resolve => {
                let left = Math.max(0, frames);
                if (left === 0) return resolve(true);
                Ticker.add(() => {
                    if (--left > 0) return true;
                    resolve(true);
                    return false;
                }, { persistent: options.persistent, scene: options.scene, onCancel: () => resolve(false) });
            });
        },
        /** Calls fn after n frames. Returns { cancel() }. */
        after(frames, fn, options = {}) {
            let left = Math.max(1, frames);
            const handle = Ticker.add(() => {
                if (--left > 0) return true;
                fn();
                return false;
            }, options);
            return { cancel: () => handle.remove(), isActive: handle.isActive };
        },
        /**
         * Calls fn(count) every n frames. Return false from fn to stop.
         * options.times — maximum number of calls.
         */
        every(frames, fn, options = {}) {
            const period = Math.max(1, frames);
            let left = period;
            let count = 0;
            const handle = Ticker.add(() => {
                if (--left > 0) return true;
                left = period;
                count++;
                if (fn(count) === false) return false;
                return !(options.times && count >= options.times);
            }, options);
            return { cancel: () => handle.remove(), isActive: handle.isActive };
        },
        /**
         * Promise resolved when predicate() becomes truthy (checked once per frame):
         * true when satisfied, false if cancelled by a scene change.
         * options: { persistent, timeout (frames) } — timeout resolves false.
         */
        until(predicate, options = {}) {
            return new Promise(resolve => {
                let frames = 0;
                const check = () => {
                    try {
                        return !!predicate();
                    } catch (e) {
                        Log.error(PLUGIN_NAME, "Timer.until predicate failed:", e);
                        return true;
                    }
                };
                if (check()) return resolve(true);
                Ticker.add(() => {
                    if (check()) {
                        resolve(true);
                        return false;
                    }
                    if (options.timeout && ++frames >= options.timeout) {
                        resolve(false);
                        return false;
                    }
                    return true;
                }, { persistent: options.persistent, scene: options.scene, onCancel: () => resolve(false) });
            });
        }
    };

    //=========================================================================
    // MF.Queue — sequential async task queue
    //=========================================================================
    //  const q = new MF.Queue();
    //  q.add(() => MF.Tween.to(a, { x: 100 }));
    //  q.add(() => MF.Timer.wait(30));
    //  q.add(() => $gameMessage.add("Done"));
    //=========================================================================

    class Queue extends EventEmitter {
        constructor(options = {}) {
            super();
            this._tasks = [];
            this._running = false;
            this._paused = !!options.paused;
        }
        /**
         * Adds a task: fn() returning a value, a Promise or a Tween.
         * Returns a Promise of the task result. Cancelled tasks (clear())
         * resolve with undefined; failed tasks reject, and the queue continues.
         * The failure is always logged and emitted as "error"; the returned promise
         * is pre-marked as handled, so fire-and-forget add() calls never trigger
         * MZ's unhandled-rejection error screen (await still receives the error).
         */
        add(fn, label = null) {
            const promise = new Promise((resolve, reject) => {
                this._tasks.push({ fn, label, resolve, reject });
                this._next();
            });
            promise.catch(() => {});
            return promise;
        }
        get size() {
            return this._tasks.length;
        }
        isRunning() {
            return this._running;
        }
        pause() {
            this._paused = true;
        }
        resume() {
            this._paused = false;
            this._next();
        }
        /** Drops pending tasks (the running one finishes). */
        clear() {
            const tasks = this._tasks.splice(0);
            for (const task of tasks) task.resolve(undefined);
        }
        _next() {
            if (this._running || this._paused) return;
            const task = this._tasks.shift();
            if (!task) {
                this.emit("empty");
                return;
            }
            this._running = true;
            let result;
            try {
                result = task.fn();
            } catch (e) {
                result = Promise.reject(e);
            }
            Promise.resolve(result).then(
                value => {
                    this._running = false;
                    task.resolve(value);
                    this._next();
                },
                error => {
                    this._running = false;
                    Log.error(PLUGIN_NAME, `Queue task${task.label ? ` "${task.label}"` : ""} failed:`, error);
                    this.emit("error", error, task.label);
                    task.reject(error);
                    this._next();
                }
            );
        }
    }

    //=========================================================================
    // MF.Layout — Units + Anchor layout for display objects  [experimental]
    //=========================================================================
    //  Layout spec:
    //    { x, y, width, height, anchor,
    //      minWidth, maxWidth, minHeight, maxHeight,   // units, relative to container
    //      rows,                                       // windows: "auto" height in rows
    //      fit }                                       // sprites: none|stretch|contain|cover
    //  x/y are offsets from the container anchor point (see MF.Anchor).
    //=========================================================================

    function clampSize(value, min, max, base) {
        let v = value;
        if (min !== undefined && min !== null) v = Math.max(v, Units.resolve(min, base));
        if (max !== undefined && max !== null) v = Math.min(v, Units.resolve(max, base));
        return v;
    }

    const LayoutMethods = {
        /** Sets the layout spec (merge = true keeps existing fields) and applies it. */
        setLayout(spec, merge = false) {
            this._mfLayout = merge ? Utils.merge(this._mfLayout || {}, spec) : Utils.clone(spec || {});
            this._mfWatchAdded();
            this.refreshLayout();
            return this;
        },
        getLayout() {
            return Utils.clone(this._mfLayout || {});
        },
        hasLayout() {
            return !!this._mfLayout;
        },
        /** Explicit container size: { width, height } or a function returning it. null = automatic. */
        setLayoutContainer(container) {
            this._mfContainer = container || null;
            this.refreshLayout();
            return this;
        },
        /** Size the layout is resolved against. */
        layoutContainerSize() {
            const c = this._mfContainer;
            if (Utils.isFunction(c)) return c();
            if (c) return c;
            return Layout.containerOf(this);
        },
        /** Size offered to children (default: own layout rect). */
        layoutInnerSize() {
            const r = this._mfLayoutRect;
            return r ? { width: r.width, height: r.height } : Layout.screenSize();
        },
        /** Last resolved rectangle { x, y, width, height } in parent coordinates. */
        layoutRect() {
            return this._mfLayoutRect ? { ...this._mfLayoutRect } : null;
        },
        /** Re-resolves the layout and refreshes children that have layouts. */
        refreshLayout() {
            if (!this._mfLayout) return;
            const container = this.layoutContainerSize();
            const rect = Layout.resolve(
                this._mfLayout,
                container,
                this._mfNaturalSize(container),
                this._mfAutoSize(container)
            );
            const prev = this._mfLayoutRect || null;
            this._mfLayoutRect = rect;
            this._mfApplyLayoutRect(rect, prev);
            Layout.refreshChildren(this);
        },
        _mfWatchAdded() {
            if (this._mfAddedWatched || !Utils.isFunction(this.on)) return;
            this._mfAddedWatched = true;
            this.on("added", () => this.refreshLayout());
        },
        // Defaults — overridden by the kind-specific mixins.
        _mfNaturalSize() {
            return { width: this.width || 0, height: this.height || 0 };
        },
        _mfAutoSize() {
            return {};
        },
        _mfApplyLayoutRect(rect) {
            this.x = rect.x;
            this.y = rect.y;
        }
    };

    const WindowLayoutMethods = {
        _mfNaturalSize(container) {
            return { width: container.width, height: this._mfAutoRowsHeight() };
        },
        _mfAutoSize(container) {
            return {
                width: () => container.width,
                height: () => this._mfAutoRowsHeight()
            };
        },
        /** Rows for "auto" height: spec.rows, else items/cols of selectable windows, else 1. */
        layoutRows() {
            const spec = this._mfLayout || {};
            if (Utils.isNumber(spec.rows)) return spec.rows;
            try {
                if (Utils.isFunction(this.maxItems) && Utils.isFunction(this.maxCols)) {
                    return Math.max(1, Math.ceil(this.maxItems() / Math.max(1, this.maxCols())));
                }
            } catch (e) {
                // data not ready yet
            }
            return 1;
        },
        _mfAutoRowsHeight() {
            return Window_Base.prototype.fittingHeight.call(this, this.layoutRows());
        },
        _mfApplyLayoutRect(rect, prev) {
            const resized = !prev || prev.width !== rect.width || prev.height !== rect.height;
            if (resized && Utils.isFunction(this.move)) {
                this.move(rect.x, rect.y, rect.width, rect.height);
                if (this.contents && Utils.isFunction(this.createContents)) {
                    this.createContents();
                    if (Utils.isFunction(this.refresh)) this.refresh();
                }
            } else {
                this.x = rect.x;
                this.y = rect.y;
            }
        },
        layoutInnerSize() {
            return { width: this.innerWidth, height: this.innerHeight };
        }
    };

    const SpriteLayoutMethods = {
        _mfNaturalSize() {
            const frame = this._frame;
            const ready = this.bitmap && (!Utils.isFunction(this.bitmap.isReady) || this.bitmap.isReady());
            return ready && frame ? { width: frame.width, height: frame.height } : { width: 0, height: 0 };
        },
        _mfAutoSize() {
            const n = this._mfNaturalSize();
            return { width: n.width, height: n.height };
        },
        /**
         * Places the sprite inside the layout rect. The image is scaled by spec.fit
         * and aligned inside the rect by the same anchor as the rect itself.
         * sprite.anchor (pivot) is respected.
         */
        _mfApplyLayoutRect(rect) {
            const spec = this._mfLayout || {};
            const nat = this._mfNaturalSize();
            let sx = 1;
            let sy = 1;
            if (nat.width > 0 && nat.height > 0) {
                const fx = rect.width / nat.width;
                const fy = rect.height / nat.height;
                switch (spec.fit) {
                    case "stretch":
                        sx = fx;
                        sy = fy;
                        break;
                    case "contain":
                        sx = sy = Math.min(fx, fy);
                        break;
                    case "cover":
                        sx = sy = Math.max(fx, fy);
                        break;
                    default:
                        break;
                }
            }
            if (this.scale) this.scale.set(sx, sy);
            const w = nat.width * sx;
            const h = nat.height * sy;
            const [ax, ay] = Anchor.factors(spec.anchor);
            const px = this.anchor ? this.anchor.x : 0;
            const py = this.anchor ? this.anchor.y : 0;
            this.x = Math.round(rect.x + (rect.width - w) * ax + px * w);
            this.y = Math.round(rect.y + (rect.height - h) * ay + py * h);
        }
    };

    const ContainerLayoutMethods = {
        _mfNaturalSize(container) {
            return { width: container.width, height: container.height };
        }
    };

    function installMethods(proto, methods, overwrite) {
        for (const key of Object.keys(methods)) {
            if (overwrite || !(key in proto)) proto[key] = methods[key];
        }
    }

    const Layout = {
        /** Default container: the UI area (Graphics.boxWidth x boxHeight). */
        screenSize() {
            if (window.Graphics && Graphics.boxWidth) return { width: Graphics.boxWidth, height: Graphics.boxHeight };
            return { width: 816, height: 624 };
        },
        /**
         * Container size for a display object:
         *   parent.layoutInnerSize() → window inner area (for window contents) → screen.
         */
        containerOf(obj) {
            const p = obj && obj.parent;
            if (p) {
                if (Utils.isFunction(p.layoutInnerSize)) return p.layoutInnerSize();
                const owner = p.parent;
                if (owner && owner._clientArea === p && Utils.isNumber(owner.innerWidth)) {
                    return { width: owner.innerWidth, height: owner.innerHeight };
                }
                if (window.Window && p instanceof window.Window) return { width: p.width, height: p.height };
            }
            return this.screenSize();
        },
        /**
         * Resolves a spec into { x, y, width, height }.
         * natural — size used when width/height are not set.
         * auto    — { width, height }: numbers or functions used for "auto".
         */
        resolve(spec = {}, container = this.screenSize(), natural = { width: 0, height: 0 }, auto = {}) {
            const cw = container.width;
            const ch = container.height;
            let w = Units.resolve(spec.width, cw, { auto: auto.width, fallback: natural.width });
            let h = Units.resolve(spec.height, ch, { auto: auto.height, fallback: natural.height });
            w = Math.max(0, clampSize(w, spec.minWidth, spec.maxWidth, cw));
            h = Math.max(0, clampSize(h, spec.minHeight, spec.maxHeight, ch));
            const ox = Units.resolve(spec.x, cw, { fallback: 0 });
            const oy = Units.resolve(spec.y, ch, { fallback: 0 });
            const pos = Anchor.toAbsolute(spec.anchor || Anchor.DEFAULT, ox, oy, w, h, cw, ch);
            return MathX.rect(pos.x, pos.y, w, h);
        },
        /**
         * Inverse of resolve(): builds a spec from an absolute rect.
         * options: { anchor = "top-left", relative = false (sizes and offsets in %) }
         */
        toSpec(rect, container = this.screenSize(), options = {}) {
            const anchor = options.anchor || Anchor.DEFAULT;
            const off = Anchor.toRelative(anchor, rect.x, rect.y, rect.width, rect.height, container.width, container.height);
            const spec = { anchor, x: off.x, y: off.y, width: rect.width, height: rect.height };
            if (options.relative) {
                spec.x = Units.toPercent(off.x, container.width);
                spec.y = Units.toPercent(off.y, container.height);
                spec.width = Units.toPercent(rect.width, container.width);
                spec.height = Units.toPercent(rect.height, container.height);
            }
            return spec;
        },
        /** Generic layout methods (position only). overwrite=false keeps existing methods. */
        mixin(proto, overwrite = false) {
            installMethods(proto, LayoutMethods, overwrite);
            return proto;
        },
        /** Layout for any Window_* prototype (resizes, recreates contents, calls refresh). */
        mixinWindow(proto) {
            installMethods(proto, LayoutMethods, true);
            installMethods(proto, WindowLayoutMethods, true);
            return proto;
        },
        /** Layout for any Sprite prototype (fit/scale, respects sprite.anchor). */
        mixinSprite(proto) {
            installMethods(proto, LayoutMethods, true);
            installMethods(proto, SpriteLayoutMethods, true);
            return proto;
        },
        /** Layout for a sized grouping container. */
        mixinContainer(proto) {
            installMethods(proto, LayoutMethods, true);
            installMethods(proto, ContainerLayoutMethods, true);
            return proto;
        },
        /** Refreshes direct children (and window contents) that have layouts. */
        refreshChildren(obj) {
            const lists = [obj.children];
            if (obj._clientArea) lists.push(obj._clientArea.children);
            for (const list of lists) {
                if (!list) continue;
                for (const child of list) {
                    if (child && child._mfLayout && Utils.isFunction(child.refreshLayout)) child.refreshLayout();
                }
            }
        },
        /** Refreshes a whole tree, e.g. after changing the resolution: MF.Layout.refreshTree(scene). */
        refreshTree(root) {
            if (!root) return;
            if (root._mfLayout && Utils.isFunction(root.refreshLayout)) {
                root.refreshLayout(); // refreshes children itself
                return;
            }
            const lists = [root.children];
            if (root._clientArea) lists.push(root._clientArea.children);
            for (const list of lists) if (list) list.forEach(c => this.refreshTree(c));
        }
    };

    //=========================================================================
    // MF.UI — base display classes with layout  [experimental]
    //=========================================================================
    //  MZ-style constructors, so they can be subclassed the usual way:
    //    function Window_MyInfo() { this.initialize(...arguments); }
    //    Window_MyInfo.prototype = Object.create(MF.UI.Window.prototype);
    //    Window_MyInfo.prototype.constructor = Window_MyInfo;
    //
    //    const win = new MF.UI.Window({ anchor: "bottom", y: -20, width: "60%", height: "auto", rows: 2 });
    //=========================================================================

    const UI = {};

    if (window.Window_Base && window.Sprite) {
        /** Window_Base with layout. new MF.UI.Window(spec, container?) */
        UI.Window = function MF_UI_Window() {
            this.initialize(...arguments);
        };
        UI.Window.prototype = Object.create(Window_Base.prototype);
        UI.Window.prototype.constructor = UI.Window;
        Layout.mixinWindow(UI.Window.prototype);
        UI.Window.prototype.initialize = function(spec = {}, container = null) {
            this._mfLayout = Utils.clone(spec);
            this._mfContainer = container;
            const size = this.layoutContainerSize();
            const rect = Layout.resolve(this._mfLayout, size, this._mfNaturalSize(size), this._mfAutoSize(size));
            this._mfLayoutRect = rect;
            Window_Base.prototype.initialize.call(this, new Rectangle(rect.x, rect.y, rect.width, rect.height));
            this._mfWatchAdded();
        };
        /** Override to draw contents; called after resizing. */
        UI.Window.prototype.refresh = function() {
            if (this.contents) this.contents.clear();
        };

        /** Sprite with layout and fit modes. new MF.UI.Sprite(bitmap?, spec?) */
        UI.Sprite = function MF_UI_Sprite() {
            this.initialize(...arguments);
        };
        UI.Sprite.prototype = Object.create(Sprite.prototype);
        UI.Sprite.prototype.constructor = UI.Sprite;
        Layout.mixinSprite(UI.Sprite.prototype);
        UI.Sprite.prototype.initialize = function(bitmap, spec) {
            Sprite.prototype.initialize.call(this, bitmap);
            if (spec) this.setLayout(spec);
        };
        UI.Sprite.prototype._onBitmapLoad = function(bitmapLoaded) {
            Sprite.prototype._onBitmapLoad.call(this, bitmapLoaded);
            if (this._mfLayout) this.refreshLayout(); // natural size is known only now
        };

        /** Invisible sized group; children resolve their layouts inside it. */
        UI.Container = function MF_UI_Container() {
            this.initialize(...arguments);
        };
        UI.Container.prototype = Object.create(Sprite.prototype);
        UI.Container.prototype.constructor = UI.Container;
        Layout.mixinContainer(UI.Container.prototype);
        UI.Container.prototype.initialize = function(spec) {
            Sprite.prototype.initialize.call(this);
            this.setLayout(spec || { width: "100%", height: "100%" });
        };
    }

    //=========================================================================
    // MF.Text — message and text extensions
    //=========================================================================
    //  Two kinds of custom escape codes:
    //    Macros   \NAME[arg]  replaced by text BEFORE the standard conversion
    //                         (result may contain \C[n], \V[n], other macros).
    //    Escapes  \NAME[args] executed while the text is drawn
    //                         (waits, sounds, face changes, text speed).
    //  Names are letters only (MZ parses escape codes as [A-Z]+).
    //
    //  Built-in:
    //    \TR[ns:key]        macro   MF.I18n translation
    //    \SAVE[key:path]    macro   value from MF.Save data
    //    \W[n]              escape  wait n frames            (message window)
    //    \SE[name,vol,pitch,pan]    play a sound effect      (message window)
    //    \FACE[name,index]  escape  change the face image    (message window)
    //    \SPD[n]            escape  n extra frames per char  (message window)
    //=========================================================================

    const RESERVED_CODES = new Set(["V", "N", "P", "G", "C", "I", "PX", "PY", "FS"]);
    const textMacros = new Map();
    const textEscapes = new Map();
    const textWarnings = new Set();

    function textWarnOnce(key, ...args) {
        if (textWarnings.has(key)) return;
        textWarnings.add(key);
        Log.warn(PLUGIN_NAME, ...args);
    }

    function checkCodeName(name) {
        const key = String(name).toUpperCase();
        if (!/^[A-Z]+$/.test(key)) throw new Error(`MF.Text: code name "${name}" must contain letters only.`);
        if (RESERVED_CODES.has(key)) throw new Error(`MF.Text: code "\\${key}" is reserved by RPG Maker.`);
        return key;
    }

    function obtainEscapeString(textState) {
        const m = /^\[([^\]]*)\]/.exec(textState.text.slice(textState.index));
        if (!m) return null;
        textState.index += m[0].length;
        return m[1];
    }

    function isMessageWindow(win) {
        return !!(window.Window_Message && win instanceof window.Window_Message);
    }

    const Text = {
        /**
         * Registers a text macro \NAME[arg] -> fn(arg, window) -> string.
         * Applied before RPG Maker's own conversion; nested macros are expanded (up to 10 levels).
         */
        registerMacro(name, fn) {
            const key = checkCodeName(name);
            if (textMacros.has(key) || textEscapes.has(key)) Log.warn(PLUGIN_NAME, `MF.Text: code \\${key} is redefined.`);
            textMacros.set(key, fn);
        },
        /**
         * Registers a runtime escape \NAME[args] -> fn(ctx).
         * ctx: { code, param, args, textState, window, drawing, isMessage }
         *   drawing  — false while text is only measured (textSizeEx): no side effects then!
         *   isMessage — the window is Window_Message
         */
        registerEscape(name, fn) {
            const key = checkCodeName(name);
            if (textMacros.has(key) || textEscapes.has(key)) Log.warn(PLUGIN_NAME, `MF.Text: code \\${key} is redefined.`);
            textEscapes.set(key, fn);
        },
        hasCode(name) {
            const key = String(name).toUpperCase();
            return textMacros.has(key) || textEscapes.has(key);
        },
        /** Expands registered macros in raw text (backslash form). */
        applyMacros(text, win = null) {
            if (!Utils.isString(text) || textMacros.size === 0) return text;
            let out = text;
            for (let pass = 0; pass < 10; pass++) {
                let changed = false;
                out = out.replace(/\\([A-Za-z]+)\[([^\]]*)\]/g, (match, name, arg) => {
                    const key = name.toUpperCase();
                    const fn = textMacros.get(key);
                    if (!fn) return match;
                    changed = true;
                    try {
                        const r = fn(arg, win);
                        return r === undefined || r === null ? "" : String(r);
                    } catch (e) {
                        textWarnOnce(`macro|${key}|${arg}`, `MF.Text: macro \\${key}[${arg}] failed:`, e);
                        return "";
                    }
                });
                if (!changed) break;
            }
            return out;
        },
        /** Removes escape codes (standard and custom) from text. */
        strip(text) {
            if (!Utils.isString(text)) return "";
            return text
                .replace(/\\([A-Za-z]+)(\[[^\]]*\])?/g, "")
                .replace(/\\[$.|!><^{}]/g, "")
                .replace(/\x1b([A-Za-z]+)(\[[^\]]*\])?/g, "")
                .replace(/\x1b[$.|!><^{}]/g, "");
        },
        /**
         * Word wrap for a window: returns lines that fit into maxWidth (default: innerWidth).
         * Width is measured with window.textSizeEx, so escape codes are respected
         * within a line. Words longer than the width are broken by characters (CJK-safe).
         */
        wrap(win, text, maxWidth) {
            const width = maxWidth || win.innerWidth;
            const measure = s => (s === "" ? 0 : win.textSizeEx(s).width);
            const lines = [];
            for (const paragraph of String(text).split(/\r?\n/)) {
                let line = "";
                for (const token of paragraph.split(/(\s+)/)) {
                    if (token === "") continue;
                    const candidate = line + token;
                    if (measure(candidate) <= width) {
                        line = candidate;
                        continue;
                    }
                    if (line.trim() !== "") lines.push(line.trimEnd());
                    line = /^\s+$/.test(token) ? "" : token;
                    // Break a single overlong word by characters.
                    while (line.length > 1 && measure(line) > width) {
                        let cut = line.length - 1;
                        while (cut > 1 && measure(line.slice(0, cut)) > width) cut--;
                        lines.push(line.slice(0, cut));
                        line = line.slice(cut);
                    }
                }
                lines.push(line.trimEnd());
            }
            return lines;
        },
        /** Text size with escape codes: { width, height }. */
        measure(win, text) {
            return win.textSizeEx(text);
        },

        /**
         * Shows a message; resolves true when it is closed, false if the scene changed.
         * Waits for a running message first. Needs a scene with a message window (map, battle).
         * options: { face: [name, index], background: 0|1|2, position: 0|1|2, speaker }
         */
        show(text, options = {}) {
            return Timer.until(() => !$gameMessage.isBusy()).then(ok => {
                if (!ok) return false;
                this._setupMessage(options);
                $gameMessage.add(text);
                return Timer.until(() => !$gameMessage.isBusy());
            });
        },
        /**
         * Shows choices; resolves with the chosen index, the cancel value, or null if the scene changed.
         * options: { text, default = 0, cancel = -1 (-1: cancel disabled; index: cancel selects it),
         *            background, position (choice window: 0 left, 1 middle, 2 right), face, speaker }
         */
        choice(choices, options = {}) {
            return Timer.until(() => !$gameMessage.isBusy()).then(ok => {
                if (!ok) return null;
                return new Promise(resolve => {
                    let result = null;
                    this._setupMessage({ ...options, position: options.messagePosition });
                    if (options.text) $gameMessage.add(options.text);
                    $gameMessage.setChoices(choices, options.default || 0, options.cancel !== undefined ? options.cancel : -1);
                    if (options.background !== undefined) $gameMessage.setChoiceBackground(options.background);
                    if (options.position !== undefined) $gameMessage.setChoicePositionType(options.position);
                    $gameMessage.setChoiceCallback(n => (result = n));
                    Timer.until(() => !$gameMessage.isBusy()).then(done => resolve(done ? result : null));
                });
            });
        },
        _setupMessage(options) {
            if (options.face) $gameMessage.setFaceImage(options.face[0] || "", options.face[1] || 0);
            if (options.background !== undefined) $gameMessage.setBackground(options.background);
            if (options.position !== undefined) $gameMessage.setPositionType(options.position);
            if (options.speaker !== undefined && Utils.isFunction($gameMessage.setSpeakerName)) {
                $gameMessage.setSpeakerName(options.speaker);
            }
        }
    };

    if (window.Window_Base) {
        Hook.alias(Window_Base.prototype, "convertEscapeCharacters", function(orig, text) {
            return orig(Text.applyMacros(text, this));
        }, PLUGIN_NAME);

        Hook.alias(Window_Base.prototype, "processEscapeCharacter", function(orig, code, textState) {
            const fn = textEscapes.get(code);
            if (!fn) return orig(code, textState);
            const param = obtainEscapeString(textState);
            const ctx = {
                code,
                param,
                args: param === null ? [] : param.split(",").map(s => s.trim()),
                textState,
                window: this,
                drawing: textState.drawing !== false,
                isMessage: isMessageWindow(this)
            };
            try {
                fn.call(this, ctx);
            } catch (e) {
                textWarnOnce(`escape|${code}|${param}`, `MF.Text: escape \\${code}[${param}] failed:`, e);
            }
            return undefined;
        }, PLUGIN_NAME);
    }

    if (window.Window_Message) {
        Hook.before(Window_Message.prototype, "startMessage", function() {
            this._mfCharWait = 0;
        }, PLUGIN_NAME);

        Hook.alias(Window_Message.prototype, "processCharacter", function(orig, textState) {
            const c = textState.text[textState.index];
            const result = orig(textState);
            if (
                this._mfCharWait > 0 && c && c.charCodeAt(0) >= 0x20 &&
                textState.drawing !== false && !this._showFast && !this._lineShowFast
            ) {
                this.startWait(this._mfCharWait);
            }
            return result;
        }, PLUGIN_NAME);
    }

    Text.registerMacro("TR", arg => I18n.t(arg));
    Text.registerMacro("SAVE", arg => {
        const idx = arg.indexOf(":");
        const key = idx >= 0 ? arg.slice(0, idx) : arg;
        const path = idx >= 0 ? arg.slice(idx + 1) : "";
        const data = Save.get(key);
        const value = path ? Utils.get(data, path) : data;
        return value === undefined || value === null ? "" : value;
    });
    Text.registerEscape("W", ctx => {
        if (ctx.drawing && ctx.isMessage) ctx.window.startWait(Math.max(0, parseInt(ctx.param, 10) || 0));
    });
    Text.registerEscape("SE", ctx => {
        if (!ctx.drawing || !ctx.isMessage || !ctx.args[0]) return;
        const [name, volume, pitch, pan] = ctx.args;
        AudioManager.playSe({
            name,
            volume: volume !== undefined ? Number(volume) : 90,
            pitch: pitch !== undefined ? Number(pitch) : 100,
            pan: pan !== undefined ? Number(pan) : 0
        });
    });
    Text.registerEscape("FACE", ctx => {
        if (!ctx.drawing || !ctx.isMessage) return;
        const win = ctx.window;
        const name = ctx.args[0] || "";
        const index = parseInt(ctx.args[1], 10) || 0;
        const rtl = Utils.isFunction($gameMessage.isRTL) && $gameMessage.isRTL();
        const fw = ImageManager.faceWidth;
        win.contents.clearRect(rtl ? win.innerWidth - fw - 4 : 4, 0, fw, win.innerHeight);
        $gameMessage.setFaceImage(name, index);
        // Window_Message.updateLoading draws the face once loaded and pauses text meanwhile.
        if (name) win.loadMessageFace();
    });
    Text.registerEscape("SPD", ctx => {
        if (ctx.drawing && ctx.isMessage) ctx.window._mfCharWait = Math.max(0, parseInt(ctx.param, 10) || 0);
    });

    //=========================================================================
    // MF.Input — actions, raw keys, shortcuts, pointer, drag-and-drop
    //=========================================================================

    const KEY_CODES = {
        backspace: 8, tab: 9, enter: 13, shift: 16, ctrl: 17, alt: 18, pause: 19, escape: 27, esc: 27,
        space: 32, pageup: 33, pagedown: 34, end: 35, home: 36,
        left: 37, up: 38, right: 39, down: 40, insert: 45, delete: 46
    };
    for (let i = 0; i < 26; i++) KEY_CODES[String.fromCharCode(97 + i)] = 65 + i;
    for (let i = 0; i < 10; i++) KEY_CODES[String(i)] = 48 + i;
    for (let i = 1; i <= 12; i++) KEY_CODES[`f${i}`] = 111 + i;

    const KEY_NAMES_TO_CODE = {
        esc: "Escape", escape: "Escape", enter: "Enter", space: "Space", tab: "Tab",
        backspace: "Backspace", delete: "Delete", del: "Delete", insert: "Insert",
        home: "Home", end: "End", pageup: "PageUp", pagedown: "PageDown",
        up: "ArrowUp", down: "ArrowDown", left: "ArrowLeft", right: "ArrowRight",
        plus: "Equal", minus: "Minus", comma: "Comma", period: "Period", slash: "Slash"
    };

    const inputState = {
        down: new Set(),
        pendingTriggered: new Set(),
        pendingReleased: new Set(),
        triggered: new Set(),
        released: new Set(),
        device: "keyboard",
        frame: 0,
        pointerConsumed: false,
        bypass: false,
        lastClick: null,
        doubleClicked: false,
        actionPrev: new Map(),
        actionReleased: new Set()
    };
    const trackedActions = new Set();
    const shortcutCache = new Map();
    const isMac = !!(window.navigator && /Mac/i.test(navigator.platform || ""));

    function setInputDevice(device) {
        if (inputState.device === device) return;
        const old = inputState.device;
        inputState.device = device;
        Events.bus.emit("mf:inputDeviceChanged", device, old);
    }

    function parseShortcut(combo) {
        let parsed = shortcutCache.get(combo);
        if (parsed) return parsed;
        parsed = { ctrl: false, shift: false, alt: false, meta: false, code: null };
        for (const raw of combo.split("+").map(s => s.trim()).filter(Boolean)) {
            const p = raw.toLowerCase();
            if (p === "ctrl" || p === "control") parsed.ctrl = true;
            else if (p === "shift") parsed.shift = true;
            else if (p === "alt" || p === "option") parsed.alt = true;
            else if (p === "meta" || p === "cmd" || p === "command") parsed.meta = true;
            else if (p === "mod") isMac ? (parsed.meta = true) : (parsed.ctrl = true);
            else if (/^[a-z]$/.test(p)) parsed.code = `Key${p.toUpperCase()}`;
            else if (/^[0-9]$/.test(p)) parsed.code = `Digit${p}`;
            else if (/^f([1-9]|1[0-2])$/.test(p)) parsed.code = p.toUpperCase();
            else if (KEY_NAMES_TO_CODE[p]) parsed.code = KEY_NAMES_TO_CODE[p];
            else parsed.code = raw; // already a KeyboardEvent.code
        }
        shortcutCache.set(combo, parsed);
        return parsed;
    }

    if (window.document && document.addEventListener) {
        document.addEventListener("keydown", e => {
            inputState.mods = { ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey };
            if (!e.repeat) inputState.pendingTriggered.add(e.code);
            inputState.down.add(e.code);
            setInputDevice("keyboard");
        });
        document.addEventListener("keyup", e => {
            inputState.mods = { ctrl: e.ctrlKey, shift: e.shiftKey, alt: e.altKey, meta: e.metaKey };
            inputState.down.delete(e.code);
            inputState.pendingReleased.add(e.code);
        });
        document.addEventListener("pointerdown", e => {
            setInputDevice(e.pointerType === "touch" ? "touch" : "mouse");
        });
        if (window.addEventListener) window.addEventListener("blur", () => {
            inputState.down.clear();
            inputState.mods = null;
        });
    }

    const draggables = [];
    let dragOrder = 0;
    let activeDrag = null;

    const Input = {
        //--- Actions (RPG Maker Input) ----------------------------------------

        /** Key name ("a", "f5", "space", "left") -> keyCode used by Input.keyMapper. */
        keyCode(name) {
            if (Utils.isNumber(name)) return name;
            const code = KEY_CODES[String(name).toLowerCase()];
            if (code === undefined) throw new Error(`MF.Input: unknown key "${name}".`);
            return code;
        },
        /**
         * Binds keys and gamepad buttons to an action name, usable with
         * Input.isPressed(action) and MF.Input.isReleased(action).
         *   MF.Input.bind("journal", { keys: ["j"], buttons: [8] });
         * options.override — allow replacing a key already bound to another action.
         */
        bind(action, options = {}) {
            const MZ = window.Input;
            for (const k of options.keys || []) {
                const code = this.keyCode(k);
                const existing = MZ.keyMapper[code];
                if (existing && existing !== action && !options.override) {
                    Log.warn(PLUGIN_NAME, `MF.Input.bind: key ${k} is already bound to "${existing}"; use override: true.`);
                    continue;
                }
                MZ.keyMapper[code] = action;
            }
            for (const b of options.buttons || []) {
                const existing = MZ.gamepadMapper[b];
                if (existing && existing !== action && !options.override) {
                    Log.warn(PLUGIN_NAME, `MF.Input.bind: button ${b} is already bound to "${existing}"; use override: true.`);
                    continue;
                }
                MZ.gamepadMapper[b] = action;
            }
            trackedActions.add(action);
        },
        isPressed(action) {
            return window.Input.isPressed(action);
        },
        isTriggered(action) {
            return window.Input.isTriggered(action);
        },
        isRepeated(action) {
            return window.Input.isRepeated(action);
        },
        isLongPressed(action) {
            return window.Input.isLongPressed(action);
        },
        /** Action released this frame. Works for actions passed to bind() or track(). */
        isReleased(action) {
            if (!trackedActions.has(action)) this.track(action);
            return inputState.actionReleased.has(action);
        },
        /** Starts release tracking for a built-in action ("ok", "cancel", ...). */
        track(action) {
            trackedActions.add(action);
        },

        //--- Raw keyboard (KeyboardEvent.code: "KeyZ", "Digit1", "F5") -------

        isKeyDown(code) {
            return inputState.down.has(code);
        },
        isKeyTriggered(code) {
            return inputState.triggered.has(code);
        },
        isKeyReleased(code) {
            return inputState.released.has(code);
        },
        modifiers() {
            if (inputState.mods) return { ...inputState.mods };
            const d = inputState.down;
            return {
                ctrl: d.has("ControlLeft") || d.has("ControlRight"),
                shift: d.has("ShiftLeft") || d.has("ShiftRight"),
                alt: d.has("AltLeft") || d.has("AltRight"),
                meta: d.has("MetaLeft") || d.has("MetaRight")
            };
        },
        /**
         * Shortcut triggered this frame with exactly these modifiers:
         *   MF.Input.isShortcut("Ctrl+Z"), "Ctrl+Shift+Z", "Mod+S" (Cmd on macOS), "F5", "Delete".
         * Ignored while the user types in an HTML input unless options.whileTyping.
         */
        isShortcut(combo, options = {}) {
            if (!options.whileTyping && this.isTyping()) return false;
            const s = parseShortcut(combo);
            if (!s.code || !inputState.triggered.has(s.code)) return false;
            const m = this.modifiers();
            return m.ctrl === s.ctrl && m.shift === s.shift && m.alt === s.alt && m.meta === s.meta;
        },
        /** True while focus is in an HTML text field (e.g. an editor inspector). */
        isTyping() {
            const el = window.document && document.activeElement;
            if (!el) return false;
            const tag = (el.tagName || "").toLowerCase();
            return tag === "input" || tag === "textarea" || tag === "select" || !!el.isContentEditable;
        },

        //--- Pointer (TouchInput) ---------------------------------------------

        /** Snapshot of pointer state for this frame (canvas coordinates). */
        pointer() {
            const T = window.TouchInput;
            return this._raw(() => ({
                x: T.x,
                y: T.y,
                pressed: T.isPressed(),
                triggered: T.isTriggered(),
                released: T.isReleased(),
                clicked: T.isClicked(),
                repeated: T.isRepeated(),
                longPressed: T.isLongPressed(),
                cancelled: T.isCancelled(),
                doubleClicked: inputState.doubleClicked,
                wheelX: T.wheelX,
                wheelY: T.wheelY,
                consumed: inputState.pointerConsumed
            }));
        },
        isDoubleClicked() {
            return inputState.doubleClicked;
        },
        /**
         * Blocks TouchInput for the rest of this frame, so windows and the map
         * do not react to a pointer action already handled (e.g. by a drag).
         */
        consumePointer() {
            inputState.pointerConsumed = true;
        },
        isPointerConsumed() {
            return inputState.pointerConsumed;
        },
        /** Point inside a visible display object (global bounds). */
        hitTest(obj, x, y) {
            if (!obj || obj.destroyed || obj._destroyed) return false;
            if (obj.worldVisible === false || obj.visible === false) return false;
            if (!Utils.isFunction(obj.getBounds)) return false;
            const b = obj.getBounds();
            return x >= b.x && y >= b.y && x < b.x + b.width && y < b.y + b.height;
        },

        /**
         * Makes a display object draggable [experimental].
         * options: {
         *   threshold = 4,        // pixels before a drag starts (below = click)
         *   priority = 0,         // overlapping targets: higher priority wins, then the latest registered
         *   consume = true,       // block TouchInput for the game while dragging
         *   persistent = false,   // survive scene changes
         *   hitTest(x, y, target),
         *   onPress(ctx), onStart(ctx), onMove(ctx), onEnd(ctx), onClick(ctx), onCancel(ctx)
         * }
         * ctx: { target, x, y, startX, startY, dx, dy (total), moveX, moveY (this frame) }
         * Right click / cancel during a drag calls onCancel.
         * Returns { destroy(), setEnabled(bool), isDragging() }.
         */
        draggable(target, options = {}) {
            const entry = {
                target,
                options,
                enabled: true,
                priority: options.priority || 0,
                order: ++dragOrder,
                scene: options.persistent ? null : (options.scene || currentScene()),
                alive: true
            };
            draggables.push(entry);
            return {
                destroy: () => this._removeDraggable(entry),
                setEnabled: value => {
                    entry.enabled = !!value;
                    if (!entry.enabled && activeDrag && activeDrag.entry === entry) this._cancelDrag();
                },
                isDragging: () => !!(activeDrag && activeDrag.entry === entry && activeDrag.started)
            };
        },
        isDragging() {
            return !!(activeDrag && activeDrag.started);
        },

        //--- Devices ----------------------------------------------------------

        /** Last used device: "keyboard" | "mouse" | "touch" | "gamepad". Event mf:inputDeviceChanged. */
        lastDevice() {
            return inputState.device;
        },
        gamepads() {
            if (!window.navigator || !Utils.isFunction(navigator.getGamepads)) return [];
            return Array.from(navigator.getGamepads() || [])
                .filter(Boolean)
                .map(g => ({ index: g.index, id: g.id, mapping: g.mapping }));
        },
        /** Gamepad rumble where supported. Returns true if at least one pad accepted it. */
        vibrate(options = {}) {
            if (!window.navigator || !Utils.isFunction(navigator.getGamepads)) return false;
            let ok = false;
            for (const pad of Array.from(navigator.getGamepads() || [])) {
                const actuator = pad && pad.vibrationActuator;
                if (actuator && Utils.isFunction(actuator.playEffect)) {
                    actuator.playEffect("dual-rumble", {
                        duration: options.duration || 200,
                        strongMagnitude: options.strong !== undefined ? options.strong : 1,
                        weakMagnitude: options.weak !== undefined ? options.weak : 1
                    }).catch(() => {});
                    ok = true;
                }
            }
            return ok;
        },

        //--- Internal -----------------------------------------------------------

        _raw(fn) {
            const prev = inputState.bypass;
            inputState.bypass = true;
            try {
                return fn();
            } finally {
                inputState.bypass = prev;
            }
        },
        _update() {
            inputState.frame++;
            inputState.pointerConsumed = false;
            inputState.triggered = inputState.pendingTriggered;
            inputState.pendingTriggered = new Set();
            inputState.released = inputState.pendingReleased;
            inputState.pendingReleased = new Set();

            inputState.actionReleased = new Set();
            const MZ = window.Input;
            if (MZ) {
                for (const action of trackedActions) {
                    const now = MZ.isPressed(action);
                    if (inputState.actionPrev.get(action) && !now) inputState.actionReleased.add(action);
                    inputState.actionPrev.set(action, now);
                }
            }
            this._updateGamepadDevice();
            this._raw(() => {
                this._updateDoubleClick();
                this._updateDrag();
            });
        },
        _updateGamepadDevice() {
            if (!window.navigator || !Utils.isFunction(navigator.getGamepads)) return;
            for (const pad of Array.from(navigator.getGamepads() || [])) {
                if (!pad) continue;
                if (pad.buttons.some(b => b.pressed) || pad.axes.some(a => Math.abs(a) > 0.5)) {
                    setInputDevice("gamepad");
                    return;
                }
            }
        },
        _updateDoubleClick() {
            const T = window.TouchInput;
            inputState.doubleClicked = false;
            if (!T || !T.isClicked()) return;
            const last = inputState.lastClick;
            const now = { frame: inputState.frame, x: T.x, y: T.y };
            if (last && now.frame - last.frame <= 20 && MathX.distance(last.x, last.y, now.x, now.y) <= 8) {
                inputState.doubleClicked = true;
                inputState.lastClick = null;
            } else {
                inputState.lastClick = now;
            }
        },
        _updateDrag() {
            const T = window.TouchInput;
            if (!T) return;
            const scene = currentScene();
            for (const entry of draggables.slice()) {
                const t = entry.target;
                if ((!entry.options.persistent && entry.scene !== scene) || !t || t.destroyed || t._destroyed) {
                    this._removeDraggable(entry);
                }
            }
            const x = T.x;
            const y = T.y;

            if (!activeDrag && T.isTriggered()) {
                let best = null;
                for (const entry of draggables) {
                    if (!entry.enabled) continue;
                    const hit = entry.options.hitTest
                        ? entry.options.hitTest(x, y, entry.target)
                        : this.hitTest(entry.target, x, y);
                    if (!hit) continue;
                    if (!best || entry.priority > best.priority || (entry.priority === best.priority && entry.order > best.order)) {
                        best = entry;
                    }
                }
                if (best) {
                    activeDrag = { entry: best, startX: x, startY: y, lastX: x, lastY: y, started: false };
                    this._dragCall("onPress", x, y);
                }
                return;
            }
            if (!activeDrag) return;

            const opts = activeDrag.entry.options;
            if (T.isCancelled()) {
                this._cancelDrag();
                return;
            }
            if (T.isPressed()) {
                const threshold = opts.threshold !== undefined ? opts.threshold : 4;
                if (!activeDrag.started && MathX.distance(activeDrag.startX, activeDrag.startY, x, y) >= threshold) {
                    activeDrag.started = true;
                    this._dragCall("onStart", x, y);
                }
                if (activeDrag.started) {
                    if (x !== activeDrag.lastX || y !== activeDrag.lastY) this._dragCall("onMove", x, y);
                    if (opts.consume !== false) this.consumePointer();
                }
                activeDrag.lastX = x;
                activeDrag.lastY = y;
                return;
            }
            // Released
            const drag = activeDrag;
            activeDrag = null;
            this._dragCall(drag.started ? "onEnd" : "onClick", x, y, drag);
            if (drag.started && opts.consume !== false) this.consumePointer();
        },
        _dragCall(name, x, y, drag = activeDrag) {
            const fn = drag.entry.options[name];
            if (!Utils.isFunction(fn)) return;
            const ctx = {
                target: drag.entry.target,
                x,
                y,
                startX: drag.startX,
                startY: drag.startY,
                dx: x - drag.startX,
                dy: y - drag.startY,
                moveX: x - drag.lastX,
                moveY: y - drag.lastY
            };
            try {
                fn(ctx);
            } catch (e) {
                Log.error(PLUGIN_NAME, `MF.Input drag ${name} failed:`, e);
            }
        },
        _cancelDrag() {
            const drag = activeDrag;
            activeDrag = null;
            if (drag && drag.started) this._dragCall("onCancel", drag.lastX, drag.lastY, drag);
            this.consumePointer();
        },
        _removeDraggable(entry) {
            entry.alive = false;
            const idx = draggables.indexOf(entry);
            if (idx >= 0) draggables.splice(idx, 1);
            if (activeDrag && activeDrag.entry === entry) activeDrag = null;
        }
    };

    if (window.SceneManager) {
        Hook.after(SceneManager, "updateInputData", function() {
            Input._update();
        }, PLUGIN_NAME);
    }

    if (window.TouchInput) {
        for (const name of ["isPressed", "isTriggered", "isRepeated", "isLongPressed", "isClicked", "isReleased", "isCancelled"]) {
            if (!Utils.isFunction(TouchInput[name])) continue;
            Hook.alias(TouchInput, name, function(orig) {
                if (inputState.pointerConsumed && !inputState.bypass) return false;
                return orig();
            }, PLUGIN_NAME);
        }
    }

    //=========================================================================
    // MF.Assets — batch preloading with progress
    //=========================================================================
    //  const task = MF.Assets.load(["picture:Logo", "face:Actor1", { type: "se", name: "Cursor1" }],
    //                              { onProgress: p => bar.setRate(p) });
    //  const { ok, failed } = await task;
    //=========================================================================

    const IMAGE_TYPES = {
        picture: "loadPicture",
        face: "loadFace",
        character: "loadCharacter",
        svActor: "loadSvActor",
        svEnemy: "loadSvEnemy",
        enemy: "loadEnemy",
        parallax: "loadParallax",
        tileset: "loadTileset",
        title1: "loadTitle1",
        title2: "loadTitle2",
        battleback1: "loadBattleback1",
        battleback2: "loadBattleback2",
        system: "loadSystem"
    };
    const AUDIO_TYPES = ["bgm", "bgs", "me", "se"];
    const assetLoaders = new Map();
    const assetGroups = new Map();
    const assetTasks = new Set();

    function pollUntil(check, timeout) {
        const started = Date.now();
        return new Promise((resolve, reject) => {
            const tick = () => {
                let r;
                try {
                    r = check();
                } catch (e) {
                    reject(e);
                    return;
                }
                if (r instanceof Error) return reject(r);
                if (r) return resolve(r);
                if (timeout && Date.now() - started > timeout) return reject(new Error("timeout"));
                setTimeout(tick, 16);
            };
            tick();
        });
    }

    /** Removes a failed bitmap from ImageManager caches, so Scene.isReady() does not throw later. */
    function evictBitmap(bitmap) {
        const IM = window.ImageManager;
        if (!IM) return;
        for (const cache of [IM._cache, IM._system]) {
            if (!cache) continue;
            for (const key of Object.keys(cache)) if (cache[key] === bitmap) delete cache[key];
        }
    }

    function waitBitmap(bitmap, label, timeout) {
        return pollUntil(() => {
            if (bitmap.isError && bitmap.isError()) return new Error(`Failed to load image ${label}`);
            return bitmap.isReady() ? bitmap : false;
        }, timeout).catch(e => {
            evictBitmap(bitmap);
            throw e;
        });
    }

    function waitAudio(buffer, label, timeout) {
        return pollUntil(() => {
            if (buffer.isError && buffer.isError()) return new Error(`Failed to load audio ${label}`);
            return buffer.isReady() ? buffer : false;
        }, timeout);
    }

    function normalizeAsset(item) {
        if (Utils.isString(item)) {
            const idx = item.indexOf(":");
            if (idx < 0) return { type: "image", url: item };
            return { type: item.slice(0, idx), name: item.slice(idx + 1) };
        }
        return item;
    }

    function assetLabel(item) {
        return `${item.type}:${item.name || item.url || item.family || "?"}`;
    }

    class AssetTask extends EventEmitter {
        constructor(items, options) {
            super();
            this.items = items.map(normalizeAsset);
            this.total = this.items.length;
            this.loaded = 0;
            this.failed = [];
            this.results = new Array(this.total);
            this.group = options.group || null;
            this._options = options;
            this._cancelled = false;
            this._done = false;
            this.promise = this._run();
        }
        /** 0..1, counting failed items as processed. */
        get progress() {
            return this.total === 0 ? 1 : (this.loaded + this.failed.length) / this.total;
        }
        isDone() {
            return this._done;
        }
        /** Stops starting new items; already running ones finish. */
        cancel() {
            this._cancelled = true;
        }
        then(onFulfilled, onRejected) {
            return this.promise.then(onFulfilled, onRejected);
        }
        async _run() {
            assetTasks.add(this);
            const concurrency = Math.max(1, this._options.concurrency || 6);
            const timeout = this._options.timeout !== undefined ? this._options.timeout : 30000;
            let next = 0;
            const worker = async () => {
                while (next < this.total && !this._cancelled) {
                    const index = next++;
                    const item = this.items[index];
                    try {
                        this.results[index] = await Assets._loadItem(item, timeout);
                        this.loaded++;
                        if (this.group) Assets._retain(this.group, this.results[index]);
                    } catch (e) {
                        this.failed.push({ item, error: e });
                        Log.error(PLUGIN_NAME, `MF.Assets: ${assetLabel(item)} failed: ${e && e.message}`);
                        this.emit("error", item, e);
                    }
                    this.emit("progress", this.progress, item);
                    if (Utils.isFunction(this._options.onProgress)) {
                        try {
                            this._options.onProgress(this.progress, item, this);
                        } catch (e) {
                            Log.error(PLUGIN_NAME, "MF.Assets onProgress failed:", e);
                        }
                    }
                }
            };
            const workers = [];
            for (let i = 0; i < Math.min(concurrency, Math.max(1, this.total)); i++) workers.push(worker());
            await Promise.all(workers);
            this._done = true;
            assetTasks.delete(this);
            const result = {
                ok: this.failed.length === 0 && !this._cancelled,
                cancelled: this._cancelled,
                results: this.results,
                failed: this.failed
            };
            this.emit("complete", result);
            return result;
        }
    }

    const Assets = {
        /**
         * Loads assets in parallel. Never rejects: resolves with
         * { ok, cancelled, results, failed: [{ item, error }] }.
         * Items: "picture:Logo", "se:Cursor1", "img/pictures/Logo.png" (url), or objects:
         *   { type: "picture" | "face" | ... | "image", name, folder? }
         *   { type: "bgm" | "bgs" | "me" | "se", name, static? }   (static SE: AudioManager.loadStaticSe)
         *   { type: "json", url }   { type: "font", family, filename }
         *   { type: "custom", load: () => Promise }
         * options: { concurrency = 6, timeout = 30000 (ms per item), group, onProgress(progress, item, task) }
         * Failed images are evicted from ImageManager caches so later scenes don't hit MZ's load error screen.
         */
        load(items, options = {}) {
            return new AssetTask(items || [], options);
        },
        /** Registers a loader: MF.Assets.register("live2d", (item, timeout) => Promise). */
        register(type, loader) {
            assetLoaders.set(type, loader);
        },
        /** Scene waits (isReady) until the task is finished. */
        bindScene(scene, task) {
            scene._mfAssetTasks = scene._mfAssetTasks || [];
            scene._mfAssetTasks.push(task);
            return task;
        },
        isLoading() {
            return assetTasks.size > 0;
        },
        /** Drops references kept for a group (retained audio buffers etc.). */
        release(group) {
            assetGroups.delete(group);
        },
        retained(group) {
            return Array.from(assetGroups.get(group) || []);
        },
        _retain(group, value) {
            if (value === undefined || value === null) return;
            if (!assetGroups.has(group)) assetGroups.set(group, new Set());
            assetGroups.get(group).add(value);
        },
        _loadItem(item, timeout) {
            const type = item.type;
            if (assetLoaders.has(type)) return Promise.resolve(assetLoaders.get(type)(item, timeout));
            if (IMAGE_TYPES[type]) {
                const bitmap = ImageManager[IMAGE_TYPES[type]](item.name);
                return waitBitmap(bitmap, assetLabel(item), timeout);
            }
            if (type === "image") {
                const bitmap = item.url
                    ? ImageManager.loadBitmapFromUrl(item.url)
                    : ImageManager.loadBitmap(item.folder, item.name);
                return waitBitmap(bitmap, assetLabel(item), timeout);
            }
            if (AUDIO_TYPES.includes(type)) {
                if (type === "se" && item.static) {
                    const se = { name: item.name, volume: 90, pitch: 100, pan: 0 };
                    AudioManager.loadStaticSe(se);
                    const buffer = (AudioManager._staticBuffers || []).find(b => b.name === item.name);
                    return buffer ? waitAudio(buffer, assetLabel(item), timeout) : Promise.resolve(null);
                }
                const buffer = AudioManager.createBuffer(`${type}/`, item.name);
                return waitAudio(buffer, assetLabel(item), timeout);
            }
            if (type === "json") return FS.loadJson(item.url);
            if (type === "font") {
                FontManager.load(item.family, item.filename);
                return pollUntil(() => {
                    const state = FontManager._states && FontManager._states[item.family];
                    if (state === "error") return new Error(`Failed to load font ${item.family}`);
                    return state === "loaded";
                }, timeout).then(() => item.family);
            }
            if (type === "custom" && Utils.isFunction(item.load)) return Promise.resolve(item.load());
            return Promise.reject(new Error(`Unknown asset type "${type}"`));
        }
    };

    if (window.Scene_Base) {
        Hook.alias(Scene_Base.prototype, "isReady", function(orig) {
            const ready = orig();
            if (!ready || !this._mfAssetTasks) return ready;
            return this._mfAssetTasks.every(t => t.isDone());
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Document — editable JSON document  [experimental]
    //=========================================================================
    //  Connects MF.History (undo/redo), MF.Schema (validation), MF.FS (atomic
    //  save with backup), MF.Data (runtime global) and MF.Migration:
    //
    //    const doc = new MF.Document({
    //        path: "data/UILayouts.json", global: "$dataUILayouts",
    //        schema, version: 1, migrationKey: "UILayouts",
    //        initial: () => ({ version: 1, scenes: {} })
    //    });
    //    doc.load();
    //    doc.set("scenes.Scene_Menu.windows._goldWindow.x", 20, { merge: "drag" });
    //    doc.undo();
    //    const r = doc.save();   // { ok, errors?, reason? }
    //=========================================================================

    class Document extends EventEmitter {
        constructor(options = {}) {
            super();
            this.path = options.path || null;
            this.global = options.global || null;
            this.schema = options.schema || null;
            this.version = options.version || null;
            this.migrationKey = options.migrationKey || null;
            this.backup = options.backup !== false;
            this.indent = options.indent !== undefined ? options.indent : 2;
            this._initial = options.initial || (() => ({}));
            this.history = new History(options.historyLimit || 100);
            this.history.on("change", () => this.emit("dirty", this.isDirty()));
            this.data = null;
            this.loadError = null;
            this._autosave = options.autosave ? Utils.debounce(() => this.save(), options.autosave) : null;
        }

        //--- Loading ----------------------------------------------------------

        /**
         * Loads the document: from the file (NW.js), else from the runtime global,
         * else initial(). Invalid JSON is NOT replaced silently: loadError is set,
         * data falls back to initial(), and save() refuses unless { force: true }.
         */
        load() {
            this.loadError = null;
            let data;
            const text = this.path && FS.isAvailable() ? FS.readText(this.path) : null;
            if (text !== null) {
                try {
                    data = JSON.parse(text);
                } catch (e) {
                    this.loadError = { code: "parse", message: e.message };
                }
            } else if (this.global && window[this.global] !== undefined && window[this.global] !== null) {
                const status = Data.status(this.global);
                if (status && status.error && status.error.code !== "notFound") this.loadError = { ...status.error };
                if (!status || !status.usedDefault) data = Utils.clone(window[this.global]);
            }
            if (data === undefined) data = this._initial();
            if (this.migrationKey && this.version) data = Migration.migrate(this.migrationKey, data, this.version);
            if (this.schema) {
                const r = Schema.normalize(data, this.schema);
                data = r.value;
                if (!r.ok) Log.warn(PLUGIN_NAME, `MF.Document ${this.path || ""}: loaded data has problems:\n${Schema.format(r.errors)}`);
            }
            this.data = data;
            this.history.clear();
            this.history.markSaved();
            this.emit("load", this.data, this.loadError);
            if (this.loadError) Log.error(PLUGIN_NAME, `MF.Document ${this.path}: ${this.loadError.message}. Saving is blocked until fixed or forced.`);
            return this;
        }
        /** Discards unsaved changes. */
        revert() {
            return this.load();
        }

        //--- Reading ----------------------------------------------------------

        get(path, fallback) {
            return Utils.clone(Utils.get(this.data, path, fallback));
        }
        has(path) {
            return Utils.has(this.data, path);
        }

        //--- Editing (all recorded in history) ---------------------------------

        /**
         * Sets a value. options:
         *   label — history label
         *   merge — merge key: consecutive set() calls on the same path with the same
         *           key become one undo step (dragging, typing)
         */
        set(path, value, options = {}) {
            const keys = Utils.toPath(path);
            const existed = Utils.has(this.data, keys);
            const before = Utils.clone(Utils.get(this.data, keys));
            const after = Utils.clone(value);
            if (existed && Utils.equals(before, after)) return false;
            const doc = this;
            const pathKey = keys.join(".");
            const command = {
                label: options.label || `set ${pathKey}`,
                path: pathKey,
                mergeKey: options.merge || null,
                before,
                existed,
                after,
                do() {
                    doc._write(keys, this.after, true);
                },
                undo() {
                    doc._write(keys, this.before, this.existed);
                },
                merge(next) {
                    if (!this.mergeKey || next.mergeKey !== this.mergeKey || next.path !== this.path) return false;
                    this.after = next.after;
                    return true;
                }
            };
            this.history.execute(command);
            return true;
        }
        /** Removes a key (undoable). */
        remove(path, options = {}) {
            const keys = Utils.toPath(path);
            if (!Utils.has(this.data, keys)) return false;
            const before = Utils.clone(Utils.get(this.data, keys));
            const doc = this;
            this.history.execute({
                label: options.label || `remove ${keys.join(".")}`,
                do() {
                    doc._write(keys, undefined, false);
                },
                undo() {
                    doc._write(keys, before, true);
                }
            });
            return true;
        }
        /** set(path, fn(currentClone)). */
        update(path, fn, options) {
            return this.set(path, fn(this.get(path)), options);
        }
        /** Groups several edits into one undo step. */
        transaction(label, fn) {
            this.history.beginBatch();
            try {
                fn(this);
            } finally {
                this.history.endBatch(label);
            }
        }
        undo() {
            return this.history.undo();
        }
        redo() {
            return this.history.redo();
        }
        canUndo() {
            return this.history.canUndo();
        }
        canRedo() {
            return this.history.canRedo();
        }
        isDirty() {
            return this.history.isDirty();
        }

        //--- Validation and saving ------------------------------------------------

        validate() {
            return this.schema ? Schema.validate(this.data, this.schema) : { ok: true, errors: [] };
        }
        /**
         * Validates and writes the file (atomic, with backup), marks the history
         * as saved, and updates the runtime global.
         * Refuses (returns { ok: false, reason }) when:
         *   "invalid"    — schema errors (see errors)
         *   "loadError"  — the source file could not be parsed (would overwrite it); use { force: true }
         *   "writeFailed"
         * Without NW.js the file is offered as a download.
         */
        save(options = {}) {
            const v = this.validate();
            if (!v.ok) {
                this.emit("saveFailed", "invalid", v.errors);
                return { ok: false, reason: "invalid", errors: v.errors };
            }
            if (this.loadError && !options.force) {
                this.emit("saveFailed", "loadError", this.loadError);
                return { ok: false, reason: "loadError", error: this.loadError };
            }
            if (this.path) {
                const written = FS.isAvailable()
                    ? FS.writeJson(this.path, this.data, { backup: this.backup, indent: this.indent })
                    : FS.saveJson(this.path, this.data, { indent: this.indent });
                if (!written) {
                    this.emit("saveFailed", "writeFailed");
                    return { ok: false, reason: "writeFailed" };
                }
            }
            if (this.global) window[this.global] = Utils.clone(this.data);
            this.loadError = null;
            this.history.markSaved();
            this.emit("save", this.data);
            return { ok: true };
        }

        _write(keys, value, present) {
            if (keys.length === 0) {
                this.data = present ? Utils.clone(value) : this._initial();
            } else if (present) {
                Utils.set(this.data, keys, Utils.clone(value));
            } else {
                Utils.unset(this.data, keys);
            }
            this.emit("change", keys.join("."), value);
            if (this._autosave) this._autosave();
        }
    }

    //=========================================================================
    // MF.Registry — named extension registries
    //=========================================================================
    //  const actions = MF.Registry.define("MF_SimpleVisual.actions", {
    //      validate: (value, id) => typeof value === "function"
    //  });
    //  actions.add("openMenu", fn, "MyPlugin");   // -> remove()
    //  actions.get("openMenu"); actions.list(); actions.on("add", (id, value) => ...)
    //=========================================================================

    class RegistryStore extends EventEmitter {
        constructor(name, options = {}) {
            super();
            this.name = name;
            this._validate = Utils.isFunction(options.validate) ? options.validate : null;
            this._override = options.override === true;
            this._items = new Map();
        }
        add(id, value, owner = "unknown") {
            if (!Utils.isString(id) || !id) {
                Log.error(PLUGIN_NAME, `Registry "${this.name}": id must be a non-empty string (${owner}).`);
                return () => {};
            }
            if (this._validate && this._validate(value, id) === false) {
                Log.error(PLUGIN_NAME, `Registry "${this.name}": invalid value for "${id}" (${owner}).`);
                return () => {};
            }
            const prev = this._items.get(id);
            if (prev && !this._override) {
                Log.warn(PLUGIN_NAME, `Registry "${this.name}": "${id}" from ${prev.owner} is replaced by ${owner}.`);
            }
            const entry = { id, value, owner };
            this._items.set(id, entry);
            this.emit("add", id, value, owner);
            return () => {
                if (this._items.get(id) === entry) this.remove(id);
            };
        }
        remove(id) {
            const entry = this._items.get(id);
            if (!entry) return false;
            this._items.delete(id);
            this.emit("remove", id, entry.value);
            return true;
        }
        has(id) {
            return this._items.has(id);
        }
        get(id, fallback) {
            const entry = this._items.get(id);
            return entry ? entry.value : fallback;
        }
        owner(id) {
            const entry = this._items.get(id);
            return entry ? entry.owner : null;
        }
        ids() {
            return Array.from(this._items.keys());
        }
        list() {
            return Array.from(this._items.values()).map(e => ({ id: e.id, value: e.value, owner: e.owner }));
        }
        get size() {
            return this._items.size;
        }
    }

    const registries = new Map();

    const Registry = {
        Store: RegistryStore,
        /** Returns the registry with this name, creating it on first call. */
        define(name, options = {}) {
            if (!registries.has(name)) registries.set(name, new RegistryStore(name, options));
            return registries.get(name);
        },
        get(name) {
            return registries.get(name) || null;
        },
        has(name) {
            return registries.has(name);
        },
        names() {
            return Array.from(registries.keys());
        }
    };

    //=========================================================================
    // MF.Services — loose coupling between plugins
    //=========================================================================
    //  MF.Services.provide("quest", api, { version: "1.0.0", owner: "MF_QuestLog" });
    //  const quest = MF.Services.use("quest", "1.0.0");      // null if missing / too old
    //  MF.Services.when("quest").then(api => ...);            // any load order
    //=========================================================================

    const services = new Map();
    const serviceWaiters = new Map();

    const Services = {
        provide(name, api, options = {}) {
            if (services.has(name)) {
                Log.warn(PLUGIN_NAME, `Service "${name}" from ${services.get(name).owner} is replaced by ${options.owner || "unknown"}.`);
            }
            services.set(name, { name, api, version: options.version || "0.0.0", owner: options.owner || "unknown" });
            const waiters = serviceWaiters.get(name);
            if (waiters) {
                serviceWaiters.delete(name);
                for (const w of waiters) {
                    if (!w.minVersion || Utils.compareVersions(services.get(name).version, w.minVersion) >= 0) w.resolve(api);
                    else w.reject(new Error(`Service "${name}" v${w.minVersion}+ is required (provided: v${services.get(name).version}).`));
                }
            }
            Events.bus.emit("mf:serviceProvided", name, api);
            return api;
        },
        has(name, minVersion) {
            const s = services.get(name);
            return !!s && (!minVersion || Utils.compareVersions(s.version, minVersion) >= 0);
        },
        /** API of the service, or null (with a debug message) if it is missing or older than minVersion. */
        use(name, minVersion) {
            if (!this.has(name, minVersion)) {
                Log.debug(PLUGIN_NAME, `Service "${name}"${minVersion ? ` v${minVersion}+` : ""} is not available.`);
                return null;
            }
            return services.get(name).api;
        },
        /** Like use(), but throws a readable error. */
        require(requester, name, minVersion) {
            const api = this.use(name, minVersion);
            if (!api) {
                const s = services.get(name);
                throw new Error(s
                    ? `${requester}: service "${name}" v${minVersion}+ is required (provided: v${s.version} by ${s.owner}).`
                    : `${requester}: service "${name}" is required. Enable the plugin that provides it.`);
            }
            return api;
        },
        /** Promise resolved when the service is provided (immediately if it already is). */
        when(name, minVersion) {
            if (services.has(name)) {
                return this.has(name, minVersion)
                    ? Promise.resolve(services.get(name).api)
                    : Promise.reject(new Error(`Service "${name}" v${minVersion}+ is required (provided: v${services.get(name).version}).`));
            }
            return new Promise((resolve, reject) => {
                if (!serviceWaiters.has(name)) serviceWaiters.set(name, []);
                serviceWaiters.get(name).push({ resolve, reject, minVersion });
            });
        },
        list() {
            return Array.from(services.values()).map(s => ({ name: s.name, version: s.version, owner: s.owner }));
        }
    };

    //=========================================================================
    // MF.Notetag — notetags of database objects and events
    //=========================================================================
    //  <Tag>            -> true
    //  <Tag: value>     -> "value" (typed by options/schema)
    //  <Tag>            multi-line block
    //  ...
    //  </Tag>           -> "..." (text between the tags)
    //  Tag names are case-insensitive. A tag may repeat: getAll() returns every value.
    //
    //  MF.Notetag.get($dataItems[1], "Price", { type: "number", default: 0 });
    //  MF.Notetag.getAll(actor, "Element", { type: "list" });       // ["fire", "ice"]
    //  MF.Notetag.collect(battler, "CritBonus", { type: "number" }); // actor+class+equips+states / enemy+states
    //=========================================================================

    const notetagCache = new Map(); // note text -> Map(lowerTag -> [raw values])
    const NOTETAG_CACHE_LIMIT = 2000;

    function notetagNote(obj) {
        if (Utils.isString(obj)) return obj;
        if (!obj) return "";
        if (Utils.isString(obj.note)) return obj.note;
        // Game objects -> their database record.
        if (Utils.isFunction(obj.isActor) && obj.isActor() && Utils.isFunction(obj.actor)) return notetagNote(obj.actor());
        if (Utils.isFunction(obj.isEnemy) && obj.isEnemy() && Utils.isFunction(obj.enemy)) return notetagNote(obj.enemy());
        // Game_Event: the note of the event (comments are not included).
        if (obj.event && Utils.isFunction(obj.event)) {
            const data = obj.event();
            return data && Utils.isString(data.note) ? data.note : "";
        }
        return "";
    }

    function notetagParse(note) {
        const cached = notetagCache.get(note);
        if (cached) return cached;
        const tags = new Map();
        const push = (name, value) => {
            const key = name.toLowerCase();
            if (!tags.has(key)) tags.set(key, []);
            tags.get(key).push(value);
        };
        const text = note.replace(/\r\n?/g, "\n");
        // Blocks first; their contents are removed so inner <...> lines do not become tags.
        const rest = text.replace(/<([^<>:\/\s][^<>:\/]*?)>\n?([\s\S]*?)\n?<\/\1>/gi, (m, name, body) => {
            push(name.trim(), body);
            return "";
        });
        const re = /<([^<>:\/\s][^<>:]*?)(?:\s*:\s*([^<>]*?))?\s*>/g;
        let m;
        while ((m = re.exec(rest))) push(m[1].trim(), m[2] === undefined ? true : m[2]);
        if (notetagCache.size >= NOTETAG_CACHE_LIMIT) notetagCache.clear();
        notetagCache.set(note, tags);
        return tags;
    }

    function notetagConvert(raw, options) {
        const type = options.type || "auto";
        if (raw === true) {
            if (type === "boolean" || type === "auto" || type === "flag") return true;
            if (type === "list") return [];
            return options.default !== undefined ? options.default : true;
        }
        const s = String(raw).trim();
        switch (type) {
            case "string":
                return s;
            case "text":
                return String(raw);
            case "number": {
                const n = Number(s);
                return Number.isFinite(n) ? n : options.default;
            }
            case "int": {
                const n = parseInt(s, 10);
                return Number.isFinite(n) ? n : options.default;
            }
            case "boolean":
            case "flag":
                return !/^(false|off|no|0)$/i.test(s);
            case "list":
                return s === "" ? [] : s.split(options.separator || ",").map(v => v.trim()).filter(v => v !== "");
            case "numbers":
                return s === "" ? [] : s.split(options.separator || ",").map(v => Number(v.trim())).filter(Number.isFinite);
            case "json":
                return Utils.parseJson(s, options.default);
            case "auto":
            default:
                if (s !== "" && Number.isFinite(Number(s))) return Number(s);
                if (/^(true|false)$/i.test(s)) return s.toLowerCase() === "true";
                return s;
        }
    }

    function notetagFinish(value, options) {
        if (value === undefined) return options.default;
        if (options.schema) {
            const r = Schema.normalize(value, options.schema);
            if (!r.ok) {
                Log.warn(PLUGIN_NAME, `Notetag value is invalid:\n${Schema.format(r.errors)}`);
                return options.default;
            }
            return r.value;
        }
        return value;
    }

    const Notetag = {
        /** All tags of an object: { lowerTag: [raw values] } (raw: true or string). */
        parse(objOrNote) {
            const tags = notetagParse(notetagNote(objOrNote));
            const out = {};
            for (const [k, v] of tags) out[k] = v.slice();
            return out;
        },
        has(obj, tag) {
            return notetagParse(notetagNote(obj)).has(String(tag).toLowerCase());
        },
        /**
         * First value of a tag.
         * options: { type: auto|string|text|number|int|boolean|list|numbers|json,
         *            default, separator, schema }
         */
        get(obj, tag, options = {}) {
            const list = notetagParse(notetagNote(obj)).get(String(tag).toLowerCase());
            if (!list) return options.default;
            return notetagFinish(notetagConvert(list[0], options), options);
        },
        /** Every value of a repeated tag. */
        getAll(obj, tag, options = {}) {
            const list = notetagParse(notetagNote(obj)).get(String(tag).toLowerCase());
            if (!list) return [];
            return list.map(raw => notetagFinish(notetagConvert(raw, options), options)).filter(v => v !== undefined);
        },
        /** Database objects that affect a battler: actor, class, equips, states / enemy, states. */
        sources(battler) {
            if (!battler) return [];
            const out = [];
            if (Utils.isFunction(battler.isActor) && battler.isActor()) {
                out.push(battler.actor(), battler.currentClass());
                for (const e of battler.equips()) if (e) out.push(e);
            } else if (Utils.isFunction(battler.isEnemy) && battler.isEnemy()) {
                out.push(battler.enemy());
            }
            if (Utils.isFunction(battler.states)) out.push(...battler.states());
            return out.filter(Boolean);
        },
        /** Values of a tag from all sources of a battler (see sources). */
        collect(battler, tag, options = {}) {
            const out = [];
            for (const src of this.sources(battler)) out.push(...this.getAll(src, tag, options));
            return out;
        },
        /** Sum of numeric values of a tag from all sources of a battler. */
        sum(battler, tag, base = 0) {
            return this.collect(battler, tag, { type: "number" }).reduce((a, b) => a + (Utils.isNumber(b) ? b : 0), base);
        },
        clearCache() {
            notetagCache.clear();
        }
    };

    //=========================================================================
    // MF.GameEvents — standard game events on MF.Events.bus
    //=========================================================================
    //  Every event is emitted on MF.Events.bus with the "game:" prefix:
    //    game:newGame, game:saveLoaded
    //    game:switchChanged (id, value, old)      game:variableChanged (id, value, old)
    //    game:goldChanged (value, old)            game:itemChanged (item, count, old)
    //    game:actorLevelChanged (actor, level, old)
    //    game:stateAdded (battler, stateId)       game:stateRemoved (battler, stateId)
    //    game:battleStart ()                      game:battleEnd (result: 0 win, 1 escape, 2 lose)
    //    game:turnStart ()                        game:turnEnd ()
    //    game:actionEnd (subject, action)
    //    game:mapLoaded (mapId)                   game:transfer (mapId, x, y)
    //    game:eventStarted (event)                game:messageAdded (text line)
    //
    //  const off = MF.GameEvents.on("variableChanged", (id, value, old) => ...);
    //  MF.GameEvents.onScene(this, "goldChanged", fn);   // removed when the scene terminates
    //=========================================================================

    const sceneSubscriptions = new WeakMap();

    const GameEvents = {
        PREFIX: "game:",
        on(name, fn, context) {
            return Events.bus.on(this.PREFIX + name, fn, context);
        },
        once(name, fn, context) {
            return Events.bus.once(this.PREFIX + name, fn, context);
        },
        emit(name, ...args) {
            return Events.bus.emit(this.PREFIX + name, ...args);
        },
        /** Subscription that is removed automatically when the scene terminates. */
        onScene(scene, name, fn, context) {
            const off = this.on(name, fn, context === undefined ? scene : context);
            if (!scene) return off;
            if (!sceneSubscriptions.has(scene)) sceneSubscriptions.set(scene, []);
            sceneSubscriptions.get(scene).push(off);
            return off;
        },
        _active(name) {
            return Events.bus.listenerCount(this.PREFIX + name) > 0;
        }
    };

    if (window.Scene_Base) {
        Hook.after(Scene_Base.prototype, "terminate", function() {
            const list = sceneSubscriptions.get(this);
            if (!list) return;
            sceneSubscriptions.delete(this);
            for (const off of list) off();
        }, PLUGIN_NAME);
    }

    if (window.DataManager) {
        Hook.after(DataManager, "setupNewGame", function() {
            GameEvents.emit("newGame");
        }, PLUGIN_NAME);
        Events.bus.on("mf:saveLoaded", () => GameEvents.emit("saveLoaded"));
    }

    if (window.Game_Switches) {
        Hook.alias(Game_Switches.prototype, "setValue", function(orig, id, value) {
            if (!GameEvents._active("switchChanged")) return orig();
            const old = this.value(id);
            orig();
            const now = this.value(id);
            if (now !== old) GameEvents.emit("switchChanged", id, now, old);
        }, PLUGIN_NAME);
    }

    if (window.Game_Variables) {
        Hook.alias(Game_Variables.prototype, "setValue", function(orig, id, value) {
            if (!GameEvents._active("variableChanged")) return orig();
            const old = this.value(id);
            orig();
            const now = this.value(id);
            if (!Utils.equals(now, old)) GameEvents.emit("variableChanged", id, now, old);
        }, PLUGIN_NAME);
    }

    if (window.Game_Party) {
        Hook.alias(Game_Party.prototype, "gainGold", function(orig) {
            if (!GameEvents._active("goldChanged")) return orig();
            const old = this.gold();
            orig();
            if (this.gold() !== old) GameEvents.emit("goldChanged", this.gold(), old);
        }, PLUGIN_NAME);
        Hook.alias(Game_Party.prototype, "gainItem", function(orig, item) {
            if (!item || !GameEvents._active("itemChanged")) return orig();
            const old = this.numItems(item);
            orig();
            const now = this.numItems(item);
            if (now !== old) GameEvents.emit("itemChanged", item, now, old);
        }, PLUGIN_NAME);
    }

    if (window.Game_Actor) {
        Hook.alias(Game_Actor.prototype, "changeExp", function(orig) {
            if (!GameEvents._active("actorLevelChanged")) return orig();
            const old = this.level;
            orig();
            if (this.level !== old) GameEvents.emit("actorLevelChanged", this, this.level, old);
        }, PLUGIN_NAME);
    }

    if (window.Game_Battler) {
        Hook.alias(Game_Battler.prototype, "addState", function(orig, stateId) {
            if (!GameEvents._active("stateAdded")) return orig();
            const had = this.isStateAffected(stateId);
            orig();
            if (!had && this.isStateAffected(stateId)) GameEvents.emit("stateAdded", this, stateId);
        }, PLUGIN_NAME);
        Hook.alias(Game_Battler.prototype, "removeState", function(orig, stateId) {
            if (!GameEvents._active("stateRemoved")) return orig();
            const had = this.isStateAffected(stateId);
            orig();
            if (had && !this.isStateAffected(stateId)) GameEvents.emit("stateRemoved", this, stateId);
        }, PLUGIN_NAME);
    }

    if (window.BattleManager) {
        Hook.after(BattleManager, "startBattle", () => GameEvents.emit("battleStart"), PLUGIN_NAME);
        Hook.after(BattleManager, "endBattle", (r, result) => GameEvents.emit("battleEnd", result), PLUGIN_NAME);
        Hook.after(BattleManager, "startTurn", () => GameEvents.emit("turnStart"), PLUGIN_NAME);
        Hook.after(BattleManager, "endTurn", () => GameEvents.emit("turnEnd"), PLUGIN_NAME);
        Hook.alias(BattleManager, "endAction", function(orig) {
            const subject = this._subject;
            const action = this._action;
            orig();
            GameEvents.emit("actionEnd", subject, action);
        }, PLUGIN_NAME);
    }

    if (window.Game_Map) {
        Hook.after(Game_Map.prototype, "setup", function(r, mapId) {
            GameEvents.emit("mapLoaded", mapId);
        }, PLUGIN_NAME);
    }

    if (window.Game_Player) {
        Hook.alias(Game_Player.prototype, "performTransfer", function(orig) {
            const transferring = this.isTransferring();
            const mapId = this._newMapId, x = this._newX, y = this._newY;
            orig();
            if (transferring) GameEvents.emit("transfer", mapId, x, y);
        }, PLUGIN_NAME);
    }

    if (window.Game_Event) {
        Hook.after(Game_Event.prototype, "start", function() {
            if (this._starting) GameEvents.emit("eventStarted", this);
        }, PLUGIN_NAME);
    }

    if (window.Game_Message) {
        Hook.after(Game_Message.prototype, "add", function(r, text) {
            GameEvents.emit("messageAdded", text);
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Commands — plugin commands with typed arguments and async support
    //=========================================================================
    //  MF.Commands.register("MF_QuestLog", "StartQuest", async function(args) {
    //      // this — Game_Interpreter (or null when called from JS)
    //      await MF.Timer.wait(30);       // the event waits until the promise settles
    //  }, { id: { type: "string", required: true }, stage: { type: "number", default: 0 } });
    //
    //  MF.Commands.call("MF_QuestLog", "StartQuest", { id: "q1" });   // from JS -> Promise
    //=========================================================================

    const commandWaits = new WeakMap(); // Game_Interpreter -> { done }
    const commandTable = new Map();

    const Commands = {
        /**
         * schema — MF.Schema properties of the arguments object (optional).
         * The handler may return a Promise; the event interpreter waits for it.
         */
        register(pluginName, commandName, handler, schema) {
            const key = `${pluginName}:${commandName}`;
            if (commandTable.has(key)) Log.warn(PLUGIN_NAME, `Command ${key} is registered again.`);
            commandTable.set(key, { handler, schema: schema || null });
            PluginManager.registerCommand(pluginName, commandName, function(rawArgs) {
                const promise = Commands._run(pluginName, commandName, rawArgs, this);
                if (this instanceof Game_Interpreter && promise) {
                    const wait = { done: false };
                    commandWaits.set(this, wait);
                    promise.finally(() => {
                        wait.done = true;
                    });
                }
            });
        },
        has(pluginName, commandName) {
            return commandTable.has(`${pluginName}:${commandName}`);
        },
        /** Calls a registered command from code. Always returns a Promise. */
        call(pluginName, commandName, args = {}, interpreter = null) {
            return this._run(pluginName, commandName, args, interpreter, true) || Promise.resolve();
        },
        _args(entry, key, rawArgs) {
            let args = Utils.parseParams(rawArgs || {});
            if (!Utils.isObject(args)) args = {};
            if (entry.schema) {
                const r = Schema.normalize(args, { type: "object", properties: entry.schema });
                if (!r.ok) Log.warn(PLUGIN_NAME, `Command ${key}: invalid arguments\n${Schema.format(r.errors)}`);
                args = r.value;
            }
            return args;
        },
        /** Returns a Promise when the handler is async (or always, if force). */
        _run(pluginName, commandName, rawArgs, interpreter, force = false) {
            const key = `${pluginName}:${commandName}`;
            const entry = commandTable.get(key);
            if (!entry) {
                Log.warn(PLUGIN_NAME, `Command ${key} is not registered.`);
                return force ? Promise.resolve() : null;
            }
            let result;
            try {
                result = entry.handler.call(interpreter, this._args(entry, key, rawArgs));
            } catch (e) {
                Log.error(PLUGIN_NAME, `Command ${key} failed:`, e);
                if (force) return Promise.reject(e);
                throw e;
            }
            if (result && Utils.isFunction(result.then)) {
                return Promise.resolve(result).catch(e => {
                    Log.error(PLUGIN_NAME, `Command ${key} failed:`, e);
                });
            }
            return force ? Promise.resolve(result) : null;
        }
    };

    if (window.Game_Interpreter) {
        Hook.alias(Game_Interpreter.prototype, "updateWait", function(orig) {
            const wait = commandWaits.get(this);
            if (wait) {
                if (!wait.done) return true;
                commandWaits.delete(this);
            }
            return orig();
        }, PLUGIN_NAME);
        // A loaded or reset interpreter must not keep waiting for a promise of another session.
        Hook.after(Game_Interpreter.prototype, "clear", function() {
            commandWaits.delete(this);
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Options — shared entries in Scene_Options (values in MF.Config)
    //=========================================================================
    //  MF.Options.add({
    //      key: "MF_QuestLog.tracker",        // MF.Config key (registered automatically)
    //      label: "Quest tracker",             // string, I18n key "ns:key" or function
    //      type: "boolean",                    // boolean | number | volume | list
    //      default: true,
    //      // number/volume: min, max, step, wrap, format(value)
    //      // list: values: [{ value: "a", label: "A" }, ...]
    //      // visible: () => true, after: "commandRemember" (MZ symbol to insert after)
    //  });
    //=========================================================================

    const optionEntries = new Map();
    const OPTION_PREFIX = "mf:";

    function optionLabel(value) {
        if (Utils.isFunction(value)) return String(value());
        if (Utils.isString(value) && value.includes(":") && I18n.has(value)) return I18n.t(value);
        return value === undefined || value === null ? "" : String(value);
    }

    function optionEntry(symbol) {
        return Utils.isString(symbol) && symbol.startsWith(OPTION_PREFIX) ? optionEntries.get(symbol.slice(OPTION_PREFIX.length)) : null;
    }

    const Options = {
        add(def) {
            if (!Utils.isObject(def) || !Utils.isString(def.key) || !def.key) {
                Log.error(PLUGIN_NAME, "Options.add: key is required.");
                return;
            }
            const type = def.type || "boolean";
            const entry = {
                key: def.key,
                label: def.label !== undefined ? def.label : def.key,
                type: ["boolean", "number", "volume", "list"].includes(type) ? type : "boolean",
                min: Utils.isNumber(def.min) ? def.min : 0,
                max: Utils.isNumber(def.max) ? def.max : type === "volume" ? 100 : 10,
                step: Utils.isNumber(def.step) && def.step > 0 ? def.step : type === "volume" ? 20 : 1,
                wrap: !!def.wrap,
                values: Array.isArray(def.values) ? def.values.map(v => (Utils.isObject(v) ? v : { value: v, label: String(v) })) : [],
                format: Utils.isFunction(def.format) ? def.format : null,
                visible: Utils.isFunction(def.visible) ? def.visible : null,
                after: def.after || null,
                owner: def.owner || "unknown"
            };
            let defaultValue = def.default;
            if (defaultValue === undefined) {
                defaultValue = entry.type === "boolean" ? false : entry.type === "list" ? (entry.values[0] || {}).value : entry.min;
            }
            if (!Config.isRegistered(entry.key)) Config.register(entry.key, defaultValue);
            optionEntries.set(entry.key, entry);
        },
        remove(key) {
            return optionEntries.delete(key);
        },
        list() {
            return Array.from(optionEntries.values()).map(e => ({ key: e.key, type: e.type, owner: e.owner }));
        },
        symbol(key) {
            return OPTION_PREFIX + key;
        },
        _visible() {
            return Array.from(optionEntries.values()).filter(e => {
                try {
                    return !e.visible || e.visible();
                } catch (err) {
                    Log.error(PLUGIN_NAME, `Option "${e.key}" visible() failed:`, err);
                    return false;
                }
            });
        },
        _status(entry) {
            const value = Config.get(entry.key);
            if (entry.format) return String(entry.format(value));
            switch (entry.type) {
                case "boolean":
                    return value ? TextManager.on || "ON" : TextManager.off || "OFF";
                case "volume":
                    return `${value}%`;
                case "list": {
                    const item = entry.values.find(v => Utils.equals(v.value, value));
                    return item ? optionLabel(item.label !== undefined ? item.label : item.value) : String(value);
                }
                default:
                    return String(value);
            }
        },
        _change(entry, dir, wrapForced) {
            const value = Config.get(entry.key);
            let next = value;
            if (entry.type === "boolean") {
                next = dir === 0 ? !value : dir > 0;
            } else if (entry.type === "list") {
                const n = entry.values.length;
                if (n === 0) return false;
                let i = entry.values.findIndex(v => Utils.equals(v.value, value));
                if (i < 0) i = 0;
                else i += dir === 0 ? 1 : dir;
                if (i >= n) i = entry.wrap || wrapForced ? 0 : n - 1;
                if (i < 0) i = entry.wrap || wrapForced ? n - 1 : 0;
                next = entry.values[i].value;
            } else {
                const cur = Utils.isNumber(value) ? value : entry.min;
                let v = cur + (dir === 0 ? 1 : dir) * entry.step;
                if (v > entry.max) v = entry.wrap || wrapForced ? entry.min : entry.max;
                if (v < entry.min) v = entry.wrap || wrapForced ? entry.max : entry.min;
                next = Math.round(v * 1e6) / 1e6;
            }
            if (Utils.equals(next, value)) return false;
            Config.set(entry.key, next);
            return true;
        }
    };

    if (window.Window_Options) {
        Hook.after(Window_Options.prototype, "makeCommandList", function() {
            for (const entry of Options._visible()) {
                const symbol = OPTION_PREFIX + entry.key;
                this.addCommand(optionLabel(entry.label), symbol);
                if (entry.after) {
                    const at = this._list.findIndex(c => c.symbol === entry.after);
                    if (at >= 0) this._list.splice(at + 1, 0, this._list.pop());
                }
            }
        }, PLUGIN_NAME);
        Hook.alias(Window_Options.prototype, "statusText", function(orig, index) {
            const entry = optionEntry(this.commandSymbol(index));
            return entry ? Options._status(entry) : orig();
        }, PLUGIN_NAME);
        const optionInput = (method, dir, wrap) => {
            Hook.alias(Window_Options.prototype, method, function(orig) {
                const entry = optionEntry(this.currentSymbol());
                if (!entry) return orig();
                if (Options._change(entry, dir, wrap)) {
                    this.redrawItem(this.findSymbol(this.currentSymbol()));
                    this.playCursorSound();
                }
                return undefined;
            }, PLUGIN_NAME);
        };
        optionInput("processOk", 0, true);
        optionInput("cursorRight", 1, false);
        optionInput("cursorLeft", -1, false);
    }

    if (window.Scene_Options) {
        Hook.after(Scene_Options.prototype, "maxCommands", function(result) {
            return result + Options._visible().length;
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Modifiers — stacking stat modifiers without overlapping hooks
    //=========================================================================
    //  const off = MF.Modifiers.add("param", (value, ctx) =>
    //      ctx.paramId === 2 && ctx.battler.isStateAffected(10) ? value * 1.2 : value,
    //      { owner: "MF_Rage", priority: 100 });   // lower priority runs first
    //
    //  Built-in stats (ctx):
    //    param       { battler, paramId }       result is rounded and clamped by MZ limits
    //    xparam      { battler, xparamId }      sparam { battler, sparamId }
    //    skillMpCost { battler, skill }         skillTpCost { battler, skill }
    //    expGain     { actor, value }           goldGain { value }  (battle rewards)
    //  Custom stats: MF.Modifiers.apply("myStat", base, ctx).
    //=========================================================================

    const modifierTable = new Map(); // stat -> [{ fn, priority, owner, order }]
    let modifierOrder = 0;

    const Modifiers = {
        add(stat, fn, options = {}) {
            if (!Utils.isFunction(fn)) {
                Log.error(PLUGIN_NAME, `Modifiers.add("${stat}"): fn must be a function.`);
                return () => {};
            }
            if (!modifierTable.has(stat)) modifierTable.set(stat, []);
            const list = modifierTable.get(stat);
            const entry = { fn, priority: Utils.isNumber(options.priority) ? options.priority : 0, owner: options.owner || "unknown", order: modifierOrder++ };
            list.push(entry);
            list.sort((a, b) => a.priority - b.priority || a.order - b.order);
            return () => {
                const i = list.indexOf(entry);
                if (i >= 0) list.splice(i, 1);
            };
        },
        has(stat) {
            const list = modifierTable.get(stat);
            return !!list && list.length > 0;
        },
        apply(stat, value, ctx = {}) {
            const list = modifierTable.get(stat);
            if (!list || list.length === 0) return value;
            let v = value;
            for (const entry of list.slice()) {
                try {
                    const r = entry.fn(v, ctx);
                    if (Utils.isNumber(r) || (r !== undefined && !Utils.isNumber(v))) v = r;
                } catch (e) {
                    Log.error(PLUGIN_NAME, `Modifier "${stat}" from ${entry.owner} failed:`, e);
                }
            }
            return v;
        },
        list(stat) {
            const pick = s => (modifierTable.get(s) || []).map(e => ({ stat: s, owner: e.owner, priority: e.priority }));
            return stat ? pick(stat) : Array.from(modifierTable.keys()).flatMap(pick);
        }
    };

    if (window.Game_BattlerBase) {
        Hook.alias(Game_BattlerBase.prototype, "param", function(orig, paramId) {
            const value = orig();
            if (!Modifiers.has("param")) return value;
            const v = Modifiers.apply("param", value, { battler: this, paramId });
            return Math.round(MathX.clamp(v, this.paramMin(paramId), this.paramMax(paramId)));
        }, PLUGIN_NAME);
        Hook.alias(Game_BattlerBase.prototype, "xparam", function(orig, xparamId) {
            const value = orig();
            return Modifiers.has("xparam") ? Modifiers.apply("xparam", value, { battler: this, xparamId }) : value;
        }, PLUGIN_NAME);
        Hook.alias(Game_BattlerBase.prototype, "sparam", function(orig, sparamId) {
            const value = orig();
            return Modifiers.has("sparam") ? Modifiers.apply("sparam", value, { battler: this, sparamId }) : value;
        }, PLUGIN_NAME);
        Hook.alias(Game_BattlerBase.prototype, "skillMpCost", function(orig, skill) {
            const value = orig();
            return Modifiers.has("skillMpCost") ? Math.max(0, Math.floor(Modifiers.apply("skillMpCost", value, { battler: this, skill }))) : value;
        }, PLUGIN_NAME);
        Hook.alias(Game_BattlerBase.prototype, "skillTpCost", function(orig, skill) {
            const value = orig();
            return Modifiers.has("skillTpCost") ? Math.max(0, Math.floor(Modifiers.apply("skillTpCost", value, { battler: this, skill }))) : value;
        }, PLUGIN_NAME);
    }

    if (window.BattleManager) {
        Hook.after(BattleManager, "makeRewards", function() {
            const r = this._rewards;
            if (!r) return;
            if (Modifiers.has("goldGain")) r.gold = Math.max(0, Math.round(Modifiers.apply("goldGain", r.gold, { value: r.gold })));
            if (Modifiers.has("expGain")) r.exp = Math.max(0, Math.round(Modifiers.apply("expGain", r.exp, { value: r.exp })));
        }, PLUGIN_NAME);
    }

    //=========================================================================
    // MF.Random — seeded random numbers
    //=========================================================================
    //  const rng = MF.Random.create(12345);     // independent generator
    //  rng.int(1, 6); rng.chance(0.25); rng.pick(list); rng.weighted(list, "weight");
    //  MF.Random.stream("loot").int(1, 100);   // state is stored in the save file
    //  MF.Random.int(1, 6);                     // Math.random-based helpers
    //=========================================================================

    function hashSeed(seed) {
        if (Utils.isNumber(seed)) return seed >>> 0;
        const s = String(seed);
        let h = 2166136261;
        for (let i = 0; i < s.length; i++) {
            h ^= s.charCodeAt(i);
            h = Math.imul(h, 16777619);
        }
        return h >>> 0;
    }

    const RandomMethods = {
        float(min = 0, max = 1) {
            return min + this.next() * (max - min);
        },
        /** Integer in [min, max] (both inclusive). */
        int(min, max) {
            if (max === undefined) {
                max = min;
                min = 0;
            }
            const lo = Math.ceil(Math.min(min, max));
            const hi = Math.floor(Math.max(min, max));
            return lo + Math.floor(this.next() * (hi - lo + 1));
        },
        chance(p) {
            return this.next() < p;
        },
        pick(list) {
            return list && list.length ? list[Math.floor(this.next() * list.length)] : undefined;
        },
        /** Shuffles a copy of the array. */
        shuffle(list) {
            const a = Array.from(list || []);
            for (let i = a.length - 1; i > 0; i--) {
                const j = Math.floor(this.next() * (i + 1));
                [a[i], a[j]] = [a[j], a[i]];
            }
            return a;
        },
        /** Weighted pick. weight — property name or function(item) -> number. */
        weighted(list, weight = "weight") {
            if (!list || !list.length) return undefined;
            const w = Utils.isFunction(weight) ? weight : item => (Utils.isObject(item) ? item[weight] : 1);
            const weights = list.map(item => Math.max(0, Number(w(item)) || 0));
            const total = weights.reduce((a, b) => a + b, 0);
            if (total <= 0) return undefined;
            let r = this.next() * total;
            for (let i = 0; i < list.length; i++) {
                r -= weights[i];
                if (r < 0) return list[i];
            }
            return list[list.length - 1];
        }
    };

    class RandomGenerator {
        constructor(seed = Date.now()) {
            this.seed(seed);
        }
        seed(seed) {
            this._state = hashSeed(seed);
            return this;
        }
        get state() {
            return this._state;
        }
        set state(value) {
            this._state = value >>> 0;
        }
        /** mulberry32: float in [0, 1). */
        next() {
            let t = (this._state = (this._state + 0x6d2b79f5) >>> 0);
            t = Math.imul(t ^ (t >>> 15), t | 1);
            t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        }
    }
    Object.assign(RandomGenerator.prototype, RandomMethods);

    const RANDOM_SAVE_KEY = "MF_Core.random";

    /** Generator whose state lives in MF.Save (survives save/load, reset on new game). */
    class RandomStream extends RandomGenerator {
        constructor(name, seed) {
            super(0);
            this.name = name;
            this._seed = seed;
        }
        _store() {
            const store = Save.get(RANDOM_SAVE_KEY);
            if (!Utils.isNumber(store[this.name])) {
                store[this.name] = hashSeed(this._seed !== undefined ? this._seed : `${this.name}:${Date.now()}:${Math.random()}`);
            }
            return store;
        }
        get state() {
            return this._store()[this.name];
        }
        set state(value) {
            this._store()[this.name] = value >>> 0;
        }
        seed(seed) {
            if (this.name !== undefined) this._store()[this.name] = hashSeed(seed);
            return this;
        }
        next() {
            const store = this._store();
            this._state = store[this.name];
            const r = RandomGenerator.prototype.next.call(this);
            store[this.name] = this._state;
            return r;
        }
    }

    Save.register(RANDOM_SAVE_KEY, { default: () => ({}) });
    const randomStreams = new Map();
    const mathRandom = { next: () => Math.random() };
    Object.assign(mathRandom, RandomMethods);

    const Random = {
        Generator: RandomGenerator,
        create(seed) {
            return new RandomGenerator(seed);
        },
        /** Named stream saved with the game. seed is used only when the stream is first created. */
        stream(name, seed) {
            if (!randomStreams.has(name)) randomStreams.set(name, new RandomStream(name, seed));
            return randomStreams.get(name);
        },
        next: () => Math.random(),
        float: (min, max) => mathRandom.float(min, max),
        int: (min, max) => mathRandom.int(min, max),
        chance: p => mathRandom.chance(p),
        pick: list => mathRandom.pick(list),
        shuffle: list => mathRandom.shuffle(list),
        weighted: (list, weight) => mathRandom.weighted(list, weight),
        hash: hashSeed
    };

    //=========================================================================
    // MF.Core — plugin registration and dependencies
    //=========================================================================


    const plugins = new Map();
    const majorWarnings = new Set();

    function majorOf(version) {
        return parseInt(String(version).split(".")[0], 10) || 0;
    }

    const Core = {
        VERSION: PLUGIN_VERSION,
        params,

        /**
         * Registers an MF_* plugin.
         *   MF.Core.register("MF_QuestLog", "0.1.0", {
         *       requires: { MF_Core: "1.0.0" }   // checked via require()
         *   });
         */
        register(name, version, info = {}) {
            if (Utils.isObject(info.requires)) {
                for (const dep of Object.keys(info.requires)) this.require(name, dep, info.requires[dep]);
            }
            plugins.set(name, { name, version, ...info });
            Log.debug(PLUGIN_NAME, `registered ${name} v${version}`);
        },
        isRegistered(name, minVersion) {
            const p = plugins.get(name);
            if (!p) return false;
            return !minVersion || Utils.compareVersions(p.version, minVersion) >= 0;
        },
        version(name) {
            const p = plugins.get(name);
            return p ? p.version : null;
        },
        list() {
            return Array.from(plugins.values());
        },
        /**
         * Dependency check. Throws an error with a readable message
         * that MZ shows on screen.
         *   MF.Core.require("MF_QuestLog", "MF_Core", "1.0.0");
         * If the installed MAJOR version is higher than the required one,
         * a one-time warning is logged: the plugin may use removed API.
         */
        require(requester, name, minVersion) {
            if (!plugins.has(name)) {
                throw new Error(`${requester}: plugin ${name} is required. Place it above ${requester} in the plugin list.`);
            }
            if (!minVersion) {
                Log.warn(PLUGIN_NAME, `${requester}: require("${name}") without a minimum version. Specify the version the plugin was written against.`);
                return true;
            }
            if (!this.isRegistered(name, minVersion)) {
                throw new Error(`${requester}: ${name} v${minVersion}+ is required (installed: v${this.version(name)}).`);
            }
            const installed = this.version(name);
            const key = `${requester}|${name}`;
            if (majorOf(installed) > majorOf(minVersion) && !majorWarnings.has(key)) {
                majorWarnings.add(key);
                Log.warn(
                    PLUGIN_NAME,
                    `${requester} was written for ${name} ${minVersion}; installed ${installed} is a newer major version and may be incompatible. See the ${name} changelog.`
                );
            }
            return true;
        },
        /**
         * Plugin parameters with recursive JSON parsing.
         * With a schema, values are validated and defaults applied;
         * problems are logged as a warning.
         */
        parameters(pluginName, schema) {
            const parsed = Utils.parseParams(PluginManager.parameters(pluginName));
            if (!schema) return parsed;
            const r = Schema.normalize(parsed, schema);
            if (!r.ok) Log.warn(pluginName, `Invalid plugin parameters:\n${Schema.format(r.errors)}`);
            return r.value;
        }
    };

    //=========================================================================
    // Export
    //=========================================================================

    Object.assign(MF, {
        Core,
        Log,
        Utils,
        Math: MathX,
        Units,
        Anchor,
        Color,
        Hook,
        Events,
        Condition,
        Script,
        FS,
        Data,
        Migration,
        History,
        Deprecation,
        Schema,
        Save,
        Config,
        I18n,
        Ticker,
        Tween,
        Timer,
        Queue,
        Layout,
        UI,
        Text,
        Input,
        Assets,
        Document,
        Registry,
        Services,
        Notetag,
        GameEvents,
        Commands,
        Options,
        Modifiers,
        Random
    });

    Core.register(PLUGIN_NAME, PLUGIN_VERSION);
})();
