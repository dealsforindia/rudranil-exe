const NOW = new Date();
const CURRENT_MONTH = NOW.getMonth(); // 0-indexed
const CURRENT_YEAR = NOW.getFullYear();
const MONTH_DAYS = new Date(CURRENT_YEAR, CURRENT_MONTH + 1, 0).getDate();
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MONTH_NAME = MONTH_NAMES[CURRENT_MONTH];
const TODAY_DAY = NOW.getDate();
const TODAY_KEY = "rd-v7-" + CURRENT_YEAR + "-" + (CURRENT_MONTH + 1) + "-" + TODAY_DAY;

const DAILIES = [
  "Wake up on time", "Workout (PPL + Abs)", "Reading block",
  "Python practice", "Study block done", "Break (30 min)", "Video editing", "Night review"
];

// PPL rotation: 0=Push, 1=Pull, 2=Legs, repeats
const PPL_DAYS = ["Push", "Pull", "Legs"];
function getTodayPPL() {
  var dayOfYear = Math.floor((NOW - new Date(CURRENT_YEAR,0,0)) / 86400000);
  return PPL_DAYS[dayOfYear % 3];
}

// === SEMESTER BACKLOGS (Real CU CCF Syllabus) ===
// Sem 3 backlogs
const MATH_SEM3 = {
  dscc3: ["Real Number System & LUB", "Archimedean Property", "Open/Closed Sets & Bolzano-Weierstrass",
          "Sequences & Cauchy Criterion", "Comparison & Ratio Test", "Root/Raabe's/Gauss Test",
          "Alternating Series & Leibniz Test"],
  dscc4: ["Exact ODEs & Integrating Factors", "Linear & Bernoulli Eqns", "Clairaut's Form & Singular Soln",
          "Const Coeff Homogeneous/Non-homo", "Groups & Abelian Groups", "Permutation & Cyclic Groups",
          "Subgroups & Lagrange's Theorem"],
  sec3:  ["LPP Formulation & Graphical", "Simplex Method & Big-M", "Two-person Zero-sum Games",
          "Saddle Points & Dominance"]
};
const MATH_SEM3_ALL = [...MATH_SEM3.dscc3, ...MATH_SEM3.dscc4, ...MATH_SEM3.sec3];

// Sem 1 backlogs
const MATH_SEM1 = {
  dscc1: ["Higher-order Derivatives & Leibniz", "L'Hospital & Curve Tracing",
          "Reduction Formulae & Arc Length", "Rotation of Axes & Conics",
          "3D Lines & Planes", "Vector Products & Applications"]
};
const MATH_SEM1_ALL = [...MATH_SEM1.dscc1];

let S = {
  dailies: Array(DAILIES.length).fill(false),
  mathSem3: Array(MATH_SEM3_ALL.length).fill(false),
  mathSem1: Array(MATH_SEM1_ALL.length).fill(false),
  sem: ["DSCC-5 Theory of Real Functions", "DSCC-6 Mechanics I", "DSCC-7 Multivariate & PDE", "DSCC-8 Group Theory II & Ring Theory"],
  semD: Array(4).fill(false),
  aff: ["Post deals", "Bot check", "EarnKaro links"],
  affD: Array(3).fill(false),
  exercises: [{n:"Push-ups",s:"3x15",done:false},{n:"Pull-ups",s:"3x8",done:false},{n:"Plank",s:"3x60s",done:false}],
  fsVid: 35, pyVid: 23,
  month: Array(MONTH_DAYS).fill(false),
  streak: 0,
  scratchpad: "",
  review: "",
  savedKey: "",
  savedMonth: CURRENT_MONTH,
  geminiKey: ""
};

// Debounced save
var _saveTimer = null;
function debouncedSave() {
  if (_saveTimer) clearTimeout(_saveTimer);
  _saveTimer = setTimeout(function() { saveState(); }, 800);
}

const checkIcon = '<svg viewBox="0 0 12 12"><polyline points="2.5 6 5 8.5 9.5 3.5"/></svg>';

