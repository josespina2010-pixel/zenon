import { and, asc, desc, eq, ilike, or, sql } from 'drizzle-orm';
import { db } from './index.ts';
import { mangas } from './schema.ts';

export interface MangaFilters {
  saga?: string;
  q?: string;
  sort?: string;
}

export interface CreateMangaInput {
  slug: string;
  volumeNumber: number;
  title: string;
  saga: string;
  edition: string;
  synopsis: string;
  author?: string;
  pages?: number;
  isbn: string;
  priceCents: number;
  stock: number;
  coverUrl: string;
  featured?: boolean;
}

export interface UpdateMangaInput {
  title?: string;
  saga?: string;
  edition?: string;
  synopsis?: string;
  priceCents?: number;
  stock?: number;
  featured?: boolean;
}

const DEFAULT_MANGA_SEED = [
  {
    slug: 'black-clover-vol-01',
    volumeNumber: 1,
    title: 'El Juramento del Cinco Hojas',
    saga: 'Reino del Trébol',
    edition: 'Tankōbon Estándar',
    synopsis:
      'En un mundo donde la magia lo es todo, Asta nace sin una gota de poder mágico. Cuando su amigo Yuno recibe el legendario grimorio de cuatro hojas, Asta despierta un grimorio negro de cinco hojas capaz de anular cualquier hechizo.',
    author: 'Yūki Tabata',
    pages: 192,
    isbn: '978-84-168-8901-1',
    priceCents: 1290,
    stock: 24,
    coverUrl: '/src/assets/images/manga_cover_grimorio_negro_1795615152661.jpg',
    featured: true,
  },
  {
    slug: 'black-clover-vol-02',
    volumeNumber: 2,
    title: 'Los Toros Negros Desatan la Tormenta',
    saga: 'Reino del Trébol',
    edition: 'Tankōbon Estándar',
    synopsis:
      'Asta supera el examen de los Caballeros Mágicos y entra en la orden más temida y caótica del Reino del Trébol: los Toros Negros, liderados por el capitán Yami Sukehiro. Primera misión en las mazmorras antiguas.',
    author: 'Yūki Tabata',
    pages: 196,
    isbn: '978-84-168-8902-8',
    priceCents: 1290,
    stock: 18,
    coverUrl: '/src/assets/images/manga_cover_toros_negros_1795615152743.jpg',
    featured: false,
  },
  {
    slug: 'black-clover-vol-05',
    volumeNumber: 5,
    title: 'Luz contra Oscuridad en la Cueva',
    saga: 'Noche Blanca',
    edition: 'Tankōbon Estándar',
    synopsis:
      'El Ojo de la Noche Blanca irrumpe en el Reino del Trébol. Yami Sukehiro despliega su Magia de Oscuridad frente a Licht en un duelo brutal que revela la existencia del Tercer Ojo y las espadas demoníacas.',
    author: 'Yūki Tabata',
    pages: 200,
    isbn: '978-84-168-8905-9',
    priceCents: 1350,
    stock: 12,
    coverUrl: '/src/assets/images/manga_cover_toros_negros_1795615152743.jpg',
    featured: true,
  },
  {
    slug: 'black-clover-vol-11',
    volumeNumber: 11,
    title: 'El Bosque de las Brujas y el Demonio',
    saga: 'Noche Blanca',
    edition: 'Edición Coleccionista',
    synopsis:
      'Con los brazos malditos e incapaces de empuñar la espada, Asta viaja al Bosque de las Brujas. Entre llamas carmesí y sangre antigua, la forma negra de antimagia despierta por primera vez.',
    author: 'Yūki Tabata',
    pages: 208,
    isbn: '978-84-168-8911-0',
    priceCents: 1690,
    stock: 9,
    coverUrl: '/src/assets/images/manga_cover_grimorio_negro_1795615152661.jpg',
    featured: false,
  },
  {
    slug: 'black-clover-vol-20',
    volumeNumber: 20,
    title: 'La Caída del Palacio de las Sombras',
    saga: 'Elfos y Demonios',
    edition: 'Tankōbon Estándar',
    synopsis:
      'Los elfos reencarnados asedian la capital real mientras el demonio Zagred manipula los hilos desde las sombras. Asta y Yuno unen fuerzas junto a los capitanes para sellar la amenaza ancestral.',
    author: 'Yūki Tabata',
    pages: 192,
    isbn: '978-84-168-8920-2',
    priceCents: 1350,
    stock: 15,
    coverUrl: '/src/assets/images/manga_cover_reino_pica_1795615153712.jpg',
    featured: false,
  },
  {
    slug: 'black-clover-vol-24',
    volumeNumber: 24,
    title: 'El Despertar de la Tríada Oscura',
    saga: 'Reino de la Pica',
    edition: 'Tankōbon Estándar',
    synopsis:
      'Tras seis meses de entrenamiento en el Reino del Corazón, los Toros Negros enfrentan a Dante Zogratis y Vanica. La sangre demoníaca y el pacto con Liebe ponen al límite la antimagia.',
    author: 'Yūki Tabata',
    pages: 196,
    isbn: '978-84-168-8924-0',
    priceCents: 1390,
    stock: 21,
    coverUrl: '/src/assets/images/manga_cover_reino_pica_1795615153712.jpg',
    featured: true,
  },
  {
    slug: 'black-clover-vol-28',
    volumeNumber: 28,
    title: 'Unión Demoníaca: Asta & Liebe',
    saga: 'Reino de la Pica',
    edition: 'Edición Coleccionista',
    synopsis:
      'Nacht Faust guía a Asta en el ritual prohibido para sellar el contrato equitativo con Liebe. La Unión Demoníaca emerge con armadura carmesí y negra para irrumpir en el castillo de la Pica.',
    author: 'Yūki Tabata',
    pages: 212,
    isbn: '978-84-168-8928-8',
    priceCents: 1790,
    stock: 7,
    coverUrl: '/src/assets/images/manga_cover_reino_pica_1795615153712.jpg',
    featured: true,
  },
  {
    slug: 'black-clover-vol-33',
    volumeNumber: 33,
    title: 'El Juicio Final del Trébol',
    saga: 'Reino de la Pica',
    edition: 'Edición Coleccionista',
    synopsis:
      'Lucius Zogratis revela su plan maestro tras derrotar a Lucifero. Asta es arrojado al País del Sol, donde aprenderá la técnica del Zetten para cortar la magia misma.',
    author: 'Yūki Tabata',
    pages: 204,
    isbn: '978-84-168-8933-2',
    priceCents: 1790,
    stock: 11,
    coverUrl: '/src/assets/images/manga_cover_grimorio_negro_1795615152661.jpg',
    featured: false,
  },
  {
    slug: 'black-clover-boxset-01',
    volumeNumber: 100,
    title: 'Cofre Coleccionista Vol. 1–10',
    saga: 'Box Sets',
    edition: 'Box Set Completo',
    synopsis:
      'Estuche rígido en tela negra mate con estampado en foil carmesí que reúne los diez primeros volúmenes de Black Clover, lámina exclusiva del grimorio de cinco hojas y marcapáginas metálico.',
    author: 'Yūki Tabata',
    pages: 1960,
    isbn: '978-84-168-9001-7',
    priceCents: 11990,
    stock: 5,
    coverUrl: '/src/assets/images/manga_boxset_coleccion_1795615154540.jpg',
    featured: true,
  },
];

