Voici une version mise à jour de votre fichier **`README.md`**. Elle prend en compte l'évolution du projet (passé de IndexedDB à **Supabase** pour l'authentification et le stockage distant), ainsi que le nouveau module de **Simulateur de financement & Analyse de faisabilité**, rédigé de façon structurée et explicite pour être parfaitement lisible par une IA ou un développeur.

---

### 📄 Contenu complet du nouveau `README.md`

```markdown
# Mon Budget — Application de Gestion Financière & Intelligence de Financement

Application personnelle de gestion financière moderne et intuitive en HTML, CSS et JavaScript vanilla. L'application est désormais connectée à **Supabase** pour gérer l'authentification sécurisée des utilisateurs et la persistance des données en base de données relationnelle distante.

---

## 🛠️ Architecture & Technologies

- **Frontend** : Vanilla JavaScript (ES6+), HTML5, CSS3 responsive.
- **Visualisation** : [Chart.js](https://www.chartjs.org/) pour les graphiques interactifs (évolutions et répartitions).
- **Backend & Base de données** : [Supabase](https://supabase.com/) (Auth, PostgreSQL, Row Level Security).
- **Déploiement / Local** : Hébergeable sur n'importe quel serveur web statique (ex: Cloudflare Workers, GitHub Pages, serveur Python local).

---

## 🚀 Lancer l'application en local

Pour éviter les restrictions de sécurité du navigateur lors du développement local :

### macOS / Linux
1. Ouvrez votre terminal et naviguez vers le dossier du projet :
   ```bash
   cd /chemin/vers/le/projet

```

2. Lancez un serveur HTTP local :
```bash
python3 -m http.server 8000

```


3. Ouvrez votre navigateur sur `http://localhost:8000`.

### Windows

1. Dans l'Explorateur Windows, tapez `cmd` dans la barre d'adresse du dossier.
2. Exécutez la commande :
```cmd
python -m http.server 8000

```


3. Ouvrez votre navigateur sur `http://localhost:8000`.

---

## ✨ Fonctionnalités Incluses

### 1. Authentification & Profils

* Connexion et inscription sécurisées via Supabase Auth.
* Gestion des sessions et déconnexion automatique après 15 minutes d'inactivité.
* Personnalisation du profil (nom, prénom, avatar dynamique).

### 2. Vue d'ensemble & Dashboard

* Calcul des métriques en temps réel : Solde net, Total des dépenses, Total des revenus, Épargne.
* Filtres temporels : Semaine, Mois, Année.
* Visualisations graphiques dynamiques :
* Évolution quotidienne (Barres Dépenses/Revenus + Ligne de tendance du solde).
* Camembert (Donut) de répartition des dépenses par catégorie.



### 3. Gestion des Operations & Catégories

* Saisie d'opérations (Dépenses, Revenus, Transferts) avec calcul monétaire sécurisé en centimes entiers (`Finance.toCents`).
* Filtrage par type, par catégorie et par recherche textuelle.
* Gestionnaire de catégories personnalisables (ajout, suppression et catégories globales par défaut).

### 4. Import / Export

* Exportation des opérations au format **CSV**.
* Sauvegarde globale et restauration des données au format **JSON**.

---

## 💡 Module : Simulateur de Financement & Intelligence de Suivi

Ce module permet à l'utilisateur de simuler des projets d'achat ou d'épargne (ex: voiture, travaux, vacances) et d'évaluer automatiquement leur faisabilité au regard de sa situation budgétaire réelle.

### A. Spécifications & Logique Métier (Vue IA / Développeur)

1. **Calcul de l'effort d'épargne** :

$$\text{Reste à financer (centimes)} = \max(0, \text{TargetAmount} - \text{CurrentAmount})$$


$$\text{Effort mensuel (centimes)} = \text{Math.round}\left(\frac{\text{Reste à financer}}{\text{Months}}\right)$$


2. **Connexion au Budget Réel & Analyse de Faisabilité** :
* L'application calcule le **solde net réel** de la période courante ($\text{Revenus réels} - \text{Dépenses réelles}$).
* **Diagnostic de faisabilité** :
* Si $\text{Solde Net Réel} \ge \text{Effort Mensuel}$ : Le projet est marqué comme `faisable` (Alerte verte ✅).
* Si $\text{Solde Net Réel} < \text{Effort Mensuel}$ : Le projet est marqué comme `tendu` (Alerte rouge ⚠️ précisant le déficit mensuel).




3. **Actions sur les projets** :
* **Calcul & Enregistrement** : Sauvegarde synchrone dans la table Supabase `financings`.
* **Réinitialisation (`#btn-reset-sim`)** : Remet à zéro le formulaire et masque la carte de résultat.
* **Suppression (`deleteFinancingProject(id)`)** : Supprime la simulation de la base de données et met à jour la liste visuelle sans rechargement de page.



### B. Structure de la table Supabase `financings`

| Champ | Type | Description |
| --- | --- | --- |
| `id` | `uuid` | Identifiant unique (Primary Key) |
| `user_id` | `uuid` | Clé étrangère vers `auth.users` |
| `name` | `text` | Intitulé du projet |
| `target_amount` | `numeric` | Objectif financier total |
| `current_amount` | `numeric` | Montant déjà disponible |
| `months` | `integer` | Durée souhaitée en mois |
| `monthly_effort` | `numeric` | Effort d'épargne mensuel requis |
| `status` | `text` | Statut du projet (`simulation`, `faisable`, `tendu`) |
| `created_at` | `timestamp` | Date de création |

---

## 📁 Structure du Code Source

* **`index.html`** : Conteneurs HTML structurels, navigation, vues modulaires (`#page-dashboard`, `#page-financing`, etc.) et fenêtres modales.
* **`styles.css` & `styles-fix.css**` : Charte graphique moderne, mise en page Flexbox/Grid et styles réactifs mobile-first.
* **`db.js` (`BudgetDB`)** : API d'accès aux données Supabase (`getTransactions`, `putTransaction`, `getCategories`, `getFinancings`, `putFinancing`, `deleteFinancing`, etc.).
* **`finance.js` (`Finance`)** : Utilitaire de calculs monétaires stricts (conversion en centimes entiers pour éviter les dérives de virgule flottante).
* **`app.js`** : Moteur applicatif principal, contrôleur d'événements DOM, rafraîchissement des graphiques et logique de faisabilité.
* **`manifest.json`** : Configuration Progressive Web App (PWA).

---

## 🛡️ Règles Métier & Confidentialité

* **Sécurité RLS** : Toutes les données stockées dans Supabase sont protégées par des politiques de sécurité au niveau des lignes (Row Level Security), garantissant qu'un utilisateur ne peut lire/écrire que ses propres enregistrements.
* **Règles d'isolation** : Les transferts internes sont isolés et n'impactent pas le calcul du solde de consommation.
* **Précision financière** : L'ensemble des montants traités dans JavaScript sont manipulés sous forme d'entiers en centimes pour éliminer les erreurs d'arrondi binaire.

```

---

Vous pouvez remplacer l'intégralité du contenu de votre fichier `README.md` par ce texte. Il reflète exactement où en est votre application aujourd'hui !

```