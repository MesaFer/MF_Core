# MF_Core — Changelog

All notable changes to `MF_Core.js` are documented here.
Format: [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), versioning: [Semantic Versioning](https://semver.org/).

## Rules

Every change to the public API **must** be recorded here in the same commit.

Each entry is tagged:

| Tag | Meaning | Allowed in |
|---|---|---|
| **Added** | New API | MINOR |
| **Changed** | Behavior change of existing API, backward compatible | MINOR |
| **Deprecated** | API still works, redirects to its replacement, warns once; removal version stated | MINOR |
| **Removed** ⚠ BREAKING | Removal of API that was deprecated before | MAJOR only |
| **Breaking** ⚠ BREAKING | Incompatible change of signature or behavior | MAJOR only |
| **Experimental change** | Change of an API marked `[experimental]` | MINOR |
| **Fixed** | Bug fix without API change | PATCH |

New entries go into an **[Unreleased]** section at the top; it is renamed to the version number on release.

### Deprecation lifecycle

An API is never removed or changed incompatibly at once:

1. **Replace** — the new API is added (MINOR). The old one keeps working and redirects to the new one via `MF.Deprecation.method` / `MF.Deprecation.property`, printing a one-time console warning.
2. **Announce** — the old API is listed under **Deprecated** with `since` and `removeIn` versions.
3. **Remove** — only in the stated MAJOR release, listed under **Removed**. At least one MINOR release must separate steps 1 and 3.

Example of step 1 (hypothetical rename in 1.1.0):

```js
MF.Utils.newName = function(...) { ... };
MF.Deprecation.method(MF.Utils, "oldName", {
    id: "MF.Utils.oldName", since: "1.1.0", removeIn: "2.0.0",
    replacement: "MF.Utils.newName", fn: MF.Utils.newName
});
```

### Dependent plugins

Each MF_* plugin declares the MF_Core version it was written against — in code **and** in `@help`:

```js
MF.Core.register("MF_QuestLog", "0.1.0", { requires: { MF_Core: "1.0.0" } });
```

```
 * @base MF_Core
 * @orderAfter MF_Core
 * Requires: MF_Core 1.0.0+ (written against 1.0.0)
```

When MF_Core's MAJOR version is higher than the required one, a one-time compatibility warning is logged.

---

## [Unreleased]

_Nothing yet._

---

## [1.2.0] — 2026-09-25

### Added
- `MF.Registry` — named extension registries (`define`, `add` → remove function, `get`, `has`, `ids`, `list`, `owner`; events `add` / `remove`; optional `validate`).
- `MF.Services` — loose coupling between plugins: `provide(name, api, { version, owner })`, `use(name, minVersion)` (null if missing), `require(requester, name, minVersion)` (readable error), `when(name, minVersion)` (Promise, any load order), `list()`.
- `MF.Notetag` — notetag parser with cache: `<Tag>`, `<Tag: value>`, repeated tags, blocks `<Tag>…</Tag>`; case-insensitive. `get` / `getAll` with types `auto | string | text | number | int | boolean | list | numbers | json`, `default`, `separator`, `schema`; `has`, `parse`; battler helpers `sources`, `collect`, `sum` (actor + class + equips + states / enemy + states). Accepts database objects, notes, `Game_Actor` / `Game_Enemy` / `Game_Event`.
- `MF.GameEvents` — standard game events on `MF.Events.bus` with the `game:` prefix: `newGame`, `saveLoaded`, `switchChanged`, `variableChanged`, `goldChanged`, `itemChanged`, `actorLevelChanged`, `stateAdded`, `stateRemoved`, `battleStart`, `battleEnd`, `turnStart`, `turnEnd`, `actionEnd`, `mapLoaded`, `transfer`, `eventStarted`, `messageAdded`. `on` / `once` / `emit`, `onScene(scene, …)` — unsubscribed automatically on scene terminate. Value-change hooks do no extra work while nobody listens.
- `MF.Commands` — plugin commands with argument schema (`MF.Schema` properties, string → number/boolean coercion) and async handlers: a returned Promise makes the event wait. `call(plugin, command, args)` runs a command from JS and returns a Promise.
- `MF.Options` — shared entries in `Scene_Options` stored in `MF.Config`: types `boolean`, `number`, `volume`, `list`; `label` (string, I18n key or function), `format`, `visible`, `after` (insert after an MZ symbol); the options window grows automatically.
- `MF.Modifiers` — stacking stat modifiers with priorities instead of competing hooks: built-in `param` (rounded and clamped by MZ limits), `xparam`, `sparam`, `skillMpCost`, `skillTpCost`, `expGain`, `goldGain`; custom stats via `apply(stat, value, ctx)`.
- `MF.Random` — seeded generators (`create(seed)`, mulberry32; `int`, `float`, `chance`, `pick`, `shuffle`, `weighted`, `state`) and named streams `stream(name, seed)` whose state is stored in the save file;   `Math.random`-based helpers with the same API.
- Ticker / Tween / Timer: `options.scene` — bind work created in a scene's `initialize` to that scene.

### Fixed
- `MF.Text.wrap` froze the game when a single character was wider than the line (narrow window, `innerWidth` 0, large `\FS`); CRLF line breaks are now split correctly.
- `MF.Script`: expressions containing a line break or `;` (e.g. pasted with CRLF, `x === ";"`) returned `undefined`; they are now evaluated as expressions, falling back to a statement block.
- `MF.Units`: an invalid expression was recompiled and logged every frame; errors are cached and logged once, the cache is bounded.
- `MF.History.isDirty()` returned false after undo + new edit that restored the saved stack length.
- `MF.History`: nested `beginBatch` / `Document.transaction` no longer split the outer group.
- `MF.Utils.parseParams` no longer turns strings with leading zeros (`"007"`, `"01"`) into numbers.
- `MF.Input.isShortcut` / `modifiers()` use modifier flags from key events (modifiers held before the window got focus were ignored).
- Loading MF_Core twice no longer installs every hook twice (the second copy is ignored with a warning).

---

## [1.1.0] — 2026-09-23

### Added
- `MF.Units` expressions: functions `min`, `max`, `abs`, `sign`, `floor`, `ceil`, `round(v, digits?)`, `trunc`, `sqrt`, `pow`, `exp`, `log`, `mod`, `clamp`, `lerp`, `step`, `between`, `if`, `hypot`, `dist`, `sin`, `cos`, `tan`, `asin`, `acos`, `atan`, `atan2` (radians), `sind`, `cosd`, `tand`, `atan2d`, `angle(x1, y1, x2, y2)`, `deg`, `rad` (degrees); constants `pi`, `PI`, `e`, `true`, `false`; operators `^` (power), `< > <= >= == !=`, `&& || !` (result 1 / 0), `cond ? a : b`. Still without `eval`; `if` / `? :` evaluate only the chosen branch.
- `MF.Units.FUNCTIONS`, `MF.Units.CONSTANTS` (name lists), `MF.Units.arity(name)`.

### Changed
- `MF.Units` error messages name the unexpected symbol, unknown functions / names and wrong argument counts. Expressions valid in 1.0.0 give the same results.

---

## [1.0.0] — 2026-09-23

Initial release.

### Added

**Foundation**
- `MF.Core` — plugin registration with declarative dependencies (`register(name, version, { requires })`), `require` with version checks (warning when the version is omitted or the installed MAJOR is newer), `parameters(name, schema?)`.
- `MF.Log` — prefixed logging; debug output controlled by the `debug` parameter.
- `MF.Utils` — type checks, runtime mode, `clone`, `merge`, `equals`, `diff` (overlay semantics), path access, `uid`, `uniqueName`, `parseParams`, `compareVersions`, `debounce`, `parseJson`, `format`.
- `MF.Math` — number helpers, `snap`, rectangle operations, easing functions, `tween`.
- `MF.Units` — safe size expressions (`"240"`, `"50%"`, `"100%-240"`, `"(100%-20)/2"`, `"auto"`) without `eval`.
- `MF.Anchor` — nine anchor points, absolute ↔ relative conversion.
- `MF.Color` — parsing (`#hex`, `rgb()`, `rgba()`) and conversion (hex, rgba, PIXI number, tone), `lerp`, `withAlpha`.
- `MF.Hook` — `alias`, `before`, `after` (optional `{ safe: true }`), hook registry. Inherited methods call the parent's implementation as it is at call time.
- `MF.Events` — `EventEmitter` and global bus `MF.Events.bus`.
- `MF.Deprecation` — `warn`, `method`, `property`, `list`; event `mf:deprecated`.
- `MF.Schema` — `validate`, `normalize`, `assert`, `format`, custom types; built-in `any`, `number`, `integer`, `string`, `boolean`, `array`, `object`, `units`, `color`, `anchor`, `condition`.

**Game logic**
- `MF.Condition` — switches, variables, self switches, party, items, gold, scripts, `all`/`any`/`not`; custom types; `dependencies`; problems logged once.
- `MF.Script` — access-controlled execution (`allowScript` parameter), `validate`, `issues`; events `mf:scriptBlocked`, `mf:scriptError`; problems logged once per snippet.

**Storage**
- `MF.FS` — NW.js file access with atomic writes and backups, `projectRoot` with fallbacks, `loadJson` with error codes (`notFound`, `http`, `parse`), `download`, `saveJson`.
- `MF.Data` — extra `data/*.json` files loaded with the database; optional/required files, `status`, `reload`, standard MZ retry screen for required files; event `mf:dataLoaded`, `mf:dataError`.
- `MF.Save` — plugin state in save files with versions, migrations, `mergeDefaults`; data of disabled plugins preserved; events `mf:saveLoaded`, `mf:saveError`.
- `MF.Config` — plugin settings in `config.rmmzsave` with schemas; unknown keys preserved; events `mf:configChanged`, `mf:configLoaded`.
- `MF.Migration` — versioned migrations.
- `MF.History` — undo/redo with merging, batches, save point.
- `MF.Document` **[experimental]** — editable JSON document: History + Schema + FS + Data + Migration; merge keys, transactions, save refuses invalid data and overwriting unparsable files.

**Text**
- `MF.I18n` — namespaced translations, locale chain, plural forms, persisted player locale; event `mf:localeChanged`.
- `MF.Text` — custom macros and escape codes for all text windows; built-in `\TR`, `\SAVE`, `\W`, `\SE`, `\FACE`, `\SPD`; `show`/`choice` Promises; `wrap`, `strip`, `measure`.

**Input**
- `MF.Input` — action bindings, `isReleased`, raw keys, shortcuts (`Mod+Z`), `isTyping`, pointer snapshot, double click, `consumePointer`, `hitTest`, device detection (`mf:inputDeviceChanged`), gamepads, vibration.
- `MF.Input.draggable` **[experimental]** — drag-and-drop with threshold, priorities, click/cancel, input consumption.

**Time**
- `MF.Ticker` — per-frame runner, scene-bound or persistent.
- `MF.Tween` — awaitable property animation (`to`, `from`, `fromTo`, `value`, repeat, yoyo, groups).
- `MF.Timer` — `wait`, `after`, `every`, `until`.
- `MF.Queue` — sequential async tasks; failures do not stop the queue or trigger MZ's error screen.

**Display and resources**
- `MF.Layout` **[experimental]** — Units + Anchor layout for windows, sprites and containers; `toSpec` for editors.
- `MF.UI` **[experimental]** — `Window`, `Sprite` (fit modes), `Container`.
- `MF.Assets` — parallel preloading with progress, timeouts, `bindScene`; failed images evicted from `ImageManager` caches.
