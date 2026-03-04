// ============================================================
// Logger — loga apenas em desenvolvimento, silencioso em produção
// ============================================================

const isDev = import.meta.env.DEV

export const logger = {
  log: isDev ? console.log.bind(console) : () => {},
  warn: isDev ? console.warn.bind(console) : () => {},
  error: isDev ? console.error.bind(console) : () => {},
}
