/* Attestat showcase: the product app's origin, in one place.
   The demo routes (/, /issuer, /showcase/<slug>) are served by the product app
   (github devdotbo/nachweis-app, app/), not by this static site. Every showcase
   page marks its demo links with data-app-path="/route"; this script writes the
   href from the origin below and, while the origin is the local default, adds a
   small note next to the link so nobody mistakes it for a hosted demo.

   To point every page at a hosted app, change DEFAULT_ORIGIN here. A single page
   can override it with <html data-app-origin="https://app.example"> if needed. */
(function () {
  "use strict";
  var DEFAULT_ORIGIN = "http://localhost:5173"; /* nachweis-app/app: bun run dev */
  var LOCAL_NOTE = "local: the app is not hosted yet. Run nachweis-app/app (bun run dev) and open " + DEFAULT_ORIGIN;

  var root = document.documentElement;
  var origin = (root.getAttribute("data-app-origin") || DEFAULT_ORIGIN).replace(/\/+$/, "");
  var isLocal = origin === DEFAULT_ORIGIN;
  root.setAttribute("data-app-origin-state", isLocal ? "local" : "hosted");

  var links = document.querySelectorAll("a[data-app-path]");
  if (!links.length) { return; }

  if (isLocal && !document.getElementById("app-note-style")) {
    var style = document.createElement("style");
    style.id = "app-note-style";
    style.textContent =
      ".app-note{display:inline-flex;align-items:center;gap:.45rem;font-size:.78rem;line-height:1.3;color:rgba(244,241,232,.62);max-width:34ch;font-family:\"Work Sans\",system-ui,sans-serif}" +
      ".app-note::before{content:\"\";width:8px;height:8px;border-radius:50%;background:#FFCC00;flex:none}" +
      ".app-note code{font-family:ui-monospace,\"SF Mono\",Menlo,monospace;font-size:.76rem;color:rgba(244,241,232,.85);word-break:break-all;min-width:0}";
    document.head.appendChild(style);
  }

  Array.prototype.forEach.call(links, function (a) {
    var path = a.getAttribute("data-app-path") || "/";
    if (path.charAt(0) !== "/") { path = "/" + path; }
    a.setAttribute("href", origin + path);
    a.setAttribute("title", isLocal ? LOCAL_NOTE : "Opens the product app at " + origin + path);
    if (!isLocal || a.hasAttribute("data-app-note-off")) { return; }
    /* one note per link, placed right after it; skipped for inline text links */
    if (a.getAttribute("data-app-note") === "inline") { return; }
    var note = document.createElement("small");
    note.className = "app-note";
    note.innerHTML = "runs locally: <code>" + origin + path + "</code>";
    a.insertAdjacentElement("afterend", note);
  });
})();
