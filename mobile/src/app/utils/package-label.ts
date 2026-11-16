import { PackageType, Product } from '../models/product.model';

// [etiqueta, singular, plural]: las cantidades siempre son fardos o cajas cerradas
const PACKAGE_NAMES: Record<PackageType, [string, string, string]> = {
  FARDO: ['Fardo', 'fardo', 'fardos'],
  CAJA: ['Caja', 'caja', 'cajas'],
};

// Ej. "Caja 24 u. · $22.50 por caja"
export const packageLabel = (product: Product): string => {
  const [label, unit] = PACKAGE_NAMES[product.package_type];
  return `${label} ${product.units_per_package} u. · $${product.sale_price.toFixed(2)} por ${unit}`;
};

// Aviso al llegar al stock que devolvió la API
export const stockMessage = (product: Product): string => {
  const [, singular, plural] = PACKAGE_NAMES[product.package_type];
  if (product.stock < 1) {
    return `${product.name} está agotado.`;
  }
  return product.stock === 1
    ? `Solo queda 1 ${singular} de ${product.name}.`
    : `Solo hay ${product.stock} ${plural} disponibles de ${product.name}.`;
};
