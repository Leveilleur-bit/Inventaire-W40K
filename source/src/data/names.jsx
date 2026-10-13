// ══════════════════════════════════════════════════════════
// NOMS DE BAPTÊME (bouton ⚄)
// ══════════════════════════════════════════════════════════
// Plusieurs formes de noms par famille de faction, pour varier les propositions :
// nom latin, prénom + épithète, titre de chevalier, nom de bête… Tirées au hasard.

const pick = (a) => a[Math.floor(Math.random() * a.length)];
// Deux mots latins qui ne partagent pas la même racine (évite « Sanguis Sanguinis », « Mortis Mortis »)
const pair = (A, B) => { const a = pick(A); let b = pick(B), k = 0; while (b.slice(0,4) === a.slice(0,4) && k++ < 10) b = pick(B); return `${a} ${b}`; };

const P = {
  // ── Imperium ──
  latinA: ["Ferrum","Ignis","Vox","Ira","Lux","Nox","Astra","Mortis","Aquila","Sanctus","Umbra","Fulmen","Gladius","Corvus","Draco","Leo","Bellum","Honos","Fides","Scutum","Tempestas","Aurum","Vigil","Hasta","Pax","Virtus"],
  latinB: ["Aeterna","Invictus","Mortis","Sanctus","Ultima","Rex","Primaris","Furiosa","Imperialis","Veritas","Dominus","Angelus","Bellator","Custos","Tenebris","Gloriae","Terribilis","Fidelis","Vindex","Ardens","Aurea","Irae"],
  prenom: ["Aldric","Castor","Varro","Tiberius","Gaius","Lucan","Marius","Severus","Cassian","Dorn","Hector","Ansgar","Octavian","Remus","Tarkon","Balthus","Corvin","Garran","Lysander","Nestor","Orsino","Thaddeus","Aurelian","Galen","Ivo","Maximin"],
  nomen: ["Vorn","Kale","Draxus","Soren","Valerius","Graeme","Thane","Morrow","Ardent","Haldor","Castellan","Varrick","Ostrander","Belisar","Crassus","Tarsis"],
  epithete: ["le Vigilant","l'Inflexible","le Juste","le Pénitent","l'Implacable","le Silencieux","le Fidèle","le Balafré","l'Ardent","le Pieux","le Sévère","le Dernier Debout","l'Éternel","le Porte-Flamme","le Briseur de Siège"],
  titreFr: ["Bouclier de Terra","Lame de l'Empereur","Marteau des Hérétiques","Fléau des Xenos","Gardien du Trône","Flamme de Macragge","Ombre du Chapitre","Voix de l'Aquila","Rempart de Cadia","Main du Primarque"],
  // ── Chevaliers ──
  sire: ["Hector","Gaston","Baudouin","Aymeric","Godefroy","Tancrède","Roland","Perceval","Anselme","Lancelin","Bohémond","Enguerrand","Thibault","Arnaud","Hugues","Raymond"],
  maison: ["Terryn","Griffith","Cadmus","Hawkshroud","Raven","Taranis","Krast","Vulker","Mortan","Degaine","Draconis","Orhlacc"],
  knightName: ["Lux Aeterna","Fureur de Kaliban","Marteau de Vorlese","Colère Sacrée","Gardien d'Acier","Glaive Impérieux","Fils du Trône","Tonnerre Pieux","Serment de Fer","Dernière Aube","Juge d'Airain","Aube Éternelle","Écu du Juste","Foudre de Terra","Pas de la Tempête"],
  // ── Chaos ──
  chaosNom: ["Vorgath","Khar'zhal","Morvath","Ulkar","Drexxus","Skarn","Vhorl","Kallax","Zhor","Maldrek","Thrask","Xyrgoth","Nurvak","Sarrox","Ghaldor","Vexmoor"],
  chaosEpi: ["le Parjure","l'Écorcheur","le Sans-Visage","le Damné","le Béni du Warp","Mille-Plaies","le Dévoreur d'Âmes","le Marqué","l'Ombre Rouge","le Traître","Cœur-de-Cendre","le Profanateur"],
  chaosLatA: ["Nex","Malus","Vorax","Abyssus","Perditio","Anathema","Sanguis","Furor","Nihil","Tormentum","Odium","Ruina","Pestis","Damnatus","Discordia"],
  chaosLatB: ["Infernalis","Damnatio","Maleficus","Vorago","Tenebrarum","Sanguinis","Furiae","Perditus","Vindicta","Malefica","Tormenta"],
  // ── Tyranides ──
  bete: ["Le Dévoreur","L'Ombre","La Faim","Le Carnassier","Le Cri","La Griffe","Le Fléau","La Marée","L'Éventreur","Le Rôdeur"],
  beteLieu: ["de Macragge","de Tarsis","de Vorlese","des Ruches","de Kharon","du Vide","de Serra","des Mondes-Proies","de Kelmar","de l'Abîme"],
  flotte: ["Kraken","Behemoth","Leviathan","Gorgon","Hydra","Jormungandr","Tiamat","Naga","Charybdis","Scylla"],
  suffixe: ["Prime","Alpha","Primus","Ascendant","Omega","Gamma-7","Progenitor","Suprême"],
  // ── Nécrons ──
  necNom: ["Anubek","Thoth'ra","Sekhemtar","Khepresh","Nefertek","Osirakh","Menkharet","Ankhamon","Setheph","Imotekh","Amonkar","Zahndrek"],
  necEpi: ["l'Éternel","le Sans-Sommeil","le Conquérant","le Seigneur des Tombes","l'Inébranlable","le Juge des Âges","l'Immortel","le Moissonneur"],
  // ── Aeldari / Drukhari ──
  eldNom: ["Aelthir","Vaelen","Ithilriel","Solanar","Faenor","Mithariel","Yrlanth","Sarielle","Naethis","Ulthanor","Lileth","Kaerith"],
  eldEpi: ["Lame-du-Crépuscule","Chant-des-Étoiles","Larme-d'Isha","Voile-d'Argent","Cœur-de-Lune","Ombre-Vive","Danse-Mort","Œil-de-Khaine"],
  drukNom: ["Vraxis","Sslyth","Kaelith","Morvyn","Xaeryl","Vharne","Lylith","Zaeth","Druvaen","Iyrlath"],
  drukEpi: ["la Cruelle","Mille-Tourments","le Raffiné","Soie-Noire","Lame-d'Agonie","le Collectionneur","Écho-de-Douleur","l'Insatiable"],
  // ── Orks ──
  orkNom: ["Grotsnik","Gorgutz","Snagrod","Uzgob","Badrukk","Ghazbag","Skrag","Nazgob","Mogrok","Zogwort","Grimgor","Waznak"],
  orkEpi: ["Kasse-Tout","Gros-Kikoup","Tête-d'Kanon","Dents-d'Acier","Kogne-Dur","le Pas-Kontent","Krâne-Rouge","Mâchoire-d'Fer","Fonce-Dedans","l'Kasseur"],
  // ── T'au ──
  tauCaste: ["Shas'el","Shas'o","Shas'vre","Kor'el","Fio'o","Por'el","Shas'ui","Kor'vre"],
  tauSept: ["T'au","Vior'la","Sa'cea","Dal'yth","Bork'an","Fal'shia","Ke'lshan","Au'taal"],
  tauNom: ["Kauyon","Mont'ka","Ro'kan","Shoh","Taan","Kais","Vesa","Ukos","Rhi'kas","Asharo","Mesme","Sha'kan"],
  // ── Votann ──
  votNom: ["Grimnir","Uthar","Brokk","Kaelen","Hrodgar","Sigrun","Dagni","Thrain","Oddrin","Barrik","Kolvar","Helga"],
  votEpi: ["Poing-d'Enclume","Barbe-de-Fer","Garde-Serment","Forge-Rancune","Œil-d'Étoile","Main-de-Pierre","Veille-Sang","Front-d'Acier"],
};

