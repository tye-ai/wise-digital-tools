/* WISE Game — boot script for the Episode 1 (Devon) prototype.
   Renders the start card, wires the Educator View overlay, and hands off to
   WISE.Engine once the player presses Play. No accounts, no data collected;
   nothing is written to storage in this build (Quick Play only). */

(function () {
  "use strict";

  var content = window.WISE_CONTENT["devon-1"];
  var elApp = document.getElementById("app");
  var elAnnouncer = document.getElementById("announcer");
  var elEducatorPanel = document.getElementById("educator-panel");
  var elEducatorToggle = document.getElementById("educator-toggle");

  function renderStartCard() {
    elApp.innerHTML = "";
    var card = document.createElement("section");
    card.className = "start-card";

    var eyebrow = document.createElement("p");
    eyebrow.className = "start-eyebrow";
    eyebrow.textContent = content.meta.character.toUpperCase();
    card.appendChild(eyebrow);

    var title = document.createElement("h1");
    title.className = "start-title";
    title.tabIndex = -1;
    title.textContent = content.meta.title;
    card.appendChild(title);

    var hook = document.createElement("p");
    hook.className = "start-hook";
    hook.textContent = content.meta.hook;
    card.appendChild(hook);

    var playBtn = document.createElement("button");
    playBtn.type = "button";
    playBtn.className = "primary-btn start-play";
    playBtn.textContent = "Play";
    playBtn.addEventListener("click", function () {
      window.WISE.Engine.init({ content: content, root: elApp, announcer: elAnnouncer });
    });
    card.appendChild(playBtn);

    var privacyNote = document.createElement("p");
    privacyNote.className = "start-privacy";
    privacyNote.textContent = "No account, no login. Every name and number here is fictional, for learning.";
    card.appendChild(privacyNote);

    elApp.appendChild(card);
    title.focus();
  }

  function renderEducatorPanel() {
    var m = content.meta;
    var html = "";
    html += '<button type="button" class="educator-close" id="educator-close" aria-label="Close educator view">✕</button>';
    html += '<h2 class="educator-heading">' + m.character.toUpperCase() + " — " + m.title + "</h2>";
    html += '<p class="educator-line"><strong>WISE connection:</strong> ' + m.wiseConnection + "</p>";
    html += '<p class="educator-line"><strong>Skills:</strong> ' + m.skills.join(" • ") + "</p>";
    html += '<p class="educator-line"><strong>Estimated time:</strong> ' + m.estimatedTime + "</p>";
    html += '<p class="educator-line"><strong>Privacy:</strong> No login, no student accounts, no data saved. All figures are fictional/sample data.</p>';
    html += '<h3 class="educator-subheading">Discussion prompts</h3><ul class="educator-list">';
    m.discussionPrompts.forEach(function (p) { html += "<li>" + p + "</li>"; });
    html += "</ul>";
    elEducatorPanel.innerHTML = html;
    document.getElementById("educator-close").addEventListener("click", closeEducatorPanel);
  }

  function openEducatorPanel() {
    renderEducatorPanel();
    elEducatorPanel.hidden = false;
    elEducatorToggle.setAttribute("aria-expanded", "true");
    elEducatorPanel.querySelector(".educator-close").focus();
  }

  function closeEducatorPanel() {
    elEducatorPanel.hidden = true;
    elEducatorToggle.setAttribute("aria-expanded", "false");
    elEducatorToggle.focus();
  }

  elEducatorToggle.addEventListener("click", function () {
    if (elEducatorPanel.hidden) openEducatorPanel(); else closeEducatorPanel();
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && !elEducatorPanel.hidden) closeEducatorPanel();
  });

  renderStartCard();
})();
