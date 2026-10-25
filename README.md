# Mon Budget — MVP 0.1

Application personnelle de gestion financière moderne en HTML, CSS et JavaScript natifs. Les transactions, catégories et budgets sont enregistrés localement dans IndexedDB. Aucun serveur applicatif, compte en ligne ou service bancaire n'est requis.

## Lancer l'application

Pour éviter les restrictions de sécurité des navigateurs sur l'accès aux bases de données locales via `file://`, il est recommandé de lancer un petit serveur web local.

### macOS
1. Ouvrez le **Terminal**.
2. Tapez `cd ` (avec un espace après), puis glissez-déposez le dossier de votre projet dans la fenêtre du Terminal et appuyez sur Entrée.
3. Exécutez la commande : `python3 -m http.server 8000`
4. Dans votre navigateur, ouvrez : `http://localhost:8000`

### Windows
1. Ouvrez le dossier du projet dans l'**Explorateur Windows**.
2. Cliquez dans la barre d'adresse du dossier, tapez `cmd` puis appuyez sur Entrée.
3. Exécutez la commande : `python -m http.server 8000` (ou `py -m http.server 8000`)
4. Dans votre navigateur, ouvrez : `http://localhost:8000`

*Pour arrêter le serveur : retournez dans le terminal et faites `Ctrl + C`.*

## Fonctionnalités incluses

- **Tableau de bord interactif** : Vue par semaine, mois ou année avec graphiques d'évolution et camembert de répartition (propulsé par Chart.js).
- **Multi-devises & Multilingue** : Choix de la devise d'affichage (Franc CFA, Euro, Dollar, Livre, Franc suisse) et de la langue (Français, Anglais, Chinois).
- **Gestion des opérations** : Ajout, modification, suppression et recherche rapide de transactions (revenus, dépenses variables ou fixes, transferts internes).
- **Budgets mensuels** : Fixation de limites par catégorie avec barres de progression et alertes de dépassement.
- **Précision monétaire** : Calculs internes stricts basés sur les centimes entiers pour éviter les erreurs d'arrondi.
- **Sauvegarde et Restauration** : Exportation de toutes vos données au format JSON et importation sécurisée (avec choix de fusion ou de remplacement).
- **Calendrier personnalisé** : Sélecteur de date ergonomique intégré pour naviguer facilement dans le temps.

## Règles importantes

- Les transferts internes sont exclus des calculs de revenus et de dépenses de consommation.
- Pour suivre votre épargne, enregistrez un transfert associé à la catégorie **Épargne**.
- Le solde net affiché correspond aux revenus moins les dépenses. Il ne s'agit pas d'un solde bancaire en temps réel.
- **Confidentialité** : Vos données restent strictement privées et stockées dans le stockage local de votre navigateur. Pensez à exporter régulièrement une sauvegarde JSON en lieu sûr, car vider les données du navigateur les effacera.

## Structure du projet

- `index.html` : Structure de l'interface et des fenêtres modales.
- `styles.css` & `styles-fix.css` : Feuilles de style responsive (ordinateur et mobile).
- `db.js` : Gestion de la base de données IndexedDB et validation des sauvegardes.
- `finance.js` : Logique de calculs monétaires sécurisés.
- `app.js` : Moteur de l'application (navigation, internationalisation, graphiques et interactions).
- `manifest.json` : Métadonnées pour l'application web.