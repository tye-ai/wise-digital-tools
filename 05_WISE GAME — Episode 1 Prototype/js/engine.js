/* WISE Game — reusable engine.
   Content modules (see content-devon-1.js) describe scenes as data; this file
   knows nothing about Devon specifically. Scene types a content module can use:
     "story"    — situation text + 2-4 choice cards
     "planning" — the month-allocation interaction (strategy + envelope steppers)
     "auto"     — no player choice; resolves state then advances immediately
     "outcome"  — end-of-story timeline + replay
   A choice's `next` may be a scene id string or a function(state) -> id.
   If a choice ever drops balance below $0, the engine inserts a generic
   "recovery" interstitial instead of failing the player. */

window.WISE = window.WISE || {};

window.WISE.Engine = (function () {
  "use strict";

  var state, content, elApp, elAnnouncer;

  function freshState(contentModule) {
    return {
      day: contentModule.scenes.intro.day || 1,
      sceneId: "intro",
      income: contentModule.income,
      fixed: contentModule.fixed,
      savingsGoalAmount: contentModule.savingsGoal,
      strategy: null,
      plan: null,
      balance: 0,
      budgets: {},
      laptopSaved: 0,
      flags: {},
      history: [],
      replayVariant: Math.random() < 0.5 ? "A" : "B",
      pendingNext: null,
      _recoveryScene: null
    };
  }

  function init(opts) {
    content = opts.content;
    elApp = opts.root;
    elAnnouncer = opts.announcer;
    state = freshState(content);
    render();
  }

  function announce(msg) {
    if (!elAnnouncer) return;
    elAnnouncer.textContent = "";
    window.setTimeout(function () { elAnnouncer.textContent = msg; }, 30);
  }

  function fmtMoney(n) {
    var rounded = Math.round(n);
    return rounded < 0 ? "−$" + Math.abs(rounded) : "$" + rounded;
  }

  function choiceNote(choice) {
    return choice.sublabel ? choice.label + " — " + choice.sublabel : choice.label;
  }

  function getActiveScene() {
    if (state.sceneId === "__recovery__") {
      if (!state._recoveryScene) state._recoveryScene = buildRecoveryScene();
      return state._recoveryScene;
    }
    return content.scenes[state.sceneId];
  }

  function buildRecoveryScene() {
    var need = Math.abs(Math.round(state.balance));
    var choices = [
      {
        id: "extra-shift-recover",
        label: "Pick up an extra shift",
        sublabel: "+$60 from work",
        effects: function (s) { s.balance += 60; s.flags.tookRecoveryShift = true; },
        next: function (s) { return s.pendingNext; }
      },
      {
        id: "trim-recover",
        label: "Trim next week’s groceries",
        sublabel: "+$25 back into the budget",
        effects: function (s) { s.balance += 25; s.flags.trimmedGroceries = true; },
        next: function (s) { return s.pendingNext; }
      }
    ];
    if (state.laptopSaved > 0) {
      var pull = Math.min(state.laptopSaved, need + 5);
      choices.push({
        id: "dip-savings",
        label: "Move $" + pull + " back from laptop savings",
        sublabel: "Protects the bills, delays the goal",
        effects: function (s) { s.balance += pull; s.laptopSaved -= pull; s.flags.dippedSavings = true; },
        next: function (s) { return s.pendingNext; }
      });
    }
    return {
      type: "story",
      day: state.day,
      heading: "The numbers don’t add up",
      body: ["The plan is short by $" + need + " right now. Nothing has gone wrong — it just needs an adjustment."],
      choices: choices
    };
  }

  function goTo(nextId) {
    state._recoveryScene = null;
    if (state.balance < 0 && nextId !== "__recovery__") {
      state.pendingNext = nextId;
      state.sceneId = "__recovery__";
    } else {
      state.sceneId = nextId;
    }
    render();
  }

  function choose(choiceId) {
    var scene = getActiveScene();
    var choice = (scene.choices || []).filter(function (c) { return c.id === choiceId; })[0];
    if (!choice) return;
    if (choice.effects) choice.effects(state);
    state.history.push({ day: state.day, label: scene.heading, note: choiceNote(choice) });
    announce(choiceNote(choice));
    var nextId = typeof choice.next === "function" ? choice.next(state) : choice.next;
    goTo(nextId);
  }

  function commitPlanning(local, pool) {
    var buffer = pool - local.groceries - local.fun;
    state.strategy = local.strategy;
    state.plan = { groceries: local.groceries, fun: local.fun, buffer: buffer };
    state.budgets = { groceries: local.groceries, fun: local.fun };
    state.balance = buffer;
    if (local.strategy === "pay-yourself-first") {
      state.laptopSaved += content.savingsGoal;
    }
    var note = local.strategy === "pay-yourself-first"
      ? "Paid yourself first — $" + content.savingsGoal + " moved to savings immediately."
      : "Paying bills first — the $" + content.savingsGoal + " stays as cash until payday’s end.";
    state.history.push({ day: 1, label: "Plan set", note: note });
    announce(note);
    goTo(content.scenes.planning.next);
  }

  function focusHeading() {
    var h = elApp.querySelector(".scene-heading");
    if (h) h.focus();
  }

  function render() {
    var scene = getActiveScene();
    if (!scene) return;
    state.day = scene.day || state.day;

    if (scene.type === "auto") {
      scene.resolve(state);
      goTo(scene.next);
      return;
    }

    elApp.innerHTML = "";
    elApp.appendChild(renderHUD());

    if (scene.type === "planning") elApp.appendChild(renderPlanning(scene));
    else if (scene.type === "outcome") elApp.appendChild(renderOutcome());
    else elApp.appendChild(renderStory(scene));

    focusHeading();
  }

  function renderHUD() {
    var hud = document.createElement("div");
    hud.className = "hud";
    if (state.sceneId === "intro") {
      hud.classList.add("hud-hidden");
      return hud;
    }
    var pct = Math.max(0, Math.min(100, Math.round((state.laptopSaved / state.savingsGoalAmount) * 100)));
    var budgetItems = "";
    if (state.budgets && Object.keys(state.budgets).length) {
      var labels = { groceries: "Groceries left", fun: "Fun money left" };
      Object.keys(state.budgets).forEach(function (key) {
        var label = labels[key] || key;
        budgetItems += '<div class="hud-item"><span class="hud-label">' + label + '</span><span class="hud-value">$' + Math.max(0, Math.round(state.budgets[key])) + "</span></div>";
      });
    }
    hud.innerHTML =
      '<div class="hud-item"><span class="hud-label">Day</span><span class="hud-value">' + state.day + " / 30</span></div>" +
      '<div class="hud-item"><span class="hud-label">Flexible cash</span><span class="hud-value">' + fmtMoney(state.balance) + "</span></div>" +
      budgetItems +
      '<div class="hud-item hud-goal"><span class="hud-label">Laptop goal</span>' +
      '<div class="progress-track" role="progressbar" aria-valuenow="' + pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Laptop savings progress">' +
      '<div class="progress-fill" style="width:' + pct + '%"></div></div>' +
      '<span class="hud-value">$' + state.laptopSaved + " of $" + state.savingsGoalAmount + "</span></div>";
    return hud;
  }

  function renderStory(scene) {
    var wrap = document.createElement("section");
    wrap.className = "scene";

    var h = document.createElement("h2");
    h.className = "scene-heading";
    h.tabIndex = -1;
    h.textContent = scene.heading;
    wrap.appendChild(h);

    (scene.body || []).forEach(function (line) {
      var p = document.createElement("p");
      p.className = line.indexOf("📱") === 0 ? "scene-line message" : "scene-line";
      p.textContent = line;
      wrap.appendChild(p);
    });

    var list = document.createElement("div");
    list.className = "choice-list";
    list.setAttribute("role", "group");
    list.setAttribute("aria-label", "Choose one");

    scene.choices.forEach(function (choice) {
      var btn = document.createElement("button");
      btn.type = "button";
      btn.className = "choice-card";

      var labelSpan = document.createElement("span");
      labelSpan.className = "choice-label";
      labelSpan.textContent = choice.label;
      btn.appendChild(labelSpan);

      if (choice.sublabel) {
        var subSpan = document.createElement("span");
        subSpan.className = "choice-sub";
        subSpan.textContent = choice.sublabel;
        btn.appendChild(subSpan);
      }

      btn.addEventListener("click", function () { choose(choice.id); });
      list.appendChild(btn);
    });

    wrap.appendChild(list);
    return wrap;
  }

  function renderPlanning(scene) {
    var wrap = document.createElement("section");
    wrap.className = "scene planning-scene";

    var h = document.createElement("h2");
    h.className = "scene-heading";
    h.tabIndex = -1;
    h.textContent = scene.heading;
    wrap.appendChild(h);

    var introP = document.createElement("p");
    introP.className = "scene-line";
    introP.textContent = scene.intro;
    wrap.appendChild(introP);

    var local = { strategy: "pay-yourself-first", groceries: 0, fun: 0 };
    var pool = 0;

    function poolFor(strategy) {
      var f = content.fixed;
      return strategy === "pay-yourself-first"
        ? content.income - f.rent - f.phone - content.savingsGoal
        : content.income - f.rent - f.phone;
    }

    function applyPreset(strategy) {
      local.strategy = strategy;
      var preset = content.planningPresets[strategy];
      local.groceries = preset.groceries;
      local.fun = preset.fun;
      pool = poolFor(strategy);
    }
    applyPreset("pay-yourself-first");

    var strategyWrap = document.createElement("div");
    strategyWrap.className = "strategy-choice";
    strategyWrap.setAttribute("role", "group");
    strategyWrap.setAttribute("aria-label", "Choose a savings strategy");

    var strategyBtns = {};
    var strategyOpts = [
      { id: "pay-yourself-first", title: "Pay Yourself First", desc: "Move $" + content.savingsGoal + " to savings right now, plan the rest around what’s left." },
      { id: "bills-first", title: "Pay Bills First", desc: "Keep the $" + content.savingsGoal + " as cash for now — save whatever’s left on payday." }
    ];

    strategyOpts.forEach(function (opt) {
      var b = document.createElement("button");
      b.type = "button";
      b.className = "strategy-card";
      b.setAttribute("aria-pressed", String(opt.id === local.strategy));
      var t = document.createElement("span");
      t.className = "strategy-title";
      t.textContent = opt.title;
      var d = document.createElement("span");
      d.className = "strategy-desc";
      d.textContent = opt.desc;
      b.appendChild(t);
      b.appendChild(d);
      b.addEventListener("click", function () {
        applyPreset(opt.id);
        Object.keys(strategyBtns).forEach(function (k) {
          strategyBtns[k].setAttribute("aria-pressed", String(k === opt.id));
        });
        updateEnvelopeUI();
      });
      strategyBtns[opt.id] = b;
      strategyWrap.appendChild(b);
    });
    wrap.appendChild(strategyWrap);

    var envelopesWrap = document.createElement("div");
    envelopesWrap.className = "envelopes";
    wrap.appendChild(envelopesWrap);

    var poolLine = document.createElement("p");
    poolLine.className = "pool-line";
    poolLine.setAttribute("aria-live", "polite");
    wrap.appendChild(poolLine);

    function makeStepper(key, title, min, step) {
      var row = document.createElement("div");
      row.className = "envelope";

      var label = document.createElement("span");
      label.className = "envelope-title";
      label.textContent = title;
      row.appendChild(label);

      var minus = document.createElement("button");
      minus.type = "button";
      minus.className = "stepper-btn";
      minus.setAttribute("aria-label", "Decrease " + title + " by $" + step);
      minus.textContent = "−";

      var amount = document.createElement("span");
      amount.className = "envelope-amount";

      var plus = document.createElement("button");
      plus.type = "button";
      plus.className = "stepper-btn";
      plus.setAttribute("aria-label", "Increase " + title + " by $" + step);
      plus.textContent = "+";

      function refresh() { amount.textContent = "$" + local[key]; }
      refresh();

      minus.addEventListener("click", function () {
        local[key] = Math.max(min, local[key] - step);
        updateEnvelopeUI();
      });
      plus.addEventListener("click", function () {
        var other = key === "groceries" ? local.fun : local.groceries;
        if (local[key] + step + other <= pool) {
          local[key] += step;
          updateEnvelopeUI();
        }
      });

      row.appendChild(minus);
      row.appendChild(amount);
      row.appendChild(plus);
      return { row: row, refresh: refresh };
    }

    var groceriesStepper = makeStepper("groceries", "Groceries", 100, 10);
    var funStepper = makeStepper("fun", "Fun money", 0, 10);
    envelopesWrap.appendChild(groceriesStepper.row);
    envelopesWrap.appendChild(funStepper.row);

    function updateEnvelopeUI() {
      groceriesStepper.refresh();
      funStepper.refresh();
      var buffer = pool - local.groceries - local.fun;
      poolLine.textContent = "$" + pool + " to plan — $" + buffer + " left as flexible buffer.";
    }
    updateEnvelopeUI();

    var continueBtn = document.createElement("button");
    continueBtn.type = "button";
    continueBtn.className = "primary-btn";
    continueBtn.textContent = "Continue";
    continueBtn.addEventListener("click", function () { commitPlanning(local, pool); });
    wrap.appendChild(continueBtn);

    return wrap;
  }

  function renderOutcome() {
    var wrap = document.createElement("section");
    wrap.className = "scene outcome-scene";

    var h = document.createElement("h2");
    h.className = "scene-heading";
    h.tabIndex = -1;
    h.textContent = "The month is over.";
    wrap.appendChild(h);

    var goalMet = state.laptopSaved >= state.savingsGoalAmount;
    var totalCash = state.balance + (state.budgets.groceries || 0) + (state.budgets.fun || 0);
    var summary = document.createElement("div");
    summary.className = "outcome-summary";

    var stat1 = document.createElement("p");
    stat1.className = "outcome-stat";
    stat1.innerHTML = "<strong>$" + Math.round(totalCash) + "</strong> left in cash";
    var stat2 = document.createElement("p");
    stat2.className = "outcome-stat";
    stat2.innerHTML = "<strong>$" + state.laptopSaved + " of $" + state.savingsGoalAmount + "</strong> saved toward the laptop" + (goalMet ? " — goal met" : "");
    summary.appendChild(stat1);
    summary.appendChild(stat2);
    wrap.appendChild(summary);

    var timelineHeading = document.createElement("h3");
    timelineHeading.className = "outcome-subheading";
    timelineHeading.textContent = "How the month went";
    wrap.appendChild(timelineHeading);

    var timeline = document.createElement("ol");
    timeline.className = "outcome-timeline";
    state.history.forEach(function (entry) {
      var li = document.createElement("li");
      var dayEl = document.createElement("span");
      dayEl.className = "timeline-day";
      dayEl.textContent = "Day " + entry.day;
      var noteEl = document.createElement("span");
      noteEl.className = "timeline-note";
      noteEl.textContent = entry.label + (entry.note ? " — " + entry.note : "");
      li.appendChild(dayEl);
      li.appendChild(noteEl);
      timeline.appendChild(li);
    });
    wrap.appendChild(timeline);

    var replayBtn = document.createElement("button");
    replayBtn.type = "button";
    replayBtn.className = "primary-btn";
    replayBtn.textContent = "Play again — try a different strategy";
    replayBtn.addEventListener("click", function () {
      state = freshState(content);
      render();
    });
    wrap.appendChild(replayBtn);

    return wrap;
  }

  return { init: init };
})();
