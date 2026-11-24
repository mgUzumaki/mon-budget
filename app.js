// ==========================================
// APP.JS — Logique unifiée pour Mon Budget
// ==========================================

(() => {
  const $ = id => document.getElementById(id);
  let transactions = [], categories = [], budgets = [], toastTimer;
  let selectedTransactionIds = new Set();
  let currentRange = 'month'; 
  let currentChartMode = 'bars';
  let referenceDate = new Date(); 
  let dailyChartInstance = null;
  let doughnutChartInstance = null;

  let currentLang = window.BudgetI18n.language;
 let currentCurrency = 'EUR';

const { t: translate } = window.BudgetI18n;

function applyTranslations() {
    window.BudgetI18n.apply();
    if ($("app-currency")) $("app-currency").value = currentCurrency;
    if ($("app-lang")) $("app-lang").value = currentLang;
    if ($("auth-lang-select")) $("auth-lang-select").value = currentLang;
    if ($("btn-auth-submit")) {
      $("btn-auth-submit").textContent = $("auth-form").dataset.mode === "signup"
        ? translate("create_my_account")
        : translate("sign_in");
    }
    const dashboardStatus = $("dashboard-load-status");
    if (dashboardStatus) {
      dashboardStatus.textContent = $("page-dashboard").dataset.loadState === "error"
        ? translate("could_not_load_your_data_refresh_the_page_to_try_again")
        : translate("loading_your_data");
    }
  }

  const today = Finance.localDate();
  const categoryName = id => categories.find(c => c.id === id)?.name || translate("category");
  const categoryLabel = category => window.BudgetI18n.categoryLabel(category, BudgetDB.defaults);
  const displayCategoryName = id => categoryLabel(categories.find(category => category.id === id));
  const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  
  function customMoney(cents, currency = currentCurrency) {
    const formatted = (cents / 100).toLocaleString(window.BudgetI18n.locale, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return `${formatted} ${currency}`;
  }

  function toast(message) {
    const el = $("toast");
    if (!el) return;
    el.textContent = message;
    el.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove("show"), 2600);
  }

  function showDialog(id) { $(id)?.showModal(); }
  function closeDialog(id) { $(id)?.close(); }

document.querySelectorAll("[data-close]").forEach(btn => {
    btn.addEventListener("click", () => {
      const modalId = btn.getAttribute("data-close");
      closeDialog(modalId);
    });
  });

  // --- GESTION DE L'AFFICHAGE (Landing Page vs Tableau de bord) ---
function showLogin() {
  const params = new URLSearchParams(window.location.search);
  const showAuth = params.get("connexion") === "1" ||
    params.get("reset-password") === "1";

  $("landing-welcome").hidden = showAuth;
  $("landing-auth").hidden = !showAuth;
  $("landing-page").hidden = false;
  $("app").hidden = true;
}

async function showApp() {
  const landingPage = $("landing-page");
  const appDiv = $("app");
  const dashboard = $("page-dashboard");
  const status = $("dashboard-load-status");

  dashboard.dataset.loadState = "loading";
  status.textContent = translate("loading_your_data");

  if (landingPage) landingPage.hidden = true;
  if (appDiv) appDiv.hidden = false;

  try {
    currentCurrency = await BudgetDB.getMainCurrency();

    if ($("app-currency")) {
      $("app-currency").value = currentCurrency;
    }
await loadDashboardFolders();
    if (!(await refresh())) {
      throw new Error("Le chargement des données a échoué.");
    }
    
    dashboard.dataset.loadState = "ready";
    const savedPage = sessionStorage.getItem("monbudget-active-page");
if (savedPage && savedPage !== "dashboard") {
  const savedTab = Array.from(document.querySelectorAll(".nav-link"))
    .find(link => link.dataset.page === savedPage);

  savedTab?.click();
}
  } catch (error) {
    dashboard.dataset.loadState = "error";
    status.textContent =
      translate("could_not_load_your_data_refresh_the_page_to_try_again");
    console.error("Erreur de chargement du tableau de bord :", error);
  }
}

  $("btn-cancel-auth")?.addEventListener("click", () => {
    $("auth-form")?.reset();
    const errEl = $("auth-error");
    if (errEl) errEl.textContent = "";
  });

  const sidebar = $("sidebar");
  const sidebarToggle = $("sidebar-toggle");
  const sidebarBackdrop = $("sidebar-backdrop");

  function toggleSidebar() {
    sidebar?.classList.toggle("is-open");
    sidebarBackdrop?.classList.toggle("is-visible");
    document.body.classList.toggle("sidebar-open");
    const isOpen = sidebar?.classList.contains("is-open");
    sidebarToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  sidebarToggle?.addEventListener("click", toggleSidebar);
  sidebarBackdrop?.addEventListener("click", toggleSidebar);
$("sidebar-close")?.addEventListener("click", () => {
  if (sidebar?.classList.contains("is-open")) {
    toggleSidebar();
    sidebarToggle?.focus();
  }
});
document.querySelectorAll(".nav-link").forEach(btn => {
  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const page = btn.dataset.page;
    sessionStorage.setItem("monbudget-active-page", page);
    document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + page));
    document.querySelectorAll(".nav-link").forEach(b => {
      b.classList.toggle("active", b === btn);
      b.setAttribute("aria-current", b === btn ? "page" : "false");
    });
const titles = { dashboard: translate('nav_dashboard'), transactions: translate('nav_transactions'), budgets: translate('nav_budgets'), statistics: translate('nav_stats'), financing: translate("simulator"), settings: translate('nav_settings') };      const pageTitle = $("page-title");
if (pageTitle) {
  pageTitle.textContent = titles[page] || titles.dashboard;
}
      if (sidebar?.classList.contains("is-open")) toggleSidebar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });
function categoryIcon(name) {
  const text = String(name)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

  const icons = [
    [/abonnement|streaming|netflix|spotify/, "📺"],
    [/aliment|course|boisson|supermarche/, "🛒"],
    [/restaurant|resto|cafe/, "🍽️"],
    [/transport|voiture|carburant|essence|train/, "🚗"],
    [/logement|loyer|maison|habitation/, "🏠"],
    [/sante|medecin|pharmacie/, "💊"],
    [/loisir|sortie|cinema|jeu/, "🎮"],
    [/sport|fitness/, "🏋️"],
    [/voyage|vacance/, "✈️"],
    [/shopping|vetement|habillement/, "🛍️"],
    [/salaire|revenu|paie/, "💰"],
    [/epargne|placement|investissement/, "🐷"],
    [/cadeau|don/, "🎁"],
    [/facture|electricite|energie|eau/, "💡"],
    [/telephone|internet|mobile/, "📱"],
    [/assurance/, "🛡️"],
    [/impot|taxe/, "🏛️"],
    [/education|formation|ecole/, "📚"]
  ];

  return icons.find(([pattern]) => pattern.test(text))?.[1] || "🏷️";
}
  function fillCategorySelect(selectId, filterFn, includeAllOption = false) {
    const sel = $(selectId);
    if (!sel) return;
    const old = sel.value;
    let html = includeAllOption ? `<option value="">${translate('filter_all_cats')}</option>` : "";
html += categories
  .filter(filterFn)
  .sort((a, b) =>
    categoryLabel(a).localeCompare(categoryLabel(b), window.BudgetI18n.locale, {
      sensitivity: "base",
      numeric: true
    })
  )
  .map(c =>
    `<option value="${escapeHTML(c.id)}">${categoryIcon(c.name)} ${escapeHTML(categoryLabel(c))}</option>`
  )
  .join("");    sel.innerHTML = html;
    if ([...sel.options].some(o => o.value === old)) sel.value = old;
  }

function renderCategoryOptions() {
    const type = $("transaction-type")?.value || "expense";
    // Affiche les catégories du type correspondant, ou toutes si c'est un transfert
        fillCategorySelect("transaction-category", category =>
      categoryMatchesOperation(category, type)
    );
    fillCategorySelect("filter-category", () => true, true);
    document.querySelectorAll("[data-operation]").forEach(button => {
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.operation === $("transaction-type").value)
    );
  });
  }
  function categoryMatchesOperation(category, type) {
  return category.kind === type ||
    type === "transfer" ||
    category.kind === "transfer";
}

