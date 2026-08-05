'use client';

import { Plus } from 'lucide-react';
import { type ReactNode, useActionState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NOTIFICATION_LEAD_TIMES, today } from '@/lib/products/schemas';
import { cn } from '@/lib/utils';

import { type AddProductState, addProductAction, initialAddProductState } from '../actions';

export function AddProductForm() {
  const [state, formAction, isPending] = useActionState<AddProductState, FormData>(
    addProductAction,
    initialAddProductState
  );

  const todayValue = today();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Adicionar produto</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4">
          <Field label="Nome" name="name" errors={state.fieldErrors?.name}>
            <Input id="name" name="name" placeholder="Leite integral" required />
          </Field>

          <Field label="Categoria" name="category" errors={state.fieldErrors?.category}>
            <Input id="category" name="category" placeholder="Bebidas" required />
          </Field>

          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Comprado em" name="buyedAt" errors={state.fieldErrors?.buyedAt}>
              <Input
                id="buyedAt"
                name="buyedAt"
                type="date"
                max={todayValue}
                defaultValue={todayValue}
                required
              />
            </Field>

            <Field label="Vence em" name="expiresAt" errors={state.fieldErrors?.expiresAt}>
              <Input id="expiresAt" name="expiresAt" type="date" min={todayValue} required />
            </Field>
          </div>

          <fieldset className="grid gap-2">
            <legend className="mb-1 text-sm leading-none font-medium">Avisar por email</legend>
            <div className="flex flex-wrap gap-4">
              {NOTIFICATION_LEAD_TIMES.map((days) => (
                <Label key={days} className="font-normal">
                  <input
                    type="checkbox"
                    name="leadTimes"
                    value={days}
                    defaultChecked={days !== 1}
                    className="size-4 accent-primary"
                  />
                  {days} {days === 1 ? 'dia antes' : 'dias antes'}
                </Label>
              ))}
            </div>
            <p className="text-sm text-muted-foreground">
              Avisos que cairiam no passado são descartados. Máximo de três por produto.
            </p>
            {state.fieldErrors?.notifications ? (
              <p className="text-sm text-destructive">{state.fieldErrors.notifications[0]}</p>
            ) : null}
          </fieldset>

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={isPending}>
              <Plus />
              {isPending ? 'Adicionando...' : 'Adicionar'}
            </Button>
            {state.message ? (
              <p
                className={cn(
                  'text-sm',
                  state.status === 'error' ? 'text-destructive' : 'text-expiry-ok'
                )}
              >
                {state.message}
              </p>
            ) : null}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  name,
  errors,
  children
}: {
  label: string;
  name: string;
  errors?: string[];
  children: ReactNode;
}) {
  return (
    <div className="grid gap-2">
      <Label htmlFor={name}>{label}</Label>
      {children}
      {errors?.[0] ? <p className="text-sm text-destructive">{errors[0]}</p> : null}
    </div>
  );
}
