/* Attestat showcase gallery: one reveal for the system map, nothing else moves on its own. Vanilla JS. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var map = document.getElementById("map-grid");
  if (!map) { return; }
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { map.classList.add("in"); io.disconnect(); }
      });
    }, { rootMargin: "0px 0px -10% 0px", threshold: 0.08 });
    io.observe(map);
  } else {
    map.classList.add("in");
  }
})();
