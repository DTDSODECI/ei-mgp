process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
const q = (s) => prisma.$queryRawUnsafe(s)

console.log('=== l’orphelin : users.poste qui ne correspond à aucun poste ===')
for (const u of await q(`SELECT u.name, u.poste FROM users u
  WHERE u.poste IS NOT NULL AND NOT EXISTS (SELECT 1 FROM postes p WHERE p.libelle = u.poste)`))
  console.log(`  « ${u.poste} »  porté par ${u.name}`)

console.log('\n=== les postes qui existent ===')
for (const p of await q(`SELECT libelle, actif FROM postes ORDER BY ordre`))
  console.log(`  « ${p.libelle} » actif=${p.actif}`)

console.log('\n=== l’écran permet-il de RENOMMER un référentiel relié par texte ? ===')