window.getTransactionCategoryOptions = type =>
  categories.filter(category => categoryMatchesOperation(category, type))
    .map(category => ({ ...category, name: categoryLabel(category) }));

  $("transaction-type")?.addEventListener("change", renderCategoryOptions);
  document.querySelectorAll("[data-operation]").forEach(button => {
  button.addEventListener("click", () => {
    const select = $("transaction-type");
    select.value = button.dataset.operation;
    select.dispatchEvent(new Event("change", { bubbles: true }));
  });
});

  const transactionDateInput = $("transaction-date");
  transactionDateInput?.addEventListener("click", () => {
    if (typeof transactionDateInput.showPicker === "function") {
      try { transactionDateInput.showPicker(); } catch (e) {}
    }
  });

  $("prev-period")?.addEventListener('click', () => {
    referenceDate.setMonth(referenceDate.getMonth() - 1);
    renderDashboard();
  });

  $("next-period")?.addEventListener('click', () => {
    referenceDate.setMonth(referenceDate.getMonth() + 1);
    renderDashboard();
  });

document.querySelectorAll('.range-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.range-btn').forEach(b => {
      b.classList.remove('active');
      b.removeAttribute('aria-pressed');
    });
    e.target.classList.add('active');
    e.target.setAttribute('aria-pressed', 'true');
    currentRange = e.target.dataset.range;
    renderDashboard();
  });
});

// --- Écouteurs pour les boutons du graphique (Barres + Tendance / Courbe seule) ---
const chartModeButtons = document.querySelectorAll("#chart-view-mode button");
chartModeButtons.forEach(button => {
  button.setAttribute("aria-pressed", String(button.dataset.view === currentChartMode));
  button.addEventListener("click", () => {
    currentChartMode = button.dataset.view;
    chartModeButtons.forEach(option => {
      const active = option === button;
      option.classList.toggle("active", active);
      option.setAttribute("aria-pressed", String(active));
    });

    renderDashboard();
  });
});
  async function refresh() {
    try {
      [transactions, categories, budgets] = await Promise.all([
        BudgetDB.getTransactions(),
        BudgetDB.getCategories(),
        BudgetDB.getBudgets()
      ]);
      transactions.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
      await refreshFolderTotals();
      renderAll();
      return true;
    } catch (err) {
      console.error("Erreur de rafraîchissement :", err);
      return false;
    }
  }

function renderAll() {
    applyTranslations();
    renderCategoryOptions();
    renderDashboard();
    renderTransactions();
    renderBudgets();
    renderStatistics();
  renderFinancings();
    updateUserProfileInfo();

    // ---> AJOUTE UNIQUEMENT CE MORCEAU ICI :
    const customRecentEl = document.getElementById("custom-recent-transactions-list");
    if (customRecentEl) {
      const latest = transactionsInSelectedFolder().slice(0, 4);
      customRecentEl.innerHTML = latest.length ? latest.map(t => {
        const amountFormatted = t.type === "income" ? `+ ${customMoney(t.amountCents)}` : `− ${customMoney(t.amountCents)}`;
        const cls = t.type === "income" ? "positive" : "negative";
        const catName = displayCategoryName(t.categoryId);
        const mainText = t.description ? t.description : catName;

        return `
          <tr>
            <td><input type="checkbox"></td>
            <td>
              <div style="display: flex; align-items: center; gap: 10px;">
                <div class="settings-icon-box ${t.type === 'income' ? 'currency-bg' : 'email-bg'}" style="width: 28px; height: 28px; font-size: 12px; margin:0;">💳</div>
                <strong>${escapeHTML(mainText)}</strong>
              </div>
            </td>
            <td style="color: #64748b; font-size: 0.9rem;">${escapeHTML(new Date(t.date + "T12:00:00").toLocaleDateString(window.BudgetI18n.locale))}</td>
            <td class="amount ${cls}" style="text-align: right;">${escapeHTML(amountFormatted)}</td>
          </tr>
        `;
      }).join("") : `<tr><td colspan="4" style="text-align: center; color: #64748b; padding: 20px;">${translate("no_recent_transactions")}</td></tr>`;
    }
  }
  function transactionsInSelectedFolder() {
  const folderId = $("dashboard-folder")?.value;
  return folderId
    ? transactions.filter(transaction => transaction.folderId === folderId)
    : transactions;
}
let dashboardFolders = [];
let folderTotals = { rows: [], currency: "EUR", state: "loading" };
let folderConversionRun = 0;
const folderRateCache = new Map();

async function refreshFolderTotals() {
  const run = ++folderConversionRun;
  const folderId = $("dashboard-folder").value;
  const globalCurrency = $("global-folder-currency");
  const field = $("global-folder-currency-field");

  if (!globalCurrency.options.length) {
    for (const option of $("app-currency").options) {
      if (option.value) globalCurrency.add(option.cloneNode(true));
    }
    globalCurrency.value = currentCurrency;
  }

  field.hidden = Boolean(folderId);
  const folder = dashboardFolders.find(item => item.id === folderId);
  const currency = folder?.display_currency || globalCurrency.value || currentCurrency;

  folderTotals = { rows: [], currency, state: "loading" };
  renderDashboard();
  renderStatistics();

  try {
    const rows = await Promise.all(
      transactionsInSelectedFolder().map(async transaction => {
        const from = transaction.originalCurrency;
        const amount = transaction.originalAmountCents;

        if (!from || !Number.isSafeInteger(amount)) {
          throw new Error("Montant ou devise d’origine manquant.");
        }

        if (from === currency) return { ...transaction, amountCents: amount };

        const key = [from, currency, transaction.date].join("|");
        if (!folderRateCache.has(key)) {
          folderRateCache.set(key,
            getExchangeRate(from, currency, transaction.date).catch(error => {
              folderRateCache.delete(key);
              throw error;
            })
          );
        }

        const { rate } = await folderRateCache.get(key);
        const amountCents = Math.round(amount * rate);
        if (rate <= 0 || !Number.isSafeInteger(amountCents)) {
          throw new Error("Conversion invalide.");
        }

        return { ...transaction, amountCents };
      })
    );

    if (run !== folderConversionRun) return;
    folderTotals = { rows, currency, state: "ready" };
  } catch (error) {
    if (run !== folderConversionRun) return;
    folderTotals = { rows: [], currency, state: "error" };
    console.error("Conversion des totaux :", error);
  }

  renderDashboard();
  renderStatistics();
}
async function loadDashboardFolders() {
  const select = $("dashboard-folder");
  if (!select) return;

  try {
    const folders = await BudgetDB.getBudgetFolders();
        dashboardFolders = folders;
    const selectedId = select.value;

    const allFoldersOption = new Option(window.BudgetI18n.t("folder_all"), "");
    allFoldersOption.dataset.i18n = "folder_all";
    select.replaceChildren(allFoldersOption);
    for (const folder of folders) {
      select.add(new Option(folder.name, folder.id));
    }

    select.value = folders.some(folder => folder.id === selectedId)
      ? selectedId
      : "";
  } catch (error) {
    console.error("Chargement des dossiers :", error);
    toast("Impossible de charger la liste des dossiers.");
  }
}

$("dashboard-folder")?.addEventListener("change", () => {
  selectedTransactionIds.clear();
  renderAll();
  refreshFolderTotals();
});
  $("global-folder-currency")?.addEventListener("change", refreshFolderTotals);
// Fonction de filtrage par période (Semaine, Mois, Année)
  function getFilteredTransactions(rows = transactionsInSelectedFolder()) {
    return rows.filter(t => {
      const tDate = new Date(t.date);
      if (isNaN(tDate.getTime())) return false;

      if (currentRange === 'week') {
        const startOfWeek = new Date(referenceDate);
        const day = startOfWeek.getDay();
        const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
        startOfWeek.setDate(diff);
        startOfWeek.setHours(0, 0, 0, 0);

        const endOfWeek = new Date(startOfWeek);
        endOfWeek.setDate(endOfWeek.getDate() + 6);
        endOfWeek.setHours(23, 59, 59, 999);

        return tDate >= startOfWeek && tDate <= endOfWeek;
      } else if (currentRange === 'year') {
        return tDate.getFullYear() === referenceDate.getFullYear();
      } else {
        return tDate.getFullYear() === referenceDate.getFullYear() &&
               tDate.getMonth() === referenceDate.getMonth();
      }
    });
  }
