# Reliquaire — organisation du code (src/)

`main.jsx` n'est plus qu'un point d'entrée. Le code est réparti ainsi :

| Dossier / fichier | Contenu |
|---|---|
| `main.jsx` | Point d'entrée : bouton retour Android, montage de l'app |
| `App.jsx` | Composant racine : état global, sauvegarde, Drive, barre d'onglets |
| `views/ViewHome.jsx` | ACCUEIL (missions du jour, mission de la semaine, Dé du Destin, Tarot, citations, serments) |
| `views/ViewCroisade.jsx` | CROISADE (armées, Codex Vivant) — composant `ViewLists` |
| `views/ViewInventory.jsx` | RELIQUES |
| `views/ViewWishlist.jsx` | WISHLIST (figurines, peintures, impression) |
| `views/ViewShame.jsx` | SHAME |
| `views/ViewParade.jsx` | PARADE |
| `views/ViewStats.jsx` | STATS (Miroir, Prophétie, trophées, cartes générées) |
| `views/ViewCodex.jsx` | CODEX (sauvegarde, réglages) |
| `views/ViewChronicle.jsx` | Le Livre de la Croisade (chapitres mensuels) |
| `views/SplashOverlay.jsx` | Écran d'ouverture |
| `components/ui.jsx` | Briques d'interface : boutons, modales, icônes, notifications |
| `components/units.jsx` | Fiche d'une relique, ajout d'unité, photos, points |
| `components/OrphanRelics.jsx` | Reliques mises de côté (unité inconnue) : bloc du CODEX pour les rattacher ou les supprimer |
| `components/heraldry.jsx` | Blasons, emblèmes, icônes de navigation |
| `components/effects.jsx` | Effets visuels : saisons de l'Accueil, gerbe d'or des célébrations |
| `components/OathCeremony.jsx` | Cérémonie « Serment tenu » |
| `components/ColossusCeremony.jsx` | Consécration d'un colosse (cérémonie d'une minute et demie) |
| `components/TrophyCeremony.jsx` | Trophée débloqué : courte cérémonie (14 secondes) |
| `components/LightCeremony.jsx` | Consécration courte (30 secondes) de toute autre figurine peinte |
| `components/ServoAssistant.jsx` | Panneau du servo-crâne convoqué depuis l'Accueil (requêtes et inspection) |
| `components/Seal.jsx` | Sceau de pureté des cérémonies (image à l'aquila ou disque de cire selon l'armée) |
| `lib/archivist.jsx` | Entrée du jour de l'Archiviste : souvenir de la collection ou lore |
| `components/RelicFrame.jsx` | Cadre doré de la photo dans les cérémonies |
| `components/Advent.jsx` | Calendrier de l'Avent de l'Accueil (décembre) : portes et lecture des épisodes |
| `components/ServoSkull.jsx` | Le servo-crâne qui traverse l'Accueil (remarques, scans) |
| `components/imperial.jsx` | Date impériale (0 735 026.M42) et date classique au toucher |
| `components/AmbientSound.jsx` | Musique d'ambiance (pistes : `AMBIENT_TRACKS`) |
| `hooks/useDriveSync.jsx` | Synchronisation Google Drive (connexion, envois, déconnexion) |
| `hooks/useBackButton.jsx` | Gestion du bouton retour pour les fenêtres |
| `data/factions.jsx` | Factions, lore, rangs, générateur du Codex Vivant |
| `data/units.jsx` | Base des unités (`UNITS_DB`), doublons fusionnés (`UNIT_ALIASES`, `migrateUnitIds`) |
| `data/points.json` | **Points MFM** : c'est ce fichier qu'on modifie à chaque mise à jour MFM |
| `data/points.jsx` | Chargement des points, unités ambiguës, nombre de figurines par boîte |
| `data/prices.json` | **Prix boutique** : c'est ce fichier qu'on modifie en cas de hausse de prix |
| `data/prices.jsx` | Chargement des prix boutique |
| `data/lore.jsx` | Citations, Tarot, phrases de célébration |
| `data/archives.jsx` | Fragments de lore de l'Archiviste (général et par armée) |
| `data/advent.jsx` | Feuilleton de l'Avent « La Veille du Reliquaire » (24 épisodes) |
| `data/tarot.jsx` | Tarot : jeux d'armée, lames renversées, lames personnelles, tirage en trois (illustrations dans public/tarot/) |
| `data/events.jsx` | Visites rares et fêtes du calendrier impérial (textes et dates) |
| `data/names.jsx` | Noms de baptême proposés (bouton ⚄), par faction |
| `data/paints.jsx` | Peintures Citadel, statuts de wishlist |
| `lib/oaths.jsx` | Serments : trois parchemins, formules, bougie, paliers du blason |
| `lib/trophies.jsx` | Les 15 trophées de la Salle des trophées (calcul partagé par STATS et App) |
| `lib/servo.jsx` | Servo-crâne assistant : réponses aux requêtes, inspection du Munitorum, nouvelle du jour |
| `lib/counsel.jsx` | Conseil de l'Archiviste : quelle relique peindre ensuite, et pourquoi (carte de l'Accueil) |
| `lib/colossus.jsx` | Qui est un colosse (300 pts par figurine, grands Chevaliers, interrupteur) |
| `lib/honors.jsx` | Titres honorifiques des figurines |
| `lib/sfx.jsx` | Sons d'interface (fichiers dans public/sons/) et vibrations |
| `lib/utils.jsx` | Outils : dates, identifiants, compression photo, notifications |
| `lib/storage.jsx` | Sauvegarde locale (IndexedDB : données + tiroir « photos ») |
| `lib/photoStore.jsx` | Rangement des photos à part (références dans les données) |
| `lib/backup.jsx` | Sauvegarde complète en un fichier .zip, et restauration (tous formats) |
| `index.css` | Styles globaux : cartouches (`hc-bare`, `orn`), voile de faction, animations |
| `lib/drive.jsx` | Synchronisation Google Drive (données + photos en 16 fichiers) |
| `lib/wahapedia.jsx` | Liens Wahapedia |

Pour une modification, il suffit en général d'envoyer à Claude le ou les fichiers concernés.
