# MF_Core

Base library for the **MF_\*** plugin family for **RPG Maker MZ**.

MF_Core provides a shared foundation — plugin registration with version checks, safe hooks, events, data files, save/config storage, localization, text codes, input, tweens, layout and more — so that MF_* plugins stay small and compatible with each other.

- **Version:** 1.0.0
- **Engine:** RPG Maker MZ
- **Author:** MesaFer
- **itch.io:** https://mesafer.itch.io/rpgmaker-mz-mf-core-plugin

## Installation

1. Copy `MF_Core.js` into your project's `js/plugins/` folder.
2. Enable it in the Plugin Manager.
3. Place it **above** all other MF_* plugins.

### Parameters

| Parameter | Default | Description |
|---|---|---|
| `debug` | `false` | Print MF_* debug messages to the console. |
| `allowScript` | `false` | Allow executing JS code from data (`script` conditions and actions). |

## Modules

All APIs live in the global `MF` namespace.

| Module | Purpose |
|---|---|
| `MF.Core` | Plugin registration, dependency and version checks |
| `MF.Log` | Prefixed logging |
| `MF.Utils` | Type checks, clone, merge, diff, paths, equality, uid |
| `MF.Math` | clamp, lerp, remap, snap, rectangles, easing |
| `MF.Units` | Size expressions: `"240"`, `"50%"`, `"100%-240"`, `"auto"` |
| `MF.Anchor` | Anchor points (top-left, center, bottom-right, ...) |
| `MF.Color` | Color parsing and conversion |
| `MF.Hook` | Safe method overriding (`alias` / `before` / `after`) |
| `MF.Events` | EventEmitter and global bus `MF.Events.bus` |
| `MF.Deprecation` | Deprecation warnings and API redirects |
| `MF.Schema` | Validation and normalization of structured data |
| `MF.Condition` | Condition evaluation (switches, variables, items, ...) |
| `MF.Script` | Access-controlled execution of JS from data |
| `MF.FS` | File access (NW.js), JSON loading, downloads |
| `MF.Data` | Extra `data/*.json` files loaded with the database |
| `MF.Save` | Plugin state stored inside save files |
| `MF.Config` | Plugin settings stored in `config.rmmzsave` |
| `MF.Migration` | Data format version migrations |
| `MF.History` | Undo / Redo stack |
| `MF.I18n` | Localization |
| `MF.Text` | Custom escape codes, message helpers, word wrap |
| `MF.Input` | Actions, raw keys, shortcuts, pointer, gamepads |
| `MF.Ticker` | Per-frame update runner |
| `MF.Tween` | Awaitable property animation |
| `MF.Timer` | Frame-based waits, delays, intervals |
| `MF.Queue` | Sequential async task queue |
| `MF.Assets` | Batch preloading with progress |
| `MF.Layout` | Units + Anchor layout *(experimental)* |
| `MF.UI` | Window / Sprite / Container with layout *(experimental)* |
| `MF.Document` | Editable JSON document: undo + validation + save *(experimental)* |

**Text codes:** `\TR[ns:key]` `\SAVE[key:path]` `\W[n]` `\SE[name,vol,pitch,pan]` `\FACE[name,index]` `\SPD[n]`

## Writing a dependent plugin

```js
/*:
 * @target MZ
 * @base MF_Core
 * @orderAfter MF_Core
 * @help Requires: MF_Core 1.0.0+
 */
MF.Core.register("MF_MyPlugin", "0.1.0", { requires: { MF_Core: "1.0.0" } });

MF.Hook.after(Scene_Map.prototype, "start", function() {
    MF.Log.debug("Map started");
});
```

## Documentation

- [Getting started](https://mesafer.github.io/MF_Core/getting-started.html)
- [API reference](https://mesafer.github.io/MF_Core/)
- [Changelog](docs/CHANGELOG.md)

## Versioning

MF_Core follows [Semantic Versioning](https://semver.org/):

- **PATCH** — bug fixes only.
- **MINOR** — new API, backward compatible.
- **MAJOR** — removal of previously deprecated API only.

APIs are never removed at once: they are deprecated first (with a one-time console warning and a redirect to the replacement) and removed no earlier than the next MAJOR release. APIs marked *experimental* may change in MINOR releases.
