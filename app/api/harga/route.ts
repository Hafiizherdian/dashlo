// app/api/harga/route.ts (Next.js App Router)
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { COOKIE_NAME } from '@/lib/auth/session';
import { verifyToken } from '@/lib/auth/jwt';

// Helper mendeteksi username di Cookie JWT Token aplikasi
async function getAppUsername(req: NextRequest): Promise<string> {
  try {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (!token) return 'system';
    const payload = await verifyToken(token);
    return payload?.username || 'system';
  } catch {
    return 'system';
  }
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const areaId    = searchParams.get('area_id');
  const regional  = searchParams.get('regional');
  const agentType = searchParams.get('agent_type');

  const isHistory = searchParams.get('history') === 'true';
  const isPeriods = searchParams.get('periods') === 'true';
  const productId = searchParams.get('product_id');

  try {
    const client = await pool.connect();
    try {
      // ── SUB-FITUR: Riwayat Perubahan Harga ───────────────────────────────────
      if (isHistory) {
        if (!productId || !areaId) {
          return NextResponse.json(
            { success: false, error: 'product_id dan area_id wajib disertakan untuk melihat riwayat' },
            { status: 400 }
          );
        }
        const historyRes = await client.query(`
          SELECT
            history_id, product_price_id, product_id, area_id,
            dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp,
            action, changed_at, changed_by
          FROM product_price_histories
          WHERE product_id = $1 AND area_id = $2
          ORDER BY changed_at DESC
        `, [Number(productId), Number(areaId)]);

        return NextResponse.json({ success: true, data: historyRes.rows });
      }

      // ── SUB-FITUR: Daftar Periode Harga per Produk+Area ───────────────────────
      if (isPeriods) {
        if (!productId || !areaId) {
          return NextResponse.json(
            { success: false, error: 'product_id dan area_id wajib disertakan untuk melihat periode' },
            { status: 400 }
          );
        }
        const periodsRes = await client.query(`
          SELECT
            period_id, product_price_id, product_id, area_id,
            TO_CHAR(valid_from, 'YYYY-MM-DD') AS valid_from, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp,
            status, created_at, created_by
          FROM product_price_periods
          WHERE product_id = $1 AND area_id = $2
          ORDER BY valid_from DESC
        `, [Number(productId), Number(areaId)]);

        return NextResponse.json({ success: true, data: periodsRes.rows });
      }

      // ── 1. Mengambil Master Area (Untuk Dropdown Selector) ───────────────────
      const areasRes = await client.query(`
        SELECT area_id, area_slug, city_name, area_name, agent_type,
               COALESCE(regional, '') AS regional
        FROM   area_overrides
        ORDER  BY regional, city_name, area_name
      `);

      // ── 2. Mengambil Master Produk ──────────────────────────────────────────
      const productsRes = await client.query(`
        SELECT id, name, category, factory
        FROM   products
        ORDER  BY name
      `);

      // ── 3. Ambil Utama Data Harga — tambah kolom scheduled period count ──────
      const conditions: string[] = [];
      const values: unknown[]    = [];
      let   idx = 1;

      if (areaId)    { conditions.push(`pp.area_id    = $${idx++}`); values.push(Number(areaId)); }
      if (regional)  { conditions.push(`ao.regional   = $${idx++}`); values.push(regional); }
      if (agentType) { conditions.push(`ao.agent_type = $${idx++}`); values.push(agentType); }

      const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const pricesRes = await client.query(`
        SELECT
          pp.id,
          pp.product_id,
          p.name          AS product_name,
          p.category,
          p.factory,
          pp.area_id,
          ao.area_slug,
          ao.city_name,
          ao.area_name,
          ao.agent_type,
          COALESCE(ao.regional, '') AS regional,
          pp.dbp, pp.wbp, pp.rbp, pp.cbp,
          pp.pita_cukai, pp.hje, pp.tarif, pp.hpp,
          pp.updated_at,
          -- Jumlah periode terjadwal (valid_from > CURRENT_DATE) untuk baris ini
          (
            SELECT COUNT(*)
            FROM product_price_periods ppp
            WHERE ppp.product_id = pp.product_id
              AND ppp.area_id    = pp.area_id
              AND ppp.valid_from > CURRENT_DATE
          )::int AS scheduled_count,
          -- valid_from periode aktif terkini (valid_from <= hari ini, terbaru)
          (
            SELECT TO_CHAR(valid_from, 'YYYY-MM-DD')
            FROM product_price_periods ppp
            WHERE ppp.product_id = pp.product_id
              AND ppp.area_id    = pp.area_id
              AND ppp.valid_from <= CURRENT_DATE
            ORDER BY valid_from DESC
            LIMIT 1
          ) AS active_period_from
        FROM   product_prices pp
        JOIN   products        p  ON p.id = pp.product_id
        JOIN   area_overrides  ao ON ao.area_id = pp.area_id
        ${where}
        ORDER  BY ao.regional, ao.city_name, ao.area_name, p.name
      `, values);

      // ── 4. Metadata Filter Unik ─────────────────────────────────────────────
      const regionalsRes = await client.query(`
        SELECT DISTINCT regional FROM area_overrides
        WHERE regional IS NOT NULL AND regional <> '' ORDER BY regional
      `);
      const agentTypesRes = await client.query(`
        SELECT DISTINCT agent_type FROM area_overrides ORDER BY agent_type
      `);

      return NextResponse.json({
        success: true,
        data: {
          prices:     pricesRes.rows,
          areas:      areasRes.rows,
          products:   productsRes.rows,
          regionals:  regionalsRes.rows.map((r: any) => r.regional),
          agentTypes: agentTypesRes.rows.map((r: any) => r.agent_type),
        },
      });
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[GET /api/harga]', err);
    return NextResponse.json({ success: false, error: 'Query gagal' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const usernameApp = await getAppUsername(req);
    const body = await req.json();
    const { action, price, prices } = body;
    const client = await pool.connect();

    try {
      // ── Tambah / Edit Harga (dengan optional periode) ─────────────────────────
      if (action === 'upsert') {
        const {
          product_id, area_id,
          dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp,
          valid_from,   // string ISO date atau null
        } = price;

        if (!product_id || !area_id) {
          return NextResponse.json(
            { success: false, error: 'product_id dan area_id wajib diisi' },
            { status: 400 }
          );
        }

        const targetAreaIds: number[] = Array.isArray(area_id)
          ? area_id.map(Number)
          : [Number(area_id)];

        // Apakah valid_from sudah berlaku (atau tidak diisi → berlaku sekarang)
        // Bandingkan sebagai string ISO date (YYYY-MM-DD) agar bebas timezone.
        // new Date("2026-06-04") di-parse sebagai UTC midnight yang berbeda dengan
        // local midnight di UTC+7, sehingga perbandingan Date object tidak aman.
        const todayStr = new Date().toLocaleDateString('en-CA'); // "YYYY-MM-DD" lokal
        const fromStr  = valid_from ? String(valid_from).slice(0, 10) : todayStr;
        const isImmediate = fromStr <= todayStr; // true → update product_prices juga

        await client.query('BEGIN');
        const insertedRows: any[] = [];

        for (const singleAreaId of targetAreaIds) {
          // 1. Jika berlaku sekarang → upsert product_prices
          if (isImmediate) {
            const res = await client.query(`
              INSERT INTO product_prices
                (product_id, area_id, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, updated_by)
              VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
              ON CONFLICT (product_id, area_id) DO UPDATE SET
                dbp        = EXCLUDED.dbp,
                wbp        = EXCLUDED.wbp,
                rbp        = EXCLUDED.rbp,
                cbp        = EXCLUDED.cbp,
                pita_cukai = EXCLUDED.pita_cukai,
                hje        = EXCLUDED.hje,
                tarif      = EXCLUDED.tarif,
                hpp        = EXCLUDED.hpp,
                updated_by = EXCLUDED.updated_by,
                updated_at = CURRENT_TIMESTAMP
              RETURNING *
            `, [
              Number(product_id), singleAreaId,
              dbp ?? 0, wbp ?? 0, rbp ?? 0, cbp ?? 0,
              pita_cukai ?? 0, hje ?? 0, tarif ?? 0, hpp ?? 0,
              usernameApp,
            ]);
            insertedRows.push(res.rows[0]);
          }

          // 2. Jika ada valid_from → simpan ke product_price_periods
          if (valid_from) {
            // Ambil product_price_id (buat dulu jika belum ada — kasus scheduled penuh)
            let ppId: number | null = null;

            if (isImmediate) {
              // product_prices sudah di-upsert di atas, ambil id-nya
              const ppRes = await client.query(
                'SELECT id FROM product_prices WHERE product_id=$1 AND area_id=$2',
                [Number(product_id), singleAreaId]
              );
              ppId = ppRes.rows[0]?.id ?? null;
            } else {
              // Harga terjadwal: pastikan product_prices sudah ada (bisa saja belum ada sama sekali)
              // Kita lakukan INSERT tanpa ON CONFLICT UPDATE agar tidak mengubah harga aktif
              const existRes = await client.query(
                'SELECT id FROM product_prices WHERE product_id=$1 AND area_id=$2',
                [Number(product_id), singleAreaId]
              );
              if (existRes.rows.length > 0) {
                ppId = existRes.rows[0].id;
              } else {
                // Belum ada sama sekali → buat placeholder dengan nilai 0
                const insertRes = await client.query(`
                  INSERT INTO product_prices
                    (product_id, area_id, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, updated_by)
                  VALUES ($1, $2, 0,0,0,0,0,0,0,0,$3)
                  RETURNING id
                `, [Number(product_id), singleAreaId, usernameApp]);
                ppId = insertRes.rows[0].id;
                insertedRows.push({ id: ppId, scheduled: true });
              }
            }

            if (ppId !== null) {
              // Tandai semua periode lama (> valid_from) sebagai 'superseded' jika ada yg lebih lama
              // Sederhananya: insert/update periode ini
              const periodStatus = isImmediate ? 'active' : 'scheduled';

              await client.query(`
                INSERT INTO product_price_periods
                  (product_price_id, product_id, area_id, valid_from,
                   dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp,
                   status, created_by)
                VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
                ON CONFLICT (product_id, area_id, valid_from) DO UPDATE SET
                  dbp        = EXCLUDED.dbp,
                  wbp        = EXCLUDED.wbp,
                  rbp        = EXCLUDED.rbp,
                  cbp        = EXCLUDED.cbp,
                  pita_cukai = EXCLUDED.pita_cukai,
                  hje        = EXCLUDED.hje,
                  tarif      = EXCLUDED.tarif,
                  hpp        = EXCLUDED.hpp,
                  status     = EXCLUDED.status,
                  created_by = EXCLUDED.created_by
              `, [
                ppId, Number(product_id), singleAreaId, valid_from,
                dbp ?? 0, wbp ?? 0, rbp ?? 0, cbp ?? 0,
                pita_cukai ?? 0, hje ?? 0, tarif ?? 0, hpp ?? 0,
                periodStatus, usernameApp,
              ]);

              // Jika periode ini aktif (isImmediate), supersede semua periode lama yg lebih tua
              if (isImmediate) {
                await client.query(`
                  UPDATE product_price_periods
                  SET    status = 'superseded'
                  WHERE  product_id  = $1
                    AND  area_id     = $2
                    AND  valid_from  < $3
                    AND  status      = 'active'
                `, [Number(product_id), singleAreaId, valid_from]);
              }
            }
          }
        }

        await client.query('COMMIT');
        return NextResponse.json({
          success: true,
          data: insertedRows[insertedRows.length - 1] ?? null,
          scheduled: !isImmediate,
        });
      }

      // ── Bulk Upload Excel ────────────────────────────────────────────────────
      if (action === 'bulk_upsert') {
        if (!Array.isArray(prices) || prices.length === 0) {
          return NextResponse.json({ success: false, error: 'Array prices kosong' }, { status: 400 });
        }
        await client.query('BEGIN');
        let count = 0;
        for (const p of prices) {
          await client.query(`
            INSERT INTO product_prices
              (product_id, area_id, dbp, wbp, rbp, cbp, pita_cukai, hje, tarif, hpp, updated_by)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
            ON CONFLICT (product_id, area_id) DO UPDATE SET
              dbp=$3, wbp=$4, rbp=$5, cbp=$6, pita_cukai=$7, hje=$8, tarif=$9, hpp=$10,
              updated_by=$11, updated_at=CURRENT_TIMESTAMP
          `, [
            p.product_id, p.area_id,
            p.dbp ?? 0, p.wbp ?? 0, p.rbp ?? 0, p.cbp ?? 0,
            p.pita_cukai ?? 0, p.hje ?? 0, p.tarif ?? 0, p.hpp ?? 0,
            usernameApp,
          ]);
          count++;
        }
        await client.query('COMMIT');
        return NextResponse.json({ success: true, data: { upserted: count } });
      }

      // ── Hapus Harga ──────────────────────────────────────────────────────────
      if (action === 'delete') {
        const { id } = price;
        if (!id) return NextResponse.json({ success: false, error: 'id wajib diisi' }, { status: 400 });

        await client.query('BEGIN');
        await client.query('UPDATE product_prices SET updated_by = $1 WHERE id = $2', [usernameApp, id]);
        await client.query('DELETE FROM product_prices WHERE id = $1', [id]);
        await client.query('COMMIT');

        return NextResponse.json({ success: true });
      }

      // ── Hapus Satu Periode ───────────────────────────────────────────────────
      if (action === 'delete_period') {
        const { period_id } = price;
        if (!period_id) return NextResponse.json({ success: false, error: 'period_id wajib diisi' }, { status: 400 });
        await client.query('DELETE FROM product_price_periods WHERE period_id = $1', [period_id]);
        return NextResponse.json({ success: true });
      }

      return NextResponse.json(
        { success: false, error: `Action tidak dikenal: ${action}` },
        { status: 400 }
      );
    } catch (err) {
      await client.query('ROLLBACK').catch(() => {});
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('[POST /api/harga]', err);
    return NextResponse.json({ success: false, error: 'Operasi gagal' }, { status: 500 });
  }
}