function countDailies() { return S.dailies.filter(Boolean).length; }

function autoMarkToday() {
  var idx = TODAY_DAY - 1;
  if (idx >= 0 && idx < MONTH_DAYS) S.month[idx] = countDailies() >= 5;
  renderMonth();
}

function updStats() {
  const cnt = countDailies();
  const pct = Math.round(cnt / DAILIES.length * 100);

  document.getElementById("hero-pct").textContent = pct + "%";
  document.getElementById("hero-ring-progress").style.strokeDashoffset = 440 - (pct / 100) * 440;

  document.getElementById("ring-fs").setAttribute("stroke-dasharray", (S.fsVid / 100) * 314 + " 314");
  document.getElementById("ring-py").setAttribute("stroke-dasharray", (S.pyVid / 100) * 226 + " 226");
  var mPct = S.month.filter(Boolean).length / MONTH_DAYS;
  document.getElementById("ring-month").setAttribute("stroke-dasharray", mPct * 138 + " 138");

  document.getElementById("stat-fs").textContent = S.fsVid;
  document.getElementById("stat-py").textContent = S.pyVid;
  document.getElementById("stat-month").textContent = S.month.filter(Boolean).length;

  document.getElementById("fs-slider").value = S.fsVid;
  document.getElementById("py-slider").value = S.pyVid;

  // Streak
  renderStreak();
  // Pending
  renderPending();
  // Review unlock
  renderReview(pct);

  pushToAndroid();
}

function renderDailies() {
  document.getElementById("dailies-count").textContent = countDailies() + "/" + DAILIES.length;
  var h = "";
  DAILIES.forEach(function(d, i) {
    var done = S.dailies[i];
    h += '<div class="task-item" onclick="togDaily(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + d + '</div></div></div>';
  });
  document.getElementById("dailies-list").innerHTML = h;
}
function togDaily(i) { S.dailies[i] = !S.dailies[i]; renderDailies(); autoMarkToday(); updStats(); saveState(); }
function resetDailies() {
  if (!confirm('Reset all dailies? This cannot be undone.')) return;
  S.dailies = Array(DAILIES.length).fill(false); renderDailies(); autoMarkToday(); updStats(); saveState();
}

function renderSem4() {
  var cnt = S.semD.filter(Boolean).length;
  document.getElementById("sem4-count").textContent = cnt + "/" + S.sem.length;
  var h = "";
  S.sem.forEach(function(t, i) {
    var done = S.semD[i];
    h += '<div class="task-item" onclick="togSem(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + t + '</div></div>' +
      '<div class="task-delete" onclick="event.stopPropagation();delSem(' + i + ')">x</div></div>';
  });
  document.getElementById("sem4-list").innerHTML = h;
}
function togSem(i) { S.semD[i] = !S.semD[i]; renderSem4(); updStats(); saveState(); }
function delSem(i) { if (!confirm('Delete "' + S.sem[i] + '"?')) return; S.sem.splice(i, 1); S.semD.splice(i, 1); renderSem4(); updStats(); saveState(); }
function addSemTask() {
  var inp = document.getElementById("sem-new-input");
  var v = inp.value.trim();
  if (!v) return;
  S.sem.push(v); S.semD.push(false); inp.value = "";
  renderSem4(); updStats(); saveState();
}

// === SEM 3 BACKLOG RENDERING ===
function renderSem3Group(id, topics, offset) {
  var el = document.getElementById("pills-" + id);
  if (!el) return;
  var h = "";
  topics.forEach(function(t, i) {
    var gi = offset + i;
    var done = S.mathSem3[gi];
    h += '<div class="math-pill ' + (done ? 'completed' : '') + '" onclick="togSem3(' + gi + ')">' + (done ? '✓ ' : '') + t + '</div>';
  });
  el.innerHTML = h;
}
function renderSem3() {
  renderSem3Group("dscc3", MATH_SEM3.dscc3, 0);
  renderSem3Group("dscc4", MATH_SEM3.dscc4, MATH_SEM3.dscc3.length);
  renderSem3Group("sec3", MATH_SEM3.sec3, MATH_SEM3.dscc3.length + MATH_SEM3.dscc4.length);
  // Update progress count
  var done3 = S.mathSem3.filter(Boolean).length;
  var el = document.getElementById("sem3-progress");
  if (el) el.textContent = done3 + '/' + MATH_SEM3_ALL.length + ' topics';
}
function togSem3(i) { S.mathSem3[i] = !S.mathSem3[i]; renderSem3(); updStats(); saveState(); }

