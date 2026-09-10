/* Attestat pitch site (repository name nachweis-site): scroll reveals, the "Who sees what" state machine, the two doors. Vanilla JS. */
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

  /* ---------- demo: who sees what ---------- */
  var ORDER = ["bind", "present", "approve", "use", "revoke"];
  var panes = {
    you: document.getElementById("pane-you"),
    issuer: document.getElementById("pane-issuer"),
    chain: document.getElementById("pane-chain")
  };
  var note = document.getElementById("demo-note");
  var stepButtons = Array.prototype.slice.call(document.querySelectorAll(".step[data-step]"));
  var miniDoors = Array.prototype.slice.call(document.querySelectorAll("#doors-mini .mini-door"));
  var state = { done: [] };

  var NOTES = {
    start: "Step 1: your crypto wallet signs the session, so the evidence can only ever bind to this address.",
    bind: "Your wallet signed a nonce. The issuer knows an address. Nothing on chain yet.",
    present: "Three fields left the phone. The proof was made in your browser tab. The chain got evidence for your address, and no name.",
    approve: "The issuer approved the address in a separate on-chain step. It never received your name.",
    use: "The fund token and the pool read the same record. Two doors, one permission.",
    revoke: "One revoke. Both doors closed. Your name was never there to remove."
  };

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
    return el;
  }
  function head(pane, text, delay) { return row(pane, null, text, "head", delay); }
  function clearEmpty(pane) {
    var e = pane.querySelector(".empty"); if (e) e.remove();
  }
  function flash(name) {
    var p = document.querySelector(".pane-" + name);
    p.classList.add("flash");
    setTimeout(function () { p.classList.remove("flash"); }, 700);
  }
  function setDoors(open) {
    miniDoors.forEach(function (d) {
      d.classList.toggle("open", open);
      d.querySelector(".state").textContent = open ? "open" : "closed";
    });
  }
  function setRow(id, value, cls) {
    var el = document.getElementById(id);
    if (!el) return;
    el.className = "row " + cls;
    el.querySelector("b").textContent = value;
    el.style.animation = "none"; void el.offsetWidth; el.style.animation = "";
  }

  var ACTIONS = {
    bind: function () {
      clearEmpty(panes.you);
      head(panes.you, "Your crypto wallet", 0);
      row(panes.you, "sign(nonce)", "0x7a3f…c41e", "k good", 80);
      flash("you");
      setTimeout(function () {
        clearEmpty(panes.issuer);
        head(panes.issuer, "Session", 0);
        row(panes.issuer, "bound address", "0x7a3f…c41e", "k", 80);
        row(panes.issuer, "name", "unknown", "k struck", 160);
        flash("issuer");
      }, 400);
    },
    present: function () {
      head(panes.you, "Request from the issuer", 0);
      row(panes.you, "Given name", "Lena", "good", 80);
      row(panes.you, "Family name", "Vogt", "good", 160);
      row(panes.you, "Over 18", "yes", "good", 240);
      row(panes.you, "Date of birth", "not shared", "struck", 320);
      row(panes.you, "Address", "not shared", "struck", 400);
      row(panes.you, "Document image", "not requested", "struck", 480);
      row(panes.you, "Proof", "made in this browser tab", "k good", 560);
      flash("you");
      setTimeout(function () {
        head(panes.issuer, "Relay", 0);
        row(panes.issuer, "wallet response", "stored encrypted, never opened", "k", 80);
        row(panes.issuer, "given_name", "not received", "k struck", 160);
        row(panes.issuer, "family_name", "not received", "k struck", 240);
        flash("issuer");
      }, 500);
      setTimeout(function () {
        clearEmpty(panes.chain);
        head(panes.chain, "Evidence", 0);
        row(panes.chain, "subject", "0x7a3f…c41e", "k", 80);
        row(panes.chain, "policyId", "0x9c02…e7b8", "k", 160);
        row(panes.chain, "bits", "over18: 1  evidence: 1", "k good", 240);
        row(panes.chain, "expiresAt", "2026-10-07", "k", 320);
        var ap = row(panes.chain, "approved", "no", "k warn", 400);
        ap.id = "chain-approved";
        var st = row(panes.chain, "statusRef", "active", "k good", 480);
        st.id = "chain-status";
        row(panes.chain, "name", "not present", "k struck", 560);
        row(panes.chain, "document", "not present", "k struck", 640);
        flash("chain");
      }, 1000);
    },
    approve: function () {
      head(panes.issuer, "Decision", 0);
      row(panes.issuer, "evidence on chain", "0x7a3f…c41e, over 18", "k good", 80);
      row(panes.issuer, "sanctions", "clear", "sim", 160);
      row(panes.issuer, "passport copy", "none stored", "warn", 240);
      row(panes.issuer, "approve", "tier A, until 2026-10-07, on chain", "good", 320);
      flash("issuer");
      setTimeout(function () {
        setRow("chain-approved", "yes, tier A", "k good");
        flash("chain");
      }, 500);
    },
    use: function () {
      head(panes.you, "From your wallet", 0);
      row(panes.you, "Subscribe", "100 NDF minted, no payment", "good", 80);
      row(panes.you, "Swap", "100 mUSD in, about 90 NDF out", "good", 160);
      head(panes.chain, "Reads", 0);
      row(panes.chain, "FundToken.subscribe", "allowed", "k good", 80);
      row(panes.chain, "Pool.swap", "allowed", "k good", 160);
      setDoors(true);
      flash("chain");
    },
    revoke: function () {
      head(panes.issuer, "Withdraw", 0);
      row(panes.issuer, "revoke", "manual", "bad", 80);
      flash("issuer");
      setTimeout(function () {
        setRow("chain-status", "revoked", "k bad");
        row(panes.chain, "FundToken.subscribe", "refused", "k bad", 80);
        row(panes.chain, "Pool.swap", "refused", "k bad", 160);
        setDoors(false);
        flash("chain");
        row(panes.you, "Fund", "refused", "bad", 240);
        row(panes.you, "Pool", "refused", "bad", 320);
      }, 400);
    }
  };

  function render() {
    stepButtons.forEach(function (b) {
      var s = b.getAttribute("data-step");
      if (s === "reset") return;
      var idx = ORDER.indexOf(s);
      var done = state.done.indexOf(s) !== -1;
      var next = idx === state.done.length;
      b.classList.toggle("is-done", done);
      b.classList.toggle("is-next", next);
      b.disabled = !next;
      b.setAttribute("aria-pressed", done ? "true" : "false");
    });
  }

  function reset() {
    state.done = [];
    panes.you.innerHTML = '<p class="empty">Your crypto wallet in the browser, and the official test wallet on your phone. Sample identity.</p>';
    panes.issuer.innerHTML = '<p class="empty">A fund issuer. Its server relays what the wallet sends and never opens it.</p>';
    panes.chain.innerHTML = '<p class="empty">Public. Anyone can read this pane.</p>';
    setDoors(false);
    note.textContent = NOTES.start;
    render();
  }

  function run(step) {
    if (step === "reset") { reset(); stepButtons[0].focus(); return; }
    if (ORDER.indexOf(step) !== state.done.length) return;
    state.done.push(step);
    ACTIONS[step]();
    note.textContent = NOTES[step];
    render();
    var nextBtn = document.querySelector(".step.is-next");
    if (nextBtn) nextBtn.focus();
  }

  stepButtons.forEach(function (b) {
    b.addEventListener("click", function () { run(b.getAttribute("data-step")); });
  });
  render();

  /* ---------- scene 4: two doors ---------- */
  var stage = document.getElementById("doors-stage");
  var toggle = document.getElementById("doors-toggle");
  if (stage && toggle) {
    toggle.addEventListener("click", function () {
      var open = stage.getAttribute("data-open") === "true";
      stage.setAttribute("data-open", open ? "false" : "true");
      stage.querySelectorAll(".door-state").forEach(function (s) { s.textContent = open ? "closed" : "open"; });
      toggle.textContent = open ? "Approve again" : "Revoke once";
      toggle.classList.toggle("is-restore", open);
    });
  }
})();
