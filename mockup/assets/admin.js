/* Injects the studio sidebar; mark the active page with <aside data-admin-nav="guests">. */
(function () {
  const icon = (d) => `<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" stroke-width="1.3" aria-hidden="true">${d}</svg>`;
  const items = [
    ["guests", "admin-guests.html", "Overview & guests", icon('<circle cx="7" cy="6" r="3"/><path d="M1.5 16c.6-3 2.8-4.5 5.5-4.5s4.9 1.5 5.5 4.5M12 3.5a2.6 2.6 0 010 5M14 11.6c1.4.6 2.2 1.9 2.5 4.4"/>')],
    ["site", "admin-site.html", "Site & texts", icon('<rect x="2" y="3" width="14" height="12"/><path d="M2 7h14M5 10.5h5"/>')],
    ["programme", "admin-programme.html", "Programme & maps", icon('<path d="M9 16s5-4.6 5-8.5A5 5 0 004 7.5C4 11.4 9 16 9 16z"/><circle cx="9" cy="7.5" r="1.8"/>')],
    ["gallery", "admin-gallery.html", "Gallery", icon('<rect x="2" y="3" width="14" height="12"/><path d="M2 12l4-4 4 4 2-2 4 4"/><circle cx="12" cy="6.5" r="1.2"/>')],
    ["wishes", "admin-wishes.html", "Guest book", icon('<path d="M3 3h12v9H7l-4 3z"/>')],
    ["door", "admin-door.html", "Door check-in", icon('<path d="M2 6V2h4M12 2h4v4M16 12v4h-4M6 16H2v-4M5 9h8"/>')],
  ];
  document.querySelectorAll("[data-admin-nav]").forEach((aside) => {
    const active = aside.dataset.adminNav;
    aside.classList.add("sidebar");
    aside.innerHTML =
      `<a class="brand" href="admin-guests.html">B | G<small>Couple’s studio</small></a>` +
      `<nav aria-label="Studio">${items
        .map(([key, href, label, svg]) => `<a href="${href}"${key === active ? ' aria-current="page"' : ""}>${svg}${label}</a>`)
        .join("")}</nav>` +
      `<div class="foot"><a href="envelope.html" target="_blank" rel="noopener">${icon('<path d="M10 2h6v6M16 2L8 10M13 11v5H2V5h5"/>')}View guest site</a>` +
      `<a href="admin-login.html">${icon('<path d="M7 3H3v12h4M12 5l4 4-4 4M16 9H7"/>')}Sign out</a></div>`;
  });
})();

function toast(msg) {
  const t = document.createElement("div");
  t.className = "toast"; t.setAttribute("role", "status"); t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 2200);
}
