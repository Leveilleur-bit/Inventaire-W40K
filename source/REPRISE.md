# Reliquaire — note de reprise (13 octobre 2026)

Depuis le 13 octobre 2026, tout est sur GitHub : dépôt `Leveilleur-bit/Inventaire-W40K`
(branche `main`), publié sur reliquaire40k.app. Claude a les droits d'écriture et pousse lui-même.

## Le projet

Reliquaire est une app personnelle de suivi de collection Warhammer 40 000 (inventaire, peinture,
points, Wishlist, Croisade, Tarot…). React + Vite, installée sur téléphone (PWA), publiée sur
GitHub Pages. Les données sont enregistrées sur l'appareil (IndexedDB) et synchronisées, si
connecté, sur Google Drive. `STRUCTURE.md` décrit chaque fichier.

## Organisation du dépôt

- Racine : le site compilé que GitHub Pages sert (`index.html`, `assets/`, `sw.js`…) et les
  médias : `fonds/`, `tarot/`, `sons/`, icônes, servo-crâne. `CNAME` = reliquaire40k.app.
- `source/` : le code source (`src/`, `public/` léger, `index.html`, `vite.config.js`,
  `package.json`, `package-lock.json`), ces notes, et `publier.sh`.
- Les images et sons n'existent qu'à la racine ; `publier.sh` les recopie dans `source/public/`
  avant de compiler (ces copies sont ignorées par git). Un nouveau fond va donc dans `fonds/` à la racine.
- `publier.sh` : copie les médias, `npm install` si besoin, `vite build`, supprime l'ancien site
  compilé (pas les médias) et pose le nouveau à la racine. Ensuite : commit + push sur `main`.

## Comment on travaille

- Réponses en français, courtes : je lis sur téléphone et je ne suis pas développeur.
- Claude clone le dépôt, modifie `source/`, lance `source/publier.sh`, vérifie dans l'aperçu,
  puis pousse sur `main` (choix validé : pas de branche à part). Plus de zip à livrer.
- Je ne compile et ne pousse plus depuis mon PC : mon ancien dossier local n'est plus la référence.
- Rappeler de faire une sauvegarde complète depuis le CODEX avant une grosse modification.
- Claude ne voit pas l'app sur mon téléphone : j'envoie des captures d'écran, il ajuste. Il peut
  toutefois ouvrir l'app de son côté (`npx vite` dans `source/`, puis Playwright en Python avec le
  Chromium déjà installé) et y charger une collection d'exemple en écrivant l'état dans IndexedDB
  (base `wh40k-codex`, tiroir `appdata`, clé `state`). Sans mes vraies photos.
- Pour les choix de données (noms, tailles, prix, points), Claude propose un tableau et je valide.

## Ce qui a été fait (3 au 5 octobre 2026)

Protection des données
- `lib/storage.jsx` : une lecture ratée de la base n'ouvre plus l'app sur une collection vide.
  Trois essais, puis écran « Lecture du Reliquaire impossible » ; aucune écriture tant que la
  lecture a échoué (`loadFailed`). Une lecture partielle compte comme un échec.