// === SEM 1 BACKLOG RENDERING ===
function renderSem1Group(id, topics, offset) {
  var el = document.getElementById("pills-" + id);
  if (!el) return;
  var h = "";
  topics.forEach(function(t, i) {
    var gi = offset + i;
    var done = S.mathSem1[gi];
    h += '<div class="math-pill ' + (done ? 'completed' : '') + '" onclick="togSem1(' + gi + ')">' + (done ? '✓ ' : '') + t + '</div>';
  });
  el.innerHTML = h;
}
function renderSem1() {
  renderSem1Group("dscc1", MATH_SEM1.dscc1, 0);
  var done1 = S.mathSem1.filter(Boolean).length;
  var el = document.getElementById("sem1-progress");
  if (el) el.textContent = done1 + '/' + MATH_SEM1_ALL.length + ' topics';
}
function togSem1(i) { S.mathSem1[i] = !S.mathSem1[i]; renderSem1(); updStats(); saveState(); }

function renderEx() {
  var h = "";
  S.exercises.forEach(function(e, i) {
    h += '<div class="task-item" onclick="togEx(' + i + ')">' +
      '<div class="task-check ' + (e.done ? 'completed' : '') + '">' + (e.done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (e.done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + e.n + '</div>' +
      '<div class="task-meta">' + e.s + '</div></div>' +
      '<div class="task-delete" onclick="event.stopPropagation();delEx(' + i + ')">x</div></div>';
  });
  document.getElementById("ex-list").innerHTML = h;
}
function togEx(i) { S.exercises[i].done = !S.exercises[i].done; renderEx(); updStats(); saveState(); }
function delEx(i) { if (!confirm('Delete "' + S.exercises[i].n + '"?')) return; S.exercises.splice(i, 1); renderEx(); updStats(); saveState(); }
function addEx() {
  var n = document.getElementById("ex-name-in").value.trim();
  var s = document.getElementById("ex-sets-in").value.trim();
  if (!n) return;
  S.exercises.push({ n: n, s: s || "—", done: false });
  document.getElementById("ex-name-in").value = "";
  document.getElementById("ex-sets-in").value = "";
  renderEx(); updStats(); saveState();
}

function renderAff() {
  var h = "";
  S.aff.forEach(function(t, i) {
    var done = S.affD[i];
    h += '<div class="task-item" onclick="togAff(' + i + ')">' +
      '<div class="task-check ' + (done ? 'completed' : '') + '">' + (done ? checkIcon : '') + '</div>' +
      '<div class="task-info"><div class="task-name" style="' + (done ? 'opacity:0.4;text-decoration:line-through;' : '') + '">' + t + '</div></div></div>';
  });
  document.getElementById("aff-list").innerHTML = h;
}
function togAff(i) { S.affD[i] = !S.affD[i]; renderAff(); updStats(); saveState(); }

function renderMonth() {
  // Update month label dynamically
  var labelEl = document.querySelector('.month-label');
  if (labelEl) labelEl.textContent = MONTH_NAME + ' Consistency';
  var h = "";
  S.month.forEach(function(done, i) {
    var isT = (i + 1) === TODAY_DAY;
    h += '<div class="mday ' + (done ? 'productive' : '') + ' ' + (isT ? 'today' : '') + '" onclick="togMonth(' + i + ')"></div>';
  });
  document.getElementById("mgrid").innerHTML = h;
}
function togMonth(i) { S.month[i] = !S.month[i]; renderMonth(); updStats(); saveState(); }

function updV(id, v) {
  S[id + "Vid"] = parseInt(v);
  updStats(); saveState();
}

// ── STREAK ──
function renderStreak() {
  var badge = document.getElementById("streak-badge");
  var countEl = document.getElementById("streak-count");
  if (S.streak > 0) {
    badge.style.display = "inline-block";
    countEl.textContent = S.streak;
  } else {
    badge.style.display = "none";
  }
}
function calcStreak() {
  // Count consecutive productive days ending at today
  var streak = 0;
  var idx = Math.min(TODAY_DAY - 1, S.month.length - 1);
  for (var i = idx; i >= 0; i--) {
    if (S.month[i]) streak++;
    else break;
  }
  S.streak = streak;
}

// ── PENDING BANNER ──
function renderPending() {
  var items = [];
  DAILIES.forEach(function(d, i) { if (!S.dailies[i]) items.push(d); });
  S.sem.forEach(function(t, i) { if (!S.semD[i]) items.push(t); });
  S.exercises.forEach(function(e) { if (!e.done) items.push(e.n); });
  var banner = document.getElementById("pending-banner");
  var list = document.getElementById("pending-list");
  var count = document.getElementById("pending-count");
  if (items.length === 0) {
    banner.style.display = "none";
    return;
  }
  banner.style.display = "block";
  count.textContent = items.length + " left";
  var h = "";
  var show = items.slice(0, 8);
  show.forEach(function(t) {
    h += '<div class="pending-pill">' + t + '</div>';
  });
  if (items.length > 8) h += '<div class="pending-pill">+' + (items.length - 8) + ' more</div>';
  list.innerHTML = h;
}

// ── SCRATCHPAD ──
function initScratchpad() {
  var el = document.getElementById("scratchpad");
  el.value = S.scratchpad || "";
  el.addEventListener("input", function() {
    S.scratchpad = el.value;
    debouncedSave();
  });
}

// ── END-OF-DAY REVIEW ──
function renderReview(pct) {
  var inner = document.getElementById("review-inner");
  var msg = document.getElementById("review-lock-msg");
  var textarea = document.getElementById("review-text");
  if (pct >= 100) {
    inner.className = "tasks-inner review-unlocked";
    msg.textContent = "\u2705 Unlocked! Write your review.";
    textarea.disabled = false;
  } else {
    inner.className = "tasks-inner review-locked";
    msg.textContent = "Complete 100% dailies to unlock (" + pct + "%)";
    textarea.disabled = true;
  }
  textarea.value = S.review || "";
}
function initReview() {
  var el = document.getElementById("review-text");
  el.addEventListener("input", function() {
    S.review = el.value;
    debouncedSave();
  });
}

// ── BACKUP EXPORT / IMPORT ──
function exportBackup() {
  var data = JSON.stringify(S, null, 2);
  var blob = new Blob([data], {type: "application/json"});
  var url = URL.createObjectURL(blob);
  var a = document.createElement("a");
  a.href = url;
  a.download = "rudranil-backup-" + TODAY_KEY + ".json";
  a.click();
  URL.revokeObjectURL(url);
  var st = document.getElementById("sync-st");
  st.textContent = "Exported!";
  st.style.color = "#6366f1";
  setTimeout(function() { st.textContent = ""; }, 2000);
}
function importBackup(event) {
  var file = event.target.files[0];
  if (!file) return;
  var reader = new FileReader();
  reader.onload = function(e) {
    try {
      var loaded = JSON.parse(e.target.result);
      if (!loaded.dailies) throw new Error("Invalid backup");
      for (var key in loaded) { S[key] = loaded[key]; }
      renderAll();
      saveState();
      var st = document.getElementById("sync-st");
      st.textContent = "Imported!";
      st.style.color = "#2ecc40";
      setTimeout(function() { st.textContent = ""; }, 2000);
    } catch(err) {
      var st = document.getElementById("sync-st");
      st.textContent = "Invalid file";
      st.style.color = "#ff4757";
    }
  };
  reader.readAsText(file);
  event.target.value = "";
}

function pushToAndroid() {
  try {
    var dailiesDone = countDailies();
    var dailiesTotal = DAILIES.length;
    var semLeft = S.semD.filter(function(d) { return !d; }).length;
    var exLeft = S.exercises.filter(function(e) { return !e.done; }).length;
    var affLeft = S.affD.filter(function(d) { return !d; }).length;
    var tasksLeft = semLeft + exLeft + affLeft + (dailiesTotal - dailiesDone);
    var data = { fsPercent: S.fsVid, pyPercent: S.pyVid, dailiesDone: dailiesDone, dailiesTotal: dailiesTotal, tasksLeft: tasksLeft };
    if (typeof AndroidBridge !== "undefined" && AndroidBridge.updateMetrics) {
      AndroidBridge.updateMetrics(JSON.stringify(data));
    }
  } catch(e) {}
}

function saveState() {
  var st = document.getElementById("sync-st");
  S.savedKey = TODAY_KEY;
  S.savedMonth = CURRENT_MONTH;
  try {
    localStorage.setItem("rudranil-v7", JSON.stringify(S));
    st.textContent = "Synced";
    st.style.color = "#2ecc40";
    setTimeout(function() { st.textContent = ""; }, 2000);
  } catch(e) {
    st.textContent = "Error";
    st.style.color = "#ff4757";
  }
}

function renderAll() {
  renderDailies(); renderSem3(); renderSem1(); renderSem4(); renderEx(); renderAff(); renderMonth();
  renderPPLIndicator();
  calcStreak(); updStats();
  document.getElementById("scratchpad").value = S.scratchpad || "";
  document.getElementById("review-text").value = S.review || "";
}

// === PPL Workout Day Indicator ===
function renderPPLIndicator() {
  var el = document.getElementById("ppl-day-label");
  if (el) el.textContent = "Today: " + getTodayPPL() + " Day + Abs";
}

// === MINI GEMINI AI ===
let aiHistory = [];

function initAI() {
  var keySetup = document.getElementById("ai-key-setup");
  var chatArea = document.getElementById("ai-chat-area");
  if (!keySetup || !chatArea) return;
  if (S.geminiKey) {
    keySetup.style.display = "none";
    chatArea.style.display = "flex";
    updateAIStatus();
  } else {
    keySetup.style.display = "flex";
    chatArea.style.display = "none";
  }
}

function updateAIStatus() {
  var dot = document.getElementById("ai-dot");
  var text = document.getElementById("ai-status-text");
  if (!dot || !text) return;
  if (!navigator.onLine) {
    dot.className = "ai-status-dot";
    text.textContent = "offline";
  } else {
    dot.className = "ai-status-dot online";
    text.textContent = "online";
  }
}
window.addEventListener('online', updateAIStatus);
window.addEventListener('offline', updateAIStatus);

function saveAIKey() {
  var val = document.getElementById("ai-key-input").value.trim();
  if (val) {
    console.log("Connecting AI with key...");
    S.geminiKey = val;
    saveState();
    initAI();
  } else {
    alert("Please paste your Gemini API key first!");
  }
}

function renderAIMessage(role, text) {
  var msgs = document.getElementById("ai-messages");
  var div = document.createElement("div");
  div.className = "ai-msg " + (role === "user" ? "ai-msg-user" : "ai-msg-ai");
  div.textContent = text;
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
}

async function sendAI() {
  var inp = document.getElementById("ai-input");
  var msg = inp.value.trim();
  if (!msg || !S.geminiKey) return;
  
  inp.value = "";
  renderAIMessage("user", msg);
  
  var dot = document.getElementById("ai-dot");
  var text = document.getElementById("ai-status-text");
  dot.className = "ai-status-dot typing";
  text.textContent = "thinking...";
  
  aiHistory.push({role: "user", parts: [{text: msg}]});
  
  try {
    var reqBody = {
      contents: aiHistory,
      systemInstruction: {
        parts: [{text: "You are Rudranil's workout AI assistant. You help plan his workouts. To add an exercise to his list, output a JSON array of actions wrapped in ```json block like this: ```json [{\"action\":\"add\", \"name\":\"Squats\", \"sets\":\"3x10\"}, {\"action\":\"delete\", \"name\":\"Push-ups\"}] ```. Only use this JSON if you are modifying his workout. Keep your regular text replies very short and concise (under 2 sentences)."}]
      }
    };
    
    var res = await fetch("https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=" + S.geminiKey, {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(reqBody)
    });
    
    if (!res.ok) throw new Error("API Error");
    var data = await res.json();
    var replyText = data.candidates[0].content.parts[0].text;
    
    // Parse actions
    var jsonMatch = replyText.match(/```json\s*([\s\S]*?)\s*```/);
    if (jsonMatch) {
      try {
        var actions = JSON.parse(jsonMatch[1]);
        var changed = false;
        actions.forEach(function(a) {
          if (a.action === "add") {
            S.exercises.push({n: a.name, s: a.sets || "—", done: false});
            changed = true;
          } else if (a.action === "delete") {
            var idx = S.exercises.findIndex(function(e) { return e.n.toLowerCase() === a.name.toLowerCase(); });
            if (idx > -1) { S.exercises.splice(idx, 1); changed = true; }
          }
        });
        if (changed) { renderEx(); updStats(); saveState(); }
      } catch(e) {}
      replyText = replyText.replace(/```json\s*([\s\S]*?)\s*```/, "").trim();
    }
    
    if (replyText) {
      renderAIMessage("model", replyText);
      aiHistory.push({role: "model", parts: [{text: replyText}]});
    }
  } catch(err) {
    renderAIMessage("model", "Error connecting to AI. Check API key or network.");
    aiHistory.pop(); // Remove user message from history on error
  }
  
  updateAIStatus();
}

function loadState() {
  try {
    var json = localStorage.getItem("rudranil-v7");
    if (json) {
      var loaded = JSON.parse(json);
      if (loaded.savedKey && loaded.savedKey !== TODAY_KEY) {
        // New day: reset only dailies, exercises, and review — NOT sem tasks or affiliates
        loaded.dailies = Array(DAILIES.length).fill(false);
        loaded.review = "";
        if (loaded.exercises) loaded.exercises = loaded.exercises.map(function(e) { return {n:e.n, s:e.s, done:false}; });
      }
      // Handle month rollover
      var savedMonth = loaded.savedMonth;
      if (savedMonth !== undefined && savedMonth !== CURRENT_MONTH) {
        loaded.month = Array(MONTH_DAYS).fill(false);
      }
      if (!loaded.exercises) loaded.exercises = S.exercises;
      if (typeof loaded.streak === 'undefined') loaded.streak = 0;
      if (typeof loaded.scratchpad === 'undefined') loaded.scratchpad = "";
      if (typeof loaded.review === 'undefined') loaded.review = "";
      // Ensure month array matches current month length
      if (!loaded.month || loaded.month.length !== MONTH_DAYS) {
        loaded.month = Array(MONTH_DAYS).fill(false);
      }
      // Ensure sem3/sem1 backlog arrays exist
      if (!loaded.mathSem3) loaded.mathSem3 = Array(MATH_SEM3_ALL.length).fill(false);
      if (!loaded.mathSem1) loaded.mathSem1 = Array(MATH_SEM1_ALL.length).fill(false);
      
      // Ensure dailies array length matches current DAILIES (handles new tasks added)
      if (loaded.dailies && loaded.dailies.length !== DAILIES.length) {
        var newDailies = Array(DAILIES.length).fill(false);
        for(var i=0; i<Math.min(loaded.dailies.length, DAILIES.length); i++) {
          newDailies[i] = loaded.dailies[i];
        }
        loaded.dailies = newDailies;
      }
      
      for (var key in loaded) { S[key] = loaded[key]; }
    }
  } catch(e) {}
  renderAll();
  initScratchpad();
  initReview();
  initAI();
}

loadState();
