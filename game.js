(function () {
  "use strict";

  var STORAGE_KEY = "toothTimeCoder";
  var KIND_LINE = "Nice try! The glowing bar comes next.";
  var CHEER_LINE = "You did it! Bright smile. Fresh teeth.";

  var ALL_BARS = {
    "Grab brush": { kind: "grab", pose: "holding" },
    "Add toothpaste": { kind: "paste", pose: "holding" },
    "Brush teeth": { kind: "brush", pose: "brushing" },
    "Brush top teeth": { kind: "brush", pose: "brushing" },
    "Brush bottom teeth": { kind: "brush", pose: "brushing" },
    Rinse: { kind: "rinse", pose: "rinsing" },
    "Wash face": { kind: "extra", pose: "waiting" },
    "Comb hair": { kind: "extra", pose: "waiting" },
    "Put on pajamas": { kind: "extra", pose: "waiting" },
    "Drink juice": { kind: "extra", pose: "waiting" }
  };

  var LEVELS = [
    {
      name: "Level 1",
      goal: ["Grab brush", "Brush teeth"],
      extras: ["Wash face", "Comb hair"]
    },
    {
      name: "Level 2",
      goal: ["Grab brush", "Add toothpaste", "Brush teeth"],
      extras: ["Wash face", "Drink juice"]
    },
    {
      name: "Level 3",
      goal: [
        "Grab brush",
        "Add toothpaste",
        "Brush top teeth",
        "Brush bottom teeth",
        "Rinse"
      ],
      extras: ["Comb hair", "Put on pajamas", "Wash face"]
    }
  ];

  var ZOOM_STEPS = [70, 80, 90, 100, 115, 130];

  var app = document.getElementById("app");
  var lookTray = document.getElementById("lookTray");
  var programList = document.getElementById("programList");
  var goBtn = document.getElementById("goBtn");
  var clearBtn = document.getElementById("clearBtn");
  var levelBadge = document.getElementById("levelBadge");
  var spokenEl = document.getElementById("spoken");
  var character = document.getElementById("character");
  var scene = document.getElementById("scene");
  var mistakeStar = document.getElementById("mistakeStar");
  var cheer = document.getElementById("cheer");
  var playAgainBtn = document.getElementById("playAgainBtn");
  var toothpasteTube = document.getElementById("toothpasteTube");
  var bubbles = document.getElementById("bubbles");

  var state = {
    levelIndex: 0,
    program: [],
    busy: false,
    speechReady: false,
    zoom: 100
  };

  function loadSave() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var data = JSON.parse(raw);
      if (data && typeof data.zoom === "number" && ZOOM_STEPS.indexOf(data.zoom) !== -1) {
        state.zoom = data.zoom;
      }
      if (data && typeof data.levelIndex === "number" && data.levelIndex >= 0 && data.levelIndex < LEVELS.length) {
        state.levelIndex = data.levelIndex;
      }
    } catch (err) {
      /* ignore bad save */
    }
  }

  function save() {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          zoom: state.zoom,
          levelIndex: state.levelIndex,
          actions: ["look", "add", "change", "take away"]
        })
      );
    } catch (err) {
      /* private mode etc. */
    }
  }

  function setZoom(percent) {
    if (ZOOM_STEPS.indexOf(percent) === -1) return;
    state.zoom = percent;
    app.style.setProperty("--z", String(percent / 100));
    var buttons = document.querySelectorAll(".zoom-btn");
    for (var i = 0; i < buttons.length; i++) {
      var btn = buttons[i];
      var z = Number(btn.getAttribute("data-zoom"));
      if (z === percent) {
        btn.classList.add("is-active");
      } else {
        btn.classList.remove("is-active");
      }
    }
    save();
  }

  function unlockSpeech() {
    if (state.speechReady) return;
    state.speechReady = true;
    if (!window.speechSynthesis) return;
    try {
      var u = new SpeechSynthesisUtterance(" ");
      u.volume = 0;
      window.speechSynthesis.speak(u);
    } catch (err) {
      /* keep going; on-screen words still work */
    }
  }

  function speak(text) {
    spokenEl.textContent = text;
    if (!window.speechSynthesis || !state.speechReady) return;
    try {
      window.speechSynthesis.cancel();
      var utter = new SpeechSynthesisUtterance(text);
      utter.rate = 0.95;
      utter.pitch = 1.05;
      window.speechSynthesis.speak(utter);
    } catch (err) {
      /* words stay on screen */
    }
  }

  function shuffle(list) {
    var copy = list.slice();
    for (var i = copy.length - 1; i > 0; i--) {
      var j = Math.floor(Math.random() * (i + 1));
      var tmp = copy[i];
      copy[i] = copy[j];
      copy[j] = tmp;
    }
    return copy;
  }

  /** look: the bars that can be used */
  function look() {
    var level = LEVELS[state.levelIndex];
    var labels = shuffle(level.goal.concat(level.extras));
    lookTray.innerHTML = "";
    for (var i = 0; i < labels.length; i++) {
      lookTray.appendChild(makeBar(labels[i], false));
    }
    return labels;
  }

  /** add: put a bar on the list */
  function add(label) {
    if (state.busy) return;
    if (!label || !ALL_BARS[label]) return;
    state.program.push(label);
    renderProgram();
    speak(label);
    save();
  }

  /** change: set the character's pose */
  function change(pose) {
    var allowed = {
      waiting: true,
      holding: true,
      brushing: true,
      rinsing: true,
      celebrating: true
    };
    if (!allowed[pose]) pose = "waiting";
    character.setAttribute("data-pose", pose);
    scene.classList.remove("is-brushing", "is-rinsing");
    if (pose === "brushing") scene.classList.add("is-brushing");
    if (pose === "rinsing") scene.classList.add("is-rinsing");
    if (pose === "holding" || pose === "brushing") {
      /* toothpaste visual cue after add toothpaste step handled in play */
    }
    if (pose === "waiting") {
      toothpasteTube.classList.remove("is-used");
    }
    save();
    return pose;
  }

  /** take away: remove the mistake star */
  function takeAway() {
    mistakeStar.hidden = true;
    clearGlow();
    save();
  }

  function makeBar(label, inProgram, index) {
    var meta = ALL_BARS[label] || { kind: "extra" };
    var el = document.createElement("button");
    el.type = "button";
    el.className = "code-bar";
    el.setAttribute("data-kind", meta.kind);
    el.setAttribute("data-label", label);
    el.setAttribute("role", "listitem");
    el.draggable = !inProgram;

    var text = document.createElement("span");
    text.textContent = label;
    el.appendChild(text);

    if (inProgram) {
      el.setAttribute("data-index", String(index));
      var remove = document.createElement("button");
      remove.type = "button";
      remove.className = "bar-remove";
      remove.setAttribute("aria-label", "Remove " + label);
      remove.textContent = "×";
      remove.addEventListener("click", function (evt) {
        evt.stopPropagation();
        if (state.busy) return;
        unlockSpeech();
        state.program.splice(index, 1);
        renderProgram();
      });
      el.appendChild(remove);
    } else {
      el.addEventListener("click", function () {
        unlockSpeech();
        add(label);
      });
      el.addEventListener("dragstart", function (evt) {
        unlockSpeech();
        evt.dataTransfer.setData("text/plain", label);
        evt.dataTransfer.effectAllowed = "copy";
      });
    }

    return el;
  }

  function renderProgram() {
    programList.innerHTML = "";
    for (var i = 0; i < state.program.length; i++) {
      programList.appendChild(makeBar(state.program[i], true, i));
    }
  }

  function clearGlow() {
    var glowing = lookTray.querySelectorAll(".is-glow");
    for (var i = 0; i < glowing.length; i++) {
      glowing[i].classList.remove("is-glow");
    }
  }

  function glowCorrectBar() {
    clearGlow();
    var goal = LEVELS[state.levelIndex].goal;
    var nextLabel = null;
    for (var i = 0; i < goal.length; i++) {
      if (state.program[i] !== goal[i]) {
        nextLabel = goal[i];
        break;
      }
    }
    if (!nextLabel) nextLabel = goal[0];

    var bars = lookTray.querySelectorAll(".code-bar");
    for (var j = 0; j < bars.length; j++) {
      if (bars[j].getAttribute("data-label") === nextLabel) {
        bars[j].classList.add("is-glow");
        break;
      }
    }

    window.setTimeout(function () {
      clearGlow();
    }, 1000);
  }

  function listsMatch(a, b) {
    if (a.length !== b.length) return false;
    for (var i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) return false;
    }
    return true;
  }

  function wait(ms) {
    return new Promise(function (resolve) {
      window.setTimeout(resolve, ms);
    });
  }

  function playStep(label) {
    var meta = ALL_BARS[label];
    speak(label);
    if (label === "Add toothpaste") {
      toothpasteTube.classList.add("is-used");
    }
    change(meta.pose);
    var duration = meta.pose === "brushing" ? 1200 : meta.pose === "rinsing" ? 1100 : 900;
    return wait(duration);
  }

  function setBusy(busy) {
    state.busy = busy;
    goBtn.disabled = busy;
    clearBtn.disabled = busy;
  }

  function onWrong() {
    mistakeStar.hidden = false;
    glowCorrectBar();
    speak(KIND_LINE);
    change("waiting");
  }

  function advanceOrCheer() {
    if (state.levelIndex >= LEVELS.length - 1) {
      change("celebrating");
      speak(CHEER_LINE);
      cheer.hidden = false;
      save();
      return;
    }
    state.levelIndex += 1;
    save();
    startLevel(true);
  }

  function startLevel(announce) {
    cheer.hidden = true;
    takeAway();
    state.program = [];
    renderProgram();
    look();
    change("waiting");
    levelBadge.textContent = LEVELS[state.levelIndex].name;
    if (announce) {
      speak(LEVELS[state.levelIndex].name + ". Put the bars in order.");
    } else {
      spokenEl.textContent = "Tap a bar or drag it into your list.";
    }
  }

  function onGo() {
    unlockSpeech();
    if (state.busy) return;
    var goal = LEVELS[state.levelIndex].goal;
    if (!listsMatch(state.program, goal)) {
      onWrong();
      return;
    }

    setBusy(true);
    takeAway();

    var chain = Promise.resolve();
    for (var i = 0; i < state.program.length; i++) {
      (function (label) {
        chain = chain.then(function () {
          return playStep(label);
        });
      })(state.program[i]);
    }

    chain
      .then(function () {
        change("celebrating");
        speak("Great job!");
        return wait(900);
      })
      .then(function () {
        setBusy(false);
        advanceOrCheer();
      })
      .catch(function () {
        setBusy(false);
        change("waiting");
      });
  }

  function onClear() {
    unlockSpeech();
    if (state.busy) return;
    state.program = [];
    renderProgram();
    change("waiting");
    speak("List cleared.");
  }

  function onPlayAgain() {
    unlockSpeech();
    state.levelIndex = 0;
    save();
    startLevel(true);
  }

  function bindUi() {
    goBtn.addEventListener("click", onGo);
    clearBtn.addEventListener("click", onClear);
    playAgainBtn.addEventListener("click", onPlayAgain);
    mistakeStar.addEventListener("click", function () {
      unlockSpeech();
      takeAway();
      speak("Star taken away.");
    });

    var zoomButtons = document.querySelectorAll(".zoom-btn");
    for (var i = 0; i < zoomButtons.length; i++) {
      zoomButtons[i].addEventListener("click", function (evt) {
        unlockSpeech();
        setZoom(Number(evt.currentTarget.getAttribute("data-zoom")));
      });
    }

    programList.addEventListener("dragover", function (evt) {
      evt.preventDefault();
      programList.classList.add("is-drag-over");
      if (evt.dataTransfer) evt.dataTransfer.dropEffect = "copy";
    });
    programList.addEventListener("dragleave", function () {
      programList.classList.remove("is-drag-over");
    });
    programList.addEventListener("drop", function (evt) {
      evt.preventDefault();
      programList.classList.remove("is-drag-over");
      unlockSpeech();
      var label = evt.dataTransfer.getData("text/plain");
      add(label);
    });

    document.addEventListener(
      "pointerdown",
      function () {
        unlockSpeech();
      },
      true
    );
  }

  // Expose Anthony's four actions for the classroom coding model
  window.ToothTimeCoder = {
    look: look,
    add: add,
    change: change,
    takeAway: takeAway
  };

  loadSave();
  bindUi();
  setZoom(state.zoom);
  startLevel(false);
})();