- `lib/drive.jsx`, `hooks/useDriveSync.jsx` : un fichier de photos Drive illisible annule le
  chargement (au lieu d'effacer les photos) ; l'accès n'est pas gardé après un raccordement raté ;
  fenêtre Google bloquée ou fermée = « erreur, réessaie » ; seule une autorisation expirée
  (401/403) redemande l'accès ; un envoi raté repart au retour du réseau.
- `App.jsx` : les reliques dont l'unité n'existe plus ne sont plus supprimées. Elles vont dans
  `orphanInventory` (conservé, sauvegardé, photos comprises) et reviennent seules si l'unité
  réapparaît. La liste reste présente même vide (pour la synchro entre appareils).
- `components/OrphanRelics.jsx` (nouveau) + `views/ViewCodex.jsx` : bloc « Reliques mises de
  côté » en haut du CODEX, affiché seulement s'il y en a : rattacher à une unité, ou supprimer.

Données
- `data/units.jsx` : doublons Space Marines fusionnés (963 unités). Identifiants conservés :
  sm081 Centurion Assault Squad (anciens sm091, sm230), sm110 Inceptor Squad (sm252),
  sm130 Devastator Squad (sm260), sm131 Centurion Devastator Squad (sm261),
  sm055 Iron Father Feirros (sm310). Table `UNIT_ALIASES` + `migrateUnitIds()`, appelée au
  démarrage, à la restauration d'une sauvegarde et au chargement Drive. Les reliques ne sont pas
  fusionnées entre elles ; pour les points corrigés à la main, l'identifiant conservé l'emporte.
- `data/points.jsx` : 11 tailles sans unité supprimées ; tailles ajoutées : Devastator Squad 5,
  Centurion Assault Squad 3, Centurion Devastator Squad 3, Deathwatch Kill Team 5,
  Chaos Terminator Squad 5, Cultist Mob 10, Traitor Guardsmen Squad 10.
- `data/points.json` : ligne « Knight Wardog » supprimée. Source inchangée :
  MFM v2.8 (mars 2026), corrections du 22/07/2026.
- `data/prices.json` : The Red Terror 50 €, Infernus Squad 40 €.
- `data/tarot.jsx` : « ce mois-ci » calculé en heure locale.

Apparence
- `components/units.jsx` (fiche d'une relique) : la case STATUT se touche et déplie les cinq
  statuts (« Peint » ferme la fiche pour laisser la cérémonie s'afficher). Fond de la fiche :
  `fonds/reliques.jpg` assombri (voile 60 à 80 %). Le parchemin a été essayé puis rejeté.
- `views/ViewInventory.jsx` : les cartouches d'armée portent la classe `hc-bare`, comme en
  CROISADE. Dans `index.css`, `hc-bare` retire le fond et le flou (`!important`) et ajoute un
  halo sombre au texte : les valeurs de fond écrites dans le code de ces cartouches sont ignorées.
- `components/ui.jsx` : voile de l'onglet RELIQUES à 42-52 % (`FOND_VEIL.inventory`).
- `public/fonds/shame.jpg` ajouté (il manquait au paquet d'origine).

## Ce qui a été fait (5 octobre 2026, suite)

Points : passage à la 11e édition
- Le MFM n'est plus un PDF mais un site (mfm.warhammer-community.com), que Claude ne peut pas
  lire. Méthode retenue : j'exporte une liste depuis l'appli officielle (toutes les unités d'une
  faction, à la taille minimale) et je la colle dans la conversation ; Claude compare.
- Quand le MFM donne deux prix pour une même taille, on garde le plus bas (l'export le donne).
- `data/points.json` : Space Marines (dont les cinq chapitres), Chevaliers Impériaux et Tyranides à jour
  (MFM v1.5 du 30/09/2026). Les autres factions sont encore en MFM v2.8 ; `source` le dit
  (texte raccourci le 7 octobre, il s'affiche en haut du CODEX).
- `data/units.jsx` (967 unités) : ajout de Captain on Bike (sm004b), Captain with Jump Pack
  (sm004c), Tyranid Prime with Lash Whip (ty072), Harridan (ty073) ; ty071 « Tyranid Prime »
  renommé « Winged Tyranid Prime » (prix suivi dans `prices.json`).
- `data/points.jsx` : tailles alignées sur l'export : Primaris Sword Brethren 4, Biovores 1,
  Ripper Swarms 1, Pyrovores 1, Mucolid Spores 1, Genestealers 5, Raveners 5, Neurogaunts 11
  (Neurotyrant laissé à 3). Unités ambiguës : 40 (retirées : Aggressor Squad, Inceptor Squad,
  Lieutenant, Vanguard Veteran Squad).
- Non touchées car absentes de mon export Tyranides : Neurothropes, Winged Tyranid Warriors,
  Trygon Prime, Stone Crusher Carnifex, Dimachaeron.
- 6 octobre : Ultramarines, Blood Angels, Dark Angels et Space Wolves mis à jour (39 unités).
  Tailles alignées : Sanguinary Guard 3, Inner Circle Companions 3, Grey Hunters 10,
  Blood Claws 10. 19 unités ajoutées (sm400 à sm418, sans prix boutique), ce qui porte le total
  à 986 unités. Ambiguës : 38 (retirées : Deathwing Knights, Wolf Guard Terminators).
  À vérifier : « Kaius Konorius » (sm401, nom repris tel quel de l'export) et « Space Wolves
  Scouts » (sm417, nom anglais supposé). Non touchées car absentes des exports : Uriel Ventris,
  Severus Agemman, Tycho, Sanguinary Ancient, Wolf Guard, Swiftclaws.
- 7 octobre : Deathwatch, Imperial Fists, Iron Hands, Raven Guard, Salamanders, White Scars
  (10 unités mises à jour). Doublons fusionnés dans `UNIT_ALIASES` : sm350 → sm049
  « Darnath Lysander », sm056 → sm051 « Kayvaan Shrike » (prix 40 €). sm301 « Deathwatch Kill
  Team » renommé « Kill Team Decimus » (110) ; im014, chez les Agents Impériaux, garde l'ancien
  nom à 100. Ajouts dans les onglets existants : Suboden Khan (sm419, White Scars), Caanok Var
  (sm420, Iron Hands), sans prix. Watch Master (Agents Impériaux) à 105 ; « Primaris Watch
  Master » laissé à 90 à ma demande. Watch Captain non touché (absent de l'export).
  Total inchangé : 986 unités.
- `data/points.json`, section `notes` (non affichée dans l'app) : les notes périmées du
  22/07/2026 sont remplacées par « MFM v1.5 : ancien → nouveau » pour chaque unité modifiée.

Cérémonies
- `components/ColossusCeremony.jsx` : plus de cadre vide au début (la croix de la faction bat à
  chaque coup de cloche, le cadre n'apparaît qu'à l'arrivée du servo-crâne) ; la photo ne déborde
  plus du cadre ; le servo-crâne et sa bulle ont leur place au-dessus de la photo. Durée portée
  à une minute et demie (toucher pour clore à partir de 85 s), avec deux répliques de plus.
- `components/LightCeremony.jsx` (nouveau) : cérémonie courte (30 s, un toucher la ferme ; cloche au début, son de célébration au sceau) pour
  toute figurine peinte qui n'est pas un colosse. Elle remplace l'ancienne bannière du bas
  d'écran. Serment tenu et promotion s'affichent après sa fermeture.

Tour de l'app par Claude (7 octobre)
- `components/AmbientSound.jsx` + `App.jsx` : le bouton son ne flotte plus sur le contenu, il est
  rangé dans la barre du bas, à droite des onglets (la barre lui laisse 40 px). Son panneau
  commence par « Couper tout le son » / « Remettre le son » : réglage `ambient.mute`, qui coupe
  musique et sons d'interface sans toucher aux autres réglages (les vibrations restent).
- `views/ViewHome.jsx` : « Dernière activité » écrit « octobre 2026 » au lieu de « 2026-10 ».
- `components/units.jsx` : la phrase « Relique consacrée » ne peut plus afficher « undefined »
  (cas d'un identifiant de relique non numérique).
- `data/` : « Tyranid Warriors with Melee / Ranged Bio-weapons » (« with » en minuscule).

Conseil de l'Archiviste (7 octobre ; d'abord appelé « conseil du Chapelain », renommé à ma demande)
- `lib/counsel.jsx` (nouveau) + carte sur l'Accueil (`views/ViewHome.jsx`), sous le Message du
  Chapelain : la relique à peindre ensuite et pourquoi. Priorité : serment en cours, ordre du Dé
  du Destin, dernière relique d'une armée, montée de rang, sinon ce qui rapproche le plus d'un
  rang ; à égalité, ce qui est déjà commencé puis le moins de points. Toucher la carte ouvre la
  fiche. Rien à saisir. `data/factions.jsx` : `FACTION_TITLES` est maintenant exporté.
  Vu sur mon téléphone le 7 octobre : le nom de la relique, écrit dans la couleur de l'armée,
  était illisible sur un fond de même teinte ; il est maintenant clair, souligné à cette couleur.

Trophée mis en scène (7 octobre)
- `lib/trophies.jsx` (nouveau) : la liste des 15 trophées, sortie de `ViewStats.jsx` sans rien
  changer à leurs règles ; STATS et App utilisent la même.
- `components/TrophyCeremony.jsx` (nouveau) + `App.jsx` : quand un trophée se débloque, une
  cérémonie de 14 s (médaillon frappé de l'emblème, nom, compte « 4 / 15 ») ; un toucher la
  ferme. Elle attend la fin des autres cérémonies (consécration, serment, promotion) ; plusieurs
  trophées passent l'un après l'autre.
- Nouveau réglage enregistré : `trophiesSeen` (trophées déjà annoncés). À la première ouverture
  après la mise à jour il se remplit en silence : aucun trophée déjà obtenu n'est rejoué.
  Un trophée perdu puis regagné n'est pas annoncé une seconde fois.
- Testé par Claude : remplissage silencieux, deux trophées à la suite, et le cas réel (dernier
  Chevalier peint depuis SHAME : cérémonie du colosse, puis Titanicus, puis Purge Totale).

Variété des dialogues et du lore (7 octobre)
- `data/lore.jsx` : citations du Chapelain 20 → 45 ; phrases de consécration impériales 18 → 30,
  neutres 4 → 8, et par armée 41 → 103 (toutes étoffées, plus six armées qui n'en avaient pas :
  Space Marines, Sororitas, Astra Militarum, Mechanicus, Custodes, Grey Knights). Six fois sur
  dix, la cérémonie courte tire maintenant une phrase propre à l'armée.
- `components/ServoSkull.jsx` : remarques 8 → 24, cinq formules pour chaque type de scan ;
  le statut « Monté » est enfin reconnu (il affichait « en attente »).
- `components/ColossusCeremony.jsx` : trois litanies par famille d'armées (au lieu d'une) et
  trois formules pour chacune des six répliques du servo-crâne, tirées à l'ouverture.
- `views/ViewHome.jsx` : bénédictions 5 → 15 ; rappel du Chapelain, trois formules par palier ;
  conseil de l'Archiviste, trois formules par cas (stable dans la journée).
- `components/units.jsx` : phrase « Relique consacrée », 8 débuts et 6 fins (au lieu de 4 et 3),
  « d'octobre » au lieu de « de Octobre », « premier » au lieu de « 1ᵉ ».
- `App.jsx` : une phrase de promotion pour chaque armée (12 en manquaient).

Fond de l'Accueil (7 octobre)
- Le fond était posé sur la page entière : étiré sur toute sa hauteur, donc très zoomé, et on
  n'en voyait qu'un morceau à la fois. Il est maintenant posé par `App.jsx` sur le conteneur qui
  défile, comme les autres onglets : l'image entière, cadrée sur l'écran, reste en place pendant
  que les cartouches défilent. Liste des fonds et réglage dans `components/ui.jsx`
  (`HOME_BG_POOL`, `homeFond`) ; même assombrissement qu'avant (voile de 49 %).
- Mes dix fonds actuels (`accueil-1.jpg` à `accueil-10.jpg`, 853 × 1844) ont été envoyés à Claude
  le 7 octobre : ils ne sont pas dans `reliquaire-complet.zip`, il faut les lui redonner.
- `accueil-11.jpg` (nouveau) : cathédrale aux bougies, recadrée en portrait par Claude à partir
  d'une image en paysage de 1024 × 559 (bande de 259 pixels agrandie : un peu douce de près,
  mais très lisible sous le voile). La liste `HOME_BG_POOL` compte 15 fonds (un par jour, à tour de rôle).
- `accueil-12.jpg` à `accueil-15.jpg` (nouveaux) : deux combats dans une cathédrale, deux sur un
  champ de bataille, reçus en 572 × 1024 et agrandis à 858 × 1536. À remplacer si je renvoie des
  versions plus grandes (en zip, la conversation réduit les images envoyées directement).
- Proposé, pas décidé : voile plus sombre en haut de l'Accueil (mes fonds ont des ciels clairs).
- Abandonné (14 octobre) : alléger les fonds. Déjà bien compressés : −2 % en JPEG, −18 % en WebP
  avec une petite perte de netteté ; chaque fond n'est chargé qu'une fois puis gardé en cache.

### Nouvelles missions (10 octobre 2026)
- **Revue de la pile** (mission du jour, 8e type, `review`) : « Ton X est-il toujours sur grappe /
  monté ? ». TOUJOURS ou IL A AVANCÉ (choix du nouveau statut ; « Peint » lance la cérémonie).
  La relique reçoit `reviewedAt` et ne revient pas avant 90 jours. Seulement les statuts
  « sur grappe » et « monté ».
- **Mission de la semaine** (carte sous la Bénédiction) : « Immortalise l'armée X dans la Parade ».
  7 jours pour le faire, compte à rebours. Tirée parmi les armées qui ont une figurine peinte et
  aucune photo dans la Parade (`appState.weekMission = {type, faction, start, done}`). Accomplie
  dès qu'une photo de cette armée entre dans la Parade ; nouvelle mission 7 jours après le début
  (pas la même armée si possible). Dans la Parade, il faut choisir l'armée (SM par défaut).

### Calendrier de l'Avent (13 octobre 2026)
- Carte sur l'Accueil en décembre uniquement (`components/Advent.jsx`, texte dans `data/advent.jsx`).
- 24 portes : celle du jour et les précédentes s'ouvrent (rattrapage tout le mois) ; une porte
  ouverte se relit, avec navigation nuit précédente / suivante.
- Feuilleton « La Veille du Reliquaire » en 24 épisodes, l'armée principale (le plus de figurines)
  en héros ; héros = surnom d'un personnage peint, sinon nom de l'unité, sinon « le chef de guerre ».
  Noms figés à la première porte (`appState.advent = {year, army, hero, opened}`).
- La porte 24 : fenêtre spéciale « Nuit de l'Ascension ». Les 24 ouvertes ajoutent l'année à
  `appState.adventDone` → trophée « Veilleur de l'Avent » (avec sa cérémonie).
- Testé dans l'aperçu avec une horloge réglée au 5 et au 26 décembre.

### Compilation : piège du CSS (13 octobre 2026)
- Vite 8 minifie le CSS avec Lightning CSS, qui supprimait `backdrop-filter: none` dans `.hc-bare`
  (cartouches de nouveau floues). `cssMinify: false` dans `vite.config.js` : ne pas le retirer.

### Nouveau sceau de pureté (13 octobre 2026)
- `public/sceau-imperial.png` : sceau de cire à l'aquila fourni par moi, détouré par Claude (l'image
  reçue avait un faux damier « transparent » imprimé dedans ; seul le sceau rond a été gardé).
- `components/Seal.jsx` : armées impériales et Chevaliers → ce sceau ; Chaos, Tyranides, xénos →
  l'ancien disque de cire rouge. Utilisé par les deux cérémonies (110 px colosse, 92 px courte).
- Cérémonie du colosse : la bulle du servo-crâne ne recouvre plus le texte du décret.
- Deux autres sceaux fournis ensuite, détourés en cercle net : `sceau-chaos.png` (Chaos : CSM, CK, LD)
  et `sceau-xenos.png` (cire verte, Tyranides et autres xénos). Plus aucun disque de secours visible,
  sauf si une image ne se charge pas.
- `components/RelicFrame.jsx` : cadre doré (baguette, filets, équerres aux coins, fleurons) autour de
  la photo, dans les deux cérémonies.

### Test de stabilité (13 octobre 2026)
- Fait par Claude sur la version compilée, avec une collection proche de la vraie (87 entrées,
  42 photos, 6 armées) : 500 changements d'onglet en rafale, 50 changements de statut rapides
  (cérémonies en cascade), 40 ouvertures du servo-crâne, puis rechargement.
- Résultat : aucune erreur de l'app, mémoire stable (revient à ~10 Mo), aucune perte de données
  au rechargement (statuts et photos identiques), pas de gel (tâche la plus longue < 0,1 s).
- Corrigé : un toucher sur le statut d'une figurine PEINTE la renvoyait « sur grappe » et effaçait
  sa date de consécration sans prévenir → confirmation « Retirer la consécration ? » (aussi via
  l'appui long).
- Trouvé : les bruitages `sons/sfx-*.mp3` (cloche, sceau, célébration, musique du colosse, dé,
  carte) n'ont JAMAIS été en ligne (absents du dépôt, déjà avant le 13 octobre). Ils sont sur mon PC
  dans `public/sons/` : à envoyer à Claude en zip. En attendant, l'app ne les redemande plus en boucle.
- 14 octobre : six bruitages fournis par moi (Pixabay) et mis en ligne dans `sons/` : dé (dice roll,
  compressé), carte (page flip), sceau (sound of a seal), cloche (single church bell), célébration
  (fanfare trompette, fondu final), colosse (« Total War » épique, 55 s, fondus). Début de silence
  coupé et volumes égalisés par Claude.
  Validés par moi sur téléphone le 14 octobre.

### Trophées : période d'enrôlement (14 octobre 2026)
- Validé par moi : 7 jours après la première ouverture (`firstOpenAt`), les trophées d'état
  (Fondateur, Purge Totale, Archiviste, Perfection) restent verrouillés (« disponible dans X jours »).
- Minimums : Purge Totale = une armée d'au moins 20 figurines à 100 % ; Perfection = au moins
  50 figurines, toutes peintes. Constantes en tête de `lib/trophies.jsx`.
- Un trophée déjà annoncé (`trophiesSeen`) reste gagné, même si la collection change.
- Accueil : pendant ces 7 jours, la jauge de honte (Shame-o-meter) est remplacée par la carte
  « MISE EN PLACE DE LA COLLECTION » : J-x, 7 cases, figurines et armées enregistrées.
  `enrolDaysLeft()` dans `lib/trophies.jsx` sert aux deux.
- Aussi pendant l'enrôlement : titre neutre « Enrôlement en cours » dans SHAME et STATS (au lieu de
  Hérétique / Renégat…), pas de bouton « Sceller le jugement », messages du Chapelain d'accueil.
- Validé par moi : pendant les 7 jours, RIEN ne compte. Passer une figurine à « Peint » change le
  statut sans cérémonie, sans historique (ni trophée, ni record, ni Chronique, ni promotion, ni
  serment). Les missions du jour se font mais ne comptent ni pour la série ni pour les trophées.
- Vérifié par Claude (14 octobre) : nouvelle installation et installation ancienne, tous les onglets,
  ajout, cycle de statut, cérémonie, confirmation de retrait, Impression, Mode Serviteur : aucune erreur.

### Mode Serviteur (14 octobre 2026)
- Tant que la Parade a moins de 10 photos (`IDLE_PARADE_MIN` dans App.jsx), la veille fait défiler
  les 15 fonds d'écran de l'Accueil (sans légende) ; ensuite, reliques peintes avec photo + Parade.

### Loi de l'Achat Interdit (14 octobre 2026)
- Validé par moi : elle juge TOUTE la collection (avant : seulement les achats datés depuis le Début
  de Croisade). Seuil inchangé (80 %). En sommeil pendant les 7 jours d'enrôlement.

### Blason de Croisade redessiné (14 octobre 2026)
- `CrusadeBlazon` (components/heraldry.jsx) : champ émaillé à motif damassé, ombre intérieure,
  bordure d'or biseautée (lumière SVG) avec 16 rivets, emblème frappé en relief, vraies feuilles
  de laurier, étoile à facettes, couronne sertie (perles, rubis), chaîne en maillons alternés,
  listel à queues d'aronde avec revers. Mêmes réglages qu'avant (formes, partitions, métal, emblèmes,
  ornements de serments). Les petits blasons (< 40 px) restent simples.

### Musique d'ambiance (14 octobre 2026)
- Validé par moi : le mode « Automatique » (une ambiance par onglet, coupée à chaque changement
  d'onglet) est remplacé par « Toutes les musiques » : les 9 pistes mélangées, enchaînées en fondu,
  sans lien avec l'onglet. C'est le mode par défaut ; l'ancien réglage « auto » est lu comme lui.
  Les ambiances seules (chant, lames, tambours, complainte) restent au choix dans le menu du son.

## Ce qui a été vérifié, et ce qui ne l'a pas été

- Vérifié par Claude : l'app compile ; aucune variable manquante ; sauvegarde locale testée avec
  une base simulée (y compris panne) ; fusion des doublons testée sur des données d'exemple ;
  plus aucune ligne de points ou de taille orpheline.
- Validé par moi sur téléphone : statut depuis la fiche, cartouches de RELIQUES.
- Jamais testé en conditions réelles : les corrections Drive (avec un vrai compte Google).
- Testé par Claude dans l'app ouverte de son côté (7 octobre), avec une collection d'exemple :
  le bloc des reliques mises de côté (mise de côté, message, rattachement avec nom et statut
  conservés) et l'écran « Lecture du Reliquaire impossible » (panne de lecture simulée : l'écran
  s'affiche, rien n'est écrit, la collection est intacte à la réouverture).
- À savoir : la musique du colosse (`sons/sfx-colosse.mp3`) dure environ une minute, la cérémonie
  une minute et demie : la musique s'arrête à peu près au moment du sceau.
- Pas encore confirmé par moi : le nouveau fond de la fiche (galerie des Reliques).
- Cérémonies (suite du 5 octobre) : vues par Claude dans une page d'essai (écrans de 360 × 780
  et 360 × 640), pas encore validées par moi sur téléphone.

Décidé le 7 octobre : le conseil de l'Archiviste reste affiché même quand il répète le serment en
cours ou l'ordre du Dé. Le cartouche « Dernière activité » de l'Accueil est transparent (`hc-bare`).

8 octobre : `views/ViewShame.jsx`, le haut de SHAME (titre, Ordre du Destin, barre de honte) et la
barre de filtres ne sont plus noirs opaques mais voilés (42 % et 50 %) : le fond transparaît.
Même réglage appliqué ensuite à tous les onglets (RELIQUES et la page d'une armée, STATS,
WISHLIST et ses barres d'onglets, PARADE, CODEX) : bandeau du haut à 42 %, barres de filtres à 50 %.
9 octobre : les cartes des reliques dans la page d'une armée (`components/units.jsx`, carte en
liste et carte en grille) sont transparentes elles aussi (`hc-bare`), comme dans la Wishlist.

8 octobre : `components/ServoSkull.jsx`, la bulle du servo-crâne se place du côté où il y a de la
place (et se rétrécit si besoin) au moment du toucher ; avant, elle suivait le sens du vol et
sortait de l'écran près d'un bord. Vérifié près des deux bords et au milieu.

Servo-crâne assistant (9 octobre)
- Bouton « SERVO-CRÂNE » en haut de l'Accueil : ouvre `components/ServoAssistant.jsx`, avec cinq
  requêtes : que dois-je peindre (reprend le conseil de l'Archiviste), où en est mon armée, où en
  est mon serment, qui attend depuis le plus longtemps, inspection du Munitorum. Une réponse qui
  vise une relique propose d'ouvrir sa fiche.
- Inspection du Munitorum : unités sans valeur en points, points incertains (non corrigés à la
  main), reliques peintes sans photo, reliques en attente sans date d'achat, Wishlist déjà
  possédée, reliques mises de côté. Chaque ligne s'ouvre d'un toucher.
- Nouvelle du jour : quand il y a quelque chose d'important (bougie du serment à 3 jours ou moins,
  armée à une relique du 100 %, rang à portée en achevant une relique en cours), le servo-crâne
  passe à coup sûr, s'arrête au milieu de l'écran et l'annonce ; toucher la bulle ouvre la fiche.
  Une fois par jour au plus (`servoNewsDay`, enregistré). Sinon, il passe au hasard comme avant.
- Calculs dans `lib/servo.jsx`, tout reste sur le téléphone. Testé par Claude dans l'app avec une
  collection d'exemple (nouvelle, cinq requêtes, ouverture de fiche).

## Idées refusées : ne pas les reproposer

- Importer les points dans l'app en collant l'export officiel (trop de risque d'erreur).
- Bouton pour revoir la cérémonie courte d'une figurine normale.
- La Vigile (séance de peinture chronométrée).
- Photos d'étapes (une photo par statut).
- Journal de batailles dans CROISADE.
- Projets avec échéance.
- Recettes reliées au stock de peintures.

Proposées le 7 octobre, pas retenues pour l'instant (ni refusées) : cérémonie de promotion mise
en scène, carte « Il y a un an », Mur des reliques, recherche dans toute la collection, carte de
relique à partager, série de peinture, « l'or qui dort » dans SHAME, rappel trimestriel des points.

## Ce qui reste à faire

1. Mise à jour des points, faction par faction : j'envoie l'export de l'appli officielle, Claude
   me donne le tableau des changements, met à jour `source`, et me signale les unités
   « ambiguës » (38) au lieu de trancher. Restent à faire : toutes les factions sauf Space
   Marines (avec Black Templars, Ultramarines, Blood Angels, Dark Angels, Space Wolves),
   Chevaliers Impériaux et Tyranides. Le MFM doit être mis à jour
   chaque trimestre (octobre 2026, janvier 2027).
2. (Fait le 14 octobre) Taille de « Phobos Strike Team » : 10 figurines.
3. Unités sans prix (pas important) : Wardens of Ultramar, Nephilim Jetfighter,
   Ravenwing Command Squad, Iron Priest, Hyperadapted Raveners, Tyrannocyte, Mutilators,
   Captain on Bike, Captain with Jump Pack, Tyranid Prime with Lash Whip, Harridan,
   et les unités sm400 à sm420.
4. (Fait le 7 octobre) Cartouches transparents sur STATS, WISHLIST, CODEX : ils l'étaient déjà
   presque tous ; les derniers ont reçu `hc-bare` (STATS : ligne Colosses, encadré Sentence,
   rétrospective ouverte ; CODEX : Ordre des armées, Aide rapide, Note). Laissés pleins exprès :
   les boutons, les fenêtres, le bloc « Reliques mises de côté ». Pas encore validé sur téléphone.
5. Gros chantiers, seulement si ça me gêne : deux appareils ouverts en même temps (Drive n'est
   lu qu'au démarrage, le dernier qui écrit l'emporte) ; poids de l'app (fichier principal
   d'environ 630 Ko ; fonds et Tarot disponibles hors ligne seulement après un premier affichage).
6. Petits points relevés, non traités : `ViewStats.jsx` et `ViewHome.jsx` très gros (environ
   113 Ko chacun) ; deux fichiers nommés `units.jsx` (`components/` et `data/`) ;
   `ouverture.jpg` et `icon-512.png` un peu lourds ; `data/paints.jsx` contient des lignes
   d'unités (à vérifier : données mortes ?).
