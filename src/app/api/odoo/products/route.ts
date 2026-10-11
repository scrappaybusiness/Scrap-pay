import { NextResponse } from "next/server";
import { fetchOdooProducts } from "@/lib/odoo";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const products = await fetchOdooProducts();
    return NextResponse.json({
      success: true,
      count: products.length,
      products,
    });
  } catch (error: any) {
    console.error("Error fetching Odoo products:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Failed to fetch products from Odoo",
        products: [],
      },
      { status: 500 }
    );
  }
}
