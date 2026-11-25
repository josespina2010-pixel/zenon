import { eq, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { users } from './schema.ts';

const INITIAL_ADMIN_EMAIL = (
  process.env.ADMIN_EMAIL || 'josespina2010@gmail.com'
).toLowerCase();

export async function getOrCreateUser(
  uid: string,
  email: string,
  displayName?: string
) {
  try {
    const normalizedEmail = email.toLowerCase();
    const isInitialAdmin = normalizedEmail === INITIAL_ADMIN_EMAIL;

    const result = await db
      .insert(users)
      .values({
        uid,
        email: normalizedEmail,
        displayName: displayName || null,
        role: isInitialAdmin ? 'admin' : 'customer',
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email: normalizedEmail,
          displayName: displayName || null,
          role: isInitialAdmin
            ? 'admin'
            : sql`CASE WHEN ${users.role} = 'admin' THEN 'admin' ELSE 'customer' END`,
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Database error in getOrCreateUser:', error);
    throw new Error('No se pudo sincronizar la cuenta de usuario.', {
      cause: error,
    });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database error in getUserByUid:', error);
    throw new Error('No se pudo consultar el perfil del usuario.', {
      cause: error,
    });
  }
}
