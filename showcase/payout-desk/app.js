/* Attestat showcase, payout desk: scroll reveals and the scripted run sheet. Vanilla JS, no network. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* scroll reveals, same behaviour as the main page */
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

  /* the desk */
  var desk = document.getElementById("desk");
  if (!desk) return;
  var log = document.getElementById("desk-log");
  var rows = Array.prototype.slice.call(desk.querySelectorAll("tbody tr"));
  var lamps = {};
  Array.prototype.forEach.call(desk.querySelectorAll(".lamp"), function (l) { lamps[l.getAttribute("data-lamp")] = l; });
  var acts = {};
  Array.prototype.forEach.call(desk.querySelectorAll(".act"), function (b) { acts[b.getAttribute("data-act")] = b; });

  var busy = false;
  var revoked = false;
  var timers = [];
  function later(fn, ms) {
    if (reduce) ms = 0;
    var t = setTimeout(fn, ms); timers.push(t); return t;
  }
  function say(text, cls) {
    var p = document.createElement("p");
    if (cls) p.className = cls;
    p.textContent = text;
    log.appendChild(p);
    while (log.children.length > 4) log.removeChild(log.firstChild);
  }
  function clearLog() { log.innerHTML = ""; }
  function lamp(name, state) {
    var l = lamps[name]; l.classList.remove("busy", "on", "off");
    if (state) l.classList.add(state);
  }
  function setNext(name) {
    Object.keys(acts).forEach(function (k) {
      if (k === "reset") return;
      acts[k].classList.remove("is-next");
      acts[k].disabled = true;
    });
    if (!name) return;
    (Array.isArray(name) ? name : [name]).forEach(function (n) { acts[n].disabled = false; acts[n].classList.add("is-next"); });
  }
  function done(name) { acts[name].classList.remove("is-next"); acts[name].classList.add("is-done"); }
  function resetRows() {
    rows.forEach(function (r) {
      r.className = "";
      var p = r.querySelector(".paid"); p.textContent = ""; p.className = "t-right paid";
    });
  }

  function propose() {
    busy = true; clearLog();
    lamp("a", "busy");
    say("Officer A proposes run 12: payout(mUSD, 3 recipients, 450 mUSD).");
    later(function () {
      lamp("a", "on");
      say("Intent int_7f3a created. Pending, 1 of 2 signatures.", "mono");
      done("propose"); setNext("approve"); busy = false;
    }, 900);
  }

  function execute(afterRevoke) {
    lamp("b", "busy");
    say("Officer B authorizes the intent. 2 of 2, threshold met.");
    later(function () {
      lamp("b", "on"); lamp("privy", "busy");
      say("Privy policy: to == GatedPayout, chain 11155111, function payout. Allowed.", "mono");
    }, 900);
    later(function () {
      lamp("privy", "on"); lamp("chain", "busy");
      say("GatedPayout asks the registry for each recipient: isEligible?");
    }, 1800);
    rows.forEach(function (r, i) {
      later(function () {
        rows.forEach(function (x) { x.classList.remove("checking"); });
        r.classList.add("checking");
        var p = r.querySelector(".paid");
        if (afterRevoke && i === 2) {
          r.classList.remove("checking"); r.classList.add("bad");
          p.textContent = "refused"; p.classList.add("no");
        } else if (afterRevoke) {
          p.textContent = "pending"; p.classList.add("ok");
        } else {
          p.textContent = "+" + (i === 1 ? "250" : "100"); p.classList.add("ok");
        }
      }, 2500 + i * 600);
    });
    later(function () {
      rows.forEach(function (x) { x.classList.remove("checking"); });
      if (afterRevoke) {
        lamp("chain", "off");
        rows.forEach(function (r, i) {
          if (i === 2) return;
          var p = r.querySelector(".paid"); p.textContent = "reverted"; p.className = "t-right paid no";
        });
        say("Revert: NotEligible(0xb05f…1a17). Whole run reverted, nothing paid. Intent status: Failed.", "bad mono");
        say("Both officers approved. Privy allowed. The chain refused. Revoke is manual; the gate is on chain, not in our database.");
        done("rerun"); setNext(null); busy = false;
      } else {
        lamp("chain", "on");
        say("Executed. Sepolia tx 0x3c9e…b210. Three balances up, treasury down 450 mUSD.", "ok mono");
        say("Treasury wallet by Privy, two-officer quorum. The chain checked three addresses and read no name.");
        done("approve"); setNext(["direct", "revoke"]); busy = false;
      }
    }, 2500 + rows.length * 600 + 500);
  }

  function direct() {
    busy = true;
    lamp("privy", "busy"); lamp("chain", null);
    say("Officer A tries a plain ERC-20 transfer of 100 mUSD to 0x91d2…8c4a, bypassing the gate.");
    later(function () {
      lamp("privy", "off");
      say("Privy policy: denied. No rule allows a transaction to this address. Nothing reached the chain.", "bad");
      say("The treasury may pay through the gate and nowhere else. Wording illustrative; the Sepolia run records Privy's own error text.");
      done("direct"); setNext(revoked ? null : "revoke"); busy = false;
    }, 1000);
  }

  function revoke() {
    busy = true; revoked = true;
    lamp("a", null); lamp("b", null); lamp("privy", null); lamp("chain", null);
    var r = rows[2];
    say("The finance desk revokes the decision for 0xb05f…1a17. A manual on-chain step.", "warn");
    later(function () {
      var d = r.querySelector(".dec"); d.textContent = "revoked"; d.className = "dec revoked";
      var p = r.querySelector(".paid"); p.textContent = ""; p.className = "t-right paid";
      rows.forEach(function (x, i) { if (i !== 2) { var q = x.querySelector(".paid"); q.textContent = ""; q.className = "t-right paid"; } });
      say("Same revoke closes the fund token and the pool for that address. One decision, three doors.");
      done("revoke"); setNext("rerun"); busy = false;
    }, 900);
  }

  function rerun() {
    busy = true; clearLog();
    lamp("a", "busy"); lamp("b", null); lamp("privy", null); lamp("chain", null);
    say("Officer A proposes run 13 with the same three recipients.");
    later(function () { lamp("a", "on"); execute(true); }, 800);
  }

  function reset() {
    timers.forEach(clearTimeout); timers = [];
    busy = false; revoked = false;
    ["a", "b", "privy", "chain"].forEach(function (n) { lamp(n, null); });
    resetRows();
    var d = rows[2].querySelector(".dec"); d.textContent = "live, exp 2026-10-02"; d.className = "dec live";
    Object.keys(acts).forEach(function (k) { acts[k].classList.remove("is-done", "is-next"); });
    clearLog();
    say("Recipients are the addresses that hold a live decision. The desk never saw a document; it sees an address and a yes.");
    setNext("propose");
  }

  desk.addEventListener("click", function (e) {
    var b = e.target.closest(".act"); if (!b || b.disabled) return;
    var a = b.getAttribute("data-act");
    if (a === "reset") return reset();
    if (busy) return;
    if (a === "propose") propose();
    else if (a === "approve") { busy = true; execute(false); }
    else if (a === "direct") direct();
    else if (a === "revoke") revoke();
    else if (a === "rerun") rerun();
  });

  /* the stepper reveals once as a group */
  var flow = document.getElementById("flow");
  if (flow && "IntersectionObserver" in window && !reduce) {
    var fo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { flow.classList.add("in"); fo.disconnect(); } });
    }, { threshold: 0.2 });
    fo.observe(flow);
  } else if (flow) { flow.classList.add("in"); }
})();