function renderDashboard() {
        const ready = folderTotals.state === "ready";
    $("folder-rates-status").textContent = ready
      ? ""
      : translate(folderTotals.state === "error" ? "folder_rates_error" : "folder_rates_loading");

    for (const selector of [".metrics-grid", ".charts-grid"]) {
      const section = $("page-dashboard").querySelector(selector);
      if (section) section.style.visibility = ready ? "" : "hidden";
    }

    if (!ready) return;

    const filteredItems = getFilteredTransactions(folderTotals.rows);
    const dashboardMoney = cents => customMoney(cents, folderTotals.currency);
    
    const income = Finance.sum(filteredItems, "income");
    const expense = Finance.sum(filteredItems, "expense");
    const net = income - expense;
    const saving = filteredItems.filter(t => t.type === "transfer" || /épargne|savings/i.test(categoryName(t.categoryId))).reduce((s, t) => s + t.amountCents, 0);

    let periodText = "";
    const locale = window.BudgetI18n.locale;

    if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      periodText = translate("week_of_start_to_end", { start: startOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short' }), end: endOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' }) });
    } else if (currentRange === 'year') {
      periodText = translate("year_year", { year: referenceDate.getFullYear() });
    } else {
      const monthFormatted = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(referenceDate);
      periodText = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);
    }

if ($("period-display-label")) $("period-display-label").textContent = periodText;

    if ($("metric-net")) {
      $("metric-net").textContent = dashboardMoney(net);
      $("metric-net").style.color = net < 0 ? "#b74e48" : "#10b981";
    }
    
    // --- MODIFICATION ICI POUR LES DÉPENSES ---
    if ($("metric-expense")) {
      $("metric-expense").textContent = "− " + dashboardMoney(expense);
      $("metric-expense").style.color = "#ef4444"; // Couleur rouge
    }

    if ($("metric-income")) $("metric-income").textContent = dashboardMoney(income);
    if ($("metric-saving")) $("metric-saving").textContent = dashboardMoney(saving);

    renderCharts(filteredItems);
  }

function renderCharts(items) {
    const canvasDaily = document.getElementById('dailyChart');
    if (canvasDaily && window.Chart) {
      if (dailyChartInstance) dailyChartInstance.destroy();

      const dateMap = {};
      items.forEach(t => {
        if (!dateMap[t.date]) {
          dateMap[t.date] = { expense: 0, income: 0 };
        }
        if (t.type === 'expense') {
          dateMap[t.date].expense += (t.amountCents / 100);
        } else if (t.type === 'income') {
          dateMap[t.date].income += (t.amountCents / 100);
        }
      });

      const labels = Object.keys(dateMap).sort();
      const expenseData = labels.map(date => -dateMap[date].expense);
      const incomeData = labels.map(date => dateMap[date].income);
      const netData = labels.map(date => dateMap[date].income - dateMap[date].expense);

      let datasets = [];

      if (currentChartMode === 'bars') {
        datasets = [
          {
            type: 'bar',
            label: translate("expense_bars"),
            backgroundColor: '#dc2626',
            data: expenseData.length ? expenseData : [0],
            backgroundColor: '#dc2626',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            type: 'bar',
            label: translate("income_bars"),
            backgroundColor: '#059669',
            data: incomeData.length ? incomeData : [0],
            backgroundColor: '#6ee7b7',
            borderRadius: 6,
            barPercentage: 0.6,
            categoryPercentage: 0.7
          },
          {
            type: 'line',
label: translate("metric_net"),
data: netData.length ? netData : [0],
borderColor: '#2563eb',
backgroundColor: '#2563eb',
            borderWidth: 3,
            tension: 0.4,
            pointRadius: 4,
            yAxisID: 'y'
          }
        ];
      } else {
        datasets = [
          {
            type: 'line',
label: translate("metric_net"),
data: netData.length ? netData : [0],
borderColor: '#2563eb',
backgroundColor: 'rgba(37, 99, 235, 0.10)',
            fill: true,
            borderWidth: 3,
            tension: 0.4
          }
        ];
      }

      dailyChartInstance = new Chart(canvasDaily.getContext('2d'), {
        data: {
          labels: labels.length ? labels : [translate("no_data")],
          datasets: datasets
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: true,
              position: 'bottom',
              labels: { boxWidth: 12, font: { size: 11 } }
            }
          },
          scales: {
            x: {
              grid: { display: false } // Supprime les lignes verticales pour ne pas surcharger
            },
            y: {
              beginAtZero: true,
              grid: { color: '#f1f5f9' }, // Grille horizontale discrète
              ticks: {
                maxTicksLimit: 6, // Espace l'échelle des ordonnées
                callback: function(value) {
                                  return value.toLocaleString(window.BudgetI18n.locale)
                    + " " + folderTotals.currency;
                }
              }
            }
          }
        }
      });
    }

    // Graphique Donut (Répartition par catégorie)
    const canvasDoughnut = document.getElementById('categoryDoughnutChart');
    if (canvasDoughnut && window.Chart) {
      if (doughnutChartInstance) doughnutChartInstance.destroy();
      const expenses = items.filter(t => t.type === 'expense');
      const catTotals = {};
      expenses.forEach(t => {
        const cName = categoryName(t.categoryId);
        catTotals[cName] = (catTotals[cName] || 0) + (t.amountCents / 100);
      });

      doughnutChartInstance = new Chart(canvasDoughnut.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: Object.keys(catTotals).length
            ? Object.keys(catTotals).map(name => {
                const category = categories.find(item => item.name === name && item.kind === "expense");
                return category ? categoryLabel(category) : name;
              })
            : [translate("no_expenses")],
          datasets: [{
            data: Object.values(catTotals).length ? Object.values(catTotals) : [1],
            backgroundColor: ['#0f766e', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
            borderWidth: 2,
            borderColor: '#ffffff'
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { position: 'bottom' } },
          cutout: '70%'
        }
      });
    }
  }

function renderTransactions() {
    const listEl = $("transaction-list");
    if (!listEl) return;

    const searchTerm = ($("search-transactions")?.value || "").toLowerCase();
    const typeFilter = $("filter-type")?.value || "";
    const catFilter = $("filter-category")?.value || "";

    const filtered = transactionsInSelectedFolder().filter(t => {
      const catName = categoryName(t.categoryId).toLowerCase();
      const desc = (t.description || "").toLowerCase();
      
      const matchesSearch = desc.includes(searchTerm) || catName.includes(searchTerm)
        || displayCategoryName(t.categoryId).toLowerCase().includes(searchTerm);
      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesCat = !catFilter || t.categoryId === catFilter;

      return matchesSearch && matchesType && matchesCat;
    });

   // Les dates sont enregistrées au format AAAA-MM-JJ.
const ordered = [...filtered].sort((a, b) =>
  b.date.localeCompare(a.date)
);

const dateFormatter = new Intl.DateTimeFormat(window.BudgetI18n.locale, {
  day: "numeric",
  month: "long",
  year: "numeric"
});

let previousDate = "";

const journalHTML = ordered.map(t => {
  const catName = categoryName(t.categoryId);
  const title = t.description || displayCategoryName(t.categoryId);

  const icon = typeof categoryIcon === "function"
    ? categoryIcon(catName)
    : ({ expense: "🛒", income: "💰", transfer: "🔄" }[t.type] || "🏷️");

  const kind = ["expense", "income", "transfer"].includes(t.type)
    ? t.type
    : "expense";

  const sign = {
    expense: "−",
    income: "+",
    transfer: "↔"
  }[kind];

  const selected = selectedTransactionIds.has(String(t.id));

  let dateHeading = "";

  if (t.date !== previousDate) {
    previousDate = t.date;

    const dateLabel = dateFormatter.format(
      new Date(`${t.date}T12:00:00`)
    );

    dateHeading = `
      <h3 class="journal-date">
        ${escapeHTML(dateLabel)}
      </h3>
    `;
  }

  return `
    ${dateHeading}

    <div
      class="transaction-row journal-row ${kind}${selected ? " is-selected" : ""}"
      data-transaction-id="${escapeHTML(t.id)}"
    >
      <input
        type="checkbox"
        class="transaction-select"
        data-transaction-id="${escapeHTML(t.id)}"
        ${selected ? "checked" : ""}
        aria-label="${escapeHTML(translate("select_title", { title }))}"
      >

      <span class="journal-icon" aria-hidden="true">
        ${icon}
      </span>

      <div class="journal-details">
        <strong>${escapeHTML(title)}</strong>
        <span class="journal-category">
          ${escapeHTML(displayCategoryName(t.categoryId))}
        </span>
      </div>

      <div class="amount journal-amount">
        ${escapeHTML(sign + " " + customMoney(t.amountCents))}
      </div>
    </div>
  `;
}).join("");

listEl.innerHTML = ordered.length ? `
  <div class="transaction-selection-toolbar">
    <label>
      <input type="checkbox" class="select-all-transactions">
      ${translate("select_all")}
    </label>

    <span>
      ${selectedTransactionIds.size
        ? translate("selected_count", { count: selectedTransactionIds.size })
        : translate("transactions_count", { count: ordered.length })}
    </span>
  </div>

  ${journalHTML}
` : `
  <div class="empty-state">
    ${translate("no_transactions_match_your_filters")}
  </div>
`;

// Synchroniser la case « Tout sélectionner ».
const selectAll = listEl.querySelector(".select-all-transactions");

if (selectAll) {
  const selectedVisible = ordered.filter(t =>
    selectedTransactionIds.has(String(t.id))
  ).length;

  selectAll.checked =
    ordered.length > 0 && selectedVisible === ordered.length;

  selectAll.indeterminate =
    selectedVisible > 0 && selectedVisible < ordered.length;
}
  listEl.onchange = (event) => {
  if (event.target.matches(".transaction-select")) {
    const id = String(event.target.dataset.transactionId);

    if (event.target.checked) {
      selectedTransactionIds.add(id);
    } else {
      selectedTransactionIds.delete(id);
    }

    renderTransactions();
  }

  if (event.target.matches(".select-all-transactions")) {
    filtered.forEach(t => {
      const id = String(t.id);

      if (event.target.checked) {
        selectedTransactionIds.add(id);
      } else {
        selectedTransactionIds.delete(id);
      }
    });

    renderTransactions();
  }
};
  listEl.onclick = (event) => {
  if (event.target.closest(".transaction-select, .select-all-transactions")) return;
  const row = event.target.closest("[data-transaction-id]");
  if (!row) return;

  openEditTransactionModal(row.dataset.transactionId);
};
  const deleteButton = $("delete-selected-transactions");

if (deleteButton) {
  deleteButton.hidden = selectedTransactionIds.size === 0;
  deleteButton.textContent =
    translate("delete_selected_count", { count: selectedTransactionIds.size });
}
  if (deleteButton) {
  deleteButton.onclick = async () => {
    const ids = [...selectedTransactionIds];
    if (ids.length === 0) return;

    if (!confirm(translate("permanently_delete_these_transactions_count", { count: ids.length }))) return;

    try {
      await BudgetDB.deleteTransactions(ids);
      selectedTransactionIds.clear();
      await refresh();
      toast(translate("transactions_deleted"));
    } catch (error) {
      toast(translate("error") + error.message);
    }
  };
}
  }

  function renderBudgets() {
    const listEl = $("budget-list");
    if (!listEl) return;
  }

  function renderStatistics() {
    const { rows, currency, state } = folderTotals;
    const income = Finance.sum(rows, "income");
    const expense = Finance.sum(rows, "expense");

    const message = state === "error"
      ? translate("folder_totals_unavailable")
      : translate("folder_rates_loading");

    for (const [id, amount] of [
      ["stats-income", income],
      ["stats-expense", expense],
      ["stats-net", income - expense]
    ]) {
      const output = $(id);
      if (output) {
        output.textContent = state === "ready" ? customMoney(amount, currency) : message;
      }
    }
  }