async function ensureCatalogSeeded() {
  const existing = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(mangas);
  if ((existing[0]?.count ?? 0) === 0) {
    await db.insert(mangas).values(DEFAULT_MANGA_SEED).onConflictDoNothing();
  }
}

export async function listMangas(filters: MangaFilters = {}) {
  try {
    await ensureCatalogSeeded();

    const conditions = [];
    if (filters.saga && filters.saga !== 'Todas') {
      conditions.push(eq(mangas.saga, filters.saga));
    }

    if (filters.q && filters.q.trim().length > 0) {
      const pattern = `%${filters.q.trim()}%`;
      conditions.push(
        or(
          ilike(mangas.title, pattern),
          ilike(mangas.saga, pattern),
          ilike(mangas.edition, pattern),
          ilike(mangas.isbn, pattern),
          ilike(mangas.synopsis, pattern)
        )
      );
    }

    const orderByClause =
      filters.sort === 'price_asc'
        ? asc(mangas.priceCents)
        : filters.sort === 'price_desc'
          ? desc(mangas.priceCents)
          : asc(mangas.volumeNumber);

    const query = db
      .select()
      .from(mangas)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(orderByClause);

    return await query;
  } catch (error) {
    console.error('Database query failed in listMangas:', error);
    throw new Error('No se pudo cargar el catálogo de mangas.', {
      cause: error,
    });
  }
}

export async function getMangaById(id: number) {
  try {
    const rows = await db
      .select()
      .from(mangas)
      .where(eq(mangas.id, id))
      .limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in getMangaById:', error);
    throw new Error('No se pudo obtener el detalle del volumen.', {
      cause: error,
    });
  }
}

export async function createManga(input: CreateMangaInput) {
  try {
    const rows = await db
      .insert(mangas)
      .values({
        slug: input.slug,
        volumeNumber: input.volumeNumber,
        title: input.title,
        saga: input.saga,
        edition: input.edition,
        synopsis: input.synopsis,
        author: input.author || 'Yūki Tabata',
        pages: input.pages || 192,
        isbn: input.isbn,
        priceCents: input.priceCents,
        stock: input.stock,
        coverUrl: input.coverUrl,
        featured: Boolean(input.featured),
      })
      .returning();
    return rows[0];
  } catch (error) {
    console.error('Database query failed in createManga:', error);
    throw new Error('No se pudo registrar el nuevo volumen.', {
      cause: error,
    });
  }
}

export async function updateManga(id: number, input: UpdateMangaInput) {
  try {
    const rows = await db
      .update(mangas)
      .set(input)
      .where(eq(mangas.id, id))
      .returning();
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in updateManga:', error);
    throw new Error('No se pudo actualizar el volumen.', {
      cause: error,
    });
  }
}

export async function deleteManga(id: number) {
  try {
    const rows = await db
      .delete(mangas)
      .where(eq(mangas.id, id))
      .returning();
    return rows[0] || null;
  } catch (error) {
    console.error('Database query failed in deleteManga:', error);
    throw new Error(
      'No se pudo eliminar el volumen (puede estar asociado a pedidos existentes).',
      { cause: error }
    );
  }
}
