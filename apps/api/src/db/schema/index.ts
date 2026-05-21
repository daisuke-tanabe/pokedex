// pgEnum 定義
export { formCategoryEnum, spriteGenderEnum, spriteKindEnum } from './enums.js';

// lookup テーブル
export { locales, type LocaleRow, type NewLocaleRow } from './locales.js';

// マスタテーブル + 多言語名
export { regionNames, regions, type NewRegion, type NewRegionName, type Region, type RegionName } from './regions.js';
export { type NewType, type NewTypeName, type Type, type TypeName, typeNames, types } from './types.js';
export {
  type NewPokedex,
  type NewPokedexName,
  type Pokedex,
  type PokedexName,
  pokedexNames,
  pokedexes,
} from './pokedexes.js';

// 進化系統
export { type EvolutionChain, evolutionChains, type NewEvolutionChain } from './evolution-chains.js';

// species + species_names + species_evolutions
export {
  type NewSpecies,
  type NewSpeciesEvolution,
  type NewSpeciesName,
  type Species,
  type SpeciesEvolution,
  type SpeciesName,
  species,
  speciesEvolutions,
  speciesNames,
} from './species.js';

// フォーム + 多言語名 + タイプ + スプライト
export { type Form, type FormName, formNames, forms, type NewForm, type NewFormName } from './forms.js';
export { type FormType, formTypes, type NewFormType } from './form-types.js';
export { type FormSprite, formSprites, type NewFormSprite } from './form-sprites.js';

// 図鑑エントリ
export { type NewPokedexEntry, pokedexEntries, type PokedexEntry } from './pokedex-entries.js';
