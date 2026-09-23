import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// En local, Prisma charge le fichier .env s'il existe.
// Sur Netlify, les variables sont injectées directement dans l'environnement,
// donc l'absence de .env ne doit pas faire échouer le build.
if (existsSync('.env')) {
  process.loadEnvFile()
}

/**
 * Prisma 7 : l'URL de connexion ne vit plus dans `schema.prisma` (le champ `datasource.url`
 * y est refusé) mais ici.
 *
 * Cette configuration cible le schéma privé `ei_mgp` de la base Supabase partagée.
 * Seule `prisma db pull` (lecture seule) doit être exécutée : jamais `migrate dev`,
 * `migrate reset` ni `db push` sur cette instance.
 */
const databaseUrl =
  process.env.DATABASE_URL ?? 'postgresql://prisma:prisma@localhost:5432/prisma'

export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    // `prisma generate` n'ouvre pas de connexion à la base. La valeur de secours
    // permet donc la génération du client pendant un build Netlify sans exposer
    // ni inventer une vraie connexion. L'application, elle, exige DATABASE_URL
    // au runtime dans src/lib/prisma.ts.
    url: databaseUrl,
  },
})
