process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const n = await prisma.$queryRawUnsafe(`
SELECT count(*)::int AS n FROM pg_constraint c
JOIN unnest(c.conkey) WITH ORDINALITY k(attnum, ord) ON true
WHERE c.contype='f' AND NOT EXISTS (SELECT 1 FROM pg_index i WHERE i.indrelid=c.conrelid AND i.indkey[0]=k.attnum)`)
console.log('  clés étrangères sans index :', n[0].n, '(avant : 31)')
const invalides = await prisma.$queryRawUnsafe(`
SELECT s.indexrelname AS idx FROM pg_stat_user_indexes s JOIN pg_index i ON i.indexrelid=s.indexrelid
WHERE NOT i.indisvalid`)
console.log('  index invalides (construction interrompue) :', invalides.length)
console.log('  index au total :', (await prisma.$queryRawUnsafe(`SELECT count(*)::int AS n FROM pg_stat_user_indexes`))[0].n)
await prisma.$disconnect()