const FORMS = {
  imperial: [
    () => pair(P.latinA, P.latinB),
    () => `${pick(P.prenom)} ${pick(P.epithete)}`,
    () => `${pick(P.prenom)} ${pick(P.nomen)}`,
    () => `${pick(P.prenom)}, ${pick(P.titreFr)}`,
    () => `Frère ${pick(P.prenom)}`,
  ],
  knight: [
    () => `Sire ${pick(P.sire)}`,
    () => `Sire ${pick(P.sire)} de ${pick(P.maison)}`,
    () => pick(P.knightName),
    () => pair(P.latinA, P.latinB),
    () => `${pick(P.sire)} ${pick(P.epithete)}`,
  ],
  chaos: [
    () => `${pick(P.chaosNom)} ${pick(P.chaosEpi)}`,
    () => pair(P.chaosLatA, P.chaosLatB),
    () => pick(P.chaosNom),
  ],
  tyranid: [
    () => `${pick(P.bete)} ${pick(P.beteLieu)}`,
    () => `${pick(P.flotte)} ${pick(P.suffixe)}`,
    () => pick(P.bete),
  ],
  necron: [() => `${pick(P.necNom)} ${pick(P.necEpi)}`, () => pick(P.necNom)],
  aeldari: [() => `${pick(P.eldNom)} ${pick(P.eldEpi)}`, () => pick(P.eldNom)],
  drukhari: [() => `${pick(P.drukNom)} ${pick(P.drukEpi)}`, () => pick(P.drukNom)],
  ork: [() => `${pick(P.orkNom)} ${pick(P.orkEpi)}`, () => pick(P.orkNom)],
  tau: [() => `${pick(P.tauCaste)} ${pick(P.tauSept)} ${pick(P.tauNom)}`, () => `${pick(P.tauCaste)} ${pick(P.tauNom)}`],
  votann: [() => `${pick(P.votNom)} ${pick(P.votEpi)}`, () => pick(P.votNom)],
};
const FACTION_FORM = { SM:"imperial", IM:"imperial", AC:"imperial", AM:"imperial", AS:"imperial", AD:"imperial", GK:"imperial", IK:"knight",
  CSM:"chaos", CK:"chaos", LD:"chaos", NC:"necron", AE:"aeldari", DR:"drukhari", OR:"ork", TY:"tyranid", GC:"tyranid", TA:"tau", LV:"votann" };

// Un nom au hasard pour cette faction (différent du nom actuel si possible)
export function randomName(faction, current = "") {
  const forms = FORMS[FACTION_FORM[faction] || "imperial"];
  for (let k = 0; k < 6; k++) { const n = pick(forms)(); if (n !== current) return n; }
  return pick(forms)();
}
