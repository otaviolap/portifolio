# 09 — Verificação

Cada fase tem seu critério em [`07-fases.md`](07-fases.md). Este é o checklist end-to-end depois que o site estiver de pé.

1. `npm run dev` → home carrega com scroll suave, hero anima na entrada, seções pinam e scrubam ao descer.
2. `/admin` sem login → redireciona pra `/login`. Login com credenciais do seed → entra. DevTools → Application → Cookies: `session` com `HttpOnly` marcado. Deletar o cookie e recarregar → volta pro login.
3. `/admin/projetos/novo` → criar projeto com screenshot real, `liveUrl` e techs → salvar → `/projetos` mostra o card com a imagem, e o link abre o site no ar.
4. `/admin/home/hero` → mudar o headline → salvar → `/` reflete (valida o `revalidateTag`).
5. Formulário em `/contato` → enviar → aparece em `/admin/leads` com status `NEW`.
6. DevTools → Network → Slow 3G + CPU 4x throttle → a home continua legível e o scroll não trava.
7. Ligar "Reduzir movimento" no SO → recarregar → conteúdo todo visível, sem pin, sem smooth scroll.
8. Lighthouse mobile em produção → Performance ≥90, Acessibilidade ≥95.
9. `curl -X POST` direto num Route Handler de mutação sem cookie → 401 (prova que o `requireUser()` protege, não só o middleware).

Para rodar o app de fato (dev server, screenshots, validação de uma mudança no browser), use a skill `/run` quando o código existir.
