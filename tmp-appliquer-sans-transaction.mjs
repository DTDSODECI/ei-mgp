process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const { readFileSync } = await import('node:fs')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })

/*
  ⚠️ INSTRUCTION PAR INSTRUCTION : `CREATE INDEX CONCURRENTLY` refuse de s'exécuter dans un bloc
  transactionnel, et envoyer plusieurs ordres d'un coup place Postgres en transaction implicite.
*/
const texte = readFileSync(process.argv[2], 'utf8')
const ordres = texte
  .split('\n')
  .filter((l) => !l.trim().startsWith('--'))
  .join('\n')
  .split(';')
  .map((o) => o.trim())
  .filter((o) => o.length > 0)

console.log(ordres.length, 'instructions à appliquer\n')
let ok = 0
for (const ordre of ordres) {
  const nom = ordre.match(/"([a-z_]+_index)"/)?.[1] ?? ordre.slice(0, 50)
  try {
    await prisma.$executeRawUnsafe(ordre)
    ok++
    process.stdout.write('.')
  } catch (e) {
    console.log('\n  ECHEC', nom, '—', String(e.message).split('\n').slice(-2).join(' ').slice(0, 120))
  }
}
console.log(`\n\n${ok}/${ordres.length} appliquées`)
await prisma.$disconnect()
