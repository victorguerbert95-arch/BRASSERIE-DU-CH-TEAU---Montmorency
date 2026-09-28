# Site vitrine — G-Soul (Enghien-les-Bains)

Site one-page en HTML/CSS/JS pur, sans framework ni étape de build.
Pensé mobile d'abord : barre fixe « Appeler / Itinéraire / La carte » en bas
de l'écran, numéro cliquable (`tel:`) dans le hero, l'en-tête, le contact et le pied de page.

Direction artistique : l'univers de la carte du restaurant (damier noir/crème,
rouge G-Soul, logo rétro) croisé avec le hip-hop des années 80 (bandeau défilant,
ombres « sticker », titres condensés).

## Structure

```
site-g-soul/
├── index.html            Page unique : hero, carte, l'esprit (à propos + avis), photos, horaires + plan, contact
├── mentions-legales.html Mentions légales (à compléter)
├── 404.html              Page d'erreur (servie automatiquement par Vercel et Netlify)
├── css/style.css         Styles (couleurs et polices en variables en tête de fichier)
├── js/main.js            Menu mobile, statut ouvert/fermé, onglets, visionneuse, images de secours
├── assets/favicon.svg    Icône du site
├── robots.txt / sitemap.xml
├── vercel.json           En-têtes HTTP pour Vercel
└── _headers              En-têtes HTTP pour Netlify
```

## Tester en local

```bash
cd site-g-soul
python3 -m http.server 8000
# puis ouvrir http://localhost:8000
```

## Mettre en ligne

Le site est dans le dossier `site-g-soul/` du dépôt : il faut l'indiquer comme racine.

- **Netlify** : *Add new site → Import an existing project*, choisir le dépôt,
  *Base directory* = `site-g-soul`, *Build command* vide, *Publish directory* = `site-g-soul`.
  Sans Git : glisser-déposer le dossier `site-g-soul` sur <https://app.netlify.com/drop>.
- **Vercel** : importer le dépôt, *Framework Preset* = « Other »,
  *Root Directory* = `site-g-soul`, aucune commande de build.

## À personnaliser avant la mise en ligne

Tous les endroits concernés sont marqués `TODO` (`grep -rn TODO site-g-soul`).

1. **Nom de domaine** : remplacer `https://www.g-soul-enghien.fr/` dans `index.html`
   (canonical, Open Graph, JSON-LD), `robots.txt` et `sitemap.xml`.
2. **Photos** : ce sont des photos d'illustration Unsplash. Déposez vos photos dans
   `assets/` (JPEG/WebP, ~1600 px de large pour le hero, ~900 px pour les autres),
   puis remplacez les URL `https://images.unsplash.com/...` et le texte `alt`.
   Dans la galerie, le lien `<a href>` pointe vers la grande image et l'`<img>` vers la vignette.
   Pour le hero, pensez à modifier aussi le `<source>` et le `<link rel="preload">` du `<head>`.
   Si une image ne se charge pas, un dégradé rouge/noir s'affiche à la place.
3. **La carte** : les plats viennent de la fiche Google et des photos de la carte ;
   les descriptions sont courtes et génériques, **à relire**. Les **prix ne sont pas affichés**
   (illisibles sur les photos fournies). Pour en ajouter un :

   ```html
   <h4 class="dish-name">Mac &amp; Cheese <span class="dish-price">6,50 €</span></h4>
   ```

   Le style est déjà prévu (prix aligné à droite, en rouge).
4. **Instagram** : mettre l'URL exacte du compte (3 liens `https://www.instagram.com/`,
   dont `sameAs` dans le JSON-LD).
5. **Image de partage** (`og:image`) : idéalement une photo 1200×630 px hébergée sur le site.
6. **Mentions légales** : compléter les champs `[À COMPLÉTER]`.
7. **Avis clients** : deux extraits d'avis Google (Ana, Alexandre M.) sont cités dans
   « L'esprit G-Soul ». Remplacez-les ou retirez-les à votre convenance.

## Horaires

Le statut « Ouvert · ferme à 16h / Fermé · rouvre à 19h » est calculé en direct
(heure de Paris) à partir du tableau des horaires :

```html
<tr data-day="1" data-slots="12:00-16:00,19:00-24:00">…</tr>
```

`data-day` : 1 = lundi … 7 = dimanche. Plusieurs créneaux séparés par des virgules,
`24:00` = minuit, `data-slots=""` = fermé ce jour-là.
En cas de changement, modifiez **le texte et `data-slots`** de chaque ligne,
ainsi que le bloc `openingHoursSpecification` du JSON-LD dans le `<head>`.

## SEO local

- `title` et `meta description` ciblant « soul food / restaurant américain Enghien-les-Bains ».
- Données structurées schema.org `Restaurant` : adresse, coordonnées GPS, horaires
  (2 services par jour), téléphone, fourchette de prix, cuisine, réservations,
  paiements, accessibilité.
  La note Google (4,8/5) est affichée mais volontairement **non balisée** :
  Google ignore les avis « auto-publiés » d'un établissement sur son propre site.
- Un seul `h1`, un `h2` par section, `h3`/`h4` pour les sous-parties.
- Gardez exactement le même nom, la même adresse et le même numéro (NAP) que sur
  la fiche Google Business Profile, et ajoutez-y l'URL du site.
- Vérifier les données structurées : <https://search.google.com/test/rich-results>.

## Accessibilité & performances

- Lien d'évitement, navigation au clavier (menu, onglets aux flèches, visionneuse),
  focus visibles, `prefers-reduced-motion` respecté (bandeau défilant arrêté).
- Sans JavaScript, le site reste complet : toutes les catégories de la carte
  s'affichent à la suite et les photos s'ouvrent en grand dans le navigateur.
- Images en `loading="lazy"` (sauf le hero, préchargé), carte Google Maps en chargement différé.
