export default function TabBar({ tabs, activeTab, onTabChange }) {
  return (
    <div className="tab-bar" role="tablist" aria-label="Sections statistiques">
      {tabs.map((tab) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            className={`tab-button ${isActive ? 'is-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
