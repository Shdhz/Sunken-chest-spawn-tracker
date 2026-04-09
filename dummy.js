document.addEventListener("DOMContentLoaded", () => {
  // DOM Elements
  const timeInput = document.getElementById("timeInput");
  const calculateBtn = document.getElementById("calculateBtn");
  const addBtn = document.getElementById("addBtn");
  const subBtn = document.getElementById("subBtn");

  const resultSection = document.getElementById("resultSection");
  const errorMsg = document.getElementById("errorMsg");
  const loadingOverlay = document.getElementById("loadingOverlay");

  const countdownEl = document.getElementById("countdown");
  const statusLabel = document.getElementById("statusLabel");
  const progressBar = document.getElementById("progressBar");
  const totalMinutesInfo = document.getElementById("totalMinutesInfo");
  const cyclePositionInfo = document.getElementById("cyclePositionInfo");
  const targetUptimeInfo = document.getElementById("targetUptimeInfo");
  const realWorldTimeInfo = document.getElementById("realWorldTimeInfo");

  const serverNameInput = document.getElementById("serverNameInput");
  const serverLinkInput = document.getElementById("serverLinkInput"); // BARU
  const saveLogBtn = document.getElementById("saveLogBtn");
  const logContainer = document.getElementById("logContainer");
  const logCountEl = document.getElementById("logCount");

  // State Variables
  let globalInterval;
  let currentActiveData = null;
  let activeLogId = null;
  let audioCtx = null;

  // Load LocalStorage & Auto-Hapus format log usang agar tidak nyangkut/stuck
  let savedServers = JSON.parse(localStorage.getItem("sunkenServers")) || [];
  const validServers = savedServers.filter(
    (s) => s.baseTotalMinutes !== undefined,
  );
  if (validServers.length !== savedServers.length) {
    savedServers = validServers;
    localStorage.setItem("sunkenServers", JSON.stringify(savedServers));
  }

  // Bypass Auto-Play Audio Browser
  document.body.addEventListener("click", () => {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume();
    }
  });

  renderLogs();
  startGlobalTimer();

  // Event Listeners
  calculateBtn.addEventListener("click", () => processTime(false));
  timeInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") processTime(false);
  });
  addBtn.addEventListener("click", () => adjustInputTime(1));
  subBtn.addEventListener("click", () => adjustInputTime(-1));
  saveLogBtn.addEventListener("click", saveToLog);

  // Core Logic Functions
  function adjustInputTime(minutesToAdd) {
    let total = parseInputToMinutes(timeInput.value);
    if (total === 0 && !/\d/.test(timeInput.value)) return;

    total += minutesToAdd;
    if (total < 0) total = 0;

    const d = Math.floor(total / (24 * 60));
    const h = Math.floor((total % (24 * 60)) / 60);
    const m = total % 60;

    let newStr = "";
    if (d > 0) newStr += `${d}d `;
    if (h > 0 || d > 0) newStr += `${h}h `;
    newStr += `${m}m`;

    timeInput.value = newStr.trim();
    processTime(true);
  }

  function parseInputToMinutes(inputStr) {
    inputStr = inputStr.toLowerCase().trim();
    const daysMatch = inputStr.match(/(\d+)\s*d/);
    const hoursMatch = inputStr.match(/(\d+)\s*h/);
    const minutesMatch = inputStr.match(/(\d+)\s*m/);

    const d = daysMatch ? parseInt(daysMatch[1]) : 0;
    const h = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const m = minutesMatch ? parseInt(minutesMatch[1]) : 0;
    return d * 24 * 60 + h * 60 + m;
  }

  function processTime(skipLoading) {
    const input = timeInput.value.toLowerCase().trim();
    errorMsg.style.display = "none";

    if (!skipLoading) activeLogId = null;

    const daysMatch = input.match(/(\d+)\s*d/);
    const hoursMatch = input.match(/(\d+)\s*h/);
    const minutesMatch = input.match(/(\d+)\s*m/);

    const parsedDays = daysMatch ? parseInt(daysMatch[1]) : 0;
    const parsedHours = hoursMatch ? parseInt(hoursMatch[1]) : 0;
    const parsedMinutes = minutesMatch ? parseInt(minutesMatch[1]) : 0;

    if (
      parsedDays === 0 &&
      parsedHours === 0 &&
      parsedMinutes === 0 &&
      !/\d/.test(input)
    ) {
      errorMsg.innerText = "Format waktu tidak dikenali. Cth: 1d 7h 45m";
      errorMsg.style.display = "block";
      resultSection.style.display = "none";
      return;
    }

    if (parsedHours >= 24 || parsedMinutes >= 60) {
      errorMsg.innerText =
        "Format salah: Jam maksimal 23 dan Menit maksimal 59.";
      errorMsg.style.display = "block";
      resultSection.style.display = "none";
      return;
    }

    const totalMinutes = parseInputToMinutes(input);

    if (skipLoading) {
      calculateLogic(totalMinutes);
    } else {
      resultSection.style.display = "none";
      loadingOverlay.style.display = "block";
      calculateBtn.disabled = true;

      setTimeout(() => {
        loadingOverlay.style.display = "none";
        calculateBtn.disabled = false;
        calculateLogic(totalMinutes);
      }, 600);
    }
  }

  function calculateLogic(totalMinutes) {
    const CYCLE_LENGTH = 70;
    const SPAWN_TARGET = 60;
    const currentCyclePosition = totalMinutes % CYCLE_LENGTH;

    let remainingMinutes;
    if (currentCyclePosition < SPAWN_TARGET) {
      remainingMinutes = SPAWN_TARGET - currentCyclePosition;
    } else {
      remainingMinutes = CYCLE_LENGTH - currentCyclePosition + SPAWN_TARGET;
    }

    const targetTotalMinutes = totalMinutes + remainingMinutes;
    const targetDays = Math.floor(targetTotalMinutes / (24 * 60));
    const targetHours = Math.floor((targetTotalMinutes % (24 * 60)) / 60);
    const targetMins = targetTotalMinutes % 60;

    let targetUptimeText = "";
    if (targetDays > 0) targetUptimeText += `${targetDays}d `;
    if (targetHours > 0 || targetDays > 0)
      targetUptimeText += `${targetHours}h `;
    targetUptimeText += `${targetMins}m`;

    const targetTimestamp = Date.now() + remainingMinutes * 60 * 1000;
    const targetDate = new Date(targetTimestamp);
    const realWorldTimeText = `${String(targetDate.getHours()).padStart(2, "0")}:${String(targetDate.getMinutes()).padStart(2, "0")}`;

    currentActiveData = {
      baseTotalMinutes: totalMinutes,
      calculationTimestamp: Date.now(),
      uptimeText: targetUptimeText.trim(),
      realWorldTime: realWorldTimeText,
    };

    resultSection.style.display = "block";
    targetUptimeInfo.innerText = targetUptimeText.trim();
    realWorldTimeInfo.innerText = realWorldTimeText;

    updateMainTimerUI();

    if (activeLogId) {
      const logIndex = savedServers.findIndex((s) => s.id === activeLogId);
      if (logIndex !== -1) {
        savedServers[logIndex].baseTotalMinutes =
          currentActiveData.baseTotalMinutes;
        savedServers[logIndex].calculationTimestamp =
          currentActiveData.calculationTimestamp;
        savedServers[logIndex].uptimeText = currentActiveData.uptimeText;
        savedServers[logIndex].realWorldTime = currentActiveData.realWorldTime;
        localStorage.setItem("sunkenServers", JSON.stringify(savedServers));
        renderLogs();
      }
    }
  }

  // Log Management
  // Log Management
  function saveToLog() {
    if (!currentActiveData) return;
    const serverName =
      serverNameInput.value.trim() || `Server ${savedServers.length + 1}`;
    const serverLink = serverLinkInput.value.trim();

    // --- UPDATE FITUR VALIDASI: Pengecualian Untuk RoPro ---
    if (serverLink) {
      const isHttp = serverLink.startsWith("http");
      const isRoPro = serverLink.includes("ropro.io");
      const isFullJobId = serverLink.length >= 30;

      // Jika BUKAN link web, BUKAN link RoPro, DAN kurang dari 30 karakter (Short ID salah)
      if (!isHttp && !isRoPro && !isFullJobId) {
        alert(
          "⚠️ PERINGATAN FORMAT ID!\n\n" +
            "Input terlalu pendek. Gunakan Full Job ID, Full Link, atau Link Invite RoPro (ropro.io/...).",
        );
        return;
      }
    }
    // --------------------------------------------------------

    const newLog = {
      id: Date.now(),
      name: serverName,
      baseTotalMinutes: currentActiveData.baseTotalMinutes,
      calculationTimestamp: currentActiveData.calculationTimestamp,
      uptimeText: currentActiveData.uptimeText,
      realWorldTime: currentActiveData.realWorldTime,
      link: serverLink,
      alertSpawnPlayed: false,
    };

    savedServers.push(newLog);
    activeLogId = newLog.id;
    localStorage.setItem("sunkenServers", JSON.stringify(savedServers));

    serverNameInput.value = "";
    serverLinkInput.value = "";
    renderLogs();
  }

  window.deleteLog = function (id) {
    savedServers = savedServers.filter((server) => server.id !== id);
    if (activeLogId === id) activeLogId = null;
    localStorage.setItem("sunkenServers", JSON.stringify(savedServers));
    renderLogs();
  };

  function renderLogs() {
    const logContainer = document.getElementById("logContainer");
    const soonContainer = document.getElementById("soonContainer");
    const soonSection = document.getElementById("soonSection");
    const now = Date.now();

    logContainer.innerHTML = "";
    soonContainer.innerHTML = "";

    if (logCountEl) logCountEl.innerText = savedServers.length;

    if (savedServers.length === 0) {
      logContainer.innerHTML =
        '<p style="color:#888; font-size:13px;">Belum ada server.</p>';
      soonSection.style.display = "none";
      return;
    }

    // 1. Hitung & Sortir semua server
    const processedServers = savedServers
      .map((server) => {
        const elapsedMs = now - server.calculationTimestamp;
        const currentTotalMinutes =
          server.baseTotalMinutes + elapsedMs / (1000 * 60);
        const pos = currentTotalMinutes % 70;

        let timeDiff;
        let isSpawning = false;

        if (pos >= 60) {
          timeDiff = 70 - pos;
          isSpawning = true;
        } else {
          timeDiff = 60 - pos;
        }

        return {
          ...server,
          timeDiff,
          isSpawning,
          weight: isSpawning ? pos - 70 : 60 - pos,
        };
      })
      .sort((a, b) => a.weight - b.weight);

    // 2. Pisahkan berdasarkan kondisi < 10 menit (dan belum masuk fase reset 70m)
    const soonList = processedServers.filter((s) => s.timeDiff <= 10);
    const othersList = processedServers.filter((s) => s.timeDiff > 10);

    // Tampilkan/Sembunyikan header "Soon"
    soonSection.style.display = soonList.length > 0 ? "block" : "none";

    // 3. Render Fungsi Helper untuk Card
    const createCard = (server) => {
      let joinHtml = "";
      if (server.link) {
        let finalUrl =
          server.link.includes("ropro.io") && !server.link.startsWith("http")
            ? "https://" + server.link
            : server.link;
        if (!finalUrl.startsWith("http")) {
          finalUrl = `https://www.roblox.com/games/start?placeId=16732694052&gameId=${finalUrl}`;
        }
        joinHtml = `<button class="btn-join" onclick="window.open('${finalUrl}', '_blank')">JOIN</button>`;
      }

      const isSoonClass = server.timeDiff <= 10 ? "soon-highlight" : "";
      const activeClass = server.id === activeLogId ? "active-sync" : "";

      const card = document.createElement("div");
      card.className = `log-card ${activeClass} ${isSoonClass}`;
      card.innerHTML = `
      <div class="log-info">
          <h5>${server.name}</h5>
          <p>${server.realWorldTime} | ${server.uptimeText}</p>
      </div>
      <div class="log-actions">
          <div class="log-timer log-timer-val" id="log-timer-${server.id}">--:--</div>
          ${joinHtml} <button class="delete-btn" onclick="deleteLog(${server.id})">X</button>
      </div>
    `;
      return card;
    };

    // Masukkan ke kontainer masing-masing
    soonList.forEach((s) => soonContainer.appendChild(createCard(s)));
    othersList.forEach((s) => logContainer.appendChild(createCard(s)));
  }
  // Global Ticker
  function startGlobalTimer() {
    globalInterval = setInterval(() => {
      updateMainTimerUI();
      updateLogTimers();
    }, 1000);

    // Auto re-sort daftar UI setiap 15 detik
    setInterval(() => {
      if (savedServers.length > 1) {
        renderLogs();
      }
    }, 15000);
  }

  function updateMainTimerUI() {
    if (!currentActiveData || resultSection.style.display === "none") return;

    const elapsedMs = Date.now() - currentActiveData.calculationTimestamp;
    const currentTotalMinutes =
      currentActiveData.baseTotalMinutes + elapsedMs / (1000 * 60);
    const currentCyclePos = currentTotalMinutes % 70;

    if (totalMinutesInfo)
      totalMinutesInfo.innerText = `${Math.floor(currentTotalMinutes)} Menit`;
    if (cyclePositionInfo)
      cyclePositionInfo.innerText = `${Math.floor(currentCyclePos)} / 70m`;

    const progressPercent = (currentCyclePos / 70) * 100;
    progressBar.style.width = `${progressPercent}%`;

    let timeDiffMinutes = 0;
    let isSpawningPhase = false;

    if (currentCyclePos < 60) {
      timeDiffMinutes = 60 - currentCyclePos;
      isSpawningPhase = false;
    } else {
      timeDiffMinutes = 70 - currentCyclePos;
      isSpawningPhase = true;
    }

    const totalSecondsLeft = Math.floor(timeDiffMinutes * 60);
    const minutesLeft = Math.floor(totalSecondsLeft / 60);
    const secondsLeft = totalSecondsLeft % 60;

    countdownEl.innerText = `${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;

    if (isSpawningPhase) {
      countdownEl.style.color = "var(--accent-amber)";
      statusLabel.innerText = "CHEST MUNCUL SEKARANG! (MENUJU RESET)";
      progressBar.style.backgroundColor = "var(--accent-amber)";
      countdownEl.style.textShadow = "0 0 20px rgba(245, 158, 11, 0.6)";
    } else {
      countdownEl.style.color = "var(--accent-emerald)";
      statusLabel.innerText = "MENIT : DETIK MENUJU SPAWN";
      progressBar.style.backgroundColor =
        minutesLeft <= 10 ? "var(--accent-emerald)" : "var(--accent-cyan)";
      countdownEl.style.textShadow =
        minutesLeft <= 10
          ? "0 0 20px rgba(16, 185, 129, 0.6)"
          : "0 0 20px rgba(0, 210, 255, 0.6)";
    }
  }

  function updateLogTimers() {
    let logUpdated = false;
    const now = Date.now();

    savedServers.forEach((server) => {
      const timerEl = document.getElementById(`log-timer-${server.id}`);
      if (!timerEl) return;

      if (server.baseTotalMinutes === undefined) {
        timerEl.innerText = "Err";
        return;
      }

      const elapsedMs = now - server.calculationTimestamp;
      const currentTotalMinutes =
        server.baseTotalMinutes + elapsedMs / (1000 * 60);
      const currentCyclePos = currentTotalMinutes % 70;

      let timeDiffMinutes;
      let isSpawningPhase;

      if (currentCyclePos >= 60) {
        timeDiffMinutes = 70 - currentCyclePos;
        isSpawningPhase = true;
      } else {
        timeDiffMinutes = 60 - currentCyclePos;
        isSpawningPhase = false;
      }

      const totalSecondsLeft = Math.floor(timeDiffMinutes * 60);
      const minutesLeft = Math.floor(totalSecondsLeft / 60);
      const secondsLeft = totalSecondsLeft % 60;

      timerEl.innerText = `${String(minutesLeft).padStart(2, "0")}:${String(secondsLeft).padStart(2, "0")}`;

      if (isSpawningPhase) {
        timerEl.classList.add("spawning");
        timerEl.parentElement.parentElement.classList.add("spawning");

        if (!server.alertSpawnPlayed) {
          playAudioAlert();
          server.alertSpawnPlayed = true;
          logUpdated = true;
        }
      } else {
        timerEl.classList.remove("spawning");
        timerEl.parentElement.parentElement.classList.remove("spawning");

        if (server.alertSpawnPlayed) {
          server.alertSpawnPlayed = false;
          logUpdated = true;
        }
      }
    });

    if (logUpdated)
      localStorage.setItem("sunkenServers", JSON.stringify(savedServers));
  }

  function playAudioAlert() {
    try {
      const audio = new Audio("alarm.mp3");

      let playCount = 1;
      const maxPlays = 2;

      // Event listener ini akan mendeteksi ketika lagu selesai/berakhir
      audio.addEventListener("ended", () => {
        if (playCount < maxPlays) {
          playCount++;
          audio.currentTime = 0;
          audio.play(); // Putar ulang
        }
      });

      // Mulai putar audio
      audio.play().catch((error) => {
        console.log(
          "Browser memblokir pemutaran audio. Pastikan Anda sudah mengklik area website.",
          error,
        );
      });
    } catch (e) {
      console.log(
        "Gagal memutar alarm.mp3. Pastikan nama file sudah benar.",
        e,
      );
    }
  }
});