async function updateUserProfileInfo() {
    const infoEl = $("user-session-info");
    if (!infoEl) return;
    try {
      const client = BudgetDB.client();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        const firstName = meta.first_name || '';
        const lastName = meta.last_name || '';
 // Première lettre pour l'avatar
        const initial = (firstName || user.email || 'G').charAt(0).toUpperCase();
        document.querySelectorAll('.settings-icon-avatar').forEach(el => el.textContent = initial);
        
        // Un seul bloc pour le titre de bienvenue
        const welcomeTitle = document.getElementById("welcome-title");
        if (welcomeTitle) {
          welcomeTitle.textContent = translate("hello_name", { name: firstName || fullName });
        }
      }
    } catch (e) {
      infoEl.textContent = translate("not_signed_in");
    }
  }

  async function checkAuthAndStart() {
    try {
      const client = BudgetDB.client();
      const { data: { session } } = await client.auth.getSession();
      if (!session) {
        showLogin();
      } else {
        showApp();
      }
    } catch (e) {
      showLogin();
    }
  }

$("tab-login")?.addEventListener("click", () => {
    $("tab-login").classList.add("active");
    $("tab-signup").classList.remove("active");
    if ($("signup-fields")) $("signup-fields").hidden = true;
    if ($("btn-auth-submit")) $("btn-auth-submit").textContent = translate("sign_in");
    if ($("auth-form")) $("auth-form").dataset.mode = "login";
  });

  $("tab-signup")?.addEventListener("click", () => {
    $("tab-signup").classList.add("active");
    $("tab-login").classList.remove("active");
    if ($("signup-fields")) $("signup-fields").hidden = false;
    if ($("btn-auth-submit")) $("btn-auth-submit").textContent = translate("create_my_account");
    if ($("auth-form")) $("auth-form").dataset.mode = "signup";
  });

  // Écoute directe du clic sur le bouton de soumission pour forcer l'action sur mobile
  $("btn-auth-submit")?.addEventListener("click", async (e) => {
    e.preventDefault();
    
    const mode = $("auth-form")?.dataset.mode || "login";
    const email = $("auth-email")?.value.trim() || "";
    const password = $("auth-password")?.value.trim() || "";
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";
    const errEl = $("auth-error");

    if (!email || !password) {
      alert(translate("enter_your_email_and_password"));
      return;
    }

    if (errEl) errEl.textContent = translate("signing_in");

    try {
      const client = BudgetDB.client();
      if (!client) throw new Error(translate("could_not_initialize_the_sign_in_service"));

      if (mode === "signup") {
        const { error } = await client.auth.signUp({ 
          email, 
          password, 
          options: { data: {
  first_name: firstName,
  last_name: lastName,
  main_currency: "EUR"
} } 
        });
        if (error) throw error;
        alert(translate("account_created_please_sign_in"));
        if (errEl) errEl.textContent = translate("account_created_please_sign_in");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
alert(translate("signed_in_successfully"));
sessionStorage.removeItem("monbudget-active-page");
showApp();
      }
    } catch (err) {
      console.error("Erreur d'auth :", err);
      const errorMsg = err.message || JSON.stringify(err);
      if (errEl) errEl.textContent = translate("error") + errorMsg;
      alert(translate("sign_in_error") + errorMsg);
    }
  });
  $("logout-btn")?.addEventListener("click", async () => {
    try {
      const client = BudgetDB.client();
      await client.auth.signOut();
      location.reload();
    } catch (e) {
      location.reload();
    }
  });

  $("auth-lang-select")?.addEventListener("change", (e) => {
    currentLang = window.BudgetI18n.setLanguage(e.target.value);
    applyTranslations();
  });

  $("app-lang")?.addEventListener("change", (e) => {
    currentLang = window.BudgetI18n.setLanguage(e.target.value);
    renderAll();
  });

