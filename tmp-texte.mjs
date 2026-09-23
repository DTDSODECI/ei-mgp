process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const q = (s) => prisma.$queryRawUnsafe(s)

console.log('=== RÉFÉRENTIELS RELIÉS PAR TEXTE plutôt que par clé étrangère ===\n')
const suspects = [
  ['lieux',               'libelle', 'dossiers',  'lieu'],
  ['villes',              'libelle', 'dossiers',  'ville'],
  ['postes',              'libelle', 'dossiers',  'poste'],
  ['postes',              'libelle', 'dossiers',  'poste_declarant'],
  ['postes',              'libelle', 'users',     'poste'],
  ['tranches_anciennete', 'libelle', 'dossiers',  'anciennete'],
]
for (const [ref, colRef, tbl, col] of suspects) {
  try {
    const existe = await q(`SELECT 1 FROM information_schema.columns WHERE table_name='${tbl}' AND column_name='${col}'`)
    if (existe.length === 0) { console.log(`  ${tbl}.${col.padEnd(20)} — colonne inexistante`); continue }
    const ty = (await q(`SELECT data_type AS t FROM information_schema.columns WHERE table_name='${tbl}' AND column_name='${col}'`))[0].t
    const renseignes = (await q(`SELECT count(*)::int AS n FROM "${tbl}" WHERE "${col}" IS NOT NULL`))[0].n
    const orphelins = (await q(`
      SELECT count(*)::int AS n FROM "${tbl}" x
      WHERE x."${col}" IS NOT NULL
        AND NOT EXISTS (SELECT 1 FROM "${ref}" r WHERE r."${colRef}" = x."${col}")`))[0].n
    console.log(`  ${(tbl + '.' + col).padEnd(30)} ${ty.padEnd(18)} → ${ref.padEnd(20)} renseignés:${String(renseignes).padStart(4)}  ORPHELINS:${orphelins}`)
  } catch (e) { console.log(`  ${tbl}.${col} — ${String(e.message).split('\n').pop().slice(0,60)}`) }
}

console.log('\n=== où ces référentiels sont-ils lus par le code ? ===')
await prisma.$disconnect()
