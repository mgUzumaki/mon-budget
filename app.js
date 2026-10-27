// ==========================================
// APP.JS — Logique unifiée pour Mon Budget
// ==========================================

(() => {
  const $ = id => document.getElementById(id);
  let transactions = [], categories = [], budgets = [], toastTimer;
  let currentRange = 'month'; 
  let referenceDate = new Date(); 
  let dailyChartInstance = null;
  let doughnutChartInstance = null;

  let currentLang = localStorage.getItem('user_lang') || 'fr';
  let currentCurrency = localStorage.getItem('user_currency') || 'FCFA';

const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistiques", nav_settings: "Réglages",
      btn_add: "Ajouter une opération", dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine", range_month: "Mois", range_year: "Année", range_day: "Jour",
      metric_net: "Solde net", metric_exp: "Total des dépenses", metric_inc: "Total des revenus", metric_save: "Épargne",
      chart_exp_title: "Évolution des dépenses", chart_exp_sub: "Activité et tendance",
      chart_cat_title: "Répartition des Dépenses", chart_cat_sub: "Par catégorie",
      recent_title: "Opérations récentes", recent_sub: "Vos dernières opérations", see_all: "Voir tout →",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.", btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types", type_expense: "Dépenses", type_income: "Revenus", type_transfer: "Transferts", filter_all_cats: "Toutes les catégories"
    },
    en: {
      nav_dashboard: "Dashboard", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistics", nav_settings: "Settings",
      btn_add: "Add transaction", dash_intro: "Your financial situation at a glance.",
      range_week: "Week", range_month: "Month", range_year: "Year", range_day: "Day",
      metric_net: "Net Balance", metric_exp: "Total Expenses", metric_inc: "Total Income", metric_save: "Savings",
      chart_exp_title: "Expense Trend", chart_exp_sub: "Activity and trend",
      chart_cat_title: "Expense Breakdown", chart_cat_sub: "By category",
      recent_title: "Recent transactions", recent_sub: "Your latest operations", see_all: "See all →",
      trans_intro: "Find, filter and edit your operations.", btn_new_op: "＋ New transaction",
      filter_all_types: "All types", type_expense: "Expenses", type_income: "Income", type_transfer: "Transfers", filter_all_cats: "All categories"
    },
    zh: {
      nav_dashboard: "总览", nav_transactions: "交易记录", nav_budgets: "预算管理", nav_stats: "统计分析", nav_settings: "设置",
      btn_add: "添加交易", dash_intro: "一目了然您的财务状况。",
      range_week: "周", range_month: "月", range_year: "年", range_day: "日",
      metric_net: "净额", metric_exp: "总支出", metric_inc: "总收入", metric_save: "储蓄",
      chart_exp_title: "支出趋势", chart_exp_sub: "活动与趋势",
      chart_cat_title: "支出分布", chart_cat_sub: "按类别",
      recent_title: "近期交易", recent_sub: "您的最新操作", see_all: "查看全部 →",
      trans_intro: "查找、筛选和修改您的操作。", btn_new_op: "＋ 新建交易",
      filter_all_types: "所有类型", type_expense: "支出", type_income: "收入", type_transfer: "转账", filter_all_cats: "所有分类"
    }
  };

  function t(key) { return translations[currentLang]?.[key] || translations['fr'][key] || key; }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      if (t(key)) el.textContent = t(key);
    });
    if ($("app-currency")) $("app-currency").value = currentCurrency;
    if ($("app-lang")) $("app-lang").value = currentLang;
    if ($("auth-lang-select")) $("auth-lang-select").value = currentLang;
  }

  const today = Finance.localDate();
  const categoryName = id => categories.find(c => c.id === id)?.name || "Catégorie";
  const escapeHTML = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  
  function customMoney(cents) {
    const formatted = (cents / 100).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${currentCurrency}`;
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
    const landingPage = $("landing-page");
    const appDiv = $("app");
    if (landingPage) landingPage.hidden = false;
    if (appDiv) appDiv.hidden = true;
  }

  function showApp() {
    const landingPage = $("landing-page");
    const appDiv = $("app");
    if (landingPage) landingPage.hidden = true;
    if (appDiv) appDiv.hidden = false;
    refresh();
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

  document.querySelectorAll(".nav-link").forEach(btn => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      const page = btn.dataset.page;
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === "page-" + page));
      document.querySelectorAll(".nav-link").forEach(b => {
        b.classList.toggle("active", b === btn);
        b.setAttribute("aria-current", b === btn ? "page" : false);
      });
      const titles = { dashboard: t('nav_dashboard'), transactions: t('nav_transactions'), budgets: t('nav_budgets'), statistics: t('nav_stats'), settings: t('nav_settings') };
      $("page-title").textContent = titles[page] || titles.dashboard;
      if (sidebar?.classList.contains("is-open")) toggleSidebar();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  });

  function fillCategorySelect(selectId, filterFn, includeAllOption = false) {
    const sel = $(selectId);
    if (!sel) return;
    const old = sel.value;
    let html = includeAllOption ? `<option value="">${t('filter_all_cats')}</option>` : "";
    html += categories.filter(filterFn).map(c => `<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");
    sel.innerHTML = html;
    if ([...sel.options].some(o => o.value === old)) sel.value = old;
  }

  function renderCategoryOptions() {
    const type = $("transaction-type")?.value || "expense";
    fillCategorySelect("transaction-category", category => category.kind === type);
    fillCategorySelect("filter-category", () => true, true);
  }

  $("transaction-type")?.addEventListener("change", renderCategoryOptions);

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

  async function refresh() {
    try {
      [transactions, categories, budgets] = await Promise.all([
        BudgetDB.getTransactions(),
        BudgetDB.getCategories(),
        BudgetDB.getBudgets()
      ]);
      transactions.sort((a, b) => b.date.localeCompare(a.date) || (b.createdAt || "").localeCompare(a.createdAt || ""));
      renderAll();
    } catch (err) {
      console.error("Erreur de rafraîchissement :", err);
    }
  }

  function renderAll() {
    applyTranslations();
    renderCategoryOptions();
    renderDashboard();
    renderTransactions();
    renderBudgets();
    renderStatistics();
    updateUserProfileInfo();
  }
