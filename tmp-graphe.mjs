process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const q = (s) => prisma.$queryRawUnsafe(s)

const tables = (await q(`SELECT relname AS t, n_live_tup AS n FROM pg_stat_user_tables ORDER BY relname`))
const fks = await q(`
  SELECT c.conrelid::regclass::text AS src, c.confrelid::regclass::text AS dst
  FROM pg_constraint c WHERE c.contype='f'`)

const sortantes = new Map(), entrantes = new Map()
for (const t of tables) { sortantes.set(t.t, 0); entrantes.set(t.t, 0) }
for (const f of fks) {
  sortantes.set(f.src, (sortantes.get(f.src) ?? 0) + 1)
  entrantes.set(f.dst, (entrantes.get(f.dst) ?? 0) + 1)
}

const isolees = [], feuilles = [], racines = [], connectees = []
for (const t of tables) {
  const s = sortantes.get(t.t) ?? 0, e = entrantes.get(t.t) ?? 0
  const fiche = { ...t, s, e }
  if (s === 0 && e === 0) isolees.push(fiche)
  else if (s === 0) racines.push(fiche)          // référentiel : cité, ne cite personne
  else if (e === 0) feuilles.push(fiche)          // feuille : cite, n'est cité par personne
  else connectees.push(fiche)
}

const bloc = (titre, liste) => {
  console.log(`\n=== ${titre} (${liste.length}) ===`)
  for (const f of liste) console.log(`  ${f.t.padEnd(28)} ${String(f.n).padStart(5)} lignes   cite:${f.s}  cité:${f.e}`)
}
bloc('ISOLÉES — aucune clé étrangère, ni dans un sens ni dans l’autre', isolees)
bloc('RÉFÉRENTIELS — citées, ne citent personne', racines)
bloc('FEUILLES — citent, ne sont citées par personne', feuilles)
console.log(`\n=== CONNECTÉES des deux côtés : ${connectees.length} ===`)
console.log('  ' + connectees.map(c => c.t).join(', '))
console.log(`\n  TOTAL ${tables.length} tables, ${fks.length} clés étrangères`)
await prisma.$disconnect()
