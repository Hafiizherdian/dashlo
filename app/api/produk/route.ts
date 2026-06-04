/**
 * app/api/products/route.ts
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/db';
import { withAuth } from '@/lib/auth/session';

export async function GET(request: NextRequest) {
  return withAuth(request, 'view_products', async () => {
    try {
      const { searchParams } = new URL(request.url);
      const search   = searchParams.get('search')   ?? '';
      const category = searchParams.get('category') ?? '';
      const factory  = searchParams.get('factory')  ?? '';

      const conditions: string[] = [];
      const params:     unknown[] = [];
      let i = 1;

      if (search) {
        conditions.push(`(name ILIKE $${i} OR factory ILIKE $${i})`);
        params.push(`%${search}%`); i++;
      }
      if (category) {
        conditions.push(`category = $${i}`);
        params.push(category); i++;
      }
      if (factory) {
        conditions.push(`factory = $${i}`);
        params.push(factory); i++;
      }

      const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

      const [products, categories, factories] = await Promise.all([
        pool.query(`
          SELECT id, name, category, factory,
                 stick_per_pack, pack_per_slop, slop_per_bal, bal_per_dos,
                 created_at
          FROM products
          ${where}
          ORDER BY category ASC, name ASC
        `, params),
        pool.query(`SELECT DISTINCT category FROM products ORDER BY category ASC`),
        pool.query(`SELECT DISTINCT factory FROM products ORDER BY factory ASC`),
      ]);

      return NextResponse.json({
        success: true,
        data: {
          products:   products.rows,
          categories: categories.rows.map(r => r.category),
          factories:  factories.rows.map(r => r.factory),
        },
        count: products.rows.length,
      });
    } catch (error) {
      console.error('[api/products GET]', error);
      return NextResponse.json(
        { success: false, error: 'Gagal mengambil data produk' },
        { status: 500 },
      );
    }
  });
}

export async function POST(request: NextRequest) {
  return withAuth(request, 'manage_products', async (session) => {
    try {
      const body = await request.json();
      const { action, product } = body;

      if (!action || !product) {
        return NextResponse.json(
          { success: false, error: 'action dan product wajib diisi' },
          { status: 400 },
        );
      }

      if (action === 'add') {
        const result = await pool.query(`
          INSERT INTO products (name, category, factory, stick_per_pack, pack_per_slop, slop_per_bal, bal_per_dos)
          VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING id
        `, [
          product.name.trim().toUpperCase(),
          product.category.trim().toUpperCase(),
          product.factory.trim().toUpperCase(),
          Number(product.stick_per_pack),
          Number(product.pack_per_slop),
          Number(product.slop_per_bal),
          Number(product.bal_per_dos),
        ]);

        return NextResponse.json({ success: true, data: { id: result.rows[0].id } });

      } else if (action === 'update') {
        await pool.query(`
          UPDATE products
          SET name          = $1,
              category      = $2,
              factory       = $3,
              stick_per_pack = $4,
              pack_per_slop  = $5,
              slop_per_bal   = $6,
              bal_per_dos    = $7
          WHERE id = $8
        `, [
          product.name.trim().toUpperCase(),
          product.category.trim().toUpperCase(),
          product.factory.trim().toUpperCase(),
          Number(product.stick_per_pack),
          Number(product.pack_per_slop),
          Number(product.slop_per_bal),
          Number(product.bal_per_dos),
          product.id,
        ]);

        return NextResponse.json({ success: true });

      } else if (action === 'delete') {
        if (session.role !== 'root') {
          return NextResponse.json(
            { success: false, error: 'Hanya root yang bisa menghapus produk' },
            { status: 403 },
          );
        }
        await pool.query('DELETE FROM products WHERE id = $1', [product.id]);
        return NextResponse.json({ success: true });

      } else {
        return NextResponse.json(
          { success: false, error: `Action tidak dikenal: ${action}` },
          { status: 400 },
        );
      }
    } catch (error: unknown) {
      console.error('[api/products POST]', error);
      const msg = (error as { code?: string })?.code === '23505'
        ? 'Nama produk sudah ada'
        : 'Gagal mengelola produk';
      return NextResponse.json({ success: false, error: msg }, { status: 500 });
    }
  });
}