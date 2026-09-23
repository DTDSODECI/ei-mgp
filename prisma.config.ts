import { existsSync } from 'node:fs'
import { defineConfig, env } from 'prisma/config'

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
 * Cette configuration pointe vers la base RÉELLE, partagée avec l'application Laravel encore
 * en service pendant la migration. Seule `prisma db pull` (lecture seule) doit être exécutée :
 * jamais `migrate dev`, `migrate reset` ni `db push`.
 */
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: env('DATABASE_URL'),
  },
})
