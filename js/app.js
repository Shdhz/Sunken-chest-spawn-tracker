document.addEventListener("DOMContentLoaded", async () => {
  // 1. Fungsi untuk menarik (fetch) file HTML
  async function loadHTML(elementId, filePath) {
    try {
      const response = await fetch(filePath);
      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);
      const htmlText = await response.text();
      document.getElementById(elementId).innerHTML = htmlText;
    } catch (error) {
      console.error(`Gagal memuat ${filePath}:`, error);
      document.getElementById(elementId).innerHTML =
        `<p style="color: red; text-align: center;">Gagal memuat komponen antarmuka.</p>`;
    }
  }

  // 2. Load semua komponen HTML secara bersamaan
  await Promise.all([
    loadHTML("tracker-view", "views/tracker.html"),
    loadHTML("pity-view", "views/pity.html"),
  ]);

  // 3. Setelah HTML masuk ke layar, panggil fungsi inisialisasi dari tracker.js & pity.js
  if (typeof initTracker === "function") initTracker();
  if (typeof initPity === "function") initPity();

  // 4. Logika Navigasi Tab (Tetap seperti aslinya)
  const navBtns = document.querySelectorAll(".nav-btn");
  const viewSections = document.querySelectorAll(".view-section");

  navBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      navBtns.forEach((b) => b.classList.remove("active"));
      viewSections.forEach((s) => {
        s.classList.remove("active");
        s.style.display = "none";
      });

      btn.classList.add("active");

      const targetId = btn.getAttribute("data-target");
      const targetSection = document.getElementById(targetId);
      targetSection.classList.add("active");
      targetSection.style.display = "block";
    });
  });
});
