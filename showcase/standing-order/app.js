/* Attestat showcase, standing order: scroll reveals, the decision-to-policy mirror, the "Run the month" replay. Vanilla JS, no network. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- scroll reveals (same behaviour as the main page) ---------- */
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

  /* ---------- the mirror: lines from decision fields to policy rules ---------- */
  var mirror = document.getElementById("mirror");
  var svg = document.getElementById("mirror-lines");
  var PAIRS = ["expiry", "policyId", "revoked"];
  var drawn = false;

  function drawLines() {
    if (!mirror || !svg) return;
    if (getComputedStyle(svg).display === "none") return;
    var box = mirror.getBoundingClientRect();
    svg.setAttribute("viewBox", "0 0 " + box.width + " " + box.height);
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    PAIRS.forEach(function (key, i) {
      var from = mirror.querySelector('.field[data-key="' + key + '"]');
      var to = mirror.querySelector('.rule[data-from="' + key + '"]');
      if (!from || !to) return;
      var a = from.getBoundingClientRect(), b = to.getBoundingClientRect();
      var x1 = a.right - box.left, y1 = a.top + a.height / 2 - box.top;
      var x2 = b.left - box.left, y2 = b.top + b.height / 2 - box.top;
      var dx = (x2 - x1) / 2;
      var p = document.createElementNS("http://www.w3.org/2000/svg", "path");
      p.setAttribute("d", "M" + x1 + " " + y1 + " C" + (x1 + dx) + " " + y1 + " " + (x2 - dx) + " " + y2 + " " + x2 + " " + y2);
      p.setAttribute("class", "l-" + key + (drawn || reduce ? "" : " l-draw"));
      if (!drawn && !reduce) p.style.animationDelay = (i * 0.25) + "s";
      svg.appendChild(p);
    });
    drawn = true;
  }
  if (document.fonts && document.fonts.ready) { document.fonts.ready.then(drawLines); } else { drawLines(); }
  window.addEventListener("load", drawLines);
  var rt; window.addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(drawLines, 120); });

  var toggle = document.getElementById("mirror-toggle");
  var revokedCell = document.getElementById("m-revoked");
  if (toggle && mirror) {
    toggle.addEventListener("click", function () {
      var on = !mirror.classList.contains("is-revoked");
      mirror.classList.toggle("is-revoked", on);
      revokedCell.textContent = on ? "true" : "false";
      toggle.textContent = on ? "Re-approve" : "Revoke on chain";
      toggle.classList.toggle("is-restore", on);
    });
  }

  /* ---------- the replay: allow, run, revoke, run again, remove ---------- */
  var panes = {
    you: document.getElementById("w-pane-you"),
    issuer: document.getElementById("w-pane-issuer"),
    chain: document.getElementById("w-pane-chain")
  };
  if (!panes.you) return;
  var note = document.getElementById("w-note");
  var ndf = document.getElementById("w-ndf");
  var walletLine = document.getElementById("w-wallet");
  var denyAll = document.getElementById("w-denyall");
  var policyMini = document.getElementById("w-policy");
  var buttons = Array.prototype.slice.call(document.querySelectorAll("#widget .step[data-step]"));
  var MONTHS = ["September 2026", "October 2026", "November 2026", "December 2026", "January 2027", "February 2027"];
  var state = { allowed: false, runs: 0, revoked: false, removed: false, done: [] };

  function row(pane, label, value, cls, delay) {
    var el = document.createElement("div");
    el.className = "row" + (cls ? " " + cls : "");
    el.style.animationDelay = (delay || 0) + "ms";
    if (label === null) {
      el.textContent = value;
    } else {
      var s = document.createElement("span"); s.textContent = label;
      var b = document.createElement("b"); b.textContent = value;
      el.appendChild(s); el.appendChild(b);
    }
    pane.appendChild(el);
    pane.scrollTop = pane.scrollHeight;
    return el;
  }
  function head(pane, text, delay) { return row(pane, null, text, "head", delay); }
  function clearEmpty(pane) { var e = pane.querySelector(".empty"); if (e) e.remove(); }
  function flash(name) {
    var p = document.querySelector("#widget .pane-" + name);
    if (!p) return;
    p.classList.add("flash");
    setTimeout(function () { p.classList.remove("flash"); }, 700);
  }
  function setNdf(n) {
    ndf.textContent = n + " NDF";
    walletLine.classList.add("bump");
    setTimeout(function () { walletLine.classList.remove("bump"); }, 900);
  }
  function setButtons() {
    buttons.forEach(function (b) {
      var s = b.getAttribute("data-step");
      b.classList.remove("is-next", "is-done");
      if (s === "reset") return;
      var enabled = false, next = false, done = state.done.indexOf(s) >= 0;
      if (s === "allow") { enabled = !state.allowed; next = enabled; }
      if (s === "run") { enabled = state.allowed && !state.revoked && !state.removed && state.runs < 3; next = enabled && state.runs === 0; }
      if (s === "revoke") { enabled = state.runs > 0 && !state.revoked; next = enabled && state.runs >= 1; }
      if (s === "run2") { enabled = state.revoked && state.done.indexOf("run2") < 0; next = enabled; }
      if (s === "remove") { enabled = state.done.indexOf("run2") >= 0 && !state.removed; next = enabled; }
      b.disabled = !enabled;
      if (done && !enabled) b.classList.add("is-done");
      if (next) b.classList.add("is-next");
    });
  }

  var STEPS = {
    allow: function () {
      clearEmpty(panes.you); clearEmpty(panes.issuer);
      head(panes.you, "Signer granted");
      row(panes.you, "Signer", "issuer's automation", "good", 80);
      row(panes.you, "Policy", "2 rules, until 7 March 2027", "", 160);
      row(panes.you, "Your key", "never seen by the signer", "", 240);
      head(panes.issuer, "Signer");
      row(panes.issuer, "delegated", "0x7c4e…19b2", "k good", 120);
      flash("you");
      note.textContent = "Step 2: the automation's tick. Nothing has been broadcast yet; press Run the month.";
      state.allowed = true;
    },
    run: function () {
      var m = MONTHS[state.runs];
      clearEmpty(panes.chain);
      head(panes.issuer, "Tick, " + m);
      row(panes.issuer, "Privy", "policy allows subscribe()", "good", 80);
      row(panes.issuer, "TICK OK", "tx 0x…5e1c (sample)", "k tx", 200);
      head(panes.chain, m, 250);
      row(panes.chain, "isEligible", "true", "good", 300);
      row(panes.chain, "Subscribed", "+100 NDF to 0x7c4e…19b2", "k good", 380);
      head(panes.you, m, 300);
      row(panes.you, "Subscribed", "+100 NDF", "good", 420);
      setNdf((state.runs + 1) * 100);
      flash("issuer"); setTimeout(function () { flash("chain"); }, 250);
      state.runs += 1;
      note.textContent = state.runs < 3
        ? "One run: Privy checked the policy and signed; the chain checked her decision and minted. Run again, or revoke."
        : "Three months in. Now the issuer withdraws its approval.";
    },
    revoke: function () {
      head(panes.chain, "Revoke, manual by the issuer");
      row(panes.chain, "Revoked", "0x7c4e…19b2, policyId", "k bad", 80);
      row(panes.chain, "isEligible", "false", "bad", 160);
      head(panes.issuer, "Revoked seen");
      row(panes.issuer, "POLICY", "deny-all rule added", "bad", 260);
      denyAll.classList.remove("hidden");
      policyMini.querySelector(".allow").classList.add("struck");
      head(panes.you, "Standing order");
      row(panes.you, "Status", "closed by the issuer", "bad", 340);
      flash("chain"); setTimeout(function () { flash("issuer"); }, 250);
      state.revoked = true;
      note.textContent = "Step 4: the scheduler runs again. Watch where it stops.";
    },
    run2: function () {
      var m = MONTHS[state.runs];
      head(panes.issuer, "Tick, " + m);
      row(panes.issuer, "Privy", "refused before broadcast", "bad", 80);
      row(panes.issuer, "TICK DENIED", "policy: decision revoked", "k bad", 200);
      head(panes.chain, m, 250);
      row(panes.chain, "Transaction", "none arrived", "", 300);
      row(panes.chain, "isEligible", "false, would refuse too", "bad", 380);
      head(panes.you, m, 300);
      row(panes.you, "Subscribe", "refused", "bad", 420);
      flash("issuer"); setTimeout(function () { flash("chain"); }, 250);
      note.textContent = "Privy stopped it at the policy, the chain would have stopped it at the decision. She can also stop it herself.";
    },
    remove: function () {
      head(panes.you, "Remove signer");
      row(panes.you, "Signers", "none", "warn", 80);
      row(panes.you, "Wallet", "only you can transact", "good", 160);
      head(panes.issuer, "Tick");
      row(panes.issuer, "TICK", "no delegated wallet", "", 240);
      flash("you");
      state.removed = true;
      note.textContent = "Three ways to stop it: the issuer's revoke, the decision's expiry, her remove. None of them holds a document.";
    }
  };

  function reset() {
    state = { allowed: false, runs: 0, revoked: false, removed: false, done: [] };
    panes.you.innerHTML = '<p class="empty">Embedded wallet by Privy, created at email sign-in. Decision live until 7 March 2027.</p>';
    panes.issuer.innerHTML = '<p class="empty">Policy created from her decision when the registry emitted Approved. Waiting for a signer.</p>';
    panes.chain.innerHTML = '<p class="empty">Public. One Decision against her address. isEligible: true.</p>';
    ndf.textContent = "0 NDF";
    denyAll.classList.add("hidden");
    policyMini.querySelector(".allow").classList.remove("struck");
    note.textContent = "Step 1: she grants the issuer's signer on her wallet, under the policy above.";
    setButtons();
  }

  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      var s = b.getAttribute("data-step");
      if (s === "reset") { reset(); return; }
      if (b.disabled) return;
      STEPS[s]();
      if (state.done.indexOf(s) < 0) state.done.push(s);
      setButtons();
    });
  });
  setButtons();
})();
