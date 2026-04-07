function computeOffense(types) {
  // For each defending type, return the BEST effectiveness this combo can achieve
  // using any of its types' moves (matching the editor's attack→defense chart)
  return TYPES.map(def => {
    return Math.max(...types.map(atk => chart[atk][def]));
  });
}

function computeDefense(types) {
  // For each attacking type, multiply effectiveness against each of this combo's types
  return TYPES.map(atk => types.reduce((mult, def) => mult * chart[atk][def], 1));
}

function buildCombos() {
  COMBOS = generateComboTypes().map((t, gi) => {
    const d = computeOffense(t);
    const dd = computeDefense(t);
    return {
      gi, t, d, dd, key: t.join('/'),
      noEff: d.filter(x=>x===0).length, nve: d.filter(x=>x>0&&x<1).length, se: d.filter(x=>x>1).length,
      defWk: dd.filter(x=>x>1).length, defRes: dd.filter(x=>x>0&&x<1).length, defImm: dd.filter(x=>x===0).length
    };
  });
  if (typeof comboState !== 'undefined' && comboState) comboState.combos = COMBOS;
}

function onChartChanged() {
  buildCombos();
  applyFilters();
  if (selectedComboIdx !== null) renderDetailPanel();
  if (mainTab === 'overall') { renderOverallChart(); renderBalanceChecker(); renderSymmetryChecker(); }
  if (mainTab === 'tierlist') { tierListCustom = null; renderTierList(); }
  renderSidePanel();
}

