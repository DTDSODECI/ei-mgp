process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const q = (s) => prisma.$queryRawUnsafe(s)

const lignes = await q(`
SELECT c.conrelid::regclass::text AS tbl,
       a.attname AS col,
       c.confrelid::regclass::text AS vers,
       (SELECT n_live_tup FROM pg_stat_user_tables s WHERE s.relid = c.conrelid) AS lignes_tbl
FROM pg_constraint c
JOIN unnest(c.conkey) WITH ORDINALITY k(attnum, ord) ON true
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = k.attnum
WHERE c.contype = 'f'
  AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid = c.conrelid AND i.indkey[0] = k.attnum)
ORDER BY c.conrelid::regclass::text, a.attname`)

const par = new Map()
for (const l of lignes) {
  if (!par.has(l.tbl)) par.set(l.tbl, [])
  par.get(l.tbl).push(l)
}
console.log('=== CLÉS ÉTRANGÈRES SANS INDEX, par table ===')
for (const [tbl, cols] of [...par].sort((a, b) => b[1].length - a[1].length)) {
  console.log(`\n  ${tbl}  (${cols[0].lignes_tbl} lignes)`)
  for (const c of cols) console.log(`     ${c.col.padEnd(30)} → ${c.vers}`)
}
console.log('\n  TOTAL :', lignes.length, 'sur', par.size, 'tables')
console.log('\n=== instructions à générer ===')
for (const l of lignes) {
  const nom = `${l.tbl}_${l.col}_index`.slice(0, 63)
  console.log(`CREATE INDEX CONCURRENTLY IF NOT EXISTS "${nom}" ON "${l.tbl}" ("${l.col}");`)
}
await prisma.$disconnect()
