import { existsSync } from 'node:fs'
import { defineConfig } from 'prisma/config'

// Prisma 7 ne charge plus automatiquement le fichier .env : on le fait explicitement.
// `process.loadEnvFile` est natif depuis Node 20.12 — inutile d'ajouter dotenv.
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
export default defineConfig({
  schema: 'prisma/schema.prisma',
  datasource: {
    url: process.env.DATABASE_URL ?? 'postgresql://prisma:prisma@localhost:5432/prisma',
  },
})
