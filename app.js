(() => {
  const $=id=>document.getElementById(id);
  let transactions=[],categories=[],budgets=[],pendingImport=null,toastTimer;
  let currentRange = 'month'; 
  let referenceDate = new Date(); 
  let dailyChartInstance = null;
  let doughnutInstance = null;

  let currentLang = localStorage.getItem('user_lang') || 'fr';
  let currentCurrency = localStorage.getItem('user_currency') || 'FCFA';

  const translations = {
    fr: {
      nav_dashboard: "Vue d’ensemble", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistiques", nav_settings: "Sauvegarde & réglages",
      btn_add: "＋ Ajouter une opération", dash_intro: "Votre situation financière en un coup d'œil.",
      range_week: "Semaine", range_month: "Mois", range_year: "Année", range_day: "Jour",
      metric_net: "Solde Actuel / Net", metric_net_sub: "Capacité nette sur la période",
      metric_exp: "Total Dépenses", metric_exp_sub: "Consommation enregistrée",
      metric_inc: "Total Revenus", metric_inc_sub: "Entrées perçues",
      metric_save: "Épargne de côté", metric_save_sub: "Virements épargne",
      chart_exp_title: "Évolution des dépenses", chart_exp_sub: "Activité & courbe de tendance",
      chart_cat_title: "Répartition par catégorie", chart_cat_sub: "Vue en camembert",
      recent_title: "Opérations récentes", recent_sub: "Les dernières opérations enregistrées", see_all: "Voir tout →",
      trans_intro: "Retrouvez, filtrez et corrigez vos opérations.", btn_new_op: "＋ Nouvelle opération",
      filter_all_types: "Tous les types", type_expense: "Dépenses", type_income: "Revenus", type_transfer: "Transferts", filter_all_cats: "Toutes les catégories",
      budget_intro: "Fixez une limite par catégorie et suivez votre consommation.", btn_new_budget: "＋ Créer un budget", budget_month_label: "Budgets pour le mois sélectionné",
      stats_intro: "Analysez les revenus et dépenses à partir de vos données.", stats_note: "Les transferts internes sont exclus.", stats_activity: "Activité de la période", stats_activity_sub: "Comparaison revenus / dépenses",
      settings_intro: "Gardez le contrôle de vos données et préférences.", pref_currency: "Devise", pref_currency_desc: "Choisissez la monnaie d’affichage.", pref_lang: "Langue", pref_lang_desc: "Sélectionnez la langue de l’interface.",
      export_title: "Exporter une sauvegarde", export_desc: "Téléchargez toutes vos données en JSON.", btn_export: "Exporter mes données",
      import_title: "Restaurer une sauvegarde", import_desc: "Importez un fichier de sauvegarde JSON.", btn_import: "Choisir un fichier JSON",
      cat_title: "Catégories", cat_desc: "Ajoutez une catégorie personnalisée.", btn_manage_cat: "Gérer les catégories",
      clear_title: "Effacer les données locales", clear_desc: "Action irréversible sans sauvegarde.", btn_clear: "Effacer toutes les données",
      notice_title: "À savoir", notice_desc: "Données conservées localement dans ce navigateur.", footer_text: "Conçu pour une gestion simple et privée <span>•</span> Aucune connexion bancaire",
      modal_quick: "SAISIE RAPIDE", modal_type: "Type d’opération", modal_amount: "Montant", modal_date: "Date", modal_cat: "Catégorie", modal_desc: "Description", modal_optional: "(facultatif)", modal_nature: "Nature de la dépense", nature_var: "Variable", nature_fix: "Fixe", modal_recurring: "Opération récurrente",
      btn_cancel: "Annuler", btn_save: "Enregistrer", btn_close: "Fermer", btn_add: "Ajouter",
      modal_planning: "PLANIFICATION", modal_limit: "Limite mensuelle", modal_custom: "PERSONNALISATION", modal_new_cat: "Nom d’une nouvelle catégorie",
      modal_restore: "RESTAURATION", import_prompt: "Comment souhaitez-vous restaurer ce fichier ?", import_merge: "Fusionner avec mes données", import_replace: "Remplacer toutes mes données", import_confirm: "Confirmer l’import",
      privacy_title: "Vos données restent privées", privacy_desc: "Stockées dans ce navigateur, sur cet appareil."
    },
    en: {
      nav_dashboard: "Dashboard", nav_transactions: "Transactions", nav_budgets: "Budgets", nav_stats: "Statistics", nav_settings: "Settings & Backup",
      btn_add: "＋ Add transaction", dash_intro: "Your financial situation at a glance.",
      range_week: "Week", range_month: "Month", range_year: "Year", range_day: "Day",
      metric_net: "Current Balance / Net", metric_net_sub: "Net capacity over period",
      metric_exp: "Total Expenses", metric_exp_sub: "Recorded consumption",
      metric_inc: "Total Income", metric_inc_sub: "Recorded inflows",
      metric_save: "Savings", metric_save_sub: "Savings transfers",
      chart_exp_title: "Expense Evolution", chart_exp_sub: "Activity & trend curve",
      chart_cat_title: "Category Breakdown", chart_cat_sub: "Doughnut view",
      recent_title: "Recent Operations", recent_sub: "Latest recorded transactions", see_all: "View all →",
      trans_intro: "Find, filter and edit your operations.", btn_new_op: "＋ New transaction",
      filter_all_types: "All types", type_expense: "Expenses", type_income: "Income", type_transfer: "Transfers", filter_all_cats: "All categories",
      budget_intro: "Set a limit per category and track your spending.", btn_new_budget: "＋ Create budget", budget_month_label: "Budgets for selected month",
      stats_intro: "Analyze your income and expenses.", stats_note: "Internal transfers are excluded.", stats_activity: "Period Activity", stats_activity_sub: "Income vs expenses comparison",
      settings_intro: "Keep control over your data and preferences.", pref_currency: "Currency", pref_currency_desc: "Choose display currency.", pref_lang: "Language", pref_lang_desc: "Select interface language.",
      export_title: "Export Backup", export_desc: "Download all your data as JSON.", btn_export: "Export my data",
      import_title: "Restore Backup", import_desc: "Import a JSON backup file.", btn_import: "Choose JSON file",
      cat_title: "Categories", cat_desc: "Add a custom category.", btn_manage_cat: "Manage categories",
      clear_title: "Clear Local Data", clear_desc: "Irreversible without backup.", btn_clear: "Clear all data",
      notice_title: "Good to know", notice_desc: "Data is stored locally in this browser.", footer_text: "Designed for simple and private finance management <span>•</span> No bank connection",
      modal_quick: "QUICK ENTRY", modal_type: "Operation Type", modal_amount: "Amount", modal_date: "Date", modal_cat: "Category", modal_desc: "Description", modal_optional: "(optional)", modal_nature: "Expense Nature", nature_var: "Variable", nature_fix: "Fixed", modal_recurring: "Recurring operation",
      btn_cancel: "Cancel", btn_save: "Save", btn_close: "Close", btn_add: "Add",
      modal_planning: "PLANNING", modal_limit: "Monthly limit", modal_custom: "CUSTOMIZATION", modal_new_cat: "New category name",
      modal_restore: "RESTORATION", import_prompt: "How do you want to restore this file?", import_merge: "Merge with current data", import_replace: "Replace all current data", import_confirm: "Confirm import",
      privacy_title: "Your data remains private", privacy_desc: "Stored locally in this browser on this device."
    },
    zh: {
      nav_dashboard: "总览", nav_transactions: "交易记录", nav_budgets: "预算管理", nav_stats: "统计分析", nav_settings: "备份与设置",
      btn_add: "＋ 添加交易", dash_intro: "一目了然您的财务状况。",
      range_week: "周", range_month: "月", range_year: "年", range_day: "日",
      metric_net: "当前净额 / 结余", metric_net_sub: "期间净额",
      metric_exp: "总支出", metric_exp_sub: "已记录消费",
      metric_inc: "总收入", metric_inc_sub: "已记录收入",
      metric_save: "储蓄", metric_save_sub: "转入储蓄",
      chart_exp_title: "支出趋势", chart_exp_sub: "活动与趋势曲线",
      chart_cat_title: "分类占比", chart_cat_sub: "环形图视图",
      recent_title: "近期交易", recent_sub: "最近记录的操作", see_all: "查看全部 →",
      trans_intro: "查找、筛选和修改您的操作。", btn_new_op: "＋ 新建交易",
      filter_all_types: "所有类型", type_expense: "支出", type_income: "收入", type_transfer: "转账", filter_all_cats: "所有分类",
      budget_intro: "设定每个分类的预算限额并跟踪消费。", btn_new_budget: "＋ 创建预算", budget_month_label: "所选月份的预算",
      stats_intro: "分析您的收支数据。", stats_note: "内部转账不计入收支。", stats_activity: "期间活动", stats_activity_sub: "收支对比",
      settings_intro: "控制您的个人数据与偏好。", pref_currency: "货币", pref_currency_desc: "选择显示货币。", pref_lang: "语言", pref_lang_desc: "选择界面语言。",
      export_title: "导出备份", export_desc: "将所有数据下载为 JSON 文件。", btn_export: "导出我的数据",
      import_title: "恢复备份", import_desc: "导入 JSON 备份文件。", btn_import: "选择 JSON 文件",
      cat_title: "分类", cat_desc: "添加自定义分类。", btn_manage_cat: "管理分类",
      clear_title: "清除本地数据", clear_desc: "无备份时操作不可逆。", btn_clear: "清除所有数据",
      notice_title: "须知", notice_desc: "数据仅保存在此浏览器的本地存储中。", footer_text: "专为简单私密的财务管理而设计 <span>•</span> 无需连接银行",
      modal_quick: "快速记账", modal_type: "交易类型", modal_amount: "金额", modal_date: "日期", modal_cat: "分类", modal_desc: "描述", modal_optional: "(可选)", modal_nature: "支出性质", nature_var: "弹性", nature_fix: "固定", modal_recurring: "定期交易",
      btn_cancel: "取消", btn_save: "保存", btn_close: "关闭", btn_add: "添加",
      modal_planning: "计划", modal_limit: "每月限额", modal_custom: "自定义", modal_new_cat: "新分类名称",
      modal_restore: "还原", import_prompt: "您想如何还原此文件？", import_merge: "与当前数据合并", import_replace: "替换所有当前数据", import_confirm: "确认导入",
      privacy_title: "您的数据完全隐私", privacy_desc: "仅保存在此浏览器和设备中。"
    }
  };

  function t(key) { return translations[currentLang]?.[key] || translations['fr'][key] || key; }

  function applyTranslations() {
    document.querySelectorAll("[data-i18n]").forEach(el => {
      const key = el.getAttribute("data-i18n");
      el.textContent = t(key);
    });
    if ($("app-currency")) $("app-currency").value = currentCurrency;
    if ($("app-lang")) $("app-lang").value = currentLang;
  }

  const today=Finance.localDate();
  const categoryName=id=>categories.find(c=>c.id===id)?.name||"Catégorie supprimée";
  const escapeHTML=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
  
  function customMoney(cents) {
    const formatted = (cents / 100).toLocaleString(currentLang === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return `${formatted} ${currentCurrency}`;
  }

  function toast(message){const el=$("toast");el.textContent=message;el.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove("show"),2600);}
  function showDialog(id){$(id).showModal();}
  function closeDialog(id){$(id).close();}
  async function refresh(){[transactions,categories,budgets]=await Promise.all([BudgetDB.getTransactions(),BudgetDB.getCategories(),BudgetDB.getBudgets()]);transactions.sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||"").localeCompare(a.createdAt||""));renderAll();}
  function renderAll(){applyTranslations();renderCategoryOptions();renderDashboard();renderTransactions();renderBudgets();renderStats();renderCategoryManager();}
  
  function go(page){
    document.querySelectorAll(".page").forEach(p=>p.classList.toggle("active",p.id==="page-"+page));
    document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.page===page));
    const titles={dashboard:t('nav_dashboard'),transactions:t('nav_transactions'),budgets:t('nav_budgets'),statistics:t('nav_stats'),settings:t('nav_settings')};
    $("page-title").textContent=titles[page]||titles.dashboard;
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function renderCategoryOptions(){
    const fill=(id,filter)=>{const sel=$(id),old=sel.value;sel.innerHTML=categories.filter(filter).map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");if([...sel.options].some(o=>o.value===old))sel.value=old;};
    fill("transaction-category",c=>true);fill("budget-category",c=>c.kind==="expense");
    const old=$("filter-category").value;$("filter-category").innerHTML=`<option value="">${t('filter_all_cats')}</option>`+categories.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");$("filter-category").value=old;
  }

  document.querySelectorAll('.range-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      document.querySelectorAll('.range-btn').forEach(b => {
        b.classList.remove('active');
      });
      e.target.classList.add('active');
      currentRange = e.target.dataset.range;
      referenceDate = new Date();
      renderDashboard();
    });
  });

  // --- CALENDRIER POPUP PERSONNALISÉ ---
  let calendarViewDate = new Date(referenceDate);
  let calendarPopup;

  function ensureCalendarPopup() {
    if (calendarPopup) return calendarPopup;
    calendarPopup = document.createElement('div');
    calendarPopup.id = 'date-calendar-popup';
    calendarPopup.className = 'date-calendar-popup';
    calendarPopup.hidden = true;
    calendarPopup.setAttribute('role', 'dialog');
    calendarPopup.setAttribute('aria-label', 'Choisir une date');
    $("period-display-label").parentElement.appendChild(calendarPopup);
    document.addEventListener('click', (event) => {
      if (calendarPopup && !calendarPopup.hidden &&
          !calendarPopup.contains(event.target) && event.target !== $("period-display-label")) {
        calendarPopup.hidden = true;
      }
    });
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && calendarPopup) calendarPopup.hidden = true;
    });
    return calendarPopup;
  }

  function renderDateCalendar() {
    const popup = ensureCalendarPopup();
    const year = calendarViewDate.getFullYear();
    const month = calendarViewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const offset = (firstDay.getDay() + 6) % 7; // Lundi en première colonne
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const selectedKey = `${referenceDate.getFullYear()}-${String(referenceDate.getMonth()+1).padStart(2,'0')}-${String(referenceDate.getDate()).padStart(2,'0')}`;
    const todayKey = Finance.localDate();
    const monthTitle = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }).format(calendarViewDate);
    const weekdays = currentLang === 'fr' ? ['Lu','Ma','Me','Je','Ve','Sa','Di'] : ['Mo','Tu','We','Th','Fr','Sa','Su'];
    let days = weekdays.map(day => `<span class="calendar-weekday">${day}</span>`).join('');
    for (let i = 0; i < offset; i++) days += '<span class="calendar-empty"></span>';
    for (let day = 1; day <= daysInMonth; day++) {
      const key = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
      const classes = ['calendar-day', key === selectedKey ? 'selected' : '', key === todayKey ? 'today' : ''].filter(Boolean).join(' ');
      days += `<button type="button" class="${classes}" data-calendar-date="${key}" aria-pressed="${key === selectedKey}">${day}</button>`;
    }
    popup.innerHTML = `<div class="calendar-header"><button type="button" class="calendar-prev" aria-label="Mois précédent">‹</button><strong>${monthTitle.charAt(0).toUpperCase()+monthTitle.slice(1)}</strong><button type="button" class="calendar-next" aria-label="Mois suivant">›</button></div><div class="calendar-grid">${days}</div><div class="calendar-footer"><button type="button" class="calendar-today">Aujourd’hui</button><button type="button" class="calendar-close">Fermer</button></div>`;
    popup.querySelector('.calendar-prev').addEventListener('click', () => { calendarViewDate.setMonth(calendarViewDate.getMonth()-1); renderDateCalendar(); });
    popup.querySelector('.calendar-next').addEventListener('click', () => { calendarViewDate.setMonth(calendarViewDate.getMonth()+1); renderDateCalendar(); });
    popup.querySelectorAll('[data-calendar-date]').forEach(button => button.addEventListener('click', () => {
      const [y, m, d] = button.dataset.calendarDate.split('-').map(Number);
      referenceDate = new Date(y, m-1, d);
      // Le calendrier sélectionne une date; la vue courante (semaine/mois/année) est conservée.
      popup.hidden = true;
      renderDashboard();
    }));
    popup.querySelector('.calendar-today').addEventListener('click', () => {
      referenceDate = new Date(); calendarViewDate = new Date(); popup.hidden = true; renderDashboard();
    });
    popup.querySelector('.calendar-close').addEventListener('click', () => { popup.hidden = true; });
  }

  $("period-display-label").addEventListener('click', (event) => {
    event.stopPropagation();
    calendarViewDate = new Date(referenceDate);
    const popup = ensureCalendarPopup();
    renderDateCalendar();
    popup.hidden = false;
  });

  // Boutons fléchés (Précédent / Suivant)
  $("prev-period").addEventListener('click', () => {
    if (currentRange === 'month') {
      const day = referenceDate.getDate();
      referenceDate.setDate(1);
      referenceDate.setMonth(referenceDate.getMonth() - 1);
      referenceDate.setDate(Math.min(day, new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()));
    } else if (currentRange === 'year') referenceDate.setFullYear(referenceDate.getFullYear() - 1);
    else if (currentRange === 'week') referenceDate.setDate(referenceDate.getDate() - 7);
    renderDashboard();
  });

  $("next-period").addEventListener('click', () => {
    if (currentRange === 'month') {
      const day = referenceDate.getDate();
      referenceDate.setDate(1);
      referenceDate.setMonth(referenceDate.getMonth() + 1);
      referenceDate.setDate(Math.min(day, new Date(referenceDate.getFullYear(), referenceDate.getMonth() + 1, 0).getDate()));
    } else if (currentRange === 'year') referenceDate.setFullYear(referenceDate.getFullYear() + 1);
    else if (currentRange === 'week') referenceDate.setDate(referenceDate.getDate() + 7);
    renderDashboard();
  });

  function renderDashboard(){
    let filteredItems = [];
    const year = referenceDate.getFullYear();
    const month = referenceDate.getMonth();
    const monthStr = String(month + 1).padStart(2, '0');
    const yearMonthKey = `${year}-${monthStr}`;

    if (currentRange === 'month') {
      filteredItems = transactions.filter(t => Finance.monthKey(t.date) === yearMonthKey);
      const monthFormatted = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US',{month:"long",year:"numeric"}).format(referenceDate);
      $("period-display-label").textContent = monthFormatted.charAt(0).toUpperCase() + monthFormatted.slice(1);
      $("period-heading").textContent = `${t('range_month')} de ${monthFormatted}`;
    } else if (currentRange === 'year') {
      filteredItems = transactions.filter(t => t.date.startsWith(String(year)));
      $("period-display-label").textContent = `${t('range_year')} ${year}`;
      $("period-heading").textContent = `Synthèse ${year}`;
    } else if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);

      filteredItems = transactions.filter(t => {
        const d = new Date(t.date);
        return d >= startOfWeek && d <= endOfWeek;
      });

      const options = { day: 'numeric', month: 'short' };
      const startStr = startOfWeek.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
      const endStr = endOfWeek.toLocaleDateString(currentLang === 'fr' ? 'fr-FR' : 'en-US', options);
      $("period-display-label").textContent = `${startStr} - ${endStr}`;
      $("period-heading").textContent = `${startStr} au ${endStr}`;
    }

    const income = Finance.sum(filteredItems, "income");
    const expense = Finance.sum(filteredItems, "expense");
    const net = income - expense;
    const saving = filteredItems.filter(t => t.type==="transfer" && /épargne|savings/i.test(categoryName(t.categoryId))).reduce((s,t)=>s+t.amountCents,0);

    $("metric-net").textContent = customMoney(net);
    $("metric-net").style.color = net < 0 ? "#b74e48" : "#10b981";
    $("metric-expense").textContent = customMoney(expense);
    $("metric-income").textContent = customMoney(income);
    $("metric-saving").textContent = customMoney(saving);

    let chartLabels = [];
    let chartValues = [];

    if (currentRange === 'week') {
      const startOfWeek = new Date(referenceDate);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);

      for (let i = 0; i < 7; i++) {
        const d = new Date(startOfWeek);
        d.setDate(startOfWeek.getDate() + i);
        const dateStr = d.toISOString().slice(0,10);
        const dayName = new Intl.DateTimeFormat(currentLang === 'fr' ? 'fr-FR' : 'en-US', { weekday: 'short' }).format(d);
        chartLabels.push(dayName.charAt(0).toUpperCase() + dayName.slice(1));
        const dayExp = filteredItems.filter(t => t.type === "expense" && t.date === dateStr).reduce((s,t)=>s+t.amountCents,0);
        chartValues.push(dayExp / 100);
      }
    } else if (currentRange === 'year') {
      const monthsShort = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
      chartLabels = monthsShort;
      chartValues = monthsShort.map((_, index) => {
        const mStr = String(index + 1).padStart(2, '0');
        const mItems = transactions.filter(t => t.type === "expense" && t.date.startsWith(`${year}-${mStr}`));
        return mItems.reduce((s,t)=>s+t.amountCents,0) / 100;
      });
    } else {
      const daysCount = new Date(year, month + 1, 0).getDate();
      for (let d = 1; d <= daysCount; d++) {
        const dStr = String(d).padStart(2, '0');
        const fullDate = `${yearMonthKey}-${dStr}`;
        chartLabels.push(d);
        const dayExp = filteredItems.filter(t => t.type === "expense" && t.date === fullDate).reduce((s,t)=>s+t.amountCents,0);
        chartValues.push(dayExp / 100);
      }
    }

    const canvasDaily = document.getElementById('dailyChart');
    if (canvasDaily) {
      const ctxDaily = canvasDaily.getContext('2d');
      if (dailyChartInstance) dailyChartInstance.destroy();

      dailyChartInstance = new Chart(ctxDaily, {
        type: 'bar',
        data: {
          labels: chartLabels,
          datasets: [
            { type: 'bar', label: t('type_expense'), data: chartValues, backgroundColor: '#10b981', borderRadius: 6, barPercentage: 0.6 },
            { type: 'line', label: 'Tendance', data: chartValues, borderColor: '#3b82f6', backgroundColor: 'transparent', borderWidth: 2.5, tension: 0.4, pointRadius: 3, pointBackgroundColor: '#3b82f6' }
          ]
        },
        options: {
          responsive: true, maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: { callbacks: { label: function(context) { return ` ${context.dataset.label}: ${customMoney(context.raw * 100)}`; } } }
          },
          scales: {
            y: { beginAtZero: true, grid: { color: '#f3f4f6' }, ticks: { font: { size: 11 }, callback: function(value) { return value + ' ' + currentCurrency; } } },
            x: { grid: { display: false }, ticks: { font: { size: 11 } } }
          }
        }
      });
    }

    const categoryMap = {};
    let totalExpenseCents = 0;
    filteredItems.filter(t => t.type === "expense").forEach(t => {
      const catName = categoryName(t.categoryId);
      categoryMap[catName] = (categoryMap[catName] || 0) + t.amountCents;
      totalExpenseCents += t.amountCents;
    });

    const catLabels = Object.keys(categoryMap);
    const catData = Object.values(categoryMap).map(cents => cents / 100);

    const canvasEl = document.getElementById('categoryDoughnutChart');
    if (canvasEl) {
      const ctx = canvasEl.getContext('2d');
      if (doughnutInstance) doughnutInstance.destroy();

      if (catLabels.length > 0) {
        doughnutInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catLabels,
            datasets: [{
              data: catData,
              backgroundColor: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316', '#6366f1'],
              borderWidth: 3, borderColor: '#ffffff', hoverOffset: 6
            }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  boxWidth: 12, boxHeight: 12, borderRadius: 6, useBorderRadius: true, font: { size: 11, weight: '500' }, padding: 12,
                  generateLabels: (chart) => {
                    const data = chart.data;
                    if (data.labels.length && data.datasets.length) {
                      return data.labels.map((label, i) => {
                        const value = data.datasets[0].data[i];
                        const percentage = totalExpenseCents > 0 ? ((value * 100) / (totalExpenseCents / 100)).toFixed(1) : 0;
                        return { text: `${label} (${percentage}%)`, fillStyle: data.datasets[0].backgroundColor[i], strokeStyle: '#fff', lineWidth: 2, hidden: false, index: i };
                      });
                    }
                    return [];
                  }
                }
              },
              tooltip: { callbacks: { label: function(context) { const value = context.raw; const percentage = totalExpenseCents > 0 ? ((value * 100) / (totalExpenseCents / 100)).toFixed(1) : 0; return ` ${customMoney(value * 100)} (${percentage}%)`; } } }
            },
            cutout: '65%'
          }
        });
      }
    }

    const recent = [...transactions].sort((a,b)=>b.date.localeCompare(a.date)||(b.createdAt||"").localeCompare(a.createdAt||"")).slice(0,5);
    $("recent-transactions").innerHTML = recent.length ? recent.map(t=>transactionRow(t,false)).join("") : `<div class="empty-state">${t('recent_sub')}</div>`;
  }

  function transactionRow(t,actions=true){
    const icon=t.type==="income"?"↗":t.type==="transfer"?"⇄":"↘",amount=t.type==="income"?`+ ${customMoney(t.amountCents)}`:t.type==="expense"?`− ${customMoney(t.amountCents)}`:customMoney(t.amountCents),cls=t.type==="income"?"positive":t.type==="expense"?"negative":"";
    const type=t.type==="income"?translations[currentLang]?.type_income||translations.fr.type_income:t.type==="transfer"?translations[currentLang]?.type_transfer||translations.fr.type_transfer:translations[currentLang]?.type_expense||translations.fr.type_expense;
    return `<div class="transaction-row"><div class="transaction-main"><span class="transaction-icon">${icon}</span><div><strong>${escapeHTML(t.description||categoryName(t.categoryId))}</strong><small>${escapeHTML(categoryName(t.categoryId))}${t.recurring?" · Récurrent":""}${t.type==="expense"?" · "+(t.expenseKind==="fixed"?"Fixe":"Variable"):""}</small></div></div><div class="transaction-meta">${new Date(t.date+"T12:00:00").toLocaleDateString(currentLang==='fr'?'fr-FR':'en-US',{day:"2-digit",month:"short",year:"numeric"})}<small>${type}</small></div><div class="amount ${cls}">${escapeHTML(amount)}</div>${actions?`<div class="row-actions"><button data-edit="${escapeHTML(t.id)}">Modifier</button><button data-delete="${escapeHTML(t.id)}">Supprimer</button></div>`:""}</div>`;
  }

  function renderTransactions(){
    const q=$("search-transactions").value.trim().toLocaleLowerCase("fr"),type=$("filter-type").value,cat=$("filter-category").value,from=$("filter-from").value,to=$("filter-to").value;
    const list=transactions.filter(t=>(!q||(t.description||"").toLocaleLowerCase("fr").includes(q)||categoryName(t.categoryId).toLocaleLowerCase("fr").includes(q))&&(!type||t.type===type)&&(!cat||t.categoryId===cat)&&(!from||t.date>=from)&&(!to||t.date<=to));
    $("transaction-list").innerHTML=list.length?list.map(t=>transactionRow(t,true)).join(""):`<div class="empty-state">Aucune transaction correspondante.</div>`;
  }

  function renderBudgets(){
    const month=$("budget-month").value||today.slice(0,7);
    const active=budgets.filter(b=>b.month===month);
    $("budget-list").innerHTML=active.length?active.map(b=>{
      const spent=transactions.filter(t=>t.type==="expense"&&t.categoryId===b.categoryId&&Finance.monthKey(t.date)===month).reduce((s,t)=>s+t.amountCents,0),pct=spent/b.limitCents*100,remaining=b.limitCents-spent,cl=pct>=100?"over":pct>=80?"warn":"";
      return `<article class="budget-card"><div class="budget-card-top"><div><h3>${escapeHTML(categoryName(b.categoryId))}</h3><p>${escapeHTML(month)}</p></div><span class="metric-icon ${cl==="over"?"expense":cl==="warn"?"saving":"income"}">${pct>=100?"!":"%"}</span></div><div class="budget-amount">${customMoney(spent)} <small>/ ${customMoney(b.limitCents)}</small></div><div class="progress-track"><div class="progress-fill ${cl}" style="width:${Math.min(pct,100)}%"></div></div><div class="budget-stats"><span>${Math.round(pct)} %</span><span>${remaining>=0?"Restant : "+customMoney(remaining):"Dépassé : "+customMoney(-remaining)}</span></div><div class="row-actions"><button data-budget-delete="${escapeHTML(b.id)}">Supprimer</button></div></article>`;
    }).join(""):`<div class="panel empty-state" style="grid-column:1/-1">Aucun budget pour ce mois.</div>`;
  }

  function renderStats(){
    const period=$("stats-period").value,month=$("stats-month").value||today.slice(0,7),key=period==="year"?month.slice(0,4):period==="day"?today:month,s=Finance.summarize(transactions,period,key);
    $("stats-income").textContent=customMoney(s.income);$("stats-expense").textContent=customMoney(s.expense);$("stats-net").textContent=customMoney(s.net);
  }

  function renderCategoryManager(){$("category-manage-list").innerHTML=categories.map(c=>`<div class="category-manage-row"><span>${escapeHTML(c.name)}</span>${BudgetDB.defaults.some(d=>d.id===c.id)?'<span class="muted">Par défaut</span>':`<button type="button" data-category-delete="${escapeHTML(c.id)}">Supprimer</button>`}</div>`).join("");}

  function openTransaction(t=null){
    $("transaction-form").reset();$("transaction-id").value=t?.id||"";$("transaction-modal-title").textContent=t?"Modifier l’opération":t('btn_new_op');$("transaction-type").value=t?.type||"expense";$("transaction-amount").value=t?(t.amountCents/100).toFixed(2):"";$("transaction-date").value=t?.date||today;$("transaction-category").value=t?.categoryId||categories.find(c=>c.kind==="expense")?.id||"";$("transaction-description").value=t?.description||"";$("expense-kind").value=t?.expenseKind||"variable";$("transaction-recurring").checked=!!t?.recurring;toggleExpenseKind();showDialog("transaction-dialog");
  }
  function toggleExpenseKind(){$("expense-kind-wrap").style.display=$("transaction-type").value==="expense"?"block":"none";const type=$("transaction-type").value;const sel=$("transaction-category");const allowed=categories.filter(c=>c.kind===type||type==="transfer"&&c.kind==="transfer"||type==="expense"&&c.kind==="expense"||type==="income"&&c.kind==="income");sel.innerHTML=allowed.map(c=>`<option value="${escapeHTML(c.id)}">${escapeHTML(c.name)}</option>`).join("");}
  async function saveTransaction(e){e.preventDefault();try{const id=$("transaction-id").value;const amountCents=Finance.toCents($("transaction-amount").value),date=$("transaction-date").value,type=$("transaction-type").value,categoryId=$("transaction-category").value;if(!date||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!categoryId)throw new Error("Complétez la date et la catégorie.");const existing=transactions.find(t=>t.id===id);const tx={id:id||Finance.uid(),date,amountCents,type,categoryId,description:$("transaction-description").value.trim(),expenseKind:type==="expense"?$("expense-kind").value:null,recurring:$("transaction-recurring").checked,createdAt:existing?.createdAt||new Date().toISOString(),updatedAt:new Date().toISOString()};await BudgetDB.putTransaction(tx);closeDialog("transaction-dialog");await refresh();toast("Opération enregistrée.");}catch(err){toast(err.message||"Erreur");}}
  async function deleteTransaction(id){if(!confirm("Supprimer ?"))return;await BudgetDB.deleteTransaction(id);await refresh();toast("Supprimé.");}
  async function createBudget(e){e.preventDefault();try{const categoryId=$("budget-category").value,limitCents=Finance.toCents($("budget-limit").value),month=$("budget-month").value||today.slice(0,7);await BudgetDB.putBudget({id:Finance.uid(),categoryId,limitCents,month});closeDialog("budget-dialog");await refresh();toast("Budget créé.");}catch(err){toast("Erreur");}}
  function exportData(){const data={app:"mon-budget",version:1,exportedAt:new Date().toISOString(),transactions,categories,budgets};const blob=new Blob([JSON.stringify(data,null,2)],{type:"application/json"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`mon-budget-${today}.json`;a.click();URL.revokeObjectURL(url);toast("Exporté.");}
  async function chooseImport(file){try{if(!file)return;const data=JSON.parse(await file.text());pendingImport=data;showDialog("import-dialog");}catch(err){toast("Fichier invalide.");}finally{$("import-file").value="";}}
  async function confirmImport(e){e.preventDefault();if(!pendingImport)return;const mode=new FormData($("import-form")).get("import-mode");await BudgetDB.importData(pendingImport,mode);pendingImport=null;closeDialog("import-dialog");await refresh();toast("Import réussi.");}
  
  function bind(){
    // Bouton de navigation mobile: le volet peut toujours être rouvert.
    const menuButton = document.createElement('button');
    menuButton.type = 'button';
    menuButton.id = 'sidebar-toggle';
    menuButton.className = 'sidebar-toggle';
    menuButton.setAttribute('aria-label', 'Ouvrir la navigation');
    menuButton.setAttribute('aria-expanded', 'false');
    menuButton.textContent = '☰';
    document.body.appendChild(menuButton);
    const navBackdrop = document.createElement('button');
    navBackdrop.type = 'button';
    navBackdrop.id = 'sidebar-backdrop';
    navBackdrop.className = 'sidebar-backdrop';
    navBackdrop.setAttribute('aria-label', 'Fermer la navigation');
    document.body.appendChild(navBackdrop);
    const closeSidebar = () => {
      document.querySelector('.sidebar')?.classList.remove('is-open');
      navBackdrop.classList.remove('is-visible');
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'Ouvrir la navigation');
      document.body.classList.remove('nav-open');
    };
    menuButton.addEventListener('click', () => {
      const sidebar = document.querySelector('.sidebar');
      const willOpen = !sidebar.classList.contains('is-open');
      sidebar.classList.toggle('is-open', willOpen);
      navBackdrop.classList.toggle('is-visible', willOpen);
      menuButton.setAttribute('aria-expanded', String(willOpen));
      menuButton.setAttribute('aria-label', willOpen ? 'Fermer la navigation' : 'Ouvrir la navigation');
      document.body.classList.toggle('nav-open', willOpen);
    });
    navBackdrop.addEventListener('click', closeSidebar);
    document.querySelectorAll("[data-page]").forEach(b=>b.addEventListener("click",()=>{go(b.dataset.page);closeSidebar();}));
    document.querySelectorAll("[data-goto]").forEach(b=>b.addEventListener("click",()=>go(b.dataset.goto)));
    ["quick-add","mobile-add","add-transaction"].forEach(id=>$(id).addEventListener("click",()=>openTransaction()));
    
    $("app-currency").addEventListener("change", (e) => {
      currentCurrency = e.target.value;
      localStorage.setItem('user_currency', currentCurrency);
      renderAll();
      toast("Devise mise à jour.");
    });

    $("app-lang").addEventListener("change", (e) => {
      currentLang = e.target.value;
      localStorage.setItem('user_lang', currentLang);
      renderAll();
      toast("Langue mise à jour.");
    });

    $("budget-month").value=today.slice(0,7);$("stats-month").value=today.slice(0,7);
    $("budget-month").addEventListener("change",renderBudgets);$("stats-month").addEventListener("change",renderStats);$("stats-period").addEventListener("change",renderStats);
    ["search-transactions","filter-type","filter-category","filter-from","filter-to"].forEach(id=>$(id).addEventListener("input",renderTransactions));
    $("transaction-type").addEventListener("change",toggleExpenseKind);$("transaction-form").addEventListener("submit",saveTransaction);$("add-budget").addEventListener("click",()=>{ $("budget-form").reset();showDialog("budget-dialog");});$("budget-form").addEventListener("submit",createBudget);
    $("transaction-list").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit)openTransaction(transactions.find(t=>t.id===edit.dataset.edit));if(del)deleteTransaction(del.dataset.delete);});
    $("recent-transactions").addEventListener("click",e=>{const edit=e.target.closest("[data-edit]"),del=e.target.closest("[data-delete]");if(edit)openTransaction(transactions.find(t=>t.id===edit.dataset.edit));if(del)deleteTransaction(del.dataset.delete);});
    $("budget-list").addEventListener("click",async e=>{const b=e.target.closest("[data-budget-delete]");if(b&&confirm("Supprimer ?")){await BudgetDB.deleteBudget(b.dataset.budgetDelete);await refresh();}});
    $("export-data").addEventListener("click",exportData);$("import-file").addEventListener("change",e=>chooseImport(e.target.files[0]));$("import-form").addEventListener("submit",confirmImport);
    $("clear-data").addEventListener("click",async()=>{if(confirm("Effacer ?")){await BudgetDB.clearAll();await refresh();}});
    $("manage-categories").addEventListener("click",()=>showDialog("category-dialog"));
    $("category-form").addEventListener("submit",async e=>{e.preventDefault();const name=$("new-category").value.trim();if(!name)return;await BudgetDB.putCategory({id:Finance.uid(),name,kind:"expense"});$("new-category").value="";await refresh();});
    $("category-manage-list").addEventListener("click",async e=>{const b=e.target.closest("[data-category-delete]");if(!b)return;await BudgetDB.deleteCategory(b.dataset.categoryDelete);await refresh();});
    document.querySelectorAll("[data-close]").forEach(b=>b.addEventListener("click",()=>closeDialog(b.dataset.close)));
    ["transaction-dialog","budget-dialog","category-dialog","import-dialog"].forEach(id=>$(id).addEventListener("click",e=>{e.target===$(id)&&closeDialog(id);}));
  }

  async function init(){try{await BudgetDB.openDB();await BudgetDB.seedCategories();bind();await refresh();}catch(e){console.error(e);}}
  document.addEventListener("DOMContentLoaded",init);
})();