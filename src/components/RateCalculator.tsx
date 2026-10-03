"use client";

import { useState, useEffect } from "react";
import { ScrapCategory } from "@/lib/types";
import { IndianRupee, Minus, Plus, Trash2 } from "lucide-react";

interface CalculatorItem {
  categoryId: string;
  name: string;
  pricePerKg: number;
  weight: number;
}

interface Props {
  categories: ScrapCategory[];
}

export function RateCalculator({ categories }: Props) {
  const [items, setItems] = useState<CalculatorItem[]>([]);

  function addItem(cat: ScrapCategory) {
    // If already added, increment weight
    const existing = items.find((i) => i.categoryId === cat.id);
    if (existing) {
      setItems(
        items.map((i) =>
          i.categoryId === cat.id ? { ...i, weight: i.weight + 1 } : i
        )
      );
    } else {
      setItems([
        ...items,
        { categoryId: cat.id, name: cat.name, pricePerKg: cat.pricePerKg, weight: 1 },
      ]);
    }
  }

  function updateWeight(categoryId: string, weight: number) {
    if (weight <= 0) {
      setItems(items.filter((i) => i.categoryId !== categoryId));
    } else {
      setItems(
        items.map((i) => (i.categoryId === categoryId ? { ...i, weight } : i))
      );
    }
  }

  function removeItem(categoryId: string) {
    setItems(items.filter((i) => i.categoryId !== categoryId));
  }

  const total = items.reduce((sum, i) => sum + i.weight * i.pricePerKg, 0);
  const totalWeight = items.reduce((sum, i) => sum + i.weight, 0);

  // Group categories by category type
  const grouped = categories.reduce<Record<string, ScrapCategory[]>>(
    (acc, cat) => {
      if (!acc[cat.category]) acc[cat.category] = [];
      acc[cat.category].push(cat);
      return acc;
    },
    {}
  );

  return (
    <div className="space-y-6">
      {/* Rate Cards by Category */}
      {Object.entries(grouped).map(([group, cats]) => (
        <div key={group}>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">
            {group}
          </h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {cats.map((cat) => {
              const added = items.find((i) => i.categoryId === cat.id);
              return (
                <button
                  key={cat.id}
                  onClick={() => addItem(cat)}
                  className={`group relative rounded-xl border-2 p-4 text-left transition-all hover:shadow-md ${
                    added
                      ? "border-brand-500 bg-brand-50 shadow-sm"
                      : "border-gray-200 bg-white hover:border-brand-300"
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-900">
                    {cat.name}
                  </p>
                  <div className="mt-1 flex items-center text-lg font-bold text-brand-700">
                    <IndianRupee className="h-4 w-4" />
                    {cat.pricePerKg}
                    <span className="ml-1 text-xs font-normal text-gray-500">
                      /{cat.unit}
                    </span>
                  </div>
                  {added && (
                    <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand-600 text-xs font-bold text-white">
                      {added.weight}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      {/* Selected Items */}
      {items.length > 0 && (
        <div className="rounded-xl border-2 border-brand-200 bg-brand-50/50 p-4">
          <h3 className="mb-3 font-semibold text-gray-900">Your Scrap Basket</h3>
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.categoryId}
                className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    ₹{item.pricePerKg}/kg
                  </p>
                </div>

                {/* Weight controls */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() =>
                      updateWeight(item.categoryId, item.weight - 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <input
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={item.weight}
                    onChange={(e) =>
                      updateWeight(item.categoryId, parseFloat(e.target.value) || 0)
                    }
                    className="w-16 rounded-lg border border-gray-300 px-2 py-1 text-center text-sm font-semibold focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                  />
                  <span className="text-xs text-gray-500">kg</span>
                  <button
                    onClick={() =>
                      updateWeight(item.categoryId, item.weight + 1)
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-100"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => removeItem(item.categoryId)}
                    className="ml-1 flex h-8 w-8 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                {/* Subtotal */}
                <div className="ml-3 w-20 text-right">
                  <p className="text-sm font-bold text-brand-700">
                    ₹{(item.weight * item.pricePerKg).toFixed(0)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="mt-4 flex items-center justify-between border-t border-brand-200 pt-4">
            <div>
              <p className="text-sm text-gray-600">
                Total: {totalWeight.toFixed(1)} kg
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-gray-500">Estimated Earnings</p>
              <p className="flex items-center text-2xl font-bold text-brand-700">
                <IndianRupee className="h-5 w-5" />
                {total.toFixed(0)}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
