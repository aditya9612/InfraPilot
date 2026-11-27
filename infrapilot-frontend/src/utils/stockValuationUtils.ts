import type { ValuationMethod, Material, InwardReceipt } from "../types/material";

export interface LandedCostParams {
  baseRate: number;
  quantity: number;
  taxPercent?: number;
  discountPercent?: number;
  freightCost?: number;
  includeTax?: boolean;
  includeFreight?: boolean;
}

/**
 * Computes landed unit rate and total cost including optional Tax, Discount, and Freight.
 */
export const calculateLandedCost = ({
  baseRate,
  quantity,
  taxPercent = 0,
  discountPercent = 0,
  freightCost = 0,
  includeTax = true,
  includeFreight = true,
}: LandedCostParams): { landedRate: number; totalCost: number; taxAmount: number; discountAmount: number } => {
  const safeQty = Math.max(0, Number(quantity) || 0);
  const safeRate = Math.max(0, Number(baseRate) || 0);
  const gross = safeQty * safeRate;
  const discountAmount = gross * ((Number(discountPercent) || 0) / 100);
  const netAfterDiscount = gross - discountAmount;
  const taxAmount = includeTax ? netAfterDiscount * ((Number(taxPercent) || 0) / 100) : 0;
  const freight = includeFreight ? Math.max(0, Number(freightCost) || 0) : 0;
  const totalCost = netAfterDiscount + taxAmount + freight;
  const landedRate = safeQty > 0 ? totalCost / safeQty : safeRate;
  return {
    landedRate: Number(landedRate.toFixed(2)),
    totalCost: Number(totalCost.toFixed(2)),
    taxAmount: Number(taxAmount.toFixed(2)),
    discountAmount: Number(discountAmount.toFixed(2)),
  };
};

/**
 * Computes stock unit rate and valuation using WAC, FIFO, or LPR.
 */
export const computeMaterialValuation = (
  material: Material,
  inwards: InwardReceipt[],
  method: ValuationMethod = "WAC"
): { unitRate: number; totalValue: number } => {
  const stock = Math.max(0, Number(material.remaining_stock) || 0);
  if (stock === 0) return { unitRate: Number(material.purchase_rate || 0), totalValue: 0 };

  const matInwards = inwards
    .filter((inc) => inc.status === "POSTED" && (!material.project_id || inc.receiving_project_id === material.project_id))
    .flatMap((inc) =>
      inc.items
        .filter((it) => it.material_id === material.id || it.material_name.toLowerCase() === (material.material_name || "").toLowerCase())
        .map((it) => ({
          qty: Number(it.received_qty) || 0,
          rate: Number(it.rate) || 0,
          date: inc.delivery_date || inc.created_at,
        }))
    )
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  if (matInwards.length === 0) {
    const rate = Number(material.purchase_rate || material.avg_rate || 0);
    return { unitRate: rate, totalValue: Number((stock * rate).toFixed(2)) };
  }

  if (method === "LPR") {
    const lastRate = matInwards[matInwards.length - 1].rate;
    return { unitRate: lastRate, totalValue: Number((stock * lastRate).toFixed(2)) };
  }

  if (method === "FIFO") {
    // Remaining stock comes from the newest inward batches
    let remainingToValue = stock;
    let totalVal = 0;
    for (let i = matInwards.length - 1; i >= 0 && remainingToValue > 0; i--) {
      const batch = matInwards[i];
      const take = Math.min(remainingToValue, batch.qty);
      totalVal += take * batch.rate;
      remainingToValue -= take;
    }
    if (remainingToValue > 0) {
      totalVal += remainingToValue * Number(material.purchase_rate || 0);
    }
    const unitRate = Number((totalVal / stock).toFixed(2));
    return { unitRate, totalValue: Number(totalVal.toFixed(2)) };
  }

  // Default: WAC (Weighted Average Cost)
  const totalInQty = matInwards.reduce((s, x) => s + x.qty, 0);
  const totalInVal = matInwards.reduce((s, x) => s + x.qty * x.rate, 0);
  const wacRate = totalInQty > 0 ? Number((totalInVal / totalInQty).toFixed(2)) : Number(material.purchase_rate || 0);
  return { unitRate: wacRate, totalValue: Number((stock * wacRate).toFixed(2)) };
};

/**
 * Formats or masks currency depending on role/viewer permission.
 */
export const formatValuationCurrency = (amount: number, maskPrices: boolean = false): string => {
  if (maskPrices) return "₹••••••";
  return `₹${(Number(amount) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}`;
};