// Fonction de filtrage par période (Semaine, Mois, Année)
  function getFilteredTransactions() {
    return transactions.filter(t => {
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
    const filteredItems = getFilteredTransactions();
    
    const income = Finance.sum(filteredItems, "income");
    const expense = Finance.sum(filteredItems, "expense");
    const net = income - expense;
    const saving = filteredItems.filter(t => t.type === "transfer" || /épargne|savings/i.test(categoryName(t.categoryId))).reduce((s, t) => s + t.amountCents, 0);

    let periodText = "";
    const locale = currentLang === 'fr' ? 'fr-FR' : 'en-US';

    if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);
      periodText = `Semaine du ${startOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short' })} au ${endOfWeek.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (currentRange === 'year') {
      periodText = `Année ${referenceDate.getFullYear()}`;
    } else {
      const monthFormatted = new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' }).format(referenceDate);
      periodText = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);
    }

    if ($("period-display-label")) $("period-display-label").textContent = periodText;

    if ($("metric-net")) {
      $("metric-net").textContent = customMoney(net);
      $("metric-net").style.color = net < 0 ? "#b74e48" : "#10b981";
    }
    if ($("metric-expense")) $("metric-expense").textContent = customMoney(expense);
    if ($("metric-income")) $("metric-income").textContent = customMoney(income);
    if ($("metric-saving")) $("metric-saving").textContent = customMoney(saving);

    renderCharts(filteredItems);
  }

function renderCharts(items) {
    // 1. Histogramme d'évolution des dépenses par date
    const canvasDaily = document.getElementById('dailyChart');
    if (canvasDaily && window.Chart) {
      if (dailyChartInstance) dailyChartInstance.destroy();

      const dateTotals = {};
      items.filter(t => t.type === 'expense').forEach(t => {
        dateTotals[t.date] = (dateTotals[t.date] || 0) + (t.amountCents / 100);
      });

      const labels = Object.keys(dateTotals).sort();
      const data = labels.map(date => dateTotals[date]);

      dailyChartInstance = new Chart(canvasDaily.getContext('2d'), {
        type: 'bar',
        data: {
          labels: labels.length ? labels : ['Aucune donnée'],
          datasets: [{
            label: 'Dépenses',
            data: data.length ? data : [0],
            backgroundColor: '#10b981',
            borderRadius: 6
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: { legend: { display: false } }
        }
      });
    }

    // 2. Graphique Camembert / Donut (Répartition par catégorie)
    const canvasDoughnut = document.getElementById('categoryDoughnutChart');
    if (canvasDoughnut && window.Chart) {
      if (doughnutChartInstance) doughnutChartInstance.destroy();

      const expenses = items.filter(t => t.type === 'expense');
      const catTotals = {};
      expenses.forEach(t => {
        const cName = categoryName(t.categoryId);
        catTotals[cName] = (catTotals[cName] || 0) + (t.amountCents / 100);
      });

      const labels = Object.keys(catTotals);
      const data = Object.values(catTotals);

      doughnutChartInstance = new Chart(canvasDoughnut.getContext('2d'), {
        type: 'doughnut',
        data: {
          labels: labels.length ? labels : ['Aucune dépense'],
          datasets: [{
            data: data.length ? data : [1],
            backgroundColor: ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'],
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

    const filtered = transactions.filter(t => {
      const catName = categoryName(t.categoryId).toLowerCase();
      const desc = (t.description || "").toLowerCase();
      
      const matchesSearch = desc.includes(searchTerm) || catName.includes(searchTerm);
      const matchesType = !typeFilter || t.type === typeFilter;
      const matchesCat = !catFilter || t.categoryId === catFilter;

      return matchesSearch && matchesType && matchesCat;
    });

    listEl.innerHTML = filtered.length ? filtered.map(t => {
      const amountFormatted = t.type === "income" ? `+ ${customMoney(t.amountCents)}` : `− ${customMoney(t.amountCents)}`;
      const cls = t.type === "income" ? "positive" : "negative";
      const catName = categoryName(t.categoryId);
      
      const mainText = t.description ? t.description : catName;
      const subText = t.description ? catName : t.date;

      return `
        <div class="transaction-row">
          <div>
            <strong>${escapeHTML(mainText)}</strong>
            <small>${escapeHTML(subText)}</small>
          </div>
          <div class="amount ${cls}">${escapeHTML(amountFormatted)}</div>
        </div>
      `;
    }).join("") : `<div class="empty-state">Aucune transaction ne correspond à vos filtres.</div>`;
  }

  function renderBudgets() {
    const listEl = $("budget-list");
    if (!listEl) return;
  }

  function renderStatistics() {
    const statsIncome = $("stats-income");
    const statsExpense = $("stats-expense");
    const statsNet = $("stats-net");
    if (statsIncome) statsIncome.textContent = customMoney(Finance.sum(transactions, "income"));
    if (statsExpense) statsExpense.textContent = customMoney(Finance.sum(transactions, "expense"));
    if (statsNet) statsNet.textContent = customMoney(Finance.sum(transactions, "income") - Finance.sum(transactions, "expense"));
  }

  async function updateUserProfileInfo() {
    const infoEl = $("user-session-info");
    if (!infoEl) return;
    try {
      const client = BudgetDB.client();
      const { data: { user } } = await client.auth.getUser();
      if (user) {
        const meta = user.user_metadata || {};
        const fullName = (meta.first_name || meta.last_name) ? `${meta.first_name || ''} ${meta.last_name || ''}`.trim() : 'Mon Compte';
        infoEl.innerHTML = `<strong>Utilisateur :</strong> ${escapeHTML(fullName)}<br><strong>Email :</strong> ${escapeHTML(user.email)}`;
      }
    } catch (e) {
      infoEl.textContent = "Session non connectée.";
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
    $("signup-fields").hidden = true;
    $("btn-auth-submit").textContent = "Se connecter";
    $("auth-form").dataset.mode = "login";
  });

  $("tab-signup")?.addEventListener("click", () => {
    $("tab-signup").classList.add("active");
    $("tab-login").classList.remove("active");
    $("signup-fields").hidden = false;
    $("btn-auth-submit").textContent = "Créer mon compte";
    $("auth-form").dataset.mode = "signup";
  });

  $("auth-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const mode = $("auth-form").dataset.mode || "login";
    const email = $("auth-email").value.trim();
    const password = $("auth-password").value.trim();
    const firstName = $("auth-firstname")?.value.trim() || "";
    const lastName = $("auth-lastname")?.value.trim() || "";
    const errEl = $("auth-error");
    if (errEl) errEl.textContent = "Connexion en cours...";

    try {
      const client = BudgetDB.client();
      if (mode === "signup") {
        const { error } = await client.auth.signUp({ email, password, options: { data: { first_name: firstName, last_name: lastName } } });
        if (error) throw error;
        toast("Compte créé avec succès ! Connectez-vous.");
      } else {
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast("Connexion réussie !");
        showApp();
      }
} catch (err) {
      console.error("Détail complet de l'erreur d'auth :", err);
      if (errEl) errEl.textContent = "Erreur : " + (err.message || JSON.stringify(err));
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
    currentLang = e.target.value;
    localStorage.setItem('user_lang', currentLang);
    applyTranslations();
  });

  $("app-lang")?.addEventListener("change", (e) => {
    currentLang = e.target.value;
    localStorage.setItem('user_lang', currentLang);
    renderAll();
  });

  $("app-currency")?.addEventListener("change", (e) => {
    currentCurrency = e.target.value;
    localStorage.setItem('user_currency', currentCurrency);
    renderAll();
  });

  function openNewTransactionModal() {
    $("transaction-form").reset();
    $("transaction-date").value = today;
    renderCategoryOptions();
    showDialog("transaction-dialog");
  }

  $("quick-add")?.addEventListener("click", openNewTransactionModal);
  $("btn_new_op")?.addEventListener("click", openNewTransactionModal);
  $("mobile-add")?.addEventListener("click", openNewTransactionModal);

  $("transaction-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    if (submitBtn.disabled) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Enregistrement...";

      const tx = {
        date: $("transaction-date").value || today,
        amountCents: Finance.toCents($("transaction-amount").value),
        type: $("transaction-type").value,
        categoryId: $("transaction-category").value,
        description: $("transaction-description").value.trim()
      };
      await BudgetDB.putTransaction(tx);
      closeDialog("transaction-dialog");
      await refresh();
      toast("Opération enregistrée avec succès");
    } catch (err) {
      toast("Erreur : " + err.message);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enregistrer";
    }
  });

  checkAuthAndStart();
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
      toast("Profil mis à jour avec succès !");
    } catch (err) {
      toast("Erreur : " + err.message);
    }
  });
  // --- DÉCONNEXION AUTOMATIQUE APRÈS 15 MINUTES D'INACTIVITÉ ---
  let inactivityTimer;
  const INACTIVITY_LIMIT = 15 * 60 * 1000; // 15 minutes en millisecondes

  async function logoutDueToInactivity() {
    try {
      const client = BudgetDB.client();
      await client.auth.signOut();
      toast("Session expirée pour cause d'inactivité.");
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

  // 2. Enregistrer la nouvelle catégorie dans Supabase lors de la soumission
  $("category-form")?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const nameInput = $("new-category-name")?.value.trim();
    const currentType = $("transaction-type")?.value || "expense"; // Récupère si c'est une dépense ou un revenu

    if (!nameInput) return;

    try {
      const client = BudgetDB.client();
      const { data: { user } } = await client.auth.getUser();

      if (!user) throw new Error("Utilisateur non connecté");

      // Insertion dans la table 'categories' de Supabase
      const { error } = await client.from('categories').insert([
        { 
          name: nameInput, 
          kind: currentType, // 'expense' ou 'income'
          user_id: user.id, 
          is_global: false 
        }
      ]);

      if (error) throw error;

      closeDialog("category-dialog");
      toast("Catégorie créée avec succès !");
      
      // On recharge les données pour que la nouvelle catégorie apparaisse direct dans le menu
      await refresh();
      
    } catch (err) {
      console.error("Erreur création catégorie :", err);
      toast("Erreur : " + err.message);
    }
  });
  $("search-transactions")?.addEventListener("input", renderTransactions);
  $("filter-type")?.addEventListener("change", renderTransactions);
  $("filter-category")?.addEventListener("change", renderTransactions);
})();
