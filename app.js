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
  var ORDER = ["present", "approve", "bind", "use", "revoke"];
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
    start: "Step 1: the test wallet answers the issuer's registered request.",
    present: "Three fields left the phone. The chain saw nothing.",
    approve: "The issuer matched its record and signed a decision. Still nothing on chain.",
    bind: "Your wallet signed a nonce. The decision is now a record on chain: bits, tier, expiry. No name.",
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

  var ACTIONS = {
    present: function () {
      clearEmpty(panes.you);
      head(panes.you, "Request from the issuer", 0);
      row(panes.you, "Given name", "Lena", "good", 80);
      row(panes.you, "Family name", "Vogt", "good", 160);
      row(panes.you, "Over 18", "yes", "good", 240);
      row(panes.you, "Date of birth", "not shared", "struck", 320);
      row(panes.you, "Address", "not shared", "struck", 400);
      row(panes.you, "Document image", "not requested", "struck", 480);
      flash("you");
      setTimeout(function () {
        clearEmpty(panes.issuer);
        head(panes.issuer, "Received", 0);
        row(panes.issuer, "given_name", "Lena", "k", 80);
        row(panes.issuer, "family_name", "Vogt", "k", 160);
        row(panes.issuer, "age_over_18", "true", "k good", 240);
        row(panes.issuer, "signed by", "DE test wallet, sample PID", "k good", 320);
        row(panes.issuer, "status list", "valid", "k good", 400);
        flash("issuer");
      }, 500);
    },
    approve: function () {
      head(panes.issuer, "Decision", 0);
      row(panes.issuer, "record match", "name + age ok", "good", 80);
      row(panes.issuer, "sanctions", "clear", "sim", 160);
      row(panes.issuer, "passport copy", "none stored", "warn", 240);
      row(panes.issuer, "approve", "tier A, until 2026-10-07", "good", 320);
      flash("issuer");
    },
    bind: function () {
      head(panes.you, "Your crypto wallet", 0);
      row(panes.you, "sign(nonce)", "0x7a3f…c41e", "k good", 80);
      flash("you");
      setTimeout(function () {
        clearEmpty(panes.chain);
        head(panes.chain, "EligibilityDecision", 0);
        row(panes.chain, "subject", "0x7a3f…c41e", "k", 80);
        row(panes.chain, "policyId", "0x9c02…e7b8", "k", 160);
        row(panes.chain, "bits", "over18: 1  evidence: 1", "k good", 240);
        row(panes.chain, "tier", "A", "k", 320);
        row(panes.chain, "expiresAt", "2026-10-07", "k", 400);
        var st = row(panes.chain, "statusRef", "active", "k good", 480);
        st.id = "chain-status";
        row(panes.chain, "name", "not present", "k struck", 560);
        row(panes.chain, "document", "not present", "k struck", 640);
        flash("chain");
      }, 500);
    },
    use: function () {
      head(panes.you, "From your wallet", 0);
      row(panes.you, "Subscribe", "100 FUND, test assets", "good", 80);
      row(panes.you, "Swap", "10 FUND to USDC", "good", 160);
      head(panes.chain, "Reads", 0);
      row(panes.chain, "FundToken.transfer", "allowed", "k good", 80);
      row(panes.chain, "Pool.swap", "allowed", "k good", 160);
      setDoors(true);
      flash("chain");
    },
    revoke: function () {
      head(panes.issuer, "Withdraw", 0);
      row(panes.issuer, "revoke", "manual", "bad", 80);
      flash("issuer");
      setTimeout(function () {
        var st = document.getElementById("chain-status");
        if (st) {
          st.className = "row k bad";
          st.querySelector("b").textContent = "revoked";
          st.style.animation = "none"; void st.offsetWidth; st.style.animation = "";
        }
        row(panes.chain, "FundToken.transfer", "refused", "k bad", 80);
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
    panes.you.innerHTML = '<p class="empty">The official test wallet, on your phone. Sample identity.</p>';
    panes.issuer.innerHTML = '<p class="empty">A fund issuer. It has a customer record, no passport copy.</p>';
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
