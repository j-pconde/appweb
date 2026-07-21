import { useState } from 'react';
import { FiShoppingBag, FiFileText, FiLogOut, FiGrid, FiMenu, FiX } from 'react-icons/fi';
import { ProductsList } from './ProductsList';

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<'produtos' | 'pedidos' | 'geral'>('produtos');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const tabs = [
    { id: 'geral', label: 'Painel Geral', icon: FiGrid },
    { id: 'produtos', label: 'Produtos', icon: FiShoppingBag },
    { id: 'pedidos', label: 'Pedidos', icon: FiFileText },
  ] as const;

  return (
    <div className="min-h-screen bg-brand-neutral text-brand-text font-sans flex flex-col md:flex-row">
      
      {/* ==========================================
          HEADER MOBILE (Aparece apenas em celular/tablet)
         ========================================== */}
      <header className="flex md:hidden items-center justify-between bg-brand-card px-6 py-4 border-b border-brand-text/10 sticky top-0 z-40">
        <div>
          <span className="text-base font-heading font-light tracking-[0.2em] text-brand-text">PISCALLO</span>
          <p className="text-[8px] tracking-widest text-brand-primary font-heading font-bold uppercase">PAINEL</p>
        </div>
        
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 text-brand-text/80 hover:bg-brand-neutral rounded-xl transition-all min-h-11 min-w-11 flex items-center justify-center border border-brand-text/5"
          aria-label="Abrir Menu"
        >
          {isMobileMenuOpen ? <FiX className="w-5 h-5" /> : <FiMenu className="w-5 h-5" />}
        </button>
      </header>

      {/* MENU RETRÁTIL MOBILE (Overlay de Navegação) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-30 md:hidden" onClick={() => setIsMobileMenuOpen(false)}>
          <nav 
            className="w-72 max-w-[80vw] h-full bg-brand-card p-6 flex flex-col justify-between shadow-2xl border-r border-brand-text/10"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-6">
              <div className="pb-4 border-b border-brand-text/5">
                <span className="text-lg font-heading font-light tracking-[0.3em] text-brand-text">PISCALLO</span>
                <p className="text-[9px] tracking-widest text-brand-primary font-heading font-bold uppercase mt-1">Navegação</p>
              </div>

              <div className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left min-h-11 ${
                        activeTab === tab.id
                          ? 'bg-brand-neutral text-brand-text border border-brand-text/10'
                          : 'text-brand-text/75 active:bg-brand-neutral/40'
                      }`}
                    >
                      <Icon className="w-4 h-4 text-brand-primary" />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button
              onClick={() => { window.location.href = '/login'; }}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-text/60 hover:text-red-600 active:bg-red-50 text-sm font-bold transition-all min-h-11"
            >
              <FiLogOut className="w-4 h-4" />
              Sair do Painel
            </button>
          </nav>
        </div>
      )}

      {/* ==========================================
          BARRA LATERAL FIXA DESKTOP (Apenas telas md para cima)
         ========================================== */}
      <aside className="hidden md:flex w-64 bg-brand-card border-r border-brand-text/10 p-6 flex-col justify-between shrink-0 sticky top-0 h-screen">
        <div className="space-y-8">
          <div>
            <span className="text-lg font-heading font-light tracking-[0.3em] text-brand-text">PISCALLO</span>
            <p className="text-[9px] tracking-widest text-brand-primary font-heading font-bold uppercase mt-1">PAINEL ADMINISTRATIVO</p>
          </div>

          <nav className="space-y-1.5">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-heading font-bold text-sm transition-all text-left border ${
                    activeTab === tab.id
                      ? 'bg-brand-neutral text-brand-text border-brand-text/10 shadow-xs'
                      : 'text-brand-text/70 border-transparent hover:bg-brand-neutral/50'
                  }`}
                >
                  <Icon className="w-4 h-4 text-brand-primary" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <button 
          onClick={() => { window.location.href = '/login'; }}
          className="flex items-center gap-3 px-4 py-3 rounded-xl text-brand-text/70 hover:text-red-600 hover:bg-red-50 text-sm font-bold transition-all mt-8"
        >
          <FiLogOut className="w-4 h-4" />
          Sair do Painel
        </button>
      </aside>

      {/* ==========================================
          ÁREA DE CONTEÚDO DINÂMICO
         ========================================== */}
      <main className="flex-1 p-5 md:p-10 max-w-7xl mx-auto w-full">
        {activeTab === 'produtos' && <ProductsList />}
        {activeTab === 'pedidos' && (
          <div className="py-16 text-center text-brand-text/60 font-sans bg-brand-card border border-brand-text/10 rounded-2xl">
            Aba de Pedidos (Em breve)
          </div>
        )}
        {activeTab === 'geral' && (
          <div className="py-16 text-center text-brand-text/60 font-sans bg-brand-card border border-brand-text/10 rounded-2xl">
            Painel Geral / Métricas (Em breve)
          </div>
        )}
      </main>

    </div>
  );
}