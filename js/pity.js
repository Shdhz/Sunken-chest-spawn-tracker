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
  let storedPity = parseInt(localStorage.getItem("sunkenPity"), 10);
  let storedChests = parseInt(localStorage.getItem("sunkenChestsOpened"), 10);

  // PERBAIKAN: Pengecekan ketat IsNaN
  let currentPity = isNaN(storedPity) ? 0 : storedPity;
  let chestsOpened = isNaN(storedChests) ? 0 : storedChests;
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
      if (currentPity > 0) currentPity -= 1;
      if (chestsOpened > 0) chestsOpened -= 1;
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
      currentPity = Math.max(0, currentPity - 10);
      if (chestsOpened > 0) chestsOpened -= 1;
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
        let parsedPity = parseInt(inputPity, 10);
        if (!isNaN(parsedPity)) {
          // PERBAIKAN UX: Beri info jika angka melebihi batas
          if (parsedPity > MAX_PITY) {
            alert(
              `Pity tidak bisa lebih dari ${MAX_PITY}. Nilai akan diubah menjadi ${MAX_PITY}.`,
            );
            parsedPity = MAX_PITY;
          } else if (parsedPity < 0) {
            parsedPity = 0;
          }

          currentPity = parsedPity;

          const inputChest = prompt(
            "Masukkan jumlah TOTAL CHEST yang sudah dibuka:",
            chestsOpened,
          );
          if (inputChest !== null && inputChest.trim() !== "") {
            const parsedChest = parseInt(inputChest, 10);
            if (!isNaN(parsedChest) && parsedChest >= 0) {
              chestsOpened = parsedChest;
            }
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
