# CLAUDE.md — Guia de desenvolvimento IADI

Este arquivo documenta decisões de design, convenções e mudanças já realizadas no projeto.
**Leia antes de fazer qualquer modificação.**

---

## Decisões de UI/PDF já implementadas

### Crachá de membro (`src/lib/pdf/MemberBadge.tsx`)
- **Formato: HORIZONTAL** (`~92mm × 63mm`, paisagem) — **NUNCA reverter para vertical**
- Dimensões fixas: `BADGE_W = 258`, `BADGE_H = 174`
- Layout frente: foto circular à **esquerda** + nome/cargo/congregação à **direita**
- Layout verso: **2 colunas** de dados + área de assinatura na base
- Faixa âmbar (`#f59e0b`) na base de frente e verso
- Página A4 retrato com **2 crachás por linha** (frente na metade superior, verso na inferior)
- Separador tracejado entre frente e verso para indicar onde recortar

---

## Arquitetura offline-first

- Todo dado é salvo primeiro no **IndexedDB** (via Dexie) e depois sincronizado com o Supabase
- A fila de sync (`sync_queue`) garante que mudanças offline sejam enviadas ao reconectar
- `syncAll()` é chamado a cada 5 minutos e na inicialização (quando há usuário autenticado)
- Soft delete: registros nunca são deletados — apenas `deleted_at` é preenchido

---

## Convenções de código

### Logger (não usar `console.*` diretamente)
```typescript
// ✅ Correto
import { logger } from '@/utils/logger'
logger.log('...') // silencioso em produção
logger.warn('...')
logger.error('...')

// ❌ Proibido em produção
console.log(...)
console.warn(...)
console.error(...)
```

### Enums centralizados (`src/types/index.ts`)
Os arrays `as const` são a **fonte única da verdade** para roles, status e tipos:
```typescript
USER_ROLES, MEMBER_STATUSES, MARITAL_STATUSES, EVENT_TYPES, LETTER_TYPES, SELF_REGISTRATION_STATUSES
```
Usar sempre esses arrays nos schemas Zod — nunca duplicar as strings:
```typescript
// ✅ Correto
import { MEMBER_STATUSES } from '@/types'
status: z.enum(MEMBER_STATUSES)

// ❌ Proibido
status: z.enum(['ativo','inativo','transferido',...])
```

### Lazy loading nas rotas (`src/App.tsx`)
Todas as páginas são carregadas com `React.lazy`. **Não importar páginas diretamente** no `App.tsx`:
```typescript
// ✅ Correto
const DashboardPage = lazy(() => import('@/pages/dashboard/DashboardPage').then(m => ({ default: m.DashboardPage })))

// ❌ Proibido
import { DashboardPage } from '@/pages/dashboard/DashboardPage'
```

### Error Boundaries por rota
Cada rota está envolta em `<PageBoundary>` (combina `RouteErrorBoundary + Suspense`).
Manter esse padrão ao adicionar novas rotas.

### Debounce na busca de membros
O hook `useDebounce` (300ms) é aplicado ao campo `search` em `useMembers.ts`.
Não remover — evita re-filtragem a cada keystroke.

### Acesso ao IndexedDB em `sync.ts`
Usar `getDbTable(tableName)` em vez de `(db as any)[tableName]`.

---

## RBAC — Hierarquia de permissões

| Nível | Role | Descrição |
|-------|------|-----------|
| 5 | `admin` | Administrador do sistema |
| 4 | `secretario` | Secretário |
| 3 | `lideranca_plena` | Liderança plena / Pastor |
| 2 | `presbitero` | Presbítero |
| 1 | `diacono_obreiro` | Diácono / Obreiro |

---

## Status de membros

`ativo` | `inativo` | `transferido` | `falecido` | `excluido` | `em_experiencia`

---

## Banco de dados

- **Supabase** (PostgreSQL + Auth + Storage + Edge Functions)
- RLS habilitado em todas as tabelas
- `member_number` é SERIAL — **nunca enviar `null` no upsert** (já tratado em `sanitizePayload`)
- Soft deletes via campo `deleted_at`

---

## Variáveis de ambiente necessárias

```
VITE_SUPABASE_URL=https://[projeto].supabase.co
VITE_SUPABASE_ANON_KEY=[chave anon]
```

---

## Build e deploy

- **Vite** com code splitting automático por página (chunks separados)
- **Vercel** com SPA routing (`vercel.json` redireciona tudo para `index.html`)
- **PWA** com Workbox para funcionamento offline
- Chunk do PDF (`@react-pdf/renderer`) é grande (~1.5MB) — esperado e aceitável
- Rodar `npm run build` para verificar antes de commitar mudanças grandes

---

## Melhorias pendentes (não implementadas ainda)

- [ ] Testes automatizados nos fluxos críticos (auth, sync, RBAC)
- [ ] Rate limiting no endpoint de cadastro público
- [ ] Content Security Policy (CSP) headers
- [ ] Serviço de monitoramento em produção (Sentry ou similar)
- [ ] Paginação na listagem de membros
