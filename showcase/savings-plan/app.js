/* Attestat showcase, savings plan: scroll reveals and the lifecycle stage (one decision, four doors, revoke, expiry, reopen). Vanilla JS, sample data, touches no wallet, no server, no chain. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveals ---------- */
  var reveals = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.1 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- the stage ---------- */
  var stage = document.getElementById("stage");
  if (!stage) return;
  var pulse = document.getElementById("pulse");
  var core = document.getElementById("core");
  var status = document.getElementById("core-status");
  var expiry = document.getElementById("core-expiry");
  var log = document.getElementById("runner-log");
  var cap = document.getElementById("runner-cap");
  var gates = {};
  Array.prototype.forEach.call(stage.querySelectorAll(".gate"), function (g) { gates[g.getAttribute("data-gate")] = g; });
  var links = {
    plan: stage.querySelector(".l-plan"), b: stage.querySelector(".l-b"),
    pool: stage.querySelector(".l-pool"), xfer: stage.querySelector(".l-xfer")
  };
  /* where each link ends and each pulse stops: the edge of the door, measured from the real layout */
  var POS = { plan: [50, 9], b: [72, 50], pool: [50, 91], xfer: [28, 50] };
  function layout() {
    var r = stage.getBoundingClientRect();
    if (!r.width || !r.height) return;
    Object.keys(gates).forEach(function (k) {
      var g = gates[k].getBoundingClientRect();
      var cx = r.width / 2, cy = r.height / 2;
      var gx = g.left - r.left + g.width / 2, gy = g.top - r.top + g.height / 2;
      var dx = gx - cx, dy = gy - cy;
      var sx = dx ? (g.width / 2) / Math.abs(dx) : Infinity, sy = dy ? (g.height / 2) / Math.abs(dy) : Infinity;
      var s = Math.min(sx, sy, 1);
      var ex = gx - dx * s, ey = gy - dy * s;
      var px = ex / r.width * 100, py = ey / r.height * 100;
      POS[k] = [px, py];
      links[k].setAttribute("x2", px.toFixed(2)); links[k].setAttribute("y2", py.toFixed(2));
    });
  }
  layout();
  window.addEventListener("resize", layout);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(layout);
  var btn = {
    revoke: document.getElementById("ctl-revoke"),
    expire: document.getElementById("ctl-expire"),
    reopen: document.getElementById("ctl-reopen"),
    reset: document.getElementById("ctl-reset")
  };

  var timers = [];
  var clock = 0;
  var closed = false;
  var busy = false;
  function later(fn, ms) { timers.push(setTimeout(fn, reduce ? 0 : ms)); }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function stamp() { clock += 1; var m = Math.floor(clock / 60), s = clock % 60; return (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }

  function line(text, cls) {
    var empty = log.querySelector(".empty"); if (empty) empty.remove();
    var li = document.createElement("li");
    li.className = cls || "";
    li.setAttribute("data-t", stamp());
    li.textContent = text;
    log.appendChild(li);
    while (log.children.length > 7) log.removeChild(log.firstChild);
  }
  function flashCore() {
    core.classList.add("flash");
    later(function () { core.classList.remove("flash"); }, 500);
  }
  function setGates(open) {
    Object.keys(gates).forEach(function (k) {
      gates[k].classList.toggle("closed", !open);
      gates[k].querySelector(".gate-state").textContent = open ? "open" : "closed";
    });
    stage.setAttribute("data-state", open ? "live" : "closed");
  }
  /* one read of the decision: a pulse travels from the record to a door, the door answers */
  function check(gate, ok, text, cls, done) {
    var p = POS[gate];
    pulse.classList.toggle("bad", !ok);
    pulse.style.left = "50%"; pulse.style.top = "50%";
    pulse.classList.add("show");
    links[gate].classList.add("hot");
    later(function () { pulse.style.left = p[0] + "%"; pulse.style.top = p[1] + "%"; }, 30);
    later(function () {
      gates[gate].classList.add("hit");
      line(text, cls);
      later(function () {
        gates[gate].classList.remove("hit");
        links[gate].classList.remove("hot");
        pulse.classList.remove("show");
        if (done) done();
      }, 450);
    }, 620);
  }
  function seq(steps, i, after) {
    if (i >= steps.length) { busy = false; if (after) after(); return; }
    var st = steps[i];
    var next = function () { later(function () { seq(steps, i + 1, after); }, st.wait || 700); };
    if (st.gate) check(st.gate, st.ok, st.text, st.cls, next);
    else { line(st.text, st.cls); if (st.flash) flashCore(); next(); }
  }
  function controls(state) {
    btn.revoke.hidden = state !== "live";
    btn.expire.hidden = state !== "live";
    btn.reopen.hidden = state !== "closed";
    var all = [btn.revoke, btn.expire, btn.reopen, btn.reset];
    all.forEach(function (b) { b.disabled = busy; });
  }

  var OPENING = [
    { text: "decision written: bits 3, tier A, expiry 2026-10-07, eligible", cls: "ok", flash: true, wait: 900 },
    { gate: "plan", ok: true, text: "run 1: subscribe() from 0x7a3f…c41e, confirmed, 100 NDF", cls: "ok" },
    { gate: "plan", ok: true, text: "run 2: subscribe(), confirmed, 200 NDF", cls: "ok" },
    { gate: "b", ok: true, text: "Issuer B: mint 50 NDF-B, confirmed, same decision", cls: "ok" },
    { gate: "pool", ok: true, text: "pool: swap 10 NDF, confirmed", cls: "ok" },
    { gate: "xfer", ok: true, text: "transfer 20 NDF to an attested friend, confirmed", cls: "ok" },
    { gate: "xfer", ok: false, text: "transfer 20 NDF to an unattested address, reverted: NotEligible", cls: "bad" }
  ];
  var REVOKE = [
    { text: "issuer: revoke(subject, policyId), one transaction, manual", cls: "bad", flash: true, wait: 500 },
    { gate: "plan", ok: false, text: "run 3: reverted: NotEligible", cls: "bad", wait: 350 },
    { gate: "b", ok: false, text: "Issuer B mint: reverted: NotEligible", cls: "bad", wait: 350 },
    { gate: "pool", ok: false, text: "pool swap: reverted, allowlist refused", cls: "bad", wait: 350 },
    { gate: "xfer", ok: false, text: "transfer to her: reverted: NotEligible", cls: "bad", wait: 500 },
    { text: "Privy policy set to DENY: plan stopped by issuer", cls: "note" }
  ];
  var EXPIRE = [
    { text: "local chain: time moved past 2026-10-07 (expiry demonstrated on a local chain)", cls: "note", flash: true, wait: 600 },
    { gate: "plan", ok: false, text: "run 3: reverted: Expired", cls: "bad", wait: 350 },
    { gate: "b", ok: false, text: "Issuer B mint: reverted: Expired", cls: "bad", wait: 350 },
    { gate: "pool", ok: false, text: "pool swap: reverted, allowlist refused", cls: "bad", wait: 350 },
    { gate: "xfer", ok: false, text: "transfer to her: reverted: Expired", cls: "bad", wait: 500 },
    { text: "nobody acted. The credential's own expiry closed the plan, Issuer B, the pool and transfers to her.", cls: "note" }
  ];
  var REOPEN = [
    { text: "a fresh proof after revoke: attestWithProof refused", cls: "bad", wait: 600 },
    { text: "operator: attestByOperator, manual, decision reopened", cls: "ok", flash: true, wait: 600 },
    { gate: "plan", ok: true, text: "run 4: subscribe(), confirmed, 300 NDF", cls: "ok" }
  ];

  function start() {
    clearTimers();
    busy = true; closed = false; clock = 0;
    log.innerHTML = "";
    line("wallet by Privy, created at email sign-in: 0x7a3f…c41e", "");
    status.textContent = "eligible";
    expiry.textContent = "2026-10-07";
    setGates(true);
    cap.textContent = "She is not clicking.";
    controls("live");
    later(function () { seq(OPENING, 0, function () { controls("live"); }); }, 600);
  }
  function closeWith(steps, why) {
    if (busy) return;
    busy = true; closed = true;
    controls("closed");
    status.textContent = why;
    if (why === "expired") expiry.textContent = "2026-10-07, past";
    later(function () { setGates(false); }, 350);
    cap.textContent = why === "revoked" ? "One transaction. Four doors." : "No one acted.";
    seq(steps, 0, function () { controls("closed"); });
  }
  function reopen() {
    if (busy) return;
    busy = true; closed = false;
    controls("live");
    later(function () { status.textContent = "eligible"; expiry.textContent = "2026-10-07"; setGates(true); }, 900);
    cap.textContent = "Manual: issuer reopens.";
    seq(REOPEN, 0, function () { controls("live"); });
  }

  btn.revoke.addEventListener("click", function () { closeWith(REVOKE, "revoked"); });
  btn.expire.addEventListener("click", function () { closeWith(EXPIRE, "expired"); });
  btn.reopen.addEventListener("click", reopen);
  btn.reset.addEventListener("click", start);

  /* start when the stage scrolls into view (it is in the hero, so usually at once) */
  var started = false;
  function kick() { if (started) return; started = true; start(); }
  if ("IntersectionObserver" in window) {
    var so = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { kick(); so.disconnect(); } });
    }, { threshold: 0.15 });
    so.observe(stage);
  } else { kick(); }
  /* resting state without the observer firing: an empty line so the log is never blank */
  var li = document.createElement("li"); li.className = "empty"; li.textContent = "Waiting for the decision."; log.appendChild(li);
})();
