/* =====================================================
   FINANCE.JS — Calculs et dates de Mon Budget
   ===================================================== */

window.Finance = (() => {
  function money(cents, currency = "EUR", lang = "fr-FR") {
    const amount = (Number(cents) || 0) / 100;

    try {
      return new Intl.NumberFormat(lang, {
        style: "currency",
        currency
      }).format(amount);
    } catch {
      return `${amount.toFixed(2)} ${currency}`;
    }
  }

  function toCents(value) {
    const normalized = String(value ?? "")
      .trim()
      .replace(/\s/g, "")
      .replace(",", ".");

    const amount = Number(normalized);

    if (
      !Number.isFinite(amount) ||
      amount <= 0 ||
      amount > 999999999999
    ) {
      throw new Error("Saisissez un montant positif valide.");
    }

    const cents = Math.round((amount + Number.EPSILON) * 100);

    if (!Number.isSafeInteger(cents)) {
      throw new Error("Ce montant est trop élevé.");
    }

    return cents;
  }

  function localDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  function monthKey(date) {
    return String(date || "").slice(0, 7);
  }

  function yearKey(date) {
    return String(date || "").slice(0, 4);
  }

  function uid() {
    if (globalThis.crypto?.randomUUID) {
      return globalThis.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  function sum(transactions, type) {
    return transactions
      .filter(transaction => transaction.type === type)
      .reduce(
        (total, transaction) =>
          total + (Number(transaction.amountCents) || 0),
        0
      );
  }

  function getWeekRange(dateString) {
    const date = new Date(`${dateString}T12:00:00`);

    if (Number.isNaN(date.getTime())) {
      throw new Error("Date invalide.");
    }

    const day = date.getDay();
    const offset = day === 0 ? -6 : 1 - day;

    const start = new Date(date);
    start.setDate(start.getDate() + offset);

    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    return {
      start: localDate(start),
      end: localDate(end)
    };
  }

  function inPeriod(transaction, period, key) {
    const date = transaction.date;

    if (!date) return false;

    if (period === "day") {
      return date === key;
    }

    if (period === "year") {
      return yearKey(date) === String(key).slice(0, 4);
    }

    if (period === "week") {
      const range = getWeekRange(key);
      return date >= range.start && date <= range.end;
    }

    return monthKey(date) === String(key).slice(0, 7);
  }

  function summarize(transactions, period, key) {
    const items = transactions.filter(transaction =>
      inPeriod(transaction, period, key)
    );

    const income = sum(items, "income");
    const expense = sum(items, "expense");
    const transfers = sum(items, "transfer");

    return {
      income,
      expense,
      transfers,
      net: income - expense,
      items
    };
  }

  function dailyExpenses(transactions, month) {
    const [year, monthNumber] = month.split("-").map(Number);
    const numberOfDays = new Date(year, monthNumber, 0).getDate();
    const totals = Array(numberOfDays).fill(0);

    transactions
      .filter(transaction =>
        transaction.type === "expense" &&
        monthKey(transaction.date) === month
      )
      .forEach(transaction => {
        const day = Number(transaction.date.slice(8, 10));

        if (day >= 1 && day <= numberOfDays) {
          totals[day - 1] += Number(transaction.amountCents) || 0;
        }
      });

    return totals;
  }

  function categoryTotals(transactions, categories, month) {
    const totals = new Map();

    transactions
      .filter(transaction =>
        transaction.type === "expense" &&
        monthKey(transaction.date) === month
      )
      .forEach(transaction => {
        const id = transaction.categoryId || "uncategorized";
        const amount = Number(transaction.amountCents) || 0;

        totals.set(id, (totals.get(id) || 0) + amount);
      });

    return Array.from(totals, ([id, cents]) => {
      const category = categories.find(item => item.id === id);

      return {
        id,
        name: category?.name || "Catégorie supprimée",
        cents
      };
    }).sort((a, b) => b.cents - a.cents);
  }

  return {
    money,
    toCents,
    localDate,
    monthKey,
    yearKey,
    uid,
    sum,
    getWeekRange,
    inPeriod,
    summarize,
    dailyExpenses,
    categoryTotals
  };
})();