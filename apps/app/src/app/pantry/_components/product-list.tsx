import { differenceInCalendarDays, parseISO } from 'date-fns';

import { Card, CardContent } from '@/components/ui/card';
import type { Product } from '@/lib/products/schemas';
import { cn } from '@/lib/utils';

export function ProductList({ products }: { products: Product[] }) {
  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-sm text-muted-foreground">
          Sua despensa está vazia. Adicione o primeiro produto acima.
        </CardContent>
      </Card>
    );
  }

  const sorted = [...products].sort((a, b) => a.expiresAt.localeCompare(b.expiresAt));

  return (
    <ul className="grid gap-2">
      {sorted.map((product) => (
        <ProductRow key={product.id} product={product} />
      ))}
    </ul>
  );
}

function ProductRow({ product }: { product: Product }) {
  const daysToExpire = differenceInCalendarDays(parseISO(product.expiresAt), new Date());

  return (
    <li>
      <Card className="gap-0 py-0">
        <CardContent className="flex items-center justify-between gap-4 py-4">
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
          <div className="shrink-0 text-right">
            <p className={cn('text-sm font-medium', urgencyClass(daysToExpire))}>
              {formatDaysToExpire(daysToExpire)}
            </p>
            <p className="text-sm text-muted-foreground">{product.expiresAt}</p>
          </div>
        </CardContent>
      </Card>
    </li>
  );
}

function urgencyClass(daysToExpire: number) {
  if (daysToExpire <= 2) return 'text-expiry-critical';
  if (daysToExpire <= 7) return 'text-expiry-soon';
  return 'text-expiry-ok';
}

function formatDaysToExpire(daysToExpire: number) {
  if (daysToExpire < 0) {
    const days = Math.abs(daysToExpire);
    return `Venceu há ${days} ${days === 1 ? 'dia' : 'dias'}`;
  }
  if (daysToExpire === 0) return 'Vence hoje';
  if (daysToExpire === 1) return 'Vence amanhã';
  return `Vence em ${daysToExpire} dias`;
}
