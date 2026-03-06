const DYNMAP_URL = import.meta.env.VITE_DYNMAP_URL || 'http://89.167.92.22:8123/';

export default function MapPage() {
  return (
    <div className="page-stack">
      <header className="hero">
        <div>
          <p className="eyebrow">Surveillance terrain</p>
          <h1>Live Map DynMap</h1>
          <p>
            Vue en direct du monde Minecraft. Si l'iframe est bloquée par le
            navigateur, ouvre la carte dans un nouvel onglet.
          </p>
        </div>
        <a className="primary-button" href={DYNMAP_URL} target="_blank" rel="noreferrer">
          Ouvrir DynMap
        </a>
      </header>

      <section className="panel map-panel">
        <iframe title="DynMap PokeChantier" src={DYNMAP_URL} loading="lazy" />
      </section>
    </div>
  );
}
