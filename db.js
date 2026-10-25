// ==========================================
// DB.JS — Gestion de la base de données Supabase (Robuste & Mappée)
// ==========================================

const BudgetDB = {
  defaults: [
    { id: "cat-alimentation", name: "Alimentation", kind: "expense" },
    { id: "cat-logement", name: "Logement", kind: "expense" },
    { id: "cat-transport", name: "Transport", kind: "expense" },
    { id: "cat-loisirs", name: "Loisirs", kind: "expense" },
    { id: "cat-salaire", name: "Salaire", kind: "income" },
    { id: "cat-epargne", name: "Épargne", kind: "transfer" }
  ],

  async getTransactions() {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      return [];
    }
    // Mapping sécurisé DB -> Application
    return (data || []).map(row => ({
      id: row.id,
      date: row.date,
      type: row.type,
      categoryId: row.category,
      amountCents: Math.round(Number(row.amount || 0) * 100),
      description: row.note || "",
      expenseKind: row.expense_kind || "variable",
      recurring: !!row.recurring,
      createdAt: row.created_at || new Date().toISOString()
    }));
  },

  async putTransaction(transaction) {
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error("Vous devez être connecté pour enregistrer une opération.");
    }

    // Mapping sécurisé Application -> DB
    const payload = {
      id: transaction.id,
      user_id: user.id,
      date: transaction.date,
      type: transaction.type,
      category: transaction.categoryId,
      amount: transaction.amountCents / 100,
      note: transaction.description || "",
      expense_kind: transaction.expenseKind || "variable",
      recurring: !!transaction.recurring,
      created_at: transaction.createdAt || new Date().toISOString()
    };

    const { data, error } = await supabaseClient
      .from('transactions')
      .upsert(payload);

    if (error) throw error;
    return data;
  },

  async deleteTransaction(id) {
    const { error } = await supabaseClient
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async getCategories() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*');

    if (error || !data || data.length === 0) {
      return this.defaults;
    }
    return data.map(c => ({
      id: c.id || c.name,
      name: c.name,
      kind: c.kind || 'expense'
    }));
  },

  async getBudgets() {
    const { data, error } = await supabaseClient
      .from('budgets')
      .select('*');

    if (error) {
      console.error("Erreur lors de la récupération des budgets :", error);
      return [];
    }
    return (data || []).map(b => ({
      id: b.id,
      month: b.month,
      categoryId: b.category,
      limitCents: Math.round(Number(b.limit_amount || b.limit || 0) * 100)
    }));
  }
};