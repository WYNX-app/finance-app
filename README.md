# Finance App — Central Financeira Pessoal

## Requisitos
- Node >= 20
- Supabase CLI

## Setup
1. `cp .env.example .env` → preencher URL e anon key do Supabase
2. `npm install`
3. `supabase link --project-ref <ref>`
4. `supabase db push` (aplica `supabase/migrations/*.sql`)
5. `npm run supabase:types`
6. `npm run dev`

## Estrutura
- `supabase/migrations/` — schema versionado
- `src/integrations/supabase/` — client + tipos gerados
- `src/services/` — wrappers por domínio
- `src/lib/money.ts` — única fonte de verdade monetária (NUMERIC → number)

## Regras
- Saldo atual = view `v_account_balances`
- Saldo projetado = view `v_account_projected_balances`
- Compra no cartão = 1 despesa; pagamento de fatura ≠ nova despesa
- Transferência = 1 transação (origem + destino)

## Deploy
- Frontend: Vercel (`npm run build`, output `dist`)
- DB: Supabase
