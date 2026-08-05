import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ApiError } from '@/lib/api-client';
import { getProducts } from '@/lib/products/api';

import { AddProductForm } from './_components/add-product-form';
import { ProductList } from './_components/product-list';

export default async function PantryPage() {
  let products: Awaited<ReturnType<typeof getProducts>>;

  try {
    products = await getProducts();
  } catch (error) {
    // Clerk signed us in, but the API doesn't know this user yet — the
    // `user.created` webhook never landed. Common on a fresh local setup, and
    // an unhandled 401 here is a blank error page, so say what's wrong instead.
    if (error instanceof ApiError && error.status === 401) {
      return <NotProvisioned requestId={error.requestId} />;
    }
    throw error;
  }

  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Minha despensa</h1>
        <p className="text-sm text-muted-foreground">
          {products.length === 0
            ? 'Nenhum produto cadastrado.'
            : `${products.length} ${products.length === 1 ? 'produto' : 'produtos'} cadastrados.`}
        </p>
      </div>

      <AddProductForm />
      <ProductList products={products} />
    </main>
  );
}

function NotProvisioned({ requestId }: { requestId?: string }) {
  return (
    <main className="mx-auto grid max-w-3xl gap-6 px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle>Conta ainda não provisionada</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-2 text-sm text-muted-foreground">
          <p>
            Você está autenticado, mas a API ainda não tem um registro para este usuário. Isso
            acontece quando o webhook <code>user.created</code> do Clerk não chegou até a API.
          </p>
          <p>
            Verifique se <code>POST /webhooks/clerk</code> está acessível e se{' '}
            <code>CLERK_WEBHOOK_SECRET</code> corresponde ao segredo no painel do Clerk.
          </p>
          {requestId ? <p>Referência: {requestId}</p> : null}
        </CardContent>
      </Card>
    </main>
  );
}
