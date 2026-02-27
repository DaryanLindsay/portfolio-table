const companyGrid = document.getElementById("companyGrid");
const macroGrid = document.getElementById("macroGrid");

const safeArray = (value) => (Array.isArray(value) ? value : []);

const renderThemes = (themes) => {
  macroGrid.innerHTML = "";
  if (!themes.length) {
    macroGrid.innerHTML =
      "<div class='theme-card'><h3>No macro themes yet</h3><p class='muted'>Run the extractor to populate themes.</p></div>";
    return;
  }

  themes.forEach((theme) => {
    const card = document.createElement("div");
    card.className = "theme-card";
    const evidence = safeArray(theme.evidence_snippets);
    card.innerHTML = `
      <details>
        <summary>
          <span>${theme.title || "Untitled theme"}</span>
          <span class="summary-plus">+</span>
        </summary>
        <p class="muted">${theme.summary || ""}</p>
        <div class="evidence">
          ${evidence
            .map(
              (e) => `
                <div class="evidence-item">
                  <p>${e.snippet || ""}</p>
                  <span class="muted">${e.source_pdf || ""}</span>
                </div>
              `
            )
            .join("")}
        </div>
      </details>
    `;
    macroGrid.appendChild(card);
  });

  const detailNodes = macroGrid.querySelectorAll("details");
  detailNodes.forEach((node) => {
    const summary = node.querySelector("summary");
    if (!summary) return;
    summary.addEventListener("click", (event) => {
      event.preventDefault();
      node.open = !node.open;
    });
  });
};

const recommendationClass = (text) => {
  const value = (text || "").toLowerCase();
  if (value.includes("buy")) return "rec rec-buy";
  if (value.includes("sell")) return "rec rec-sell";
  if (value.includes("hold")) return "rec rec-hold";
  return "rec";
};

const renderCompanies = (companies) => {
  companyGrid.innerHTML = "";
  if (!companies.length) {
    companyGrid.innerHTML =
      "<div class='company-card'><h3>No active companies</h3><p class='muted'>Run the extractor on the most recent issue.</p></div>";
    return;
  }

  const table = document.createElement("table");
  table.className = "portfolio-table";
  table.innerHTML = `
    <thead>
      <tr>
        <th></th>
        <th>Name</th>
        <th>Ticker (CAD/USD) </th>
        <th>Recommendation</th>
      </tr>
    </thead>
    <tbody></tbody>
  `;
  const tbody = table.querySelector("tbody");

  companies.forEach((company) => {
    const row = document.createElement("tr");
    row.className = "portfolio-row";
    row.innerHTML = `
      <td class="toggle-cell"><span class="row-toggle">+</span></td>
      <td>${company.company_name || "Unknown"}</td>
      <td>${company.ticker_raw || company.ticker || "—"}</td>
      <td><span class="${recommendationClass(company.recommendation)}">${company.recommendation || "—"}</span></td>
    `;

    const detailsRow = document.createElement("tr");
    detailsRow.className = "portfolio-details";
    const updateText = company.latest_update || "No update in last 3 issues.";
    const updateBullets = updateText.includes(" • ")
      ? updateText.split(" • ").map((b) => b.trim()).filter(Boolean)
      : [updateText];
    detailsRow.innerHTML = `
      <td colspan="4">
        <div class="detail-box">
          <div class="update-label">Updates</div>
          <ul class="detail-list">
            ${updateBullets.map((b) => `<li>${b}</li>`).join("")}
          </ul>
        </div>
      </td>
    `;

    row.addEventListener("click", () => {
      detailsRow.classList.toggle("is-open");
      const toggle = row.querySelector(".row-toggle");
      if (toggle) toggle.textContent = detailsRow.classList.contains("is-open") ? "−" : "+";
    });

    tbody.appendChild(row);
    tbody.appendChild(detailsRow);
  });

  companyGrid.appendChild(table);
};

const fetchFirstOk = async (paths) => {
  let lastErr = null;
  for (const path of paths) {
    try {
      const res = await fetch(path);
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status} for ${path}`);
        continue;
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
    }
  }
  throw lastErr || new Error("Failed to load JSON");
};

const loadData = async () => {
  try {
    const [companyJson, themeJson] = await Promise.all([
      fetchFirstOk([
        "/build/active_company_cards.json",
        "../build/active_company_cards.json",
      ]),
      fetchFirstOk(["/build/macro_themes.json", "../build/macro_themes.json"]),
    ]);

    renderThemes(companyJson?.note ? themeJson.macro_themes || [] : themeJson.macro_themes || []);
    renderCompanies(companyJson.companies || []);
  } catch (err) {
    companyGrid.innerHTML =
      "<div class='company-card'><h3>Data load error</h3><p class='muted'>Ensure Live Server is running from the project root. Try opening /build/active_company_cards.json in the browser.</p></div>";
    macroGrid.innerHTML = "";
  }
};

loadData();
