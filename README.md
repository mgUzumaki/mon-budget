# MonBudget

MonBudget est une application web gratuite de suivi des finances personnelles. Elle permet de saisir ses revenus et ses dépenses, de les organiser par catégorie ou par dossier et de consulter l’évolution de son budget. Elle s’utilise sur ordinateur et sur téléphone, en français, en anglais et en chinois simplifié.

[Ouvrir MonBudget](https://mon-budget.gedeonmoufouma.workers.dev/)

## Fonctionnalités disponibles

- **Compte** — L’accueil présente MonBudget et ouvre un écran de connexion séparé. L’utilisateur peut créer un compte, se connecter ou demander un lien de réinitialisation. Le formulaire de récupération affiche l’adresse du compte et demande de confirmer le nouveau mot de passe.
- **Vue d’ensemble** — Consultez le solde net, les revenus, les dépenses et leur répartition par catégorie. Choisissez une période (semaine, mois ou année), un dossier et, pour la vue globale, une devise d’affichage. Le graphique des flux affiche les dépenses en rouge sous zéro, les revenus en vert et le solde net en bleu.
- **Transactions** — Ajoutez, modifiez et supprimez des opérations. Recherchez-les par description et filtrez-les par type ou par catégorie. Le bouton **Voir tout** ouvre le journal des transactions.
- **Import depuis une image** — Téléversez une photo ou une capture d’écran. Tesseract.js lit l’image dans le navigateur et MonBudget propose les opérations reconnues. Vérifiez les montants et les dates dans l’aperçu avant d’enregistrer. Pour les dates relatives, comme « hier », indiquez la date de la capture.
- **Dossiers et catégories** — Dans **Réglages**, consultez et renommez vos dossiers ou gérez vos catégories. Avant de supprimer un dossier, choisissez soit de déplacer ses opérations vers un autre dossier, soit de les supprimer avec lui après confirmation.
- **Exports et sauvegardes** — Exportez le journal en CSV. Dans **Réglages**, vous pouvez aussi exporter et restaurer une sauvegarde JSON.
- **Navigation** — Une nouvelle connexion ouvre **Vue d’ensemble**. L’actualisation dans le même onglet reprend la rubrique ouverte pendant la session.

L’interface est traduite en français, en anglais et en chinois simplifié. La lecture d’images charge aussi des modèles espagnol et allemand. L’interprétation des dates et des montants dépend du format de la capture.

## En préparation

**Budgets**, **Statistiques** et **Simulateur** sont masqués dans le menu public pendant leur mise au point. Les graphiques de la **Vue d’ensemble** restent accessibles.

Le code du simulateur calcule l’effort d’épargne mensuel à partir du montant cible, de l’épargne déjà disponible et de la durée du projet. Il le compare au solde net de la période et enregistre les projets dans la table `financings`.

## Lancer le projet en local

Ouvrez un terminal à la racine du dépôt et lancez un serveur HTTP.

```bash
python3 -m http.server 8000
```

Sous Windows, utilisez `python -m http.server 8000` si la commande `python3` est indisponible. Ouvrez ensuite [localhost:8000](http://localhost:8000/).

L’interface utilise HTML, CSS et JavaScript, avec Chart.js pour les graphiques. La version publiée est hébergée sur Cloudflare Workers. Les comptes et les données sont gérés par Supabase Auth et PostgreSQL.

### Configuration Supabase

- Pour développer, utilisez un projet Supabase de test. Renseignez son URL et sa clé publique dans l’initialisation du client dans `index.html`. Gardez les clés d’administration et les identifiants SMTP côté serveur.
- Configurez les politiques **Row Level Security (RLS)** des tables de données pour limiter chaque compte à ses propres enregistrements. Le frontend utilise notamment `transactions`, `categories`, `budget_folders` et `financings`.
- La suppression d’un dossier appelle la fonction SQL `remove_budget_folder`. Elle effectue le déplacement ou la suppression des opérations et supprime le dossier dans la même transaction.
- Configurez **Authentication → URL Configuration** pour autoriser l’adresse de retour en `?reset-password=1`, ainsi qu’un service SMTP pour l’envoi aux utilisateurs. Le modèle d’e-mail **Reset password** transmet le jeton au site, où Supabase le vérifie avant la modification du mot de passe.

## Structure du projet

| Fichier | Rôle |
|---|---|
| `index.html` | Accueil public, écrans de connexion et de récupération, vues et dialogues |
| `styles.css`, `styles-fix.css` | Mise en page, composants et adaptation mobile |
| `app.js` | Navigation, authentification, tableaux de bord et gestion des opérations |
| `db.js` | Accès aux données Supabase via `BudgetDB` |
| `finance.js` | Calculs monétaires et conversion en centimes |
| `i18n.js` | Textes de l’interface et formats par langue |
| `capture-import.js` | Reconnaissance d’images, interprétation du texte et aperçu de l’import |
| `manifest.json` | Métadonnées de l’application web |
| `monbudget-telephone.webp` | Visuel animé sur l’accueil et la connexion |

## Assistance

Depuis l’écran de connexion, cliquez sur **Contacter le support**. Une fois connecté, ouvrez **Réglages → Aide et signalement**. Si vous joignez une capture, masquez les montants et les informations personnelles.

[Contacter le support MonBudget](mailto:monbudget2@gmail.com)