$("app-currency")?.addEventListener("change", async (e) => {
  const newCurrency = e.target.value;

  try {
    await BudgetDB.setMainCurrency(newCurrency);

    currentCurrency = newCurrency;
    localStorage.setItem("user_currency", currentCurrency);

    renderAll();
    toast(translate("display_currency_updated"));
  } catch (error) {
    console.error("Erreur de changement de devise :", error);

    // Remettre l'ancienne devise dans le sélecteur
    e.target.value = currentCurrency;

    toast(translate("could_not_update_the_currency"));
  }
});
// Récupérer le taux de change historique
async function getExchangeRate(from, to, date) {
  // Même devise : aucun calcul de conversion nécessaire
  if (from === to) {
    return {
      rate: 1,
      date: date
    };
  }
  const url = `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(from)}/${encodeURIComponent(to)}?date=${encodeURIComponent(date)}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      translate("no_exchange_rate_from_from_to_to_on_date", { from, to, date })
    );
  }
  const result = await response.json();
  if (!result.rate || !Number.isFinite(Number(result.rate))) {
    throw new Error(translate("invalid_exchange_rate"));
  }
  return {
    rate: Number(result.rate),
    date: result.date || date
  };
}
  // Mettre à jour l'aperçu de conversion
async function updateTransactionConversion() {
  const amountInput = $("transaction-amount");
  const currencyInput = $("transaction-currency");
  const dateInput = $("transaction-date");
  const panel = $("transaction-conversion");

  if (!amountInput || !currencyInput || !dateInput || !panel) return;

  const amount = Number(amountInput.value.replace(",", "."));
  const fromCurrency = currencyInput.value;
  const toCurrency = currentCurrency;
  const date = dateInput.value;

  // Masquer l'aperçu si les informations sont incomplètes
  if (!amount || amount <= 0 || !date || !fromCurrency) {
    panel.hidden = true;
    return;
  }

  panel.hidden = false;

  $("transaction-exchange-rate").textContent = translate("calculating");
  $("transaction-converted-amount").textContent = translate("calculating");
  $("transaction-rate-date").textContent = "";

  try {
    const conversion = await getExchangeRate(
      fromCurrency,
      toCurrency,
      date
    );

    const convertedAmount = amount * conversion.rate;

    $("transaction-exchange-rate").textContent =
      `1 ${fromCurrency} = ${conversion.rate.toFixed(6)} ${toCurrency}`;

    $("transaction-converted-amount").textContent =
      `${convertedAmount.toFixed(2)} ${toCurrency}`;

    $("transaction-rate-date").textContent =
      translate("rate_on_date", { date: conversion.date });

  } catch (error) {
    $("transaction-exchange-rate").textContent =
      translate("exchange_rate_unavailable");

    $("transaction-converted-amount").textContent =
      "Conversion impossible";

    $("transaction-rate-date").textContent = error.message;
  }
}
  // Actualiser la conversion lorsque l'utilisateur modifie les champs
$("transaction-amount")?.addEventListener(
  "input",
  updateTransactionConversion
);

$("transaction-currency")?.addEventListener(
  "change",
  updateTransactionConversion
);

$("transaction-date")?.addEventListener(
  "change",
  updateTransactionConversion
);
async function loadTransactionFolders(selectedId, select = $("transaction-folder")) {
  select.disabled = true;
  select.replaceChildren(new Option("Chargement des dossiers…", ""));

  try {
    const folders = await BudgetDB.getBudgetFolders();
    const placeholder = folders.length
      ? "Choisir un dossier"
      : "Crée d’abord un dossier depuis le tableau de bord.";

    select.replaceChildren(new Option(placeholder, ""));
    for (const folder of folders) {
      select.add(new Option(folder.name, folder.id));
    }

    const personal = folders.find(folder =>
      folder.name.trim().toLowerCase() === "personnel"
    );
    select.value = selectedId ?? personal?.id ?? "";
  } catch (error) {
    select.replaceChildren(new Option("Impossible de charger les dossiers", ""));
    toast("Impossible de charger les dossiers. Ferme et rouvre le formulaire.");
  } finally {
    select.disabled = false;
  }
}
  $("capture-import-open")?.addEventListener("click", () => {
  const destination = $("capture-folder");
  if (!destination) return;

  const currentFolderId = $("transaction-folder")?.value || undefined;
  loadTransactionFolders(currentFolderId, destination);
});
function openNewTransactionModal(prefill = {}) {
  const form = $("transaction-form");
  const dialog = $("transaction-dialog");

  form.reset();
  loadTransactionFolders();
  delete form.dataset.transactionId;
  $("transaction-modal-title").textContent = translate("new_transaction");
  $("transaction-date").value = prefill.date || today;
  $("transaction-type").value = prefill.type || "expense";

  if ($("transaction-currency")) {
    $("transaction-currency").value = prefill.currency || currentCurrency;
  }

  if (Number.isSafeInteger(prefill.amountCents)) {
    $("transaction-amount").value = (prefill.amountCents / 100).toFixed(2);
  }

  $("transaction-description").value = prefill.description || "";

  if ($("transaction-conversion")) {
    $("transaction-conversion").hidden = true;
  }

  renderCategoryOptions();

  if (!dialog.open) {
    showDialog("transaction-dialog");
  }

  updateTransactionConversion();
}

document.addEventListener("capture-import:select", event => {
  closeDialog("capture-import-dialog");
  openNewTransactionModal(event.detail);
});
// Ouvrir une opération existante pour la consulter ou la modifier
function openEditTransactionModal(transactionId) {
  const transaction = transactions.find(item => String(item.id) === String(transactionId));

  if (!transaction) {
    toast(translate("transaction_not_found"));
    return;
  }

  const form = $("transaction-form");

  form.reset();
  loadTransactionFolders(transaction.folderId || "");
  // Indiquer que nous modifions une opération existante
  form.dataset.transactionId = transaction.id;

  $("transaction-modal-title").textContent = translate("edit_transaction");

  $("transaction-date").value = transaction.date;
  $("transaction-type").value = transaction.type;
  $("transaction-amount").value = (
    (transaction.originalAmountCents ?? transaction.amountCents) / 100
  ).toFixed(2);

  $("transaction-currency").value =
    transaction.originalCurrency || currentCurrency;

  $("transaction-description").value = transaction.description || "";

  renderCategoryOptions();
  $("transaction-category").value = transaction.categoryId || "";

  // Afficher les informations de conversion déjà enregistrées
  const panel = $("transaction-conversion");

  if (panel) {
    panel.hidden = false;
    panel.style.display = "block";
  }
  $("transaction-exchange-rate").textContent =
    `1 ${transaction.originalCurrency || currentCurrency} = ${Number(transaction.exchangeRate || 1).toFixed(6)} ${transaction.baseCurrency || currentCurrency}`;
  $("transaction-converted-amount").textContent =
    `${(transaction.amountCents / 100).toFixed(2)} ${transaction.baseCurrency || currentCurrency}`;

  $("transaction-rate-date").textContent =
    translate("rate_recorded_on_date", { date: transaction.exchangeRateDate || transaction.date });

  showDialog("transaction-dialog");
}
  $("quick-add")?.addEventListener("click", openNewTransactionModal);
  $("btn_new_op")?.addEventListener("click", openNewTransactionModal);
  $("mobile-add")?.addEventListener("click", openNewTransactionModal);

async function saveTransaction({
  folderId, id, date, amount, currency, type, categoryId, description
}) {
  const originalAmountCents = Finance.toCents(amount);

  if (!Number.isSafeInteger(originalAmountCents) || originalAmountCents <= 0) {
    throw new Error(translate("the_amount_must_be_greater_than_zero"));
  }

  const originalCurrency = currency || currentCurrency;
  const conversion = await getExchangeRate(originalCurrency, currentCurrency, date);
  const convertedAmountCents = Math.round(originalAmountCents * conversion.rate);

  return BudgetDB.putTransaction({
    folderId,
    id,
    date,
    amountCents: convertedAmountCents,
    originalAmountCents,
    originalCurrency,
    convertedAmountCents,
    baseCurrency: currentCurrency,
    exchangeRate: conversion.rate,
    exchangeRateDate: conversion.date,
    type,
    categoryId,
    description: description.trim()
  });
}

window.saveImportedTransaction = saveTransaction;
window.refreshAfterCaptureImport = refresh;
  
$("transaction-form")?.addEventListener("submit", async (e) => {
  e.preventDefault();

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  if (submitBtn.disabled) return;
    if ($("transaction-folder").disabled || !$("transaction-folder").value) return;

  try {
    submitBtn.disabled = true;
    submitBtn.textContent = translate("saving_2");

    await saveTransaction({
    folderId: $("transaction-folder").value,
      id: form.dataset.transactionId || undefined,
      date: $("transaction-date").value || today,
      amount: $("transaction-amount").value,
      currency: $("transaction-currency")?.value,
      type: $("transaction-type").value,
      categoryId: $("transaction-category").value,
      description: $("transaction-description").value
    });

    delete form.dataset.transactionId;

    closeDialog("transaction-dialog");
    await refresh();

    toast(translate("transaction_saved"));

  } catch (err) {
    toast(translate("error") + err.message);

  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = translate("save");
  }
});


// --- GESTION DU CHANGEMENT DE DATE ---
  const hiddenDatePicker = document.getElementById('hidden-date-picker');

  if (hiddenDatePicker) {
    hiddenDatePicker.addEventListener('change', (e) => {
      const selectedDate = new Date(e.target.value);
      if (!isNaN(selectedDate.getTime())) {
        referenceDate = selectedDate;
        renderDashboard();
      }
    });
  }

  // Mettre à jour les données du profil dans les réglages
  async function updateUserProfileInfo() {
    try {
      const client = BudgetDB.client();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        const firstName = meta.first_name || '';
        const lastName = meta.last_name || '';
        const fullName = (firstName || lastName) ? `${firstName} ${lastName}`.trim() : 'Mon Compte';
        
        if ($("settings-user-name")) $("settings-user-name").textContent = fullName;
        if ($("settings-user-email")) $("settings-user-email").textContent = user.email;
        if ($("info-modal-email")) $("info-modal-email").textContent = user.email;

        // Première lettre pour l'avatar
        const initial = (firstName || user.email || 'G').charAt(0).toUpperCase();
        document.querySelectorAll('.settings-icon-avatar').forEach(el => el.textContent = initial);

        if ($("edit-firstname")) $("edit-firstname").value = firstName;
        if ($("edit-lastname")) $("edit-lastname").value = lastName;
      }
    } catch (e) {
      console.error(e);
    }
  }

  // Ouverture des modales Réglages
  $("btn-open-profile-modal")?.addEventListener("click", () => showDialog("profile-dialog"));
  $("btn-open-email-modal")?.addEventListener("click", () => showDialog("email-dialog"));

  // Enregistrement du profil
  $("profile-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const client = BudgetDB.client();
      const first_name = $("edit-firstname").value.trim();
      const last_name = $("edit-lastname").value.trim();

      const { error } = await client.auth.updateUser({
        data: { first_name, last_name }
      });

      if (error) throw error;
      closeDialog("profile-dialog");
      await updateUserProfileInfo();
      toast(translate("profile_updated"));
    } catch (err) {
      toast(translate("error") + err.message);
    }
  });
  // --- DÉCONNEXION AUTOMATIQUE APRÈS 15 MINUTES D'INACTIVITÉ ---
  let inactivityTimer;
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes en millisecondes

  async function logoutDueToInactivity() {
    try {
      const client = BudgetDB.client();
      await client.auth.signOut();
      toast(translate("your_session_expired_due_to_inactivity"));
      setTimeout(() => location.reload(), 1500);
    } catch (e) {
      location.reload();
    }
  }

  function resetInactivityTimer() {
    clearTimeout(inactivityTimer);
    // Le minuteur s'active uniquement si l'utilisateur est connecté
    const appDiv = document.getElementById("app");
    if (appDiv && !appDiv.hidden) {
      inactivityTimer = setTimeout(logoutDueToInactivity, INACTIVITY_LIMIT);
    }
  }

  // Écouter les interactions de l'utilisateur (souris, clavier, tactile)
  ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'].forEach(event => {
    window.addEventListener(event, resetInactivityTimer, { passive: true });
  });

// Lancer le décompte initial
  resetInactivityTimer();
  
  // Appliquer les traductions dès le chargement de la page
  applyTranslations();

  // --- GESTION DE L'AJOUT D'UNE NOUVELLE CATÉGORIE ---
  
  // 1. Ouvrir la modale de catégorie lorsqu'on clique sur le bouton ＋
  $("btn-add-category")?.addEventListener("click", () => {
    $("category-form")?.reset();
    showDialog("category-dialog");
  });

// 2. Enregistrer la nouvelle catégorie via db.js
  $("category-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = $("new-category-name")?.value.trim();
    const currentType = $("transaction-type")?.value || "expense";

    if (!nameInput) return;

    try {
      await BudgetDB.putCategory({ name: nameInput, kind: currentType });
      closeDialog("category-dialog");
      toast(translate("category_created"));
      await refresh();
    } catch (err) {
      console.error("Erreur création catégorie :", err);
      toast(translate("error") + err.message);
    }
  });
  $("search-transactions")?.addEventListener("input", renderTransactions);
  $("filter-type")?.addEventListener("change", renderTransactions);
  $("filter-category")?.addEventListener("change", renderTransactions);
  // --- GESTION DES BOUTONS DE RÉGLAGES COMPLÉMENTAIRES ---

  // Ouvrir la modale de création de catégorie depuis les réglages

  // Exporter les transactions au format CSV
  $("btn-export-data")?.addEventListener("click", () => {
    if (!transactions.length) {
      toast(translate("no_transactions_to_export"));
      return;
    }

    let csvContent = "data:text/csv;charset=utf-8,Date,Type,Categorie,Montant,Note\n";
    transactions.forEach(t => {
      const amount = (t.amountCents / 100).toFixed(2);
      const cat = categoryName(t.categoryId);
      csvContent += `${t.date},${t.type},"${cat}",${amount},"${t.description || ''}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "mon_budget_export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast(translate("export_complete"));
  });
 // --- GESTIONNAIRE COMPLET DES CATÉGORIES (CORRIGÉ) ---

  function renderCategoriesManagementList() {
    const container = $("categories-list-container");
    if (!container) return;

    container.innerHTML = categories.length ? categories.map(c => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #f1f5f9;">
        <div>
          <strong>${escapeHTML(categoryLabel(c))}</strong>
          <span style="font-size: 0.75rem; color: #64748b; margin-left: 6px; background: #f1f5f9; padding: 2px 6px; border-radius: 4px;">
            ${c.kind === 'income' ? translate("income") : c.kind === 'transfer' ? translate("transfer") : translate("expense")} ${c.is_global ? '(Global)' : ''}
          </span>
        </div>
        ${!c.is_global ? `<button type="button" class="danger-btn-small" onclick="deleteCategory('${c.id}')" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer;">${translate("delete")}</button>` : `<span style="font-size:0.75rem; color:#94a3b8;">${translate("default")}</span>`}
      </div>
    `).join("") : `<p style="text-align: center; color: #64748b;">${translate("no_categories_found")}</p>`;
  }

  // Ouvrir la modale proprement
  $("btn-open-manage-cats")?.addEventListener("click", () => {
    renderCategoriesManagementList();
    const dlg = $("manage-categories-dialog");
    if (dlg) {
      if (typeof dlg.showModal === "function") dlg.showModal();
      else dlg.setAttribute("open", true);
    }
  });

// Fermer la modale explicitement (résout le souci de la croix et du bouton fermer)
  document.querySelectorAll("[data-close='manage-categories-dialog']").forEach(btn => {
    btn.addEventListener("click", () => {
      const dlg = $("manage-categories-dialog");
      if (dlg) {
        if (typeof dlg.close === "function") dlg.close();
        else dlg.removeAttribute("open");
      }
    });
  });
// Ajouter une catégorie depuis la modale de gestion avec affichage instantané
  $("manage-category-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = $("manage-new-cat-name")?.value.trim();
    const kindInput = $("manage-new-cat-kind")?.value || "expense";

    if (!nameInput) return;

    try {
      const newCat = await BudgetDB.putCategory({ name: nameInput, kind: kindInput });
      categories.push(newCat);

      $("manage-new-cat-name").value = "";
      toast(translate("category_created"));
      
      renderCategoriesManagementList();
      renderCategoryOptions();
      await refresh();
    } catch (err) {
      console.error("Erreur ajout catégorie :", err);
      toast(translate("error") + err.message);
    }
  });

  // Fonction globale pour supprimer une catégorie
  window.deleteCategory = async function(catId) {
    if (!confirm(translate("delete_this_category"))) return;

    try {
      await BudgetDB.deleteCategory(catId);
      toast(translate("category_deleted"));
      await refresh();
      renderCategoriesManagementList();
      renderCategoryOptions();
    } catch (err) {
      toast(translate("could_not_delete") + err.message);
    }
  };
  // --- EXPORTATION DES DONNÉES EN JSON ---
  $("btn-export-json")?.addEventListener("click", async () => {
    try {
      const allTransactions = await BudgetDB.getTransactions();
      const allCategories = await BudgetDB.getCategories();
      
      const exportData = {
        version: "1.0",
        date: new Date().toISOString(),
        transactions: allTransactions,
        categories: allCategories
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportData, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `mon_budget_backup_${Finance.localDate()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      toast(translate("json_export_complete"));
    } catch (err) {
      console.error("Erreur export JSON :", err);
      toast(translate("export_failed"));
    }
  });

  // --- IMPORTATION DES DONNÉES EN JSON ---
  $("btn-import-json")?.addEventListener("click", () => {
    $("import-file-input")?.click();
  });

  $("import-file-input")?.addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(event.target.result);

        // Importer les catégories d'abord si elles existent
        if (data.categories && Array.isArray(data.categories)) {
          for (const cat of data.categories) {
            // Évite de recréer les catégories globales par défaut si besoin
            if (!cat.is_global) {
              try { await BudgetDB.putCategory(cat); } catch (e) {}
            }
          }
        }

        // Importer les transactions ensuite
        if (data.transactions && Array.isArray(data.transactions)) {
          for (const t of data.transactions) {
            await BudgetDB.putTransaction(t);
          }
        }

        toast(translate("data_imported_and_restored"));
        await refresh();
      } catch (err) {
        console.error("Erreur d'import JSON :", err);
        toast(translate("invalid_json_file"));
      }
    };
    reader.readAsText(file);
  });
  // --- RÉINITIALISER LE FORMULAIRE DU SIMULATEUR ---
  $("btn-reset-sim")?.addEventListener("click", () => {
    $("financing-sim-form")?.reset();
    $("sim-result-card").style.display = "none";
    toast(translate("form_reset"));
  });
  // --- SUPPRIMER UN PROJET DE FINANCEMENT ---
  window.deleteFinancingProject = async function(id) {
    if (!confirm(translate("delete_this_goal"))) return;
    try {
      await BudgetDB.deleteFinancing(id);
      toast(translate("goal_deleted"));
      renderFinancings();
    } catch (err) {
      console.error("Erreur suppression projet :", err);
      toast(translate("could_not_delete_2"));
    }
  };
// --- LOGIQUE DU SIMULATEUR DE FINANCEMENT & ANALYSE DE FAISABILITÉ ---
  $("financing-sim-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = $("sim-name").value.trim();
    const target = parseFloat($("sim-target").value) || 0;
    const current = parseFloat($("sim-current").value) || 0;
    const months = parseInt($("sim-months").value) || 1;

    const remainingCents = Math.max(0, Finance.toCents(target - current));
    const monthlyEffortCents = Math.round(remainingCents / months);

    // --- CALCUL DE LA CAPACITÉ RÉELLE DU MOIS ---
    // On récupère les revenus et dépenses des transactions actuelles du mois
    const filteredItems = getFilteredTransactions();
    const realIncome = Finance.sum(filteredItems, "income");
    const realExpense = Finance.sum(filteredItems, "expense");
    const realNetBalance = realIncome - realExpense; // Ce qu'il reste vraiment ce mois-ci

    // Analyse de faisabilité
    const canAfford = realNetBalance >= monthlyEffortCents;
    const diffCents = realNetBalance - monthlyEffortCents;

    // Affichage des résultats de base
    $("res-proj-name").textContent = name;
    $("res-rem-amount").textContent = customMoney(remainingCents);
    $("res-monthly-effort").textContent = customMoney(monthlyEffortCents) + translate("month");

    // --- AJOUT DU BLOC DE FAISABILITÉ DANS LA CARTE DE RÉSULTAT ---
    let feasibilityEl = $("sim-feasibility-alert");
    if (!feasibilityEl) {
      feasibilityEl = document.createElement("div");
      feasibilityEl.id = "sim-feasibility-alert";
      feasibilityEl.style.cssText = "margin-top: 15px; padding: 12px; border-radius: 8px; font-size: 0.9rem;";
      $("sim-result-card").appendChild(feasibilityEl);
    }

    if (canAfford) {
      feasibilityEl.style.background = "#e6f4ea";
      feasibilityEl.style.color = "#065f46";
      feasibilityEl.textContent = "✅ " + translate("this_goal_is_feasible_this_month_your_net_balance_balance_covers_the_required_savings_leaving_remaining", { balance: customMoney(realNetBalance), remaining: customMoney(diffCents) });
    } else {
      feasibilityEl.style.background = "#fee2e2";
      feasibilityEl.style.color = "#dc2626";
      feasibilityEl.textContent = "⚠️ " + translate("your_net_balance_balance_falls_short_of_the_required_savings_by_shortfall_this_month", { balance: customMoney(realNetBalance), shortfall: customMoney(Math.abs(diffCents)) });
    }

    $("sim-result-card").style.display = "block";

    // Enregistrement automatique en mode simulation dans Supabase
    try {
      await BudgetDB.putFinancing({
        name: name,
        targetAmount: target,
        currentAmount: current,
        months: months,
        monthlyEffort: monthlyEffortCents / 100,
        status: canAfford ? "faisable" : "tendu"
      });
      toast(translate("savings_estimate_saved"));
      renderFinancings();
    } catch (err) {
      console.error("Erreur sauvegarde projet :", err);
      toast(translate("could_not_save_the_goal"));
    }
  });
  // --- CHARGEMENT ET AFFICHAGE DES FINANCEMENTS ---
 async function renderFinancings() {
    const container = $("financing-projects-list");
    if (!container) return;

    try {
      const projects = await BudgetDB.getFinancings();

      container.innerHTML = projects.length ? projects.map(p => `
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 1px solid #f1f5f9;">
          <div>
            <strong>${escapeHTML(p.name)}</strong>
            <small style="display: block; color: #64748b; font-size: 0.85rem;">
              ${translate("target_target_term_months_months_savings_effort_month", { target: customMoney(p.targetAmount * 100), months: p.months, effort: customMoney(p.monthlyEffort * 100) })}
            </small>
          </div>
          <div style="display: flex; align-items: center; gap: 10px;">
            <span style="background: #e6f4ea; color: #065f46; padding: 4px 8px; border-radius: 6px; font-size: 0.75rem; font-weight: 600;">
              ${p.status}
            </span>
            <button type="button" onclick="deleteFinancingProject('${p.id}')" style="background: #fee2e2; color: #dc2626; border: none; padding: 4px 8px; border-radius: 4px; cursor: pointer; font-size: 0.75rem;">
              ${translate("delete")}
            </button>
          </div>
        </div>
      `).join("") : `<p style="text-align: center; color: #64748b; padding: 15px;">${translate("no_savings_goals_yet")}</p>`;
    } catch (err) {
      console.error("Erreur affichage financements :", err);
    }
  }
    $("open-budget-folder")?.addEventListener("click", () => {
    $("budget-folder-form").reset();
    $("budget-folder-status").textContent = "";

    const currency = $("budget-folder-currency");
    const options = Array.from($("app-currency").options)
      .filter(option => option.value)
      .map(option => option.cloneNode(true));

    currency.replaceChildren(...options);
    currency.value = currentCurrency;
    showDialog("budget-folder-dialog");
  });

  $("budget-folder-form")?.addEventListener("submit", async event => {
    event.preventDefault();

    const form = event.currentTarget;
    const name = $("budget-folder-name").value.trim();
    const currency = $("budget-folder-currency").value;
    const status = $("budget-folder-status");
    const submit = form.querySelector('button[type="submit"]');

    if (!name) {
      status.textContent = "Saisis un nom de dossier.";
      return;
    }

    submit.disabled = true;
    status.textContent = "Création en cours…";

    try {
      const folder = await BudgetDB.createBudgetFolder({ name, currency });
            await loadDashboardFolders();
      closeDialog("budget-folder-dialog");
      toast(`Dossier « ${folder.name} » créé.`);
    } catch (error) {
      status.textContent = error.code === "23505"
        ? "Tu as déjà un dossier avec ce nom."
        : "Impossible de créer le dossier. Réessaie.";
      console.error("Création du dossier :", error);
    } finally {
      submit.disabled = false;
    }
  });
    const foldersDialog = $("manage-folders-dialog");
  const foldersList = $("manage-folders-list");
  const foldersStatus = $("manage-folders-status");
  let folderActionPending = false;

  function makeFolderButton(label, onClick) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "secondary-btn";
    button.textContent = label;
    button.addEventListener("click", onClick);
    return button;
  }

  async function renderManagedFolders() {
    const folders = await BudgetDB.getBudgetFolders();
    foldersList.replaceChildren();

    if (!folders.length) {
      foldersStatus.textContent = "Tu n’as encore aucun dossier.";
      return;
    }

    foldersStatus.textContent = "";

    for (const folder of folders) {
      const row = document.createElement("li");
      const title = document.createElement("strong");
      title.textContent = `${folder.name} · ${folder.display_currency}`;

      const actions = document.createElement("div");
      actions.append(
        makeFolderButton(translate("folder_rename"), () => renameManagedFolder(folder)),
        makeFolderButton(translate("folder_delete_open"), () => {
          deleteOptions.hidden = !deleteOptions.hidden;
        })
      );

      const deleteOptions = document.createElement("div");
      deleteOptions.hidden = true;

      const destinationLabel = document.createElement("label");
      destinationLabel.textContent = "Déplacer les opérations vers ";
      const destination = document.createElement("select");
      destination.add(new Option(translate("folder_choose_destination"), ""));

      for (const otherFolder of folders) {
        if (otherFolder.id !== folder.id) {
          destination.add(new Option(otherFolder.name, otherFolder.id));
        }
      }

      const moveButton = makeFolderButton(translate("folder_move_and_delete"), () => {
        if (!destination.value) return;

        const targetName = destination.selectedOptions[0].textContent;
        if (window.confirm(
          `Déplacer les opérations de « ${folder.name} » vers « ${targetName} », puis supprimer le dossier « ${folder.name} » ?`
        )) {
          removeManagedFolder(folder.id, destination.value, false);
        }
      });

      destination.disabled = destination.options.length === 1;
      moveButton.disabled = true;
      destination.addEventListener("change", () => {
        moveButton.disabled = !destination.value;
      });

      const deleteButton = makeFolderButton(translate("folder_delete_with_transactions"), () => {
        if (window.confirm(
          `Supprimer définitivement le dossier « ${folder.name} » et toutes ses opérations ?`
        )) {
          removeManagedFolder(folder.id, null, true);
        }
      });

      destinationLabel.append(destination);
      deleteOptions.append(destinationLabel, moveButton, deleteButton);
      row.append(title, actions, deleteOptions);
      foldersList.append(row);
    }
  }

  async function runFolderAction(save, successMessage) {
    if (folderActionPending) return;
    folderActionPending = true;
    foldersList.inert = true;
    foldersStatus.textContent = translate("recovery_saving");

    try {
      await save();
    } catch (error) {
      foldersStatus.textContent =
        error?.code === "23505"
          ? "Tu as déjà un dossier avec ce nom."
          : "Impossible d’enregistrer la modification.";
      console.error("Gestion des dossiers :", error);
      folderActionPending = false;
      foldersList.inert = false;
      return;
    }

    try {
      await loadDashboardFolders();
      const refreshed = await refresh();
      await renderManagedFolders();
      foldersStatus.textContent = refreshed
        ? successMessage
        : `${successMessage} Actualise la page pour mettre à jour le tableau de bord.`;
    } catch (error) {
      foldersStatus.textContent = `${successMessage} Rouvre « Mes dossiers » pour actualiser la liste.`;
      console.error("Actualisation des dossiers :", error);
    } finally {
      folderActionPending = false;
      foldersList.inert = false;
    }
  }

  function renameManagedFolder(folder) {
    const name = window.prompt("Nouveau nom du dossier", folder.name)?.trim();
    if (!name || name === folder.name) return;

    return runFolderAction(async () => {
      const user = await BudgetDB.requireUser();
      const { error } = await BudgetDB.client()
        .from("budget_folders")
        .update({ name })
        .eq("id", folder.id)
        .eq("user_id", user.id)
        .select("id")
        .single();

      if (error) throw error;
    }, "Dossier renommé.");
  }

  function removeManagedFolder(folderId, destinationId, deleteTransactions) {
    return runFolderAction(async () => {
      const { error } = await BudgetDB.client().rpc("remove_budget_folder", {
        source_id: folderId,
        destination_id: destinationId,
        delete_transactions: deleteTransactions
      });

      if (error) throw error;
    }, deleteTransactions ? "Dossier et opérations supprimés." : "Opérations déplacées et dossier supprimé.");
  }

  $("btn-open-manage-folders")?.addEventListener("click", async () => {
    if (folderActionPending) return;
    foldersList.replaceChildren();
    foldersStatus.textContent = "Chargement des dossiers…";
    foldersDialog.showModal();

    try {
      await renderManagedFolders();
    } catch (error) {
      foldersStatus.textContent = "Impossible de charger les dossiers.";
      console.error("Chargement des dossiers :", error);
    }
  });
    document.querySelector('[data-goto="transactions"]')
    ?.addEventListener("click", () => {
      ["search-transactions", "filter-type", "filter-category"].forEach(id => {
        const field = $(id);
        if (field) field.value = "";
      });

      const folder = $("dashboard-folder");
      if (folder && folder.value) {
        folder.value = "";
        folder.dispatchEvent(new Event("change"));
      } else {
        renderTransactions();
      }

      document.querySelector('.nav-link[data-page="transactions"]')?.click();
    });
  // <--- COLLER checkAuthAndStart(); ICI, TOUT À LA FIN
   const forgotPasswordButton = $("btn-forgot-password");
  const resetPasswordForm = $("reset-password-form");
  const resetPasswordStatus = $("reset-password-status");

    const loginForm = $("auth-form");
  const authTabs = $("tab-login").parentElement;
  const requestForm = $("request-password-reset-form");
  const recoveryEmail = $("recovery-email");
  const recoveryStatus = $("recovery-email-status");

  function showAuthScreen(screen) {
    const showLoginForm = screen === "login";

    loginForm.style.display = showLoginForm ? "" : "none";
    authTabs.style.display = showLoginForm ? "" : "none";
    requestForm.hidden = screen !== "request";
    resetPasswordForm.hidden = screen !== "reset";
    forgotPasswordButton.hidden =
      !showLoginForm || loginForm.dataset.mode === "signup";
  }

  showAuthScreen("login");

  $("tab-login").addEventListener("click", () => showAuthScreen("login"));
  $("tab-signup").addEventListener("click", () => showAuthScreen("login"));

  forgotPasswordButton.addEventListener("click", () => {
    recoveryEmail.value = $("auth-email").value.trim();
    recoveryStatus.textContent = "";
    showAuthScreen("request");
    recoveryEmail.focus();
  });

  $("btn-back-to-login").addEventListener("click", () => {
    showAuthScreen("login");
    forgotPasswordButton.focus();
  });

  requestForm.addEventListener("submit", async event => {
    event.preventDefault();
    const submit = requestForm.querySelector('button[type="submit"]');
    const redirect = new URL(window.location.href);
    redirect.search = "?reset-password=1";
    redirect.hash = "";

    submit.disabled = true;
    recoveryStatus.textContent = translate("recovery_sending");

    try {
      const { error } = await BudgetDB.client().auth.resetPasswordForEmail(
        recoveryEmail.value.trim(),
        { redirectTo: redirect.href }
      );

      if (error) throw error;

      recoveryStatus.textContent =
        translate("recovery_sent");
    } catch {
      recoveryStatus.textContent = translate("recovery_send_error");
    } finally {
      submit.disabled = false;
    }
  });


    let recoveryUserId = null;

  resetPasswordForm.addEventListener("submit", async event => {
    event.preventDefault();
    if (!recoveryUserId) return;

    const password = $("reset-new-password").value;
    const confirmation = $("reset-confirm-password").value;

    if (password !== confirmation) {
      resetPasswordStatus.textContent = translate("recovery_mismatch");
      $("reset-confirm-password").focus();
      return;
    }

    const submit = resetPasswordForm.querySelector('button[type="submit"]');
    submit.disabled = true;
    resetPasswordStatus.textContent = translate("recovery_saving");

    try {
      const auth = BudgetDB.client().auth;
      const { data, error: userError } = await auth.getUser();

      if (userError || data?.user?.id !== recoveryUserId) {
        resetPasswordStatus.textContent = translate("recovery_session_expired");
        return;
      }

      const { error } = await auth.updateUser({ password });

      if (error) {
        resetPasswordStatus.textContent =
          translate("recovery_update_error");
        return;
      }

      recoveryUserId = null;
      resetPasswordForm.reset();

      const { error: signOutError } = await auth.signOut({ scope: "local" });
      if (signOutError) {
        resetPasswordStatus.textContent =
          translate("recovery_signout_error");
        return;
      }

      $("auth-email").value = data.user.email || "";
      $("auth-password").value = "";
      showAuthScreen("login");
      $("auth-error").textContent =
        translate("recovery_done");
      $("auth-password").focus();
    } catch {
      resetPasswordStatus.textContent = translate("recovery_generic_error");
    } finally {
      submit.disabled = false;
    }
  });

  async function startWithPasswordRecovery() {
    const url = new URL(window.location.href);
    if (url.searchParams.get("reset-password") !== "1") {
      return checkAuthAndStart();
    }

    showLogin();
    showAuthScreen("request");

    const tokenHash = url.searchParams.get("token_hash");
    if (!tokenHash) {
      recoveryStatus.textContent = translate("recovery_request_again");
      return;
    }

    url.searchParams.delete("token_hash");
    window.history.replaceState(null, "", url);

    recoveryStatus.textContent = translate("recovery_checking");
    const { data, error } = await BudgetDB.client().auth.verifyOtp({
      token_hash: tokenHash,
      type: "recovery"
    });

    if (error || !data?.session || !data.user?.id) {
      recoveryStatus.textContent =
        translate("recovery_link_expired");
      return;
    }

    recoveryUserId = data.user.id;
    $("reset-account-email").textContent = data.user.email || "";
    showAuthScreen("reset");
    $("reset-new-password").focus();
  }

  startWithPasswordRecovery().catch(() => {
    showLogin();
    showAuthScreen("request");
    recoveryStatus.textContent = translate("recovery_check_error");
  });

})();
