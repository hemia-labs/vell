<template>
  <div class="home-view">
    <section class="greeting">
      <div>
        <h1>Bienvenido a <span>Vell CMS</span></h1>
        <p>Administra contenido, modelos, activos y automatizaciones desde un espacio limpio y preparado para crecer.</p>
      </div>

      <div class="stats-card" aria-label="Resumen del espacio">
        <div>
          <span class="stats-card__label">Contenido</span>
          <strong>1,284</strong>
        </div>
        <div class="stats-card__divider"></div>
        <div>
          <span class="stats-card__label">Modelos</span>
          <strong>18</strong>
        </div>
      </div>
    </section>

    <section class="placeholder-grid" aria-label="Accesos rápidos">
      <article class="placeholder-card placeholder-card--hero">
        <span class="placeholder-card__eyebrow">Dashboard</span>
        <h2>Tu layout privado ya está listo.</h2>
        <p>Este espacio queda preparado para construir el panel principal con tarjetas, tablas y flujos de contenido.</p>
      </article>

      <article class="placeholder-card">
        <span class="placeholder-card__eyebrow">Siguiente</span>
        <h2>Crear módulos</h2>
        <p>Podemos conectar aquí vistas como contenido, modelos, activos, equipo y ajustes.</p>
      </article>
    </section>
  </div>
</template>

<style scoped>
.home-view {
  display: flex;
  flex-direction: column;
  gap: 36px;
}

.greeting {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
}

.greeting h1 {
  margin: 0 0 8px;
  color: var(--app-ink);
  font-family: 'Instrument Serif', ui-serif, Georgia, serif;
  font-size: clamp(36px, 5vw, 44px);
  font-weight: 400;
  letter-spacing: -0.02em;
  line-height: 1.05;
}

.greeting h1 span {
  color: var(--app-muted);
  font-style: italic;
}

.greeting p {
  max-width: 520px;
  margin: 0;
  color: var(--app-muted);
  font-size: 14px;
}

.stats-card {
  display: flex;
  gap: 28px;
  border: 1px solid var(--app-line);
  border-radius: var(--app-radius);
  background: var(--app-surface);
  padding: 14px 22px;
}

.stats-card > div:not(.stats-card__divider) {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stats-card__label {
  color: var(--app-muted);
  font-size: 11px;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.stats-card strong {
  color: var(--app-ink);
  font-size: 20px;
  font-weight: 500;
  letter-spacing: -0.02em;
}

.stats-card__divider {
  width: 1px;
  background: var(--app-line);
}

.placeholder-grid {
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 14px;
}

.placeholder-card {
  min-height: 200px;
  border: 1px solid var(--app-line);
  border-radius: var(--app-radius-lg);
  background: var(--app-surface);
  padding: 18px;
}

.placeholder-card--hero {
  border-color: var(--app-ink);
  background: var(--app-ink);
  color: var(--app-bg);
}

.placeholder-card__eyebrow {
  color: var(--app-muted);
  font-family: 'Geist Mono', ui-monospace, monospace;
  font-size: 11px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.placeholder-card--hero .placeholder-card__eyebrow,
.placeholder-card--hero p {
  color: color-mix(in oklab, var(--app-bg) 74%, transparent);
}

.placeholder-card h2 {
  margin: 18px 0 8px;
  color: inherit;
  font-size: 22px;
  font-weight: 550;
  letter-spacing: -0.015em;
  line-height: 1.25;
}

.placeholder-card p {
  margin: 0;
  color: var(--app-muted);
  font-size: 13px;
  line-height: 1.45;
}

@media (max-width: 760px) {
  .greeting,
  .stats-card {
    align-items: stretch;
    flex-direction: column;
  }

  .placeholder-grid {
    grid-template-columns: 1fr;
  }
}
</style>
