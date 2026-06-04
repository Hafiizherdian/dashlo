/**
 * app/api/areas/route.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';
import { canAccessArea } from '@/lib/auth/types';

// Helper untuk membuat slug otomatis dari nama agen
function toSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9_\s-]/g, '') // Hapus karakter aneh kecuali spasi, dash, underscore
    .replace(/[\s-]+/g, '_')       // Ubah spasi atau dash menjadi underscore (_)
    .trim();
}

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_areas', async (session) => {
    try {
      const result = await pool.query(`
        SELECT
          ao.area_id                  AS id,
          ao.area_name                AS name,
          ao.agent_type               AS agent_type,
          ao.regional                 AS regional,
          COUNT(DISTINCT ao.city_name) AS city_count,
          ARRAY_AGG(ao.city_name ORDER BY ao.city_name) AS cities
        FROM area_overrides ao
        GROUP BY ao.area_id, ao.area_name, ao.agent_type, ao.regional
        ORDER BY ao.area_name ASC
      `);

      let areas = result.rows;

      if (session.role !== 'root') {
        areas = areas.filter(a => canAccessArea(session, a.id));
      }

      return NextResponse.json({
        success: true,
        data: { areas },
        count: areas.length,
      });
    } catch (error) {
      console.error('[api/areas GET]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data area' },
        { status: 500 },
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, 'manage_areas', async (session) => {
    try {
      const body = await request.json();
      const { action, area } = body;

      if (!action || !area) {
        return NextResponse.json(
          { success: false, error: 'action dan area wajib diisi' },
          { status: 400 },
        );
      }

      const slug = toSlug(area.name);

      if (action === 'add') {
        const cities: string[] = (area.cities ?? [])
          .map((c: string) => c.trim().toUpperCase())
          .filter(Boolean);

        if (!cities.length) {
          return NextResponse.json(
            { success: false, error: 'Minimal satu kota harus diisi' },
            { status: 400 },
          );
        }

        // 1. Ambil area_id otomatis dari sequence database untuk baris pertama
        const firstCity = cities[0];
        const insertFirst = await pool.query(`
          INSERT INTO area_overrides (city_name, area_name, area_slug, agent_type, regional)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (city_name) DO UPDATE
            SET area_name  = EXCLUDED.area_name,
                area_slug  = EXCLUDED.area_slug,
                agent_type = EXCLUDED.agent_type,
                regional   = EXCLUDED.regional,
                updated_at = NOW()
          RETURNING area_id
        `, [firstCity, area.name, slug, area.agent_type ?? 'agen', area.regional ?? null]);

        const generatedAreaId = insertFirst.rows[0].area_id;

        // 2. Terapkan area_id yang didapat ke kota-kota selebihnya (jika ada lebih dari 1 kota)
        if (cities.length > 1) {
          for (let i = 1; i < cities.length; i++) {
            await pool.query(`
              INSERT INTO area_overrides (city_name, area_id, area_name, area_slug, agent_type, regional)
              VALUES ($1, $2, $3, $4, $5, $6)
              ON CONFLICT (city_name) DO UPDATE
                SET area_id    = EXCLUDED.area_id,
                    area_name  = EXCLUDED.area_name,
                    area_slug  = EXCLUDED.area_slug,
                    agent_type = EXCLUDED.agent_type,
                    regional   = EXCLUDED.regional,
                    updated_at = NOW()
            `, [cities[i], generatedAreaId, area.name, slug, area.agent_type ?? 'agen', area.regional ?? null]);
          }
        }

      } else if (action === 'edit') { // <--- Sudah diubah dari 'update' menjadi 'edit'
        const cities: string[] = (area.cities ?? [])
          .map((c: string) => c.trim().toUpperCase())
          .filter(Boolean);

        if (!cities.length) {
          return NextResponse.json(
            { success: false, error: 'Minimal satu kota harus diisi' },
            { status: 400 },
          );
        }

        // Hapus semua relasi kota lama khusus untuk area_id ini, lalu insert ulang memakai ID lama yang dipertahankan
        await pool.query('DELETE FROM area_overrides WHERE area_id = $1', [area.id]);

        for (const city of cities) {
          await pool.query(`
            INSERT INTO area_overrides (city_name, area_id, area_name, area_slug, agent_type, regional)
            VALUES ($1, $2, $3, $4, $5, $6)
            ON CONFLICT (city_name) DO UPDATE
              SET area_id    = EXCLUDED.area_id,
                  area_name  = EXCLUDED.area_name,
                  area_slug  = EXCLUDED.area_slug,
                  agent_type = EXCLUDED.agent_type,
                  regional   = EXCLUDED.regional,
                  updated_at = NOW()
          `, [city, area.id, area.name, slug, area.agent_type ?? 'agen', area.regional ?? null]);
        }

      } else if (action === 'delete') {
        if (session.role !== 'root') {
          return NextResponse.json(
            { success: false, error: 'Hanya root yang bisa menghapus area' },
            { status: 403 },
          );
        }
        await pool.query('DELETE FROM area_overrides WHERE area_id = $1', [area.id]);

      } else {
        return NextResponse.json(
          { success: false, error: `Action tidak dikenal: ${action}` },
          { status: 400 },
        );
      }

      // Ambil kembali list terbaru untuk dikembalikan ke UI
      const updated = await pool.query(`
        SELECT
          area_id    AS id,
          area_name  AS name,
          agent_type AS agent_type,
          regional   AS regional,
          COUNT(DISTINCT city_name)                    AS city_count,
          ARRAY_AGG(city_name ORDER BY city_name)      AS cities
        FROM area_overrides
        GROUP BY area_id, area_name, agent_type, regional
        ORDER BY area_name ASC
      `);

      return NextResponse.json({
        success: true,
        data: { areas: updated.rows },
        count: updated.rows.length,
      });
    } catch (error) {
      console.error('[api/areas POST]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengelola area' },
        { status: 500 },
      );
    }
  });
}