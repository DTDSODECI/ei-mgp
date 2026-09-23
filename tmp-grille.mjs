process.loadEnvFile('.env')
const { PrismaPg } = await import('@prisma/adapter-pg')
const { PrismaClient } = await import('@prisma/client')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) })
console.log('=== statuts, et ce que la grille doit proposer ===')
for (const s of await prisma.statuts_dossier.findMany({ orderBy: { ordre: 'asc' }, select: { code: true, actif: true } })) {
  const sortantes = { recu: 1, en_analyse: 1, en_investigation: 1, en_attente_information: 1, action_corrective_en_cours: 1, reouvert: 1 }[s.code] ?? 0
  const propose = s.actif && sortantes
  console.log('  ', s.code.padEnd(28), 'actif=', String(s.actif).padEnd(6), 'transitions sortantes=', sortantes, '| proposé :', propose ? 'OUI' : 'non')
}
console.log('\nrole_etapes sur en_attente_information :',
  await prisma.role_etapes.count({ where: { statuts_dossier: { code: 'en_attente_information' } } }),
  '(conservées : désactiver retire du choix, jamais du passé)')
await prisma.$disconnect()
