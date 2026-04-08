import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// ─── Startup diagnostics ────────────────────────────────────────────────────
console.log('[GestorCOC] main.ts executing — Angular bootstrap starting');
console.log('[GestorCOC] User agent:', navigator.userAgent);
console.log('[GestorCOC] Location:', window.location.href);
console.log('[GestorCOC] Document ready state:', document.readyState);

// ─── Global unhandled error capture (catches errors outside Angular's zone) ──
window.addEventListener('error', (event) => {
  console.error('[GestorCOC] Uncaught global error:', event.message, event.error);
  showBootstrapError(
    `Error global no capturado: ${event.message}`,
    event.error instanceof Error ? event.error.stack : String(event.error),
  );
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('[GestorCOC] Unhandled promise rejection:', event.reason);
  showBootstrapError(
    `Promesa rechazada sin manejar: ${event.reason}`,
    event.reason instanceof Error ? event.reason.stack : String(event.reason),
  );
});

// ─── DOM fallback shown when Angular fails to bootstrap ─────────────────────
function showBootstrapError(message: string, detail?: string): void {
  const root = document.querySelector('app-root');
  if (!root) {
    console.error('[GestorCOC] <app-root> element not found in DOM');
    return;
  }

  // Only inject the error UI once
  if (root.querySelector('.ng-bootstrap-error')) {
    return;
  }

  root.innerHTML = `
    <div class="ng-bootstrap-error" style="
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      box-sizing: border-box;
    ">
      <div style="
        max-width: 640px;
        width: 100%;
        background: #1e293b;
        border: 1px solid #ef4444;
        border-radius: 12px;
        padding: 2rem;
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
      ">
        <div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:1.25rem;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          <h1 style="margin:0; font-size:1.25rem; font-weight:700; color:#f87171;">
            Error al iniciar la aplicación
          </h1>
        </div>
        <p style="margin:0 0 1rem; font-size:0.9rem; color:#94a3b8; line-height:1.6;">
          La aplicación Angular no pudo inicializarse correctamente. Por favor recargue la página.
          Si el problema persiste, contacte al administrador del sistema.
        </p>
        <div style="
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 8px;
          padding: 1rem;
          margin-bottom: 1.25rem;
          font-family: monospace;
          font-size: 0.8rem;
          color: #fca5a5;
          word-break: break-word;
          white-space: pre-wrap;
          max-height: 200px;
          overflow-y: auto;
        ">${escapeHtml(message)}${detail ? '\n\n' + escapeHtml(detail) : ''}</div>
        <div style="display:flex; gap:0.75rem; flex-wrap:wrap;">
          <button onclick="window.location.reload()" style="
            padding: 0.6rem 1.25rem;
            background: #2563eb;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
          ">Recargar página</button>
          <button onclick="localStorage.clear(); sessionStorage.clear(); window.location.reload()" style="
            padding: 0.6rem 1.25rem;
            background: #475569;
            color: white;
            border: none;
            border-radius: 8px;
            font-size: 0.875rem;
            font-weight: 600;
            cursor: pointer;
          ">Limpiar caché y recargar</button>
        </div>
      </div>
    </div>
  `;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
bootstrapApplication(App, appConfig)
  .then(() => {
    console.log('[GestorCOC] Angular bootstrap completed successfully');
  })
  .catch((err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[GestorCOC] Angular bootstrap FAILED:', err);
    console.error('[GestorCOC] Error details:', { message, stack });
    showBootstrapError(`Bootstrap falló: ${message}`, stack);
  });

