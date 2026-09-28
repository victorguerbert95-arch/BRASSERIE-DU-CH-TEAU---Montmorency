# Site vitrine — Brasserie du Château (Montmorency)

Site one-page en HTML/CSS/JS pur, sans framework ni étape de build.
Pensé mobile d'abord : barre d'actions fixe « Appeler / Itinéraire / Horaires »
en bas de l'écran, numéro de téléphone cliquable partout.

## Structure

```
(racine du dépôt)
├── index.html            Page unique (hero, carte, à propos, photos, horaires, contact)
├── mentions-legales.html Mentions légales (à compléter)
├── 404.html              Page d'erreur (servie automatiquement par Vercel et Netlify)
├── css/style.css         Styles (variables de couleurs en tête de fichier)
├── js/main.js            Menu mobile, statut ouvert/fermé, onglets, visionneuse
├── assets/favicon.svg    Icône du site
├── robots.txt / sitemap.xml
├── vercel.json           En-têtes HTTP pour Vercel
└── _headers              En-têtes HTTP pour Netlify
```

## Tester en local

N'importe quel serveur statique convient, par exemple :

```bash
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mettre en ligne

Les fichiers du site sont à la racine du dépôt : aucun réglage de dossier n'est nécessaire.

**Netlify** : *Add new site → Import an existing project*, choisir le dépôt GitHub,
laisser *Base directory* vide, *Build command* vide et *Publish directory* vide
(ou `.`). Netlify trouve directement `index.html`.
Alternative sans Git : glisser-déposer le contenu du dépôt sur <https://app.netlify.com/drop>.

**Vercel** : importer le dépôt, *Framework Preset* = « Other », sans commande
de build ni dossier racine à préciser.

## À personnaliser avant la mise en ligne

Tous les endroits concernés sont marqués `TODO` dans le code (`grep -rn TODO .`).

1. **Nom de domaine** : remplacer `https://www.brasserie-du-chateau-montmorency.fr/`
   dans `index.html` (canonical, Open Graph, JSON-LD), `robots.txt` et `sitemap.xml`.
2. **Photos** : les images actuelles sont des photos d'illustration Unsplash.
   Déposez vos photos dans `assets/` (JPEG/WebP, ~1600 px de large pour le hero,
   ~900 px pour les autres), puis remplacez les URL `https://images.unsplash.com/...`
   et le texte `alt` de chaque image. Pour la galerie, le lien `<a href>` pointe vers
   la version grand format et l'`<img>` vers la vignette.
   Si une image ne se charge pas, un fond dégradé vert s'affiche à la place.
3. **La carte** : les plats et les prix sont **des exemples** à remplacer par la
   vraie carte (section `id="menu"`). Le couscous du jeudi est mis en avant sur
   l'ardoise.
4. **Instagram** : mettre l'URL exacte du compte (2 liens `https://www.instagram.com/`).
   Vous pouvez aussi l'ajouter au JSON-LD avec `"sameAs": ["https://www.instagram.com/votre-compte"]`.
5. **Image de partage** (`og:image`) : idéalement une photo 1200×630 px hébergée
   sur le site.
6. **Mentions légales** : compléter les champs `[À COMPLÉTER]` (SIRET, forme
   juridique, responsable de publication, hébergeur).

## Horaires

Les horaires affichés sont lus depuis le tableau HTML (`data-open` / `data-close`
sur chaque ligne) : le statut « Ouvert · ferme à 20h » se met à jour tout seul
(à l'heure de Paris). En cas de changement, modifiez :

- le tableau `data-hours` dans `index.html` (texte **et** attributs `data-open` / `data-close`) ;
- le bloc `openingHoursSpecification` du JSON-LD, dans le `<head>`.

## SEO local

- Balises `title` et `meta description` ciblant « bar tabac brasserie Montmorency ».
- Données structurées schema.org `Restaurant` (adresse, coordonnées GPS,
  horaires, téléphone, réservations, moyens de paiement, accessibilité).
  La note Google n'est volontairement pas balisée : Google n'affiche pas les
  avis « auto-publiés » d'un établissement sur son propre site.
- Un seul `h1`, puis `h2` par section et `h3`/`h4` pour les sous-parties.
- Conseil : gardez exactement le même nom, la même adresse et le même numéro
  (NAP) que sur la fiche Google Business Profile, et ajoutez l'URL du site sur
  cette fiche.
- Vérifier les données structurées : <https://search.google.com/test/rich-results>.

## Accessibilité & performances

- Lien d'évitement, navigation au clavier (menu, onglets, visionneuse),
  focus visibles, respect de `prefers-reduced-motion`.
- Sans JavaScript, le site reste complet : toutes les catégories de la carte
  s'affichent l'une sous l'autre.
- Images en `loading="lazy"` (sauf le hero), carte Google Maps en chargement différé.
