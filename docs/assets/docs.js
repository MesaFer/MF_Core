/* MF_Core documentation — anchors, deep search, navigation. No dependencies. */
(function () {
    "use strict";

    var main = document.querySelector("main");
    var input = document.getElementById("filter");
    var results = document.getElementById("results");
    var tocItems = Array.prototype.slice.call(document.querySelectorAll("#toc li"));
    if (!main) return;

    //--- Stable ids for headings, signatures and API table rows ---------------

    var used = {};
    Array.prototype.forEach.call(document.querySelectorAll("[id]"), function (el) { used[el.id] = true; });

    function slug(text) {
        return String(text).toLowerCase()
            .replace(/^new\s+/, "new-")
            .replace(/[^a-z0-9.\-_ ]+/g, " ")
            .trim()
            .replace(/[\s.]+/g, "-")
            .replace(/-+/g, "-")
            .replace(/^-|-$/g, "") || "section";
    }
    function uniqueId(base) {
        var id = base, i = 2;
        while (used[id]) id = base + "-" + i++;
        used[id] = true;
        return id;
    }
    function textOf(el) {
        var clone = el.cloneNode(true);
        Array.prototype.forEach.call(clone.querySelectorAll(".anchor, .tag, .ret, .step"), function (n) { n.remove(); });
        return clone.textContent.replace(/\s+/g, " ").trim();
    }
    function addAnchor(el) {
        var a = document.createElement("a");
        a.className = "anchor";
        a.href = "#" + el.id;
        a.textContent = "#";
        a.setAttribute("aria-label", "Link to this section");
        el.insertBefore(a, el.firstChild);
    }

    var entries = [];
    var h2 = null, h3 = null;
    var walker = main.querySelectorAll("h2, h3, h4, .sig, table tr, .pitfalls-list > li[id]");

    Array.prototype.forEach.call(walker, function (el) {
        var tag = el.tagName.toLowerCase();
        var prefix = h2 && h2.id ? h2.id + "-" : "";
        var keywords = (el.getAttribute("data-keywords") || "").toLowerCase();

        if (tag === "h2") {
            h2 = el; h3 = null;
            if (!el.id) el.id = uniqueId(slug(textOf(el)));
            addAnchor(el);
            entries.push({ id: el.id, title: textOf(el), path: "", kind: "section", keywords: keywords });
            return;
        }
        var path = h2 ? textOf(h2) + (h3 ? " › " + textOf(h3) : "") : "";

        if (tag === "h3" || tag === "h4") {
            if (tag === "h3") h3 = el;
            if (!el.id) el.id = uniqueId(prefix + slug(textOf(el)));
            addAnchor(el);
            entries.push({ id: el.id, title: textOf(el), path: h2 ? textOf(h2) : "", kind: "topic", keywords: keywords });
            return;
        }
        if (el.classList.contains("sig")) {
            var full = textOf(el);
            var name = full.split("(")[0].trim();
            if (!el.id) el.id = uniqueId(prefix + slug(name));
            addAnchor(el);
            entries.push({ id: el.id, title: full.replace(/\s*→.*$/, ""), path: path, kind: "api", keywords: keywords });
            return;
        }
        if (tag === "li") {
            entries.push({ id: el.id, title: textOf(el.querySelector("strong") || el), path: "Pitfalls", kind: "pitfall", keywords: textOf(el).toLowerCase() });
            return;
        }
        if (tag === "tr") {
            var first = el.querySelector("td");
            if (!first || !first.querySelector("code")) return;
            var title = textOf(first);
            if (!title) return;
            if (!el.id) el.id = uniqueId(prefix + slug(title.split(/[(,]/)[0]));
            var rest = Array.prototype.slice.call(el.querySelectorAll("td"), 1).map(textOf).join(" ").toLowerCase();
            entries.push({ id: el.id, title: title.length > 90 ? title.slice(0, 87) + "…" : title, path: path, kind: "api", keywords: keywords + " " + rest });
        }
    });

    // Scroll to an auto-generated anchor requested in the URL.
    if (location.hash) {
        var target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
        if (target) setTimeout(function () { target.scrollIntoView(); flash(target); }, 0);
    }

    function flash(el) {
        el.classList.remove("flash");
        void el.offsetWidth;
        el.classList.add("flash");
    }

    //--- Search ---------------------------------------------------------------

    var selected = -1;
    var shown = [];

    function escapeHtml(s) {
        return s.replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
    }
    function highlight(text, words) {
        var html = escapeHtml(text);
        words.forEach(function (w) {
            if (!w) return;
            var re = new RegExp("(" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + ")", "ig");
            html = html.replace(re, "<mark>$1</mark>");
        });
        return html;
    }
    function score(entry, words, q) {
        var t = entry.title.toLowerCase();
        var hay = t + " " + entry.path.toLowerCase() + " " + (entry.keywords || "");
        for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return -1;
        var s = 1;
        var bare = t.replace(/^mf\./, "");
        if (t === q || bare === q) s += 100;
        if (t.indexOf(q) === 0 || bare.indexOf(q) === 0) s += 50;
        if (t.indexOf(q) >= 0) s += 20;
        var inTitle = words.filter(function (w) { return t.indexOf(w) >= 0; }).length;
        if (words.length > 1 && inTitle === words.length) s += 15;
        s += inTitle * 2;
        if (words.length > 1 && t.indexOf(words[words.length - 1]) >= 0) s += 6;
        if (entry.kind === "section") s += 8;
        if (entry.kind === "pitfall") s += 4;
        return s - Math.min(t.length, 100) / 1000;
    }
    function render(q) {
        var query = q.trim().toLowerCase();
        tocItems.forEach(function (li) {
            if (li.classList.contains("group")) {
                li.classList.toggle("hidden", query !== "");
                return;
            }
            li.classList.toggle("hidden", query !== "" && li.textContent.toLowerCase().indexOf(query) < 0);
        });
        if (!results) return;
        if (!query) {
            results.classList.remove("open");
            results.innerHTML = "";
            shown = [];
            return;
        }
        var words = query.split(/[\s.]+/).filter(Boolean);
        shown = entries
            .map(function (e) { return { e: e, s: score(e, words, query) }; })
            .filter(function (x) { return x.s >= 0; })
            .sort(function (a, b) { return b.s - a.s; })
            .slice(0, 40)
            .map(function (x) { return x.e; });
        selected = shown.length ? 0 : -1;
        results.innerHTML = shown.length
            ? shown.map(function (e, i) {
                return '<a href="#' + e.id + '" data-i="' + i + '"' + (i === 0 ? ' class="sel"' : "") + ">" +
                    '<span class="r-kind">' + e.kind + "</span>" +
                    '<span class="r-title">' + highlight(e.title, words) + "</span>" +
                    (e.path ? '<span class="r-path">' + escapeHtml(e.path) + "</span>" : "") + "</a>";
            }).join("")
            : '<div class="r-empty">No matches</div>';
        results.classList.add("open");
    }
    function select(i) {
        if (!shown.length) return;
        selected = (i + shown.length) % shown.length;
        Array.prototype.forEach.call(results.querySelectorAll("a"), function (a, j) {
            a.classList.toggle("sel", j === selected);
            if (j === selected) a.scrollIntoView({ block: "nearest" });
        });
    }
    function go(entry) {
        if (!entry) return;
        var el = document.getElementById(entry.id);
        if (!el) return;
        history.replaceState(null, "", "#" + entry.id);
        el.scrollIntoView({ behavior: "smooth", block: "start" });
        flash(el);
    }

    if (input) {
        input.addEventListener("input", function () { render(input.value); });
        input.addEventListener("keydown", function (e) {
            if (e.key === "ArrowDown") { select(selected + 1); e.preventDefault(); }
            else if (e.key === "ArrowUp") { select(selected - 1); e.preventDefault(); }
            else if (e.key === "Enter") { go(shown[selected]); e.preventDefault(); }
            else if (e.key === "Escape") { input.value = ""; render(""); input.blur(); }
        });
    }
    if (results) {
        results.addEventListener("click", function (e) {
            var a = e.target.closest("a[data-i]");
            if (!a) return;
            e.preventDefault();
            go(shown[Number(a.getAttribute("data-i"))]);
        });
    }
    document.addEventListener("keydown", function (e) {
        var typing = /^(input|textarea|select)$/i.test((document.activeElement || {}).tagName || "");
        if (!input || typing) return;
        if (e.key === "/" || (e.key.toLowerCase() === "k" && (e.ctrlKey || e.metaKey))) {
            e.preventDefault();
            input.focus();
            input.select();
        }
    });

    //--- Highlight the current section in the sidebar --------------------------

    var links = {};
    Array.prototype.forEach.call(document.querySelectorAll("#toc a[href^='#']"), function (a) {
        links[a.getAttribute("href").slice(1)] = a;
    });
    if ("IntersectionObserver" in window) {
        var current = null;
        var observer = new IntersectionObserver(function (items) {
            items.forEach(function (it) {
                if (!it.isIntersecting) return;
                var a = links[it.target.id];
                if (!a) return;
                if (current) current.classList.remove("active");
                current = a;
                a.classList.add("active");
            });
        }, { rootMargin: "0px 0px -80% 0px" });
        Array.prototype.forEach.call(main.querySelectorAll("h2[id]"), function (h) { observer.observe(h); });
    }

    // Exposed for tests.
    window.MFDocs = { entries: entries, search: function (q) { render(q); return shown.slice(); } };
})();
