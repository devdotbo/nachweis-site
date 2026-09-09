/* Attestat showcase, back office: scroll reveals and the scripted compliance desk. Vanilla JS, sample data, touches nothing. */
(function () {
  "use strict";
  document.documentElement.classList.add("js");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

  var ORDER = ["evidence", "comp", "ops", "probe", "stranger", "revoke"];
  var intents = document.getElementById("intent-list");
  var chain = document.getElementById("chain-log");
  var note = document.getElementById("demo-note");
  var fence = document.getElementById("fence");
  var roleComp = document.getElementById("role-comp");
  var roleOps = document.getElementById("role-ops");
  var stepButtons = Array.prototype.slice.call(document.querySelectorAll(".step[data-step]"));
  var miniDoors = Array.prototype.slice.call(document.querySelectorAll("#doors-mini .mini-door"));
  var state = { done: [] };
  var INVESTOR = "0x7a3f…c41e";
  var STRANGER = "0x00c9…b17d";
  var POLICY = "0x9c02…e7b8";

  var NOTES = {
    start: "Step 1: the investor's proof lands on chain as evidence.",
    evidence: "Attested, no approval. The service saw the event and proposed an intent: zero of two.",
    comp: "One of two. Compliance signed with its own key. Nothing was broadcast.",
    ops: "Two of two. Privy executed approve from the enclave. Both doors open on the same record.",
    probe: "Refused by the wallet policy before signing. The operator wallet cannot move money, even with both keys.",
    stranger: "Two signatures, no evidence. The registry reverted with NoDecision and the intent failed.",
    revoke: "One signature from operations under its emergency policy. Both doors closed. Manual withdrawal."
  };

  function el(tag, cls, text) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (text !== undefined) e.textContent = text;
    return e;
  }
  function row(pane, label, value, cls, delay) {
    var r = el("div", "row" + (cls ? " " + cls : ""));
    r.style.animationDelay = (delay || 0) + "ms";
    if (label === null) { r.textContent = value; }
    else { r.appendChild(el("span", "", label)); r.appendChild(el("b", "", value)); }
    pane.appendChild(r);
    return r;
  }
  function head(pane, text, delay) { return row(pane, null, text, "head", delay); }
  function clearEmpty(pane) { var e = pane.querySelector(".empty"); if (e) e.remove(); }
  function flash(name) {
    var p = document.querySelector(".dpane." + name);
    p.classList.add("flash");
    setTimeout(function () { p.classList.remove("flash"); }, 700);
  }
  function shake(name) {
    var p = document.querySelector(".dpane." + name);
    p.classList.add("shake");
    setTimeout(function () { p.classList.remove("shake"); }, 600);
  }
  function setDoors(open) {
    miniDoors.forEach(function (d) {
      d.classList.toggle("open", open);
      d.querySelector(".state").textContent = open ? "open" : "closed";
    });
  }
  function setRole(which) {
    roleComp.classList.toggle("active", which === "comp");
    roleOps.classList.toggle("active", which === "ops");
  }

  function intent(id, call, status, sigCount, noteText) {
    var card = el("div", "intent");
    card.id = id;
    var h = el("div", "intent-head");
    h.appendChild(el("b", "", call));
    var st = el("span", "intent-status", status);
    h.appendChild(st);
    card.appendChild(h);
    var sigs = el("div", "sigs");
    var s1 = el("span", "sig"), s2 = el("span", "sig");
    sigs.appendChild(s1); sigs.appendChild(s2);
    sigs.appendChild(el("em", "", sigCount + " of 2"));
    card.appendChild(sigs);
    card.appendChild(el("p", "intent-note", noteText));
    card.appendChild(el("p", "who", ""));
    clearEmpty(intents);
    intents.insertBefore(card, intents.firstChild);
    return card;
  }
  function setIntent(card, opts) {
    if (opts.status) { card.querySelector(".intent-status").textContent = opts.status; }
    if (opts.sigs !== undefined) {
      var s = card.querySelectorAll(".sig");
      s[0].classList.toggle("on", opts.sigs >= 1);
      s[1].classList.toggle("on", opts.sigs >= 2);
      card.querySelector(".sigs em").textContent = opts.sigs + " of 2";
    }
    if (opts.note) { card.querySelector(".intent-note").textContent = opts.note; }
    if (opts.who) { card.querySelector(".who").textContent = opts.who; }
    if (opts.cls) { card.className = "intent " + opts.cls; }
  }

  var ACTIONS = {
    evidence: function () {
      clearEmpty(chain);
      head(chain, "Attested", 0);
      row(chain, "subject", INVESTOR, "k", 80);
      row(chain, "policyId", POLICY, "k", 160);
      row(chain, "bits", "evidence 1, over18 1", "k good", 240);
      row(chain, "tier, expiry", "1, 2026-10-07", "k", 320);
      row(chain, "approved", "false", "k warn", 400);
      row(chain, "name", "not present", "k struck", 480);
      flash("chain");
      setTimeout(function () {
        intent("intent-approve", "approve(" + INVESTOR + ")", "pending", 0, "Proposed by the service from the Attested event.");
        flash("intents");
      }, 600);
    },
    comp: function () {
      setRole("comp");
      var c = document.getElementById("intent-approve");
      setIntent(c, { sigs: 1, note: "Authorized by compliance. Waiting for operations.", who: "signature 1: compliance key" });
      flash("intents");
    },
    ops: function () {
      setRole("ops");
      var c = document.getElementById("intent-approve");
      setIntent(c, { sigs: 2, status: "executed", cls: "executed", note: "Threshold met. Privy signed in the enclave and broadcast.", who: "signature 2: operations key" });
      flash("intents");
      setTimeout(function () {
        head(chain, "Approved", 0);
        row(chain, "subject", INVESTOR, "k", 80);
        row(chain, "operator", "0x5e1d…9a4c, the Privy wallet", "k good", 160);
        row(chain, "approved", "true", "k good", 240);
        row(chain, "FundToken.transfer", "allowed", "k good", 320);
        row(chain, "Pool.swap", "allowed", "k good", 400);
        setDoors(true);
        flash("chain");
      }, 500);
    },
    probe: function () {
      setRole("ops");
      var c = intent("intent-probe", "send 0.01 ETH to 0x1f…", "refused", 0, "");
      setIntent(c, { cls: "refused", note: "Policy violation. Only approve and revoke on the registry are allowed. Not signed, not broadcast.", who: "refused by the policy, inside the enclave" });
      fence.classList.add("hit");
      shake("wallet");
      setTimeout(function () { fence.classList.remove("hit"); }, 1200);
    },
    stranger: function () {
      var c = intent("intent-stranger", "approve(" + STRANGER + ")", "pending", 0, "Proposed by hand for an address that brought no evidence.");
      setTimeout(function () { setRole("comp"); setIntent(c, { sigs: 1, who: "signature 1: compliance key" }); }, 500);
      setTimeout(function () { setRole("ops"); setIntent(c, { sigs: 2, status: "processing", who: "signature 2: operations key" }); }, 1000);
      setTimeout(function () {
        setIntent(c, { status: "failed", cls: "failed", note: "Reverted: NoDecision(" + STRANGER + ", policyId). No evidence, no approval." });
        head(chain, "Reverted", 0);
        row(chain, "approve(" + STRANGER + ")", "NoDecision", "k bad", 80);
        shake("chain");
      }, 1700);
    },
    revoke: function () {
      setRole("ops");
      var c = intent("intent-revoke", "revoke(" + INVESTOR + ")", "executed", 1, "");
      setIntent(c, { cls: "executed", note: "Emergency policy: operations alone may revoke until 2026-12-31.", who: "signature 1: operations key. Manual withdrawal." });
      flash("intents");
      setTimeout(function () {
        head(chain, "Revoked", 0);
        row(chain, "subject", INVESTOR, "k", 80);
        row(chain, "operator", "0x5e1d…9a4c, the Privy wallet", "k", 160);
        row(chain, "approved", "false", "k bad", 240);
        row(chain, "Subscribe", "NotEligible", "k bad", 320);
        row(chain, "Pool.swap", "no permission", "k bad", 400);
        setDoors(false);
        flash("chain");
      }, 500);
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
    intents.innerHTML = '<p class="empty">Waiting for evidence. The service watches the registry\'s Attested event.</p>';
    chain.innerHTML = '<p class="empty">Public. Anyone can read this pane.</p>';
    setDoors(false);
    setRole(null);
    fence.classList.remove("hit");
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
})();
