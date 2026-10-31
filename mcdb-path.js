// Where the Minecraft PokemonServer SQLite DB lives. Plain JS at the root so both
// the boot gate (dependencies.js, run by Node directly) and the app (app/lib) share it.
export const MC_DB_PATH = process.env.MC_DB_PATH || '/mcdata/pokemonserver.db';
