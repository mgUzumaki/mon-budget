/* Supabase : stockage cloud multi-utilisateurs sécurisé avec RLS */
(function () {
  const SUPABASE_URL = 'https://fcsroswxrtlkmttsayrf.supabase.co';
  const SUPABASE_ANON_KEY = 'sb_publishable_lWjzSW8jq7iIW-yPJWrWqw_fTh0-Ix4';

  // Initialisation du client Supabase (nécessite le script global dans index.html)
  const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

  const DEFAULT_CATEGORIES = [
    {id:"logement",name:"Logement",kind:"expense"},
    {id:"courses",name:"Courses",kind:"expense"},
    {id:"restaurants",name:"Restaurants",kind:"expense"},
    {id:"transport",name:"Transport",kind:"expense"},
    {id:"abonnements",name:"Abonnements",kind:"expense"},
    {id:"sante",name:"Santé",kind:"expense"},
    {id:"shopping",name:"Shopping",kind:"expense"},
    {id:"loisirs",name:"Loisirs",kind:"expense"},
    {id:"voyages",name:"Voyages",kind:"expense"},
    {id:"factures",name:"Factures",kind:"expense"},
    {id:"autres",name:"Autres",kind:"expense"},
    {id:"salaire",name:"Salaire",kind:"income"},
    {id:"autre-revenu",name:"Autre revenu",kind:"income"},
    {id:"epargne",name:"Épargne",kind:"transfer"},
    {id:"transfert-interne",name:"Transfert interne",kind:"transfer"}
  ];

  async function getUserId() {
    const { data: { user } } = await supabaseClient.auth.getUser();
    return user ? user.id : null;
  }

  window.BudgetDB = {
    openDB: async () => supabaseClient,
    seedCategories: async () => {
      // Les catégories par défaut peuvent être gérées localement ou partagées
      return DEFAULT_CATEGORIES;
    },
    defaults: DEFAULT_CATEGORIES,

    async getTransactions() {
      const { data, error } = await supabaseClient
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });
      if (error) throw error;
      // Adaptation des champs si nécessaire pour correspondre à ton app
      return data.map(t => ({
        id: t.id,
        date: t.date,
        categoryId: t.category, // ou categoryId selon ta table SQL
        amountCents: Math.round(t.amount * 100),
        type: t.type,
        note: t.note
      }));
    },

    async getCategories() {
      return DEFAULT_CATEGORIES;
    },

    async getBudgets() {
      return [];
    },

    async putTransaction(x) {
      const userId = await getUserId();
      const payload = {
        id: x.id,
        user_id: userId,
        date: x.date,
        category: x.categoryId,
        amount: x.amountCents / 100,
        type: x.type,
        note: x.note || ''
      };
      const { error } = await supabaseClient
        .from('transactions')
        .upsert(payload);
      if (error) throw error;
      return x;
    },

    async deleteTransaction(id) {
      const { error } = await supabaseClient
        .from('transactions')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },

    putCategory: async x => x,
    deleteCategory: async id => {},
    putBudget: async x => x,
    deleteBudget: async id => {},

    async clearAll() {
      const { error } = await supabaseClient
        .from('transactions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Supprime tout pour l'user connecté
      if (error) throw error;
    },

    async importData(data, mode) {
      if (mode === 'replace') {
        await this.clearAll();
      }
      if (data && Array.isArray(data.transactions)) {
        for (const t of data.transactions) {
          await this.putTransaction(t);
        }
      }
      return { transactions: data?.transactions?.length || 0, categories: 0, budgets: 0 };
    }
  };
})();