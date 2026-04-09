function initPity() {
  // Ambil elemen DOM Pity
  const pityCounterText = document.getElementById("pityCounterText");
  const pityProgressBar = document.getElementById("pityProgressBar");
  const pityStatusLabel = document.getElementById("pityStatusLabel");
  const chestsOpenedText = document.getElementById("chestsOpenedText");
  const hasTentacleCheck = document.getElementById("hasTentacleCheck"); // Elemen Checkbox Baru

  // Tombol Interaksi
  const addNormalBtn = document.getElementById("addNormalBtn");
  const subNormalBtn = document.getElementById("subNormalBtn");
  const addMythicBtn = document.getElementById("addMythicBtn");
  const subMythicBtn = document.getElementById("subMythicBtn");
  const resetAuricBtn = document.getElementById("resetAuricBtn");
  const resetDeadmanBtn = document.getElementById("resetDeadmanBtn");
  const editPityBtn = document.getElementById("editPityBtn");

  // Load state dari LocalStorage
  let currentPity = parseInt(localStorage.getItem("sunkenPity")) || 0;
  let chestsOpened = parseInt(localStorage.getItem("sunkenChestsOpened")) || 0;
  let hasTentacle = localStorage.getItem("sunkenHasTentacle") === "true"; // State Inventory Baru
  const MAX_PITY = 250;

  // Set nilai awal checkbox
  if (hasTentacleCheck) hasTentacleCheck.checked = hasTentacle;

  function updatePityUI() {
    // Validasi ketat
    if (isNaN(currentPity)) currentPity = 0;
    if (currentPity > MAX_PITY) currentPity = MAX_PITY;
    if (currentPity < 0) currentPity = 0;
    if (isNaN(chestsOpened)) chestsOpened = 0;
    if (chestsOpened < 0) chestsOpened = 0;

    // Simpan ke storage
    localStorage.setItem("sunkenPity", currentPity);
    localStorage.setItem("sunkenChestsOpened", chestsOpened);
    localStorage.setItem("sunkenHasTentacle", hasTentacle);

    // Update UI DOM
    pityCounterText.innerText = currentPity;
    if (chestsOpenedText) chestsOpenedText.innerText = chestsOpened;

    const progressPercent = (currentPity / MAX_PITY) * 100;
    pityProgressBar.style.width = `${progressPercent}%`;

    // --- LOGIKA TARGET PITY DINAMIS ---
    let targetItemName = hasTentacle ? "AURIC ROD" : "Deadman's Tentacle";

    // Visual Feedback
    if (currentPity === MAX_PITY) {
      pityStatusLabel.innerText = `GUARANTEED ${targetItemName}!`;
      pityStatusLabel.style.color = "var(--accent-amber)";
      pityCounterText.style.color = "var(--accent-amber)";
      pityProgressBar.style.background = "var(--accent-amber)";
    } else if (currentPity >= 200) {
      pityStatusLabel.innerText = `Sedikit lagi mendapatkan (${targetItemName})`;
      pityStatusLabel.style.color = "var(--accent-rose)";
      pityCounterText.style.color = "var(--accent-rose)";
      pityProgressBar.style.background =
        "linear-gradient(90deg, #f59e0b, #f43f5e)";
    } else {
      pityStatusLabel.innerText = `Target: ${targetItemName}`;
      pityStatusLabel.style.color = "var(--text-main)";
      pityCounterText.style.color = "white";
      pityProgressBar.style.background =
        "linear-gradient(90deg, #3b82f6, #a855f7)";
    }
  }

  // Event Listener Checkbox Inventory
  if (hasTentacleCheck) {
    hasTentacleCheck.addEventListener("change", (e) => {
      hasTentacle = e.target.checked;
      updatePityUI();
    });
  }

  // --- LOGIKA PENAMBAHAN & PENGURANGAN ---
  if (addNormalBtn)
    addNormalBtn.addEventListener("click", () => {
      currentPity += 1;
      chestsOpened += 1;
      updatePityUI();
    });
  if (subNormalBtn)
    subNormalBtn.addEventListener("click", () => {
      currentPity -= 1;
      chestsOpened -= 1;
      updatePityUI();
    });
  if (addMythicBtn)
    addMythicBtn.addEventListener("click", () => {
      currentPity += 10;
      chestsOpened += 1;
      updatePityUI();
    });
  if (subMythicBtn)
    subMythicBtn.addEventListener("click", () => {
      currentPity -= 10;
      chestsOpened -= 1;
      updatePityUI();
    });

  // --- LOGIKA EDIT MANUAL ---
  if (editPityBtn) {
    editPityBtn.addEventListener("click", () => {
      const inputPity = prompt(
        "Masukkan angka PITY kamu saat ini (0 - 250):",
        currentPity,
      );
      if (inputPity !== null && inputPity.trim() !== "") {
        const parsedPity = parseInt(inputPity);
        if (!isNaN(parsedPity)) {
          currentPity = parsedPity;
          const inputChest = prompt(
            "Masukkan jumlah TOTAL CHEST yang sudah dibuka:",
            chestsOpened,
          );
          if (inputChest !== null && inputChest.trim() !== "") {
            const parsedChest = parseInt(inputChest);
            if (!isNaN(parsedChest)) chestsOpened = parsedChest;
          }
          updatePityUI();
        } else {
          alert("Input tidak valid. Harap masukkan angka.");
        }
      }
    });
  }

  // --- LOGIKA RESET ---
  function handlePityReset(itemName) {
    if (
      confirm(
        `Selamat mendapatkan ${itemName}! Reset Pity dan Total Chest kembali ke 0?\n\n(Catatan: Jangan lupa centang kotak Inventory jika kamu mendapatkan Tentacle)`,
      )
    ) {
      currentPity = 0;
      chestsOpened = 0;

      // Auto-centang jika yang didapat adalah Tentacle
      if (
        itemName === "Dead Man's Tentacle" &&
        hasTentacleCheck &&
        !hasTentacle
      ) {
        hasTentacle = true;
        hasTentacleCheck.checked = true;
      }

      updatePityUI();
    }
  }

  if (resetAuricBtn)
    resetAuricBtn.addEventListener("click", () => handlePityReset("Auric Rod"));
  if (resetDeadmanBtn)
    resetDeadmanBtn.addEventListener("click", () =>
      handlePityReset("Dead Man's Tentacle"),
    );

  // Init pertama kali
  updatePityUI();
}
