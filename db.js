// ==========================================
// DB.JS — Gestion de la base de données Supabase
// ==========================================

const BudgetDB = {
  // Catégories par défaut si la table est vide
  defaults: [
    { id: "cat-alimentation", name: "Alimentation", kind: "expense" },
    { id: "cat-logement", name: "Logement", kind: "expense" },
    { id: "cat-transport", name: "Transport", kind: "expense" },
    { id: "cat-loisirs", name: "Loisirs", kind: "expense" },
    { id: "cat-salaire", name: "Salaire", kind: "income" },
    { id: "cat-epargne", name: "Épargne", kind: "transfer" }
  ],

  // --- TRANSACTIONS ---
  async getTransactions() {
    const { data, error } = await supabaseClient
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Erreur lors de la récupération des transactions :", error);
      return [];
    }
    return data || [];
  },

  async putTransaction(transaction) {
    // 1. Vérifier et récupérer l'utilisateur actuellement connecté
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();

    if (authError || !user) {
      throw new Error("Vous devez être connecté pour enregistrer une opération.");
    }

    // 2. Attacher l'identifiant unique de l'utilisateur (user_id) à la transaction
    const payload = {
      ...transaction,
      user_id: user.id
    };

    // 3. Envoyer la donnée sécurisée dans Supabase
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

  // --- CATÉGORIES ---
  async getCategories() {
    const { data, error } = await supabaseClient
      .from('categories')
      .select('*');

    if (error || !data || data.length === 0) {
      return this.defaults;
    }
    return data;
  },

  // --- BUDGETS ---
  async getBudgets() {
    const { data, error } = await supabaseClient
      .from('budgets')
      .select('*');

    if (error) {
      console.error("Erreur lors de la récupération des budgets :", error);
      return [];
    }
    return data || [];
  }
};