const POKEDEX_TYPES = {
  Bulbasaur:['Grass','Poison'],Ivysaur:['Grass','Poison'],Venusaur:['Grass','Poison'],Charmander:['Fire'],Charmeleon:['Fire'],Charizard:['Fire','Flying'],Squirtle:['Water'],Wartortle:['Water'],Blastoise:['Water'],Caterpie:['Bug'],Metapod:['Bug'],Butterfree:['Bug','Flying'],
  Weedle:['Bug','Poison'],Kakuna:['Bug','Poison'],Beedrill:['Bug','Poison'],Pidgey:['Normal','Flying'],Pidgeotto:['Normal','Flying'],Pidgeot:['Normal','Flying'],Rattata:['Normal'],Raticate:['Normal'],Spearow:['Normal','Flying'],Fearow:['Normal','Flying'],
  Ekans:['Poison'],Arbok:['Poison'],Pikachu:['Electric'],Raichu:['Electric'],Sandshrew:['Ground'],Sandslash:['Ground'],'Nidoran-F':['Poison'],Nidorina:['Poison'],Nidoqueen:['Poison','Ground'],
  'Nidoran-M':['Poison'],Nidorino:['Poison'],Nidoking:['Poison','Ground'],Clefairy:['Fairy'],Clefable:['Fairy'],Vulpix:['Fire'],Ninetales:['Fire'],Jigglypuff:['Normal','Fairy'],Wigglytuff:['Normal','Fairy'],
  Zubat:['Poison','Flying'],Golbat:['Poison','Flying'],Oddish:['Grass','Poison'],Gloom:['Grass','Poison'],Vileplume:['Grass','Poison'],Paras:['Bug','Grass'],Parasect:['Bug','Grass'],Venonat:['Bug','Poison'],Venomoth:['Bug','Poison'],
  Diglett:['Ground'],Dugtrio:['Ground'],Meowth:['Normal'],Persian:['Normal'],Psyduck:['Water'],Golduck:['Water'],Mankey:['Fighting'],Primeape:['Fighting'],
  Growlithe:['Fire'],Arcanine:['Fire'],Poliwag:['Water'],Poliwhirl:['Water'],Poliwrath:['Water','Fighting'],Abra:['Psychic'],Kadabra:['Psychic'],Alakazam:['Psychic'],Machop:['Fighting'],Machoke:['Fighting'],Machamp:['Fighting'],
  Bellsprout:['Grass','Poison'],Weepinbell:['Grass','Poison'],Victreebel:['Grass','Poison'],Tentacool:['Water','Poison'],Tentacruel:['Water','Poison'],Geodude:['Rock','Ground'],Graveler:['Rock','Ground'],Golem:['Rock','Ground'],Ponyta:['Fire'],Rapidash:['Fire'],
  Slowpoke:['Water','Psychic'],Slowbro:['Water','Psychic'],Magnemite:['Electric','Steel'],Magneton:['Electric','Steel'],Farfetchd:['Normal','Flying'],Doduo:['Normal','Flying'],Dodrio:['Normal','Flying'],
  Seel:['Water'],Dewgong:['Water','Ice'],Grimer:['Poison'],Muk:['Poison'],Shellder:['Water'],Cloyster:['Water','Ice'],Gastly:['Ghost','Poison'],Haunter:['Ghost','Poison'],Gengar:['Ghost','Poison'],
  Onix:['Rock','Ground'],Drowzee:['Psychic'],Hypno:['Psychic'],Krabby:['Water'],Kingler:['Water'],Voltorb:['Electric'],Electrode:['Electric'],
  Exeggcute:['Grass','Psychic'],Exeggutor:['Grass','Psychic'],Cubone:['Ground'],Marowak:['Ground'],Hitmonlee:['Fighting'],Hitmonchan:['Fighting'],Lickitung:['Normal'],
  Koffing:['Poison'],Weezing:['Poison'],Rhyhorn:['Ground','Rock'],Rhydon:['Ground','Rock'],Chansey:['Normal'],Tangela:['Grass'],
  Kangaskhan:['Normal'],Horsea:['Water'],Seadra:['Water'],Goldeen:['Water'],Seaking:['Water'],Staryu:['Water'],Starmie:['Water','Psychic'],
  'Mr. Mime':['Psychic','Fairy'],Scyther:['Bug','Flying'],Jynx:['Ice','Psychic'],Electabuzz:['Electric'],Magmar:['Fire'],
  Pinsir:['Bug'],Tauros:['Normal'],Magikarp:['Water'],Gyarados:['Water','Flying'],Lapras:['Water','Ice'],
  Ditto:['Normal'],Eevee:['Normal'],Vaporeon:['Water'],Jolteon:['Electric'],Flareon:['Fire'],Porygon:['Normal'],Omanyte:['Rock','Water'],Omastar:['Rock','Water'],
  Kabuto:['Rock','Water'],Kabutops:['Rock','Water'],Aerodactyl:['Rock','Flying'],Snorlax:['Normal'],Articuno:['Ice','Flying'],Zapdos:['Electric','Flying'],Moltres:['Fire','Flying'],
  Dratini:['Dragon'],Dragonair:['Dragon'],Dragonite:['Dragon','Flying'],Mewtwo:['Psychic'],Mew:['Psychic'],// Gen 2
  Chikorita:['Grass'],Bayleef:['Grass'],Meganium:['Grass'],Cyndaquil:['Fire'],Quilava:['Fire'],Typhlosion:['Fire'],
  Totodile:['Water'],Croconaw:['Water'],Feraligatr:['Water'],Sentret:['Normal'],Furret:['Normal'],Hoothoot:['Normal','Flying'],Noctowl:['Normal','Flying'],Ledyba:['Bug','Flying'],Ledian:['Bug','Flying'],
  Spinarak:['Bug','Poison'],Ariados:['Bug','Poison'],Crobat:['Poison','Flying'],Chinchou:['Water','Electric'],Lanturn:['Water','Electric'],Pichu:['Electric'],Cleffa:['Fairy'],Igglybuff:['Normal','Fairy'],
  Togepi:['Fairy'],Togetic:['Fairy','Flying'],Natu:['Psychic','Flying'],Xatu:['Psychic','Flying'],Mareep:['Electric'],Flaaffy:['Electric'],Ampharos:['Electric'],Bellossom:['Grass'],
  Marill:['Water','Fairy'],Azumarill:['Water','Fairy'],Sudowoodo:['Rock'],Politoed:['Water'],Hoppip:['Grass','Flying'],Skiploom:['Grass','Flying'],Jumpluff:['Grass','Flying'],
  Aipom:['Normal'],Sunkern:['Grass'],Sunflora:['Grass'],Yanma:['Bug','Flying'],Wooper:['Water','Ground'],Quagsire:['Water','Ground'],
  Espeon:['Psychic'],Umbreon:['Dark'],Murkrow:['Dark','Flying'],Slowking:['Water','Psychic'],Misdreavus:['Ghost'],
  Unown:['Psychic'],Wobbuffet:['Psychic'],Girafarig:['Normal','Psychic'],Pineco:['Bug'],Forretress:['Bug','Steel'],
  Dunsparce:['Normal'],Gligar:['Ground','Flying'],Steelix:['Steel','Ground'],Snubbull:['Fairy'],Granbull:['Fairy'],
  Qwilfish:['Water','Poison'],Scizor:['Bug','Steel'],Shuckle:['Bug','Rock'],Heracross:['Bug','Fighting'],
  Sneasel:['Dark','Ice'],Teddiursa:['Normal'],Ursaring:['Normal'],Slugma:['Fire'],Magcargo:['Fire','Rock'],Swinub:['Ice','Ground'],Piloswine:['Ice','Ground'],
  Corsola:['Water','Rock'],Remoraid:['Water'],Octillery:['Water'],Delibird:['Ice','Flying'],Mantine:['Water','Flying'],
  Skarmory:['Steel','Flying'],Houndour:['Dark','Fire'],Houndoom:['Dark','Fire'],Kingdra:['Water','Dragon'],Phanpy:['Ground'],Donphan:['Ground'],
  Porygon2:['Normal'],Stantler:['Normal'],Smeargle:['Normal'],Tyrogue:['Fighting'],Hitmontop:['Fighting'],
  Smoochum:['Ice','Psychic'],Elekid:['Electric'],Magby:['Fire'],Miltank:['Normal'],Blissey:['Normal'],Raikou:['Electric'],Entei:['Fire'],Suicune:['Water'],
  Larvitar:['Rock','Ground'],Pupitar:['Rock','Ground'],Tyranitar:['Rock','Dark'],Lugia:['Psychic','Flying'],'Ho-Oh':['Fire','Flying'],Celebi:['Psychic','Grass'],
  // Gen 3
  Treecko:['Grass'],Grovyle:['Grass'],Sceptile:['Grass'],Torchic:['Fire'],Combusken:['Fire','Fighting'],Blaziken:['Fire','Fighting'],Mudkip:['Water'],Marshtomp:['Water','Ground'],Swampert:['Water','Ground'],Poochyena:['Dark'],Mightyena:['Dark'],
  Zigzagoon:['Normal'],Linoone:['Normal'],Wurmple:['Bug'],Silcoon:['Bug'],Beautifly:['Bug','Flying'],Cascoon:['Bug'],Dustox:['Bug','Poison'],Lotad:['Water','Grass'],Lombre:['Water','Grass'],Ludicolo:['Water','Grass'],
  Seedot:['Grass'],Nuzleaf:['Grass','Dark'],Shiftry:['Grass','Dark'],Taillow:['Normal','Flying'],Swellow:['Normal','Flying'],Wingull:['Water','Flying'],Pelipper:['Water','Flying'],Ralts:['Psychic','Fairy'],Kirlia:['Psychic','Fairy'],
  Gardevoir:['Psychic','Fairy'],Surskit:['Bug','Water'],Masquerain:['Bug','Flying'],Shroomish:['Grass'],Breloom:['Grass','Fighting'],Slakoth:['Normal'],Vigoroth:['Normal'],Slaking:['Normal'],
  Nincada:['Bug','Ground'],Ninjask:['Bug','Flying'],Shedinja:['Bug','Ghost'],Whismur:['Normal'],Loudred:['Normal'],Exploud:['Normal'],Makuhita:['Fighting'],Hariyama:['Fighting'],Azurill:['Normal','Fairy'],
  Nosepass:['Rock'],Skitty:['Normal'],Delcatty:['Normal'],Sableye:['Dark','Ghost'],Mawile:['Steel','Fairy'],
  Aron:['Steel','Rock'],Lairon:['Steel','Rock'],Aggron:['Steel','Rock'],Meditite:['Fighting','Psychic'],Medicham:['Fighting','Psychic'],Electrike:['Electric'],Manectric:['Electric'],Plusle:['Electric'],Minun:['Electric'],
  Volbeat:['Bug'],Illumise:['Bug'],Roselia:['Grass','Poison'],Gulpin:['Poison'],Swalot:['Poison'],Carvanha:['Water','Dark'],Sharpedo:['Water','Dark'],
  Wailmer:['Water'],Wailord:['Water'],Numel:['Fire','Ground'],Camerupt:['Fire','Ground'],Torkoal:['Fire'],Spoink:['Psychic'],Grumpig:['Psychic'],
  Spinda:['Normal'],Trapinch:['Ground'],Vibrava:['Ground','Dragon'],Flygon:['Ground','Dragon'],Cacnea:['Grass'],Cacturne:['Grass','Dark'],Swablu:['Normal','Flying'],Altaria:['Dragon','Flying'],
  Zangoose:['Normal'],Seviper:['Poison'],Lunatone:['Rock','Psychic'],Solrock:['Rock','Psychic'],Barboach:['Water','Ground'],Whiscash:['Water','Ground'],
  Corphish:['Water'],Crawdaunt:['Water','Dark'],Baltoy:['Ground','Psychic'],Claydol:['Ground','Psychic'],Lileep:['Rock','Grass'],Cradily:['Rock','Grass'],Anorith:['Rock','Bug'],Armaldo:['Rock','Bug'],
  Feebas:['Water'],Milotic:['Water'],Castform:['Normal'],Kecleon:['Normal'],Shuppet:['Ghost'],Banette:['Ghost'],
  Duskull:['Ghost'],Dusclops:['Ghost'],Tropius:['Grass','Flying'],Chimecho:['Psychic'],Absol:['Dark'],
  Wynaut:['Psychic'],Snorunt:['Ice'],Glalie:['Ice'],Spheal:['Ice','Water'],Sealeo:['Ice','Water'],Walrein:['Ice','Water'],Clamperl:['Water'],Huntail:['Water'],Gorebyss:['Water'],
  Relicanth:['Water','Rock'],Luvdisc:['Water'],Bagon:['Dragon'],Shelgon:['Dragon'],Salamence:['Dragon','Flying'],Beldum:['Steel','Psychic'],Metang:['Steel','Psychic'],Metagross:['Steel','Psychic'],
  Regirock:['Rock'],Regice:['Ice'],Registeel:['Steel'],Latias:['Dragon','Psychic'],Latios:['Dragon','Psychic'],Kyogre:['Water'],Groudon:['Ground'],Rayquaza:['Dragon','Flying'],Jirachi:['Steel','Psychic'],Deoxys:['Psychic'],
  // Gen 4
  Turtwig:['Grass'],Grotle:['Grass'],Torterra:['Grass','Ground'],Chimchar:['Fire'],Monferno:['Fire','Fighting'],Infernape:['Fire','Fighting'],Piplup:['Water'],Prinplup:['Water'],Empoleon:['Water','Steel'],Starly:['Normal','Flying'],Staravia:['Normal','Flying'],Staraptor:['Normal','Flying'],
  Bidoof:['Normal'],Bibarel:['Normal','Water'],Kricketot:['Bug'],Kricketune:['Bug'],Shinx:['Electric'],Luxio:['Electric'],Luxray:['Electric'],Budew:['Grass','Poison'],Roserade:['Grass','Poison'],
  Cranidos:['Rock'],Rampardos:['Rock'],Shieldon:['Rock','Steel'],Bastiodon:['Rock','Steel'],Burmy:['Bug'],Wormadam:['Bug','Grass'],Mothim:['Bug','Flying'],Combee:['Bug','Flying'],Vespiquen:['Bug','Flying'],
  Pachirisu:['Electric'],Buizel:['Water'],Floatzel:['Water'],Cherubi:['Grass'],Cherrim:['Grass'],Shellos:['Water'],Gastrodon:['Water','Ground'],
  Ambipom:['Normal'],Drifloon:['Ghost','Flying'],Drifblim:['Ghost','Flying'],Buneary:['Normal'],Lopunny:['Normal'],Mismagius:['Ghost'],
  Honchkrow:['Dark','Flying'],Glameow:['Normal'],Purugly:['Normal'],Chingling:['Psychic'],Stunky:['Poison','Dark'],Skuntank:['Poison','Dark'],
  Bronzor:['Steel','Psychic'],Bronzong:['Steel','Psychic'],Bonsly:['Rock'],'Mime Jr.':['Psychic','Fairy'],Happiny:['Normal'],
  Chatot:['Normal','Flying'],Spiritomb:['Ghost','Dark'],Gible:['Dragon','Ground'],Gabite:['Dragon','Ground'],Garchomp:['Dragon','Ground'],Munchlax:['Normal'],
  Riolu:['Fighting'],Lucario:['Fighting','Steel'],Hippopotas:['Ground'],Hippowdon:['Ground'],Skorupi:['Poison','Bug'],Drapion:['Poison','Dark'],Croagunk:['Poison','Fighting'],Toxicroak:['Poison','Fighting'],
  Carnivine:['Grass'],Finneon:['Water'],Lumineon:['Water'],Mantyke:['Water','Flying'],Snover:['Grass','Ice'],Abomasnow:['Grass','Ice'],
  Weavile:['Dark','Ice'],Magnezone:['Electric','Steel'],Lickilicky:['Normal'],Rhyperior:['Ground','Rock'],
  Tangrowth:['Grass'],Electivire:['Electric'],Magmortar:['Fire'],Togekiss:['Fairy','Flying'],
  Yanmega:['Bug','Flying'],Leafeon:['Grass'],Glaceon:['Ice'],Gliscor:['Ground','Flying'],Mamoswine:['Ice','Ground'],
  'Porygon-Z':['Normal'],Gallade:['Psychic','Fighting'],Probopass:['Rock','Steel'],Dusknoir:['Ghost'],
  Froslass:['Ice','Ghost'],Rotom:['Electric','Ghost'],Uxie:['Psychic'],Mesprit:['Psychic'],Azelf:['Psychic'],Dialga:['Steel','Dragon'],
  Palkia:['Water','Dragon'],Heatran:['Fire','Steel'],Regigigas:['Normal'],Giratina:['Ghost','Dragon'],
  Cresselia:['Psychic'],Phione:['Water'],Manaphy:['Water'],Darkrai:['Dark'],Shaymin:['Grass'],
  Arceus:['Normal'],// Gen 5
  Victini:['Psychic','Fire'],Snivy:['Grass'],Servine:['Grass'],Serperior:['Grass'],Tepig:['Fire'],Pignite:['Fire','Fighting'],Emboar:['Fire','Fighting'],
  Oshawott:['Water'],Dewott:['Water'],Samurott:['Water'],Patrat:['Normal'],Watchog:['Normal'],Lillipup:['Normal'],Herdier:['Normal'],Stoutland:['Normal'],Purrloin:['Dark'],Liepard:['Dark'],
  Pansage:['Grass'],Simisage:['Grass'],Pansear:['Fire'],Simisear:['Fire'],Panpour:['Water'],Simipour:['Water'],Munna:['Psychic'],Musharna:['Psychic'],
  Pidove:['Normal','Flying'],Tranquill:['Normal','Flying'],Unfezant:['Normal','Flying'],Blitzle:['Electric'],Zebstrika:['Electric'],Roggenrola:['Rock'],Boldore:['Rock'],Gigalith:['Rock'],Woobat:['Psychic','Flying'],Swoobat:['Psychic','Flying'],
  Drilbur:['Ground'],Excadrill:['Ground','Steel'],Audino:['Normal'],Timburr:['Fighting'],Gurdurr:['Fighting'],Conkeldurr:['Fighting'],Tympole:['Water'],Palpitoad:['Water','Ground'],Seismitoad:['Water','Ground'],
  Throh:['Fighting'],Sawk:['Fighting'],Sewaddle:['Bug','Grass'],Swadloon:['Bug','Grass'],Leavanny:['Bug','Grass'],Venipede:['Bug','Poison'],Whirlipede:['Bug','Poison'],Scolipede:['Bug','Poison'],Cottonee:['Grass','Fairy'],Whimsicott:['Grass','Fairy'],
  Petilil:['Grass'],Lilligant:['Grass'],Basculin:['Water'],Sandile:['Ground','Dark'],Krokorok:['Ground','Dark'],Krookodile:['Ground','Dark'],Darumaka:['Fire'],Darmanitan:['Fire'],
  Maractus:['Grass'],Dwebble:['Bug','Rock'],Crustle:['Bug','Rock'],Scraggy:['Dark','Fighting'],Scrafty:['Dark','Fighting'],Sigilyph:['Psychic','Flying'],
  Yamask:['Ghost'],Cofagrigus:['Ghost'],Tirtouga:['Water','Rock'],Carracosta:['Water','Rock'],Archen:['Rock','Flying'],Archeops:['Rock','Flying'],Trubbish:['Poison'],Garbodor:['Poison'],
  Zorua:['Dark'],Zoroark:['Dark'],Minccino:['Normal'],Cinccino:['Normal'],Gothita:['Psychic'],Gothorita:['Psychic'],Gothitelle:['Psychic'],Solosis:['Psychic'],Duosion:['Psychic'],Reuniclus:['Psychic'],
  Ducklett:['Water','Flying'],Swanna:['Water','Flying'],Vanillite:['Ice'],Vanillish:['Ice'],Vanilluxe:['Ice'],Deerling:['Normal','Grass'],Sawsbuck:['Normal','Grass'],Emolga:['Electric','Flying'],
  Karrablast:['Bug'],Escavalier:['Bug','Steel'],Foongus:['Grass','Poison'],Amoonguss:['Grass','Poison'],Frillish:['Water','Ghost'],Jellicent:['Water','Ghost'],Alomomola:['Water'],
  Joltik:['Bug','Electric'],Galvantula:['Bug','Electric'],Ferroseed:['Grass','Steel'],Ferrothorn:['Grass','Steel'],Klink:['Steel'],Klang:['Steel'],Klinklang:['Steel'],Tynamo:['Electric'],Eelektrik:['Electric'],Eelektross:['Electric'],
  Elgyem:['Psychic'],Beheeyem:['Psychic'],Litwick:['Ghost','Fire'],Lampent:['Ghost','Fire'],Chandelure:['Ghost','Fire'],Axew:['Dragon'],Fraxure:['Dragon'],Haxorus:['Dragon'],Cubchoo:['Ice'],Beartic:['Ice'],
  Cryogonal:['Ice'],Shelmet:['Bug'],Accelgor:['Bug'],Stunfisk:['Ground','Electric'],Mienfoo:['Fighting'],Mienshao:['Fighting'],
  Druddigon:['Dragon'],Golett:['Ground','Ghost'],Golurk:['Ground','Ghost'],Pawniard:['Dark','Steel'],Bisharp:['Dark','Steel'],Bouffalant:['Normal'],
  Rufflet:['Normal','Flying'],Braviary:['Normal','Flying'],Vullaby:['Dark','Flying'],Mandibuzz:['Dark','Flying'],Heatmor:['Fire'],Durant:['Bug','Steel'],Deino:['Dark','Dragon'],Zweilous:['Dark','Dragon'],Hydreigon:['Dark','Dragon'],
  Larvesta:['Bug','Fire'],Volcarona:['Bug','Fire'],Cobalion:['Steel','Fighting'],Terrakion:['Rock','Fighting'],Virizion:['Grass','Fighting'],Tornadus:['Flying'],Thundurus:['Electric','Flying'],Reshiram:['Dragon','Fire'],Zekrom:['Dragon','Electric'],
  Landorus:['Ground','Flying'],Kyurem:['Dragon','Ice'],Keldeo:['Water','Fighting'],Meloetta:['Normal','Psychic'],
  Genesect:['Bug','Steel'],// Gen 6
  Chespin:['Grass'],Quilladin:['Grass'],Chesnaught:['Grass','Fighting'],Fennekin:['Fire'],Braixen:['Fire'],Delphox:['Fire','Psychic'],Froakie:['Water'],Frogadier:['Water'],Greninja:['Water','Dark'],
  Bunnelby:['Normal'],Diggersby:['Normal','Ground'],Fletchling:['Normal','Flying'],Fletchinder:['Fire','Flying'],Talonflame:['Fire','Flying'],Scatterbug:['Bug'],Spewpa:['Bug'],Vivillon:['Bug','Flying'],Litleo:['Fire','Normal'],Pyroar:['Fire','Normal'],
  Flabebe:['Fairy'],Floette:['Fairy'],Florges:['Fairy'],Skiddo:['Grass'],Gogoat:['Grass'],Pancham:['Fighting'],Pangoro:['Fighting','Dark'],Furfrou:['Normal'],
  Espurr:['Psychic'],Meowstic:['Psychic'],Honedge:['Steel','Ghost'],Doublade:['Steel','Ghost'],Aegislash:['Steel','Ghost'],Spritzee:['Fairy'],Aromatisse:['Fairy'],Swirlix:['Fairy'],Slurpuff:['Fairy'],
  Inkay:['Dark','Psychic'],Malamar:['Dark','Psychic'],Binacle:['Rock','Water'],Barbaracle:['Rock','Water'],Skrelp:['Poison','Water'],Dragalge:['Poison','Dragon'],Clauncher:['Water'],Clawitzer:['Water'],
  Helioptile:['Electric','Normal'],Heliolisk:['Electric','Normal'],Tyrunt:['Rock','Dragon'],Tyrantrum:['Rock','Dragon'],Amaura:['Rock','Ice'],Aurorus:['Rock','Ice'],Sylveon:['Fairy'],
  Hawlucha:['Fighting','Flying'],Dedenne:['Electric','Fairy'],Carbink:['Rock','Fairy'],Goomy:['Dragon'],Sliggoo:['Dragon'],Goodra:['Dragon'],
  Klefki:['Steel','Fairy'],Phantump:['Ghost','Grass'],Trevenant:['Ghost','Grass'],Pumpkaboo:['Ghost','Grass'],Gourgeist:['Ghost','Grass'],Bergmite:['Ice'],Avalugg:['Ice'],
  Noibat:['Flying','Dragon'],Noivern:['Flying','Dragon'],Xerneas:['Fairy'],Yveltal:['Dark','Flying'],Zygarde:['Dragon','Ground'],Diancie:['Rock','Fairy'],Hoopa:['Psychic','Ghost'],Volcanion:['Fire','Water'],// Gen 7
  Rowlet:['Grass','Flying'],Dartrix:['Grass','Flying'],Decidueye:['Grass','Ghost'],
  Litten:['Fire'],Torracat:['Fire'],Incineroar:['Fire','Dark'],Popplio:['Water'],Brionne:['Water'],Primarina:['Water','Fairy'],Pikipek:['Normal','Flying'],Trumbeak:['Normal','Flying'],Toucannon:['Normal','Flying'],Yungoos:['Normal'],Gumshoos:['Normal'],
  Grubbin:['Bug'],Charjabug:['Bug','Electric'],Vikavolt:['Bug','Electric'],Crabrawler:['Fighting'],Crabominable:['Fighting','Ice'],Oricorio:['Fire','Flying'],Cutiefly:['Bug','Fairy'],Ribombee:['Bug','Fairy'],
  Rockruff:['Rock'],Lycanroc:['Rock'],Wishiwashi:['Water'],Mareanie:['Poison','Water'],Toxapex:['Poison','Water'],Mudbray:['Ground'],Mudsdale:['Ground'],
  Dewpider:['Water','Bug'],Araquanid:['Water','Bug'],Fomantis:['Grass'],Lurantis:['Grass'],Morelull:['Grass','Fairy'],Shiinotic:['Grass','Fairy'],Salandit:['Poison','Fire'],Salazzle:['Poison','Fire'],
  Stufful:['Normal','Fighting'],Bewear:['Normal','Fighting'],Bounsweet:['Grass'],Steenee:['Grass'],Tsareena:['Grass'],Comfey:['Fairy'],Oranguru:['Normal','Psychic'],
  Passimian:['Fighting'],Wimpod:['Bug','Water'],Golisopod:['Bug','Water'],Sandygast:['Ghost','Ground'],Palossand:['Ghost','Ground'],Pyukumuku:['Water'],
  'Type: Null':['Normal'],Silvally:['Normal'],Minior:['Rock','Flying'],Komala:['Normal'],Turtonator:['Fire','Dragon'],
  Togedemaru:['Electric','Steel'],Mimikyu:['Ghost','Fairy'],Bruxish:['Water','Psychic'],Drampa:['Normal','Dragon'],
  Dhelmise:['Ghost','Grass'],'Jangmo-o':['Dragon'],'Hakamo-o':['Dragon','Fighting'],'Kommo-o':['Dragon','Fighting'],'Tapu Koko':['Electric','Fairy'],'Tapu Lele':['Psychic','Fairy'],'Tapu Bulu':['Grass','Fairy'],'Tapu Fini':['Water','Fairy'],
  Cosmog:['Psychic'],Cosmoem:['Psychic'],Solgaleo:['Psychic','Steel'],Lunala:['Psychic','Ghost'],Nihilego:['Rock','Poison'],Buzzwole:['Bug','Fighting'],Pheromosa:['Bug','Fighting'],Xurkitree:['Electric'],
  Celesteela:['Steel','Flying'],Kartana:['Grass','Steel'],Guzzlord:['Dark','Dragon'],Necrozma:['Psychic'],Magearna:['Steel','Fairy'],Marshadow:['Fighting','Ghost'],
  Poipole:['Poison'],Naganadel:['Poison','Dragon'],Stakataka:['Rock','Steel'],Blacephalon:['Fire','Ghost'],Zeraora:['Electric'],Meltan:['Steel'],Melmetal:['Steel'],// Gen 8
  Grookey:['Grass'],Thwackey:['Grass'],Rillaboom:['Grass'],
  Scorbunny:['Fire'],Raboot:['Fire'],Cinderace:['Fire'],Sobble:['Water'],Drizzile:['Water'],Inteleon:['Water'],Skwovet:['Normal'],Greedent:['Normal'],Rookidee:['Flying'],Corvisquire:['Flying'],Corviknight:['Flying','Steel'],
  Blipbug:['Bug'],Dottler:['Bug','Psychic'],Orbeetle:['Bug','Psychic'],Nickit:['Dark'],Thievul:['Dark'],Gossifleur:['Grass'],Eldegoss:['Grass'],Wooloo:['Normal'],Dubwool:['Normal'],
  Chewtle:['Water'],Drednaw:['Water','Rock'],Yamper:['Electric'],Boltund:['Electric'],Rolycoly:['Rock'],Carkol:['Rock','Fire'],Coalossal:['Rock','Fire'],Applin:['Grass','Dragon'],Flapple:['Grass','Dragon'],Appletun:['Grass','Dragon'],
  Silicobra:['Ground'],Sandaconda:['Ground'],Cramorant:['Flying','Water'],Arrokuda:['Water'],Barraskewda:['Water'],Toxel:['Electric','Poison'],Toxtricity:['Electric','Poison'],
  Sizzlipede:['Fire','Bug'],Centiskorch:['Fire','Bug'],Clobbopus:['Fighting'],Grapploct:['Fighting'],Sinistea:['Ghost'],Polteageist:['Ghost'],Hatenna:['Psychic'],Hattrem:['Psychic'],Hatterene:['Psychic','Fairy'],
  Impidimp:['Dark','Fairy'],Morgrem:['Dark','Fairy'],Grimmsnarl:['Dark','Fairy'],Obstagoon:['Dark','Normal'],Perrserker:['Steel'],Cursola:['Ghost'],
  Sirfetchd:['Fighting'],'Mr. Rime':['Ice','Psychic'],Runerigus:['Ground','Ghost'],Milcery:['Fairy'],Alcremie:['Fairy'],
  Falinks:['Fighting'],Pincurchin:['Electric'],Snom:['Ice','Bug'],Frosmoth:['Ice','Bug'],Stonjourner:['Rock'],
  Eiscue:['Ice'],Indeedee:['Psychic','Normal'],Morpeko:['Electric','Dark'],Cufant:['Steel'],Copperajah:['Steel'],
  Dracozolt:['Electric','Dragon'],Arctozolt:['Electric','Ice'],Dracovish:['Water','Dragon'],Arctovish:['Water','Ice'],Duraludon:['Steel','Dragon'],Dreepy:['Dragon','Ghost'],Drakloak:['Dragon','Ghost'],Dragapult:['Dragon','Ghost'],
  Zacian:['Fairy'],Zamazenta:['Fighting'],Eternatus:['Poison','Dragon'],Kubfu:['Fighting'],Urshifu:['Fighting','Dark'],Zarude:['Dark','Grass'],Regieleki:['Electric'],Regidrago:['Dragon'],
  Glastrier:['Ice'],Spectrier:['Ghost'],Calyrex:['Psychic','Grass'],Wyrdeer:['Normal','Psychic'],Kleavor:['Bug','Rock'],Ursaluna:['Ground','Normal'],
  Basculegion:['Water','Ghost'],Sneasler:['Fighting','Poison'],Overqwil:['Dark','Poison'],Enamorus:['Fairy','Flying'],// Gen 9
  Sprigatito:['Grass'],Floragato:['Grass'],Meowscarada:['Grass','Dark'],Fuecoco:['Fire'],Crocalor:['Fire'],Skeledirge:['Fire','Ghost'],
  Quaxly:['Water'],Quaxwell:['Water'],Quaquaval:['Water','Fighting'],Lechonk:['Normal'],Oinkologne:['Normal'],Tarountula:['Bug'],Spidops:['Bug'],Nymble:['Bug'],Lokix:['Bug','Dark'],
  Pawmi:['Electric'],Pawmo:['Electric','Fighting'],Pawmot:['Electric','Fighting'],Tandemaus:['Normal'],Maushold:['Normal'],Fidough:['Fairy'],Dachsbun:['Fairy'],Smoliv:['Grass','Normal'],Dolliv:['Grass','Normal'],Arboliva:['Grass','Normal'],
  Squawkabilly:['Normal','Flying'],Nacli:['Rock'],Naclstack:['Rock'],Garganacl:['Rock'],Charcadet:['Fire'],Armarouge:['Fire','Psychic'],Ceruledge:['Fire','Ghost'],Tadbulb:['Electric'],Bellibolt:['Electric'],
  Wattrel:['Electric','Flying'],Kilowattrel:['Electric','Flying'],Maschiff:['Dark'],Maboss:['Dark'],Shroodle:['Poison','Normal'],Grafaiai:['Poison','Normal'],Bramblin:['Grass','Ghost'],Brambleghast:['Grass','Ghost'],
  Toedscool:['Ground','Grass'],Toedscruel:['Ground','Grass'],Klawf:['Rock'],Capsakid:['Grass'],Scovillain:['Grass','Fire'],Rellor:['Bug'],Rabsca:['Bug','Psychic'],
  Flittle:['Psychic'],Espathra:['Psychic'],Tinkatink:['Fairy','Steel'],Tinkatuff:['Fairy','Steel'],Tinkaton:['Fairy','Steel'],Wiglett:['Water'],Wugtrio:['Water'],Bombirdier:['Flying','Dark'],
  Finizen:['Water'],Palafin:['Water'],Varoom:['Steel','Poison'],Revavroom:['Steel','Poison'],Cyclizar:['Dragon','Normal'],Orthworm:['Steel'],
  Glimmet:['Rock','Poison'],Glimmora:['Rock','Poison'],Greavard:['Ghost'],Houndstone:['Ghost'],Flamigo:['Flying','Fighting'],Cetoddle:['Ice'],Cetitan:['Ice'],
  Veluza:['Water','Psychic'],Dondozo:['Water'],Tatsugiri:['Dragon','Water'],Annihilape:['Fighting','Ghost'],
  Clodsire:['Poison','Ground'],Farigiraf:['Normal','Psychic'],Dudunsparce:['Normal'],Kingambit:['Dark','Steel'],
  'Great Tusk':['Ground','Fighting'],'Scream Tail':['Fairy','Psychic'],'Brute Bonnet':['Grass','Dark'],'Flutter Mane':['Ghost','Fairy'],'Slither Wing':['Bug','Fighting'],'Sandy Shocks':['Electric','Ground'],'Iron Treads':['Ground','Steel'],'Iron Bundle':['Ice','Water'],
  'Iron Hands':['Fighting','Electric'],'Iron Jugulis':['Dark','Flying'],'Iron Moth':['Fire','Poison'],'Iron Thorns':['Rock','Electric'],Frigibax:['Dragon','Ice'],Arctibax:['Dragon','Ice'],Baxcalibur:['Dragon','Ice'],Gimmighoul:['Ghost'],Gholdengo:['Steel','Ghost'],
  'Wo-Chien':['Dark','Grass'],'Chien-Pao':['Dark','Ice'],'Ting-Lu':['Dark','Ground'],'Chi-Yu':['Dark','Fire'],'Roaring Moon':['Dragon','Dark'],'Iron Valiant':['Fairy','Fighting'],Koraidon:['Fighting','Dragon'],Miraidon:['Electric','Dragon'],
  'Walking Wake':['Water','Dragon'],'Iron Leaves':['Grass','Psychic'],Dipplin:['Grass','Dragon'],Poltchageist:['Grass','Ghost'],Sinistcha:['Grass','Ghost'],Okidogi:['Poison','Fighting'],Munkidori:['Poison','Psychic'],Fezandipiti:['Poison','Fairy'],Ogerpon:['Grass'],
  'Gouging Fire':['Fire','Dragon'],'Raging Bolt':['Electric','Dragon'],'Iron Boulder':['Rock','Psychic'],'Iron Crown':['Steel','Psychic'],Terapagos:['Normal'],Pecharunt:['Poison','Ghost'],'Alolan Rattata':['Dark','Normal'],'Alolan Raticate':['Dark','Normal'],
  'Alolan Raichu':['Electric','Psychic'],'Alolan Sandshrew':['Ice','Steel'],'Alolan Sandslash':['Ice','Steel'],'Alolan Vulpix':['Ice'],'Alolan Ninetales':['Ice','Fairy'],'Alolan Diglett':['Ground','Steel'],'Alolan Dugtrio':['Ground','Steel'],
  'Alolan Meowth':['Dark'],'Alolan Persian':['Dark'],'Alolan Geodude':['Rock','Electric'],'Alolan Graveler':['Rock','Electric'],'Alolan Golem':['Rock','Electric'],'Alolan Grimer':['Poison','Dark'],'Alolan Muk':['Poison','Dark'],'Alolan Exeggutor':['Grass','Dragon'],
  'Alolan Marowak':['Fire','Ghost'],'Galarian Meowth':['Steel'],'Galarian Persian':['Normal'],'Galarian Ponyta':['Psychic'],'Galarian Rapidash':['Psychic','Fairy'],'Galarian Slowpoke':['Psychic'],'Galarian Slowbro':['Poison','Psychic'],'Galarian Slowking':['Poison','Psychic'],
  'Galarian Farfetchd':['Fighting'],'Galarian Weezing':['Poison','Fairy'],'Galarian Mr. Mime':['Ice','Psychic'],'Galarian Articuno':['Psychic','Flying'],'Galarian Zapdos':['Fighting','Flying'],'Galarian Moltres':['Dark','Flying'],
  'Galarian Corsola':['Ghost'],'Galarian Zigzagoon':['Dark','Normal'],'Galarian Linoone':['Dark','Normal'],'Galarian Darumaka':['Ice'],'Galarian Darmanitan':['Ice'],'Galarian Yamask':['Ground','Ghost'],'Galarian Stunfisk':['Ground','Steel'],
  'Galarian Zapdos':['Fighting','Flying'],'Hisuian Growlithe':['Fire','Rock'],'Hisuian Arcanine':['Fire','Rock'],'Hisuian Voltorb':['Electric','Grass'],'Hisuian Electrode':['Electric','Grass'],'Hisuian Typhlosion':['Fire','Ghost'],
  'Hisuian Qwilfish':['Dark','Poison'],'Hisuian Sneasel':['Fighting','Poison'],'Hisuian Samurott':['Water','Dark'],'Hisuian Lilligant':['Grass','Fighting'],
  'Hisuian Zorua':['Normal','Ghost'],'Hisuian Zoroark':['Normal','Ghost'],'Hisuian Braviary':['Psychic','Flying'],'Hisuian Sliggoo':['Steel','Dragon'],'Hisuian Goodra':['Steel','Dragon'],'Hisuian Avalugg':['Ice','Rock'],
  'Hisuian Decidueye':['Grass','Fighting'],'Paldean Wooper':['Poison','Ground'],'Clodsire':['Poison','Ground'],'Paldean Tauros (Combat)':['Fighting'],'Paldean Tauros (Blaze)':['Fighting','Fire'],
  'Paldean Tauros (Aqua)':['Fighting','Water'],'Mega Venusaur':['Grass','Poison'],'Mega Charizard X':['Fire','Dragon'],'Mega Charizard Y':['Fire','Flying'],'Mega Blastoise':['Water'],'Mega Beedrill':['Bug','Poison'],'Mega Pidgeot':['Normal','Flying'],'Mega Alakazam':['Psychic'],'Mega Slowbro':['Water','Psychic'],
  'Mega Gengar':['Ghost','Poison'],'Mega Kangaskhan':['Normal'],'Mega Pinsir':['Bug','Flying'],'Mega Gyarados':['Water','Dark'],'Mega Lapras':['Water','Ice'],'Mega Aerodactyl':['Rock','Flying'],'Mega Mewtwo X':['Psychic','Fighting'],'Mega Mewtwo Y':['Psychic'],'Mega Ampharos':['Electric','Dragon'],'Mega Scizor':['Bug','Steel'],
  'Mega Heracross':['Bug','Fighting'],'Mega Houndoom':['Dark','Fire'],'Mega Tyranitar':['Rock','Dark'],'Mega Blaziken':['Fire','Fighting'],'Mega Gardevoir':['Psychic','Fairy'],'Mega Mawile':['Steel','Fairy'],'Mega Aggron':['Steel'],'Mega Medicham':['Fighting','Psychic'],'Mega Manectric':['Electric'],'Mega Banette':['Ghost'],'Mega Absol':['Dark'],
  'Mega Latias':['Dragon','Psychic'],'Mega Latios':['Dragon','Psychic'],'Mega Garchomp':['Dragon','Ground'],'Mega Lucario':['Fighting','Steel'],'Mega Abomasnow':['Grass','Ice'],'Mega Gallade':['Psychic','Fighting'],'Mega Audino':['Normal','Fairy'],'Mega Diancie':['Rock','Fairy'],'Mega Rayquaza':['Dragon','Flying'],
  'Mega Lopunny':['Normal','Fighting'],'Mega Sableye':['Dark','Ghost'],'Mega Altaria':['Dragon','Fairy'],'Mega Salamence':['Dragon','Flying'],'Mega Metagross':['Steel','Psychic'],'Mega Steelix':['Steel','Ground'],'Mega Sharpedo':['Water','Dark'],'Mega Camerupt':['Fire','Ground'],
  'Mega Glalie':['Ice'],'Mega Swampert':['Water','Ground'],'Rotom-Heat':['Electric','Fire'],'Rotom-Wash':['Electric','Water'],'Rotom-Frost':['Electric','Ice'],'Rotom-Fan':['Electric','Flying'],'Rotom-Mow':['Electric','Grass'],'Shaymin-Sky':['Grass','Flying'],
  'Giratina-Origin':['Ghost','Dragon'],'Tornadus-Therian':['Flying'],'Thundurus-Therian':['Electric','Flying'],'Landorus-Therian':['Ground','Flying'],'Kyurem-Black':['Dragon','Ice'],'Kyurem-White':['Dragon','Ice'],'Keldeo-Resolute':['Water','Fighting'],
  'Aegislash-Blade':['Steel','Ghost'],'Oricorio-Pom-Pom':['Electric','Flying'],'Oricorio-Pa\'u':['Psychic','Flying'],'Oricorio-Sensu':['Ghost','Flying'],'Lycanroc-Midnight':['Rock'],'Lycanroc-Dusk':['Rock'],'Wishiwashi-School':['Water'],
  'Minior-Core':['Rock','Flying'],'Mimikyu-Busted':['Ghost','Fairy'],'Necrozma-Dusk-Mane':['Psychic','Steel'],'Necrozma-Dawn-Wings':['Psychic','Ghost'],'Necrozma-Ultra':['Psychic','Dragon'],'Urshifu-Rapid-Strike':['Fighting','Water'],
  'Calyrex-Ice':['Psychic','Ice'],'Calyrex-Shadow':['Psychic','Ghost'],'Enamorus-Therian':['Fairy','Flying'],'Wormadam-Sandy':['Bug','Ground'],'Wormadam-Trash':['Bug','Steel'],'Basculegion-F':['Water','Ghost'],
  'Oinkologne-F':['Normal'],
};

// Build lowercase lookup map for fuzzy search
const POKEDEX_LOWER = {};
Object.keys(POKEDEX_TYPES).forEach(n => { POKEDEX_LOWER[n.toLowerCase()] = n; });

function searchPokemon(query) {
  if (!query || query.length < 2) return [];
  const q = query.toLowerCase();
  const exact = [];
  const starts = [];
  const contains = [];
  Object.keys(POKEDEX_LOWER).forEach(lower => {
    if (lower === q) exact.push(POKEDEX_LOWER[lower]);
    else if (lower.startsWith(q)) starts.push(POKEDEX_LOWER[lower]);
    else if (lower.includes(q)) contains.push(POKEDEX_LOWER[lower]);
  });
  return [...exact, ...starts, ...contains].slice(0, 8);
}

function fillSlotFromPokemon(si, name) {
  const types = POKEDEX_TYPES[name];
  if (!types) return;
  teamSlots[si] = [
    TYPES.includes(types[0]) ? types[0] : null,
    types[1] && TYPES.includes(types[1]) ? types[1] : null,
    null
  ];
  teamSlotNames[si] = name;
  const dd = document.getElementById(`pkmnDrop${si}`);
  if (dd) dd.style.display = 'none';
  renderTeamAnalyzer();
}

function onPkmnInput(si, val) {
  const results = searchPokemon(val);
  const dd = document.getElementById(`pkmnDrop${si}`);
  if (!dd) return;
  if (!results.length || !val) { dd.style.display = 'none'; return; }
  dd.style.display = 'block';
  dd.innerHTML = results.map(name => {
    const types = POKEDEX_TYPES[name];
    const badges = types.map(t => {
      const col = TYPE_COLORS[t] || '#888';
      return `<span style="font-size:9px;padding:1px 5px;border-radius:3px;background:${col};color:${TYPE_TEXT[t]||'#fff'};font-weight:700">${t}</span>`;
    }).join(' ');
    return `<div data-action="select-pokemon-result" data-slot="${si}" data-name="${name.replace(/'/g,"&#39;")}"
      style="padding:6px 10px;cursor:pointer;display:flex;align-items:center;justify-content:space-between;gap:8px"
     >
      <span style="font-size:12px;color:var(--text)">${name}</span>
      <span style="display:flex;gap:3px">${badges}</span>
    </div>`;
  }).join('');
}

const teamSlots = Array.from({length: 6}, () => [null, null, null]);
const teamSlotNames = Array(6).fill(null); // tracks selected Pokémon name per slot
let moveSlots = [null, null, null, null]; // up to 4 move types
let tierListCustom = null; // null = auto-generated, array = user-arranged

APP_STATE.team = APP_STATE.team || {};
Object.defineProperties(APP_STATE.team, {
  teamSlots: { get: () => teamSlots },
  teamSlotNames: { get: () => teamSlotNames },
  moveSlots: { get: () => moveSlots, set: v => { moveSlots = v; } },
  tierListCustom: { get: () => tierListCustom, set: v => { tierListCustom = v; } },
});
const TIER_META = {
  S:{label:'S',color:'#ff7675',bg:'rgba(255,118,117,0.15)',desc:'Exceptional — best of the best'},
  A:{label:'A',color:'#fdcb6e',bg:'rgba(253,203,110,0.15)',desc:'Great — strong with few weaknesses'},
  B:{label:'B',color:'#55efc4',bg:'rgba(85,239,196,0.15)',desc:'Good — solid, reliable choice'},
  C:{label:'C',color:'#74b9ff',bg:'rgba(116,185,255,0.15)',desc:'Average — workable but limited'},
  D:{label:'D',color:'#a29bfe',bg:'rgba(162,155,254,0.15)',desc:'Below average — notable issues'},
  F:{label:'F',color:'#b2bec3',bg:'rgba(178,190,195,0.15)',desc:'Poor — heavily outclassed'},
};
const TIER_ORDER = ['S','A','B','C','D','F'];

const scoreVal = (v, sign) => v===2?sign:v===4?sign*2:v===0.5?-sign:v===0.25?-sign*2:v===0?-sign*3:0;

function scoreTierType(t) {
  return TYPES.reduce((s,d) => s + scoreVal(chart[t]?.[d]??1, 1), 0)
       + TYPES.reduce((s,a) => s + scoreVal(chart[a]?.[t]??1, -1), 0);
}

function autoGenerateTiers() {
  const tiers = { S:[], A:[], B:[], C:[], D:[], F:[] };
  const scores = TYPES.map(t => scoreTierType(t));
  const allEqual = scores.every(s => s === scores[0]);
  if (allEqual) { TYPES.forEach(t => tiers.C.push(t)); return tiers; }
  const n = TYPES.length / 18;
  TYPES.forEach((t, i) => {
    const gr = GRADES.find(g => scores[i] >= g.threshold * n);
    tiers[gr.g].push(t);
  });
  return tiers;
}

function renderTierList() {
  const el = document.getElementById('tierListContent');
  if (!el) return;
  if (!tierListCustom) tierListCustom = autoGenerateTiers();
  const tiers = tierListCustom;
  const typeChip = (t, tier) =>
    `<div draggable="true" data-tier-drag-type="${t}" data-tier-dragover="1"
      style="display:inline-flex;align-items:center;gap:5px;padding:5px 10px;border-radius:6px;background:${TYPE_COLORS[t]};color:${TYPE_TEXT[t]||getContrastText(TYPE_COLORS[t])};font-size:12px;font-weight:700;cursor:grab;user-select:none;transition:transform 0.1s"
      title="Drag to move · Score: ${scoreTierType(t).toFixed(1)}">
      ${typeIcon(t,13)}${t}
    </div>`;

  const tierRow = (key) => {
    const m = TIER_META[key];
    return `<div data-tier-dragover="1" data-tier-drop="${key}"
      style="display:flex;align-items:stretch;gap:0;border-radius:8px;overflow:hidden;border:1px solid var(--border);min-height:54px;margin-bottom:6px">
      <div style="width:52px;min-width:52px;background:${m.color};display:flex;align-items:center;justify-content:center;font-size:26px;font-weight:900;color:#fff;text-shadow:0 1px 4px rgba(0,0,0,0.4)">
        ${m.label}
      </div>
      <div style="flex:1;background:${m.bg};display:flex;align-items:center;flex-wrap:wrap;gap:6px;padding:8px 12px;min-height:54px">
        ${tiers[key].length ? tiers[key].map(t => typeChip(t, key)).join('') : `<span style="font-size:11px;color:var(--dim);font-style:italic">Drop types here</span>`}
      </div>
    </div>`;
  };

  el.innerHTML = `
    <div style="display:flex;align-items:center;gap:12px;margin-bottom:6px;flex-wrap:wrap">
      <div>
        <div style="font-size:14px;font-weight:800;color:var(--text)">🏆 Type Tier List</div>
        <div style="font-size:11px;color:var(--dim);margin-top:2px">Auto-ranked by overall balance score. Drag types between tiers to customize.</div>
      </div>
      <div style="display:flex;gap:6px;margin-left:auto;flex-wrap:wrap">
        <button data-action="reset-tier-list" style="padding:6px 12px;background:var(--surface2);border:1px solid var(--border);color:var(--dim2);border-radius:6px;cursor:pointer;font-size:11px;font-weight:700">↺ Reset to Auto</button>
        <button data-action="export-tier-list-png" style="padding:6px 14px;background:var(--accent);border:none;color:white;border-radius:6px;cursor:pointer;font-size:11px;font-weight:700">🖼 Export PNG</button>
      </div>
    </div>
    <div style="font-size:10px;color:var(--dim);margin-bottom:14px">Scoring: +2 per SE hit · −1 per resisted · −1.5 per immune given · −2 per weakness · +1 per resistance · +2 per immunity taken</div>
    <div id="tierListRows">
      ${TIER_ORDER.map(tierRow).join('')}
    </div>`;
}

let _tierDragging = null;
function tierDragStart(typeName, e) { _tierDragging = typeName; e.dataTransfer.effectAllowed = 'move'; }
function tierDrop(targetTier, e) {
  e.preventDefault();
  if (!_tierDragging || !tierListCustom) return;
  // Remove from current tier
  TIER_ORDER.forEach(t => {
    tierListCustom[t] = tierListCustom[t].filter(x => x !== _tierDragging);
  });
  tierListCustom[targetTier].push(_tierDragging);
  _tierDragging = null;
  renderTierList();
}

function exportTierListPNG() {
  exportPNG(document.getElementById('tierListRows'), 'type-tier-list.png',
    { backgroundColor: getComputedStyle(document.body).getPropertyValue('--bg').trim() || '#0d0d14', scale: 2 });
}

function renderMovesetChecker() {
  const el = document.getElementById('movesetCheckerContent');
  if (!el) return;

  const activeSlots = moveSlots.filter(Boolean);

  // Build results
  let resultHtml = '';
  if (activeSlots.length > 0) {
    // For each defending type, find the best multiplier any move achieves
    const coverage = TYPES.map(def => {
      const best = Math.max(...activeSlots.map(atk => chart[atk]?.[def] ?? 1));
      return { def, best };
    });

    const se       = coverage.filter(c => c.best >= 2);
    const neutral  = coverage.filter(c => c.best === 1);
    const resisted = coverage.filter(c => c.best > 0 && c.best < 1);
    const immune   = coverage.filter(c => c.best === 0);
    const pct = Math.round((se.length / TYPES.length) * 100);

    // Per-slot breakdown: what each individual move hits SE
    const perSlot = activeSlots.map(atk => ({
      atk,
      se: TYPES.filter(def => (chart[atk]?.[def] ?? 1) >= 2),
      unique: TYPES.filter(def => {
        const myVal = chart[atk]?.[def] ?? 1;
        if (myVal < 2) return false;
        // only SE by this slot alone (no other slot covers it as well or better)
        return !activeSlots.filter(o => o !== atk).some(o => (chart[o]?.[def] ?? 1) >= 2);
      })
    }));

    const typeTag = (def) =>
      `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:4px;background:${TYPE_COLORS[def]};color:${TYPE_TEXT[def]||getContrastText(TYPE_COLORS[def])};font-size:10px;font-weight:700">${typeIcon(def,10)}${def}</span>`;

    const section = (label, color, items) => items.length === 0 ? '' : `
      <div style="margin-bottom:12px">
        <div style="font-size:10px;font-weight:700;color:${color};letter-spacing:0.5px;margin-bottom:5px">${label} (${items.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:4px">${items.map(c => typeTag(c.def)).join('')}</div>
      </div>`;

    resultHtml = `
      <div style="margin-bottom:10px">
        <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:6px">Coverage with ${activeSlots.map(t=>`<span style="color:${TYPE_COLORS[t]};font-weight:800">${t}</span>`).join(' + ')}</div>
        <div style="background:var(--surface2);border-radius:4px;height:7px;margin-bottom:6px;overflow:hidden">
          <div style="background:var(--green);height:100%;width:${pct}%;border-radius:4px;transition:width 0.3s"></div>
        </div>
        <div style="display:flex;gap:16px;font-size:10px;margin-bottom:12px">
          <span style="color:var(--green);font-weight:700">✓ ${se.length} SE (${pct}%)</span>
          <span style="color:var(--dim)">— ${neutral.length} neutral</span>
          <span style="color:#f7d02c;font-weight:700">½ ${resisted.length} resisted</span>
          <span style="color:#f95587;font-weight:700">✗ ${immune.length} immune</span>
        </div>
      </div>
      ${section('✓ Super Effective', 'var(--green)', se)}
      ${resisted.length ? section('½ Resisted', '#f7d02c', resisted) : ''}
      ${immune.length ? section('✗ Immune / Not Covered', '#f95587', immune) : ''}
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px">
        <div style="font-size:10px;font-weight:700;color:var(--dim);letter-spacing:0.5px;margin-bottom:8px">COVERAGE GAPS</div>
        ${(() => {
          const notSE = [...neutral, ...resisted, ...immune];
          if (!notSE.length) return `<div style="font-size:11px;color:var(--green);font-weight:700;padding:6px 0">🎉 Full coverage — all types hit SE!</div>`;
          return `<div style="font-size:10px;color:var(--dim);margin-bottom:6px">${notSE.length} type${notSE.length!==1?'s':''} not hit super effectively:</div>
            <div style="display:flex;flex-wrap:wrap;gap:4px">${notSE.map(c => {
              const label = c.best === 0 ? '0×' : c.best < 1 ? '½×' : '1×';
              const col = c.best === 0 ? '#f95587' : c.best < 1 ? '#f7d02c' : 'var(--dim)';
              return `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 7px;border-radius:4px;background:${TYPE_COLORS[c.def]}22;color:${TYPE_COLORS[c.def]};font-size:10px;font-weight:700">${typeIcon(c.def,10)}${c.def}<span style="color:${col};font-size:9px;margin-left:2px">${label}</span></span>`;
            }).join('')}</div>`;
        })()}
      </div>
      <div style="border-top:1px solid var(--border);padding-top:12px;margin-top:4px">
        <div style="font-size:10px;font-weight:700;color:var(--dim);letter-spacing:0.5px;margin-bottom:8px">PER-MOVE BREAKDOWN</div>
        <div style="display:grid;grid-template-columns:repeat(${perSlot.length},1fr);gap:10px">
          ${perSlot.map(s => {
            const nve = TYPES.filter(def => { const v = chart[s.atk]?.[def] ?? 1; return v > 0 && v < 1; });
            const imm = TYPES.filter(def => (chart[s.atk]?.[def] ?? 1) === 0);
            const miniTag = def => `<span style="display:inline-flex;align-items:center;gap:3px;padding:3px 8px;border-radius:4px;background:${TYPE_COLORS[def]};color:${TYPE_TEXT[def]||getContrastText(TYPE_COLORS[def])};font-size:11px;font-weight:700">${typeIcon(def,11)}${def}</span>`;
            const row = (label, color, items) => items.length === 0 ? '' :
              `<div style="margin-bottom:10px">
                <div style="font-size:9px;font-weight:700;color:${color};letter-spacing:0.5px;margin-bottom:5px">${label} (${items.length})</div>
                <div style="display:flex;flex-wrap:wrap;gap:4px">${items.map(miniTag).join('')}</div>
              </div>`;
            return `<div style="background:var(--surface2);border:1px solid var(--border);border-top:4px solid ${TYPE_COLORS[s.atk]};border-radius:8px;padding:12px 14px">
              <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding-bottom:8px;border-bottom:1px solid var(--border)">
                ${typeIcon(s.atk, 20)}
                <span style="font-size:15px;font-weight:800;color:${TYPE_COLORS[s.atk]}">${s.atk}</span>
                <span style="font-size:10px;color:var(--dim);margin-left:2px">· ${s.se.length} SE</span>
                ${s.unique.length ? `<span style="margin-left:auto;font-size:9px;background:#a98fff22;color:#a98fff;border:1px solid #a98fff44;border-radius:3px;padding:2px 7px;font-weight:700">★ ${s.unique.length} unique</span>` : ''}
              </div>
              ${row('SUPER EFFECTIVE', 'var(--green)', s.se)}
              ${row('NOT VERY EFFECTIVE', '#f7d02c', nve)}
              ${row('NO EFFECT', '#f95587', imm)}
              ${!s.se.length && !nve.length && !imm.length ? `<div style="font-size:10px;color:var(--dim);text-align:center;padding:8px 0">All neutral</div>` : ''}
            </div>`;
          }).join('')}
        </div>
      </div>`;
  }

  el.innerHTML = `
    <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px">⚔️ Moveset Coverage Checker</div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:14px">Select up to 4 attack types to simulate a Pokémon's moveset. See which types are SE, resisted, or immune — and which moves are carrying the coverage.</div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:16px">
      ${[0,1,2,3].map(i => {
        const t = moveSlots[i];
        return `<div style="display:flex;flex-direction:column;gap:5px">
          <div class="lbl">MOVE ${i+1}</div>
          <select data-change="set-move-slot" data-slot="${i}"
            style="background:${t?TYPE_COLORS[t]+'33':'var(--surface2)'};border:1px solid ${t?TYPE_COLORS[t]:'var(--border)'};color:${t?TYPE_COLORS[t]:'var(--dim)'};border-radius:6px;padding:6px 7px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer">
            <option value="">— None —</option>
            ${TYPES.map(ty => `<option value="${ty}" ${t===ty?'selected':''}>${ty}</option>`).join('')}
          </select>
        </div>`;
      }).join('')}
    </div>
    ${resultHtml || `<div style="text-align:center;padding:20px;color:var(--dim);font-size:12px">Select at least one move type to see coverage.</div>`}
  `;
}

function setMoveSlot(idx, value) { moveSlots[idx] = value || null; renderMovesetChecker(); }
function renderTeamAnalyzer() {
  const el = document.getElementById('teamAnalyzerContent');
  if (!el) return;

  // Slot builder
  const slotHtml = teamSlots.map((slot, si) => {
    const filled = slot.filter(Boolean);
    return `<div style="background:var(--surface2);border:1px solid var(--border);border-radius:10px;padding:12px;display:flex;flex-direction:column;gap:8px">
      <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
        <span style="font-size:11px;font-weight:700;color:var(--dim);letter-spacing:0.5px">SLOT ${si+1}</span>
        ${teamSlotNames[si] ? `<span style="font-size:12px;font-weight:700;color:var(--text)">${teamSlotNames[si]}</span>` : ''}
        ${filled.length ? `<span style="margin-left:auto;font-size:10px;cursor:pointer;color:var(--dim)" data-action="clear-team-slot" data-slot="${si}">✕ Clear</span>` : ''}
      </div>
      <div style="position:relative">
        <input id="pkmnSearch${si}" type="text" placeholder="Name (2+ chars)..." autocomplete="off"
          value="${teamSlotNames[si] || ''}"
          data-input="pokemon-input" data-focus="pokemon-input" data-slot="${si}"
          style="width:100%;background:var(--surface);border:1px solid var(--border);border-radius:6px;padding:6px 10px;color:var(--text);font-family:inherit;font-size:12px;outline:none;box-sizing:border-box"/>
        <div id="pkmnDrop${si}" style="display:none;position:absolute;top:calc(100% + 2px);left:0;right:0;background:var(--surface);border:1px solid var(--border2);border-radius:6px;z-index:99;box-shadow:0 6px 20px rgba(0,0,0,0.4);overflow:hidden;max-height:220px;overflow-y:auto"></div>
      </div>
      <div style="display:flex;gap:6px;flex-wrap:wrap">
        ${[0,1,2].map(ti => {
          const t = slot[ti];
          return `<div style="flex:1;min-width:70px">
            <select data-change="set-team-type" data-slot="${si}" data-type-idx="${ti}"
              style="width:100%;background:${t ? TYPE_COLORS[t]+'33' : 'var(--surface)'};border:1px solid ${t ? TYPE_COLORS[t] : 'var(--border)'};color:${t ? TYPE_COLORS[t] : 'var(--dim)'};border-radius:6px;padding:5px 6px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer">
              <option value="">— Type ${ti+1} —</option>
              ${TYPES.map(ty => `<option value="${ty}" ${t===ty?'selected':''}>${ty}</option>`).join('')}
            </select>
          </div>`;
        }).join('')}
      </div>
      ${filled.length ? `<div style="display:flex;gap:4px;flex-wrap:wrap">${filled.map(t => `<span style="display:inline-flex;align-items:center;gap:4px;background:${TYPE_COLORS[t]}22;color:${TYPE_COLORS[t]};font-size:11px;font-weight:700;padding:3px 8px;border-radius:4px">${typeIcon(t,12)}${t}</span>`).join('')}</div>` : ''}
    </div>`;
  }).join('');

  // Compute combined defense profile
  const activeSlots = teamSlots.filter(s => s.some(Boolean));
  let teamResultHtml = '';

  if (activeSlots.length === 0) {
    teamResultHtml = `<div style="text-align:center;padding:30px;color:var(--dim);font-size:12px">Select types for at least one slot to see the team profile.</div>`;
  } else {
    // For each defending type, collect multipliers across all filled slots
    const typeProfile = {}; // t -> array of mults (one per slot)
    TYPES.forEach(def => {
      typeProfile[def] = activeSlots.map(slot => {
        const filled = slot.filter(Boolean);
        if (!filled.length) return 1;
        return filled.reduce((mult, atk) => mult * (chart[atk]?.[def] ?? 1), 1);
      });
    });

    // Count: how many slots are weak/resist/immune to each type
    const weak2x = [], weak4x = [], resist = [], immune = [], neutral = [];
    TYPES.forEach(def => {
      const mults = typeProfile[def];
      const weakCount = mults.filter(m => m >= 2).length;
      const immuneCount = mults.filter(m => m === 0).length;
      const resistCount = mults.filter(m => m > 0 && m < 1).length;
      if (immuneCount === activeSlots.length) immune.push(def);
      else if (weakCount >= Math.ceil(activeSlots.length / 2)) weak2x.push({ def, weakCount, mults });
      else if (weakCount > 0) weak4x.push({ def, weakCount, mults });
      else if (resistCount > 0) resist.push({ def, resistCount, mults });
    });

    const multTag = (def, mults) => {
      const weakCount = mults.filter(m => m >= 2).length;
      return `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border)">
        <span style="display:inline-flex;align-items:center;gap:3px;color:${TYPE_COLORS[def]};font-size:11px;font-weight:700">${typeIcon(def,12)}${def}</span>
        <span class="f10d">${weakCount}/${activeSlots.length} slots weak</span>
      </div>`;
    };

    const resistTag = (def, mults) => {
      const resistCount = mults.filter(m => m > 0 && m < 1).length;
      return `<div style="display:flex;align-items:center;gap:5px;padding:5px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border)">
        <span style="display:inline-flex;align-items:center;gap:3px;color:${TYPE_COLORS[def]};font-size:11px;font-weight:700">${typeIcon(def,12)}${def}</span>
        <span class="f10d">${resistCount}/${activeSlots.length} slots resist</span>
      </div>`;
    };

    const section = (title, color, items, tagFn) => items.length ? `
      <div style="margin-bottom:14px">
        <div style="font-size:11px;font-weight:700;color:${color};letter-spacing:0.5px;margin-bottom:6px">${title} (${items.length})</div>
        <div style="display:flex;flex-wrap:wrap;gap:5px">${items.map(i => typeof i === 'string' ? `<span style="display:inline-flex;align-items:center;gap:3px;padding:5px 8px;border-radius:6px;background:var(--surface2);border:1px solid var(--border);color:${TYPE_COLORS[i]};font-size:11px;font-weight:700">${typeIcon(i,12)}${i}</span>` : tagFn(i.def, i.mults)).join('')}</div>
      </div>` : '';

    teamResultHtml = `
      <div style="font-size:12px;font-weight:700;color:var(--text);margin-bottom:10px">Combined Team Defense Profile — ${activeSlots.length} Pokémon</div>
      ${section('🔴 Major Weaknesses (majority of team)', '#f95587', weak2x, multTag)}
      ${section('🟡 Partial Weaknesses (some slots)', '#f7d02c', weak4x, multTag)}
      ${section('🟢 Resisted by some slots', '#4ade80', resist, resistTag)}
      ${section('⚪ Full Team Immune', 'var(--dim)', immune, null)}
      ${!weak2x.length && !weak4x.length ? '<div style="color:var(--green);font-size:12px;font-weight:700;padding:10px 0">✅ No major team-wide weaknesses!</div>' : ''}
    `;
  }

  el.innerHTML = `
    <div style="font-size:14px;font-weight:800;color:var(--text);margin-bottom:4px">🫂 Team Weakness Analyzer</div>
    <div style="font-size:11px;color:var(--dim);margin-bottom:16px">Select up to 3 types per Pokémon slot (up to 6 Pokémon). See your team's combined defensive coverage.</div>
    <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:10px;margin-bottom:20px">
      ${slotHtml}
    </div>
    <div style="border-top:1px solid var(--border);padding-top:16px">
      ${teamResultHtml}
    </div>`;
}

function setTeamType(slotIdx, typeIdx, value) { teamSlots[slotIdx][typeIdx] = value || null; renderTeamAnalyzer(); }
function clearTeamSlot(slotIdx) { teamSlots[slotIdx] = [null, null, null]; teamSlotNames[slotIdx] = null; renderTeamAnalyzer(); }

// combo runtime hotfix: keep lexical COMBOS in sync with rebuilt combo data
