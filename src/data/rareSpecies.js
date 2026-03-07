const LEGENDARY_SPECIES = new Set([
  'articuno',
  'zapdos',
  'moltres',
  'mewtwo',
  'raikou',
  'entei',
  'suicune',
  'lugia',
  'ho-oh',
  'regirock',
  'regice',
  'registeel',
  'latias',
  'latios',
  'kyogre',
  'groudon',
  'rayquaza',
  'uxie',
  'mesprit',
  'azelf',
  'dialga',
  'palkia',
  'heatran',
  'regigigas',
  'giratina',
  'cresselia',
  'cobalion',
  'terrakion',
  'virizion',
  'tornadus',
  'thundurus',
  'landorus',
  'reshiram',
  'zekrom',
  'kyurem',
  'xerneas',
  'yveltal',
  'zygarde',
  'type-null',
  'silvally',
  'tapu-koko',
  'tapu-lele',
  'tapu-bulu',
  'tapu-fini',
  'cosmog',
  'cosmoem',
  'solgaleo',
  'lunala',
  'necrozma',
  'zacian',
  'zamazenta',
  'eternatus',
  'kubfu',
  'urshifu',
  'regieleki',
  'regidrago',
  'glastrier',
  'spectrier',
  'calyrex',
  'enamorus',
  'wo-chien',
  'chien-pao',
  'ting-lu',
  'chi-yu',
  'koraidon',
  'miraidon',
  'okidogi',
  'munkidori',
  'fezandipiti',
  'ogerpon',
  'terapagos',
]);

const MYTHICAL_SPECIES = new Set([
  'mew',
  'celebi',
  'jirachi',
  'deoxys',
  'phione',
  'manaphy',
  'darkrai',
  'shaymin',
  'arceus',
  'victini',
  'keldeo',
  'meloetta',
  'genesect',
  'diancie',
  'hoopa',
  'volcanion',
  'magearna',
  'marshadow',
  'zeraora',
  'meltan',
  'melmetal',
  'zarude',
  'pecharunt',
]);

const ULTRA_BEAST_SPECIES = new Set([
  'nihilego',
  'buzzwole',
  'pheromosa',
  'xurkitree',
  'celesteela',
  'kartana',
  'guzzlord',
  'poipole',
  'naganadel',
  'stakataka',
  'blacephalon',
]);

function normalizeSpecies(species) {
  return String(species || '')
    .trim()
    .toLowerCase()
    .replace(/^cobblemon:/, '')
    .replace(/[_\s]+/g, '-');
}

function buildRareCounts(summary) {
  let legendaryCaught = 0;
  let mythicalCaught = 0;
  let ultraBeastCaught = 0;
  const legendaryUnique = new Set();
  const mythicalUnique = new Set();
  const ultraBeastUnique = new Set();
  const pokemon = summary?.pokemon || [];

  for (const entry of pokemon) {
    if (entry?.knowledge !== 'CAUGHT') continue;

    const species = normalizeSpecies(entry.species);
    if (!species) continue;

    if (LEGENDARY_SPECIES.has(species)) {
      legendaryCaught += 1;
      legendaryUnique.add(species);
    }

    if (MYTHICAL_SPECIES.has(species)) {
      mythicalCaught += 1;
      mythicalUnique.add(species);
    }

    if (ULTRA_BEAST_SPECIES.has(species)) {
      ultraBeastCaught += 1;
      ultraBeastUnique.add(species);
    }
  }

  return {
    legendaryCaught,
    mythicalCaught,
    ultraBeastCaught,
    legendaryUniqueCount: legendaryUnique.size,
    mythicalUniqueCount: mythicalUnique.size,
    ultraBeastUniqueCount: ultraBeastUnique.size,
    legendaryUnique,
    mythicalUnique,
    ultraBeastUnique,
  };
}

function countRareCapturedFromSummaries(summaries) {
  let legendaryCaught = 0;
  let mythicalCaught = 0;
  let ultraBeastCaught = 0;
  const legendaryUnique = new Set();
  const mythicalUnique = new Set();
  const ultraBeastUnique = new Set();

  for (const summary of summaries) {
    const counts = buildRareCounts(summary);
    legendaryCaught += counts.legendaryCaught;
    mythicalCaught += counts.mythicalCaught;
    ultraBeastCaught += counts.ultraBeastCaught;

    for (const species of counts.legendaryUnique) legendaryUnique.add(species);
    for (const species of counts.mythicalUnique) mythicalUnique.add(species);
    for (const species of counts.ultraBeastUnique) ultraBeastUnique.add(species);
  }

  return {
    legendaryCaught,
    mythicalCaught,
    ultraBeastCaught,
    legendaryUniqueCount: legendaryUnique.size,
    mythicalUniqueCount: mythicalUnique.size,
    ultraBeastUniqueCount: ultraBeastUnique.size,
  };
}

function countRareCapturedByPlayerFromSummaries(playerSummaries) {
  let legendaryCaught = 0;
  let mythicalCaught = 0;
  let ultraBeastCaught = 0;
  const legendaryUnique = new Set();
  const mythicalUnique = new Set();
  const ultraBeastUnique = new Set();
  const byPlayer = {};

  for (const item of playerSummaries) {
    const uuid = item?.uuid;
    if (!uuid) continue;

    const counts = buildRareCounts(item.summary);

    byPlayer[uuid] = {
      legendaryCaught: counts.legendaryCaught,
      mythicalCaught: counts.mythicalCaught,
      ultraBeastCaught: counts.ultraBeastCaught,
      legendaryUniqueCount: counts.legendaryUniqueCount,
      mythicalUniqueCount: counts.mythicalUniqueCount,
      ultraBeastUniqueCount: counts.ultraBeastUniqueCount,
    };

    legendaryCaught += counts.legendaryCaught;
    mythicalCaught += counts.mythicalCaught;
    ultraBeastCaught += counts.ultraBeastCaught;

    for (const species of counts.legendaryUnique) legendaryUnique.add(species);
    for (const species of counts.mythicalUnique) mythicalUnique.add(species);
    for (const species of counts.ultraBeastUnique) ultraBeastUnique.add(species);
  }

  return {
    legendaryCaught,
    mythicalCaught,
    ultraBeastCaught,
    legendaryUniqueCount: legendaryUnique.size,
    mythicalUniqueCount: mythicalUnique.size,
    ultraBeastUniqueCount: ultraBeastUnique.size,
    byPlayer,
  };
}

export { countRareCapturedFromSummaries, countRareCapturedByPlayerFromSummaries };
