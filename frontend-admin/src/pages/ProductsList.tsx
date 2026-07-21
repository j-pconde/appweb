import { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiSearch } from 'react-icons/fi';
import { ProductDetails } from './ProductDetails';

const API_URL = 'http://localhost:3333';

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  estampa: string;
  color: string;
  stock: number;
  productId: string;
  price: number;
  active: boolean;
}

export interface Model {
  id: string;
  nome: string; 
  price: number;
  categoryId: string;
  tamanhos: string[]; 
  cores: string[];    
  grade: { [key: string]: number }; 
  description?: string; 
  variants?: ProductVariant[]; 
}

interface Category {
  id: string;
  name: string;
}

export function ProductsList() {
  const [selectedModel, setSelectedModel] = useState<Model | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [newModelName, setNewModelName] = useState('');
  const [newModelPrice, setNewModelPrice] = useState<number>(0);
  const [selectedCategory, setSelectedCategory] = useState('00000000-0000-0000-0000-000000000000');
  const [showAddModal, setShowAddModal] = useState(false);
  
  const [modelos, setModelos] = useState<Model[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) throw new Error('Erro ao buscar produtos');
      const data = await response.json();

      // Blindagem: Garante que os dados sejam sempre um Array antes do .map()
      const prodArray = Array.isArray(data) ? data : (data.products || []);

      const formattedModels: Model[] = prodArray.map((prod: any) => {
        const coresSet = new Set<string>();
        const tamanhosSet = new Set<string>();
        const grade: { [key: string]: number } = {};

        if (Array.isArray(prod.variants)) {
          prod.variants.forEach((v: any) => {
            if (v.active !== false) {
              coresSet.add(v.color || '');
              tamanhosSet.add(v.size || '');
              grade[`${v.color}-${v.size}`] = v.stock || 0;
            }
          });
        }
        return {
          id: prod.id,
          nome: prod.name || 'Sem Nome',
          cores: Array.from(coresSet),
          tamanhos: Array.from(tamanhosSet),
          grade,
          categoryId: prod.categoryId || '',
          price: prod.price || 0,
          description: prod.description || '',
          variants: prod.variants || [] 
        };
      });

      setModelos(formattedModels);
    } catch (err) {
      console.error(err);
      alert('Não foi possível carregar os produtos do servidor.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch(`${API_URL}/categories`);
      if (response.ok) {
        const data = await response.json();
        // Blindagem: Impede que categories vire um objeto e quebre o app
        const catArray = Array.isArray(data) ? data : (data.categories || []);
        setCategories(catArray);
        if (catArray.length > 0) setSelectedCategory(catArray[0].id);
      }
    } catch (err) {
      console.warn('Rota de categorias indisponível. Usando categoria padrão fictícia.');
      const uuidPadrao = '00000000-0000-0000-0000-000000000000';
      setCategories([{ id: uuidPadrao, name: 'Geral' }]);
      setSelectedCategory(uuidPadrao);
    }
  };

  const handleCreateModel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newModelName.trim() || !selectedCategory) {
      alert("Por favor, preencha o nome do modelo e selecione uma categoria válida.");
      return;
    }

    try {
      const precoTratado = Number(newModelPrice) > 0 ? Number(newModelPrice) : 79.90;

      const payload = {
        name: newModelName.trim(),
        price: precoTratado, 
        categoryId: selectedCategory,
        description: 'Modelo gerado pelo painel Piscallo.',
        variants: [] 
      };

      const response = await fetch(`${API_URL}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      
      let responseData: any = {};
      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { error: responseText };
        }
      }

      if (!response.ok) {
        console.error("Erro detalhado do Backend:", responseData);
        throw new Error(responseData.error || responseData.message || `Erro do servidor (${response.status})`);
      }

      const createdProduct = responseData;

      const novo: Model = {
        id: createdProduct.id,
        nome: createdProduct.name,
        tamanhos: ['P', 'M', 'G'], 
        cores: ['Preto', 'Branco'], 
        grade: {},
        categoryId: createdProduct.categoryId,
        price: Number(createdProduct.price) || precoTratado,
        description: createdProduct.description || '',
        variants: [] 
      };

      // Garante que modelos seja tratado como array no state update
      setModelos(prev => Array.isArray(prev) ? [novo, ...prev] : [novo]);
      setNewModelName('');
      setNewModelPrice(0);
      setShowAddModal(false);
      setSelectedModel(novo); 
    } catch (err: any) {
      alert(`Falha ao registrar modelo: ${err.message}`);
    }
  };

  const handleDeleteModel = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Tem certeza que deseja excluir permanentemente este modelo e todo o seu estoque no banco de dados?')) {
      try {
        const response = await fetch(`${API_URL}/products/${id}`, {
          method: 'DELETE',
        });

        if (!response.ok) throw new Error('Erro ao deletar modelo');

        setModelos(prev => (Array.isArray(prev) ? prev.filter(m => m.id !== id) : []));
      } catch (err) {
        alert('Erro ao excluir do servidor.');
      }
    }
  };

  if (selectedModel) {
    return (
      <ProductDetails 
        model={selectedModel} 
        onBack={() => {
          setSelectedModel(null);
          fetchProducts(); 
        }} 
        onSave={async () => {
          setSelectedModel(null);
          fetchProducts();
        }}
      />
    );
  }

  // Blindagem na filtragem
  const safeModelos = Array.isArray(modelos) ? modelos : [];
  const filteredModelos = safeModelos.filter(m => {
    const nomeModelo = m?.nome || '';
    return nomeModelo.toLowerCase().includes((searchTerm || '').toLowerCase());
  });

  return (
    <div className="space-y-6 font-sans text-brand-text">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-heading font-light tracking-tight text-brand-text">Lista de Modelos</h1>
          <p className="text-sm text-brand-text/60">Gerencie modelos e o estoque da confecção em tempo real.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center justify-center gap-2 px-5 py-3 md:py-2.5 bg-brand-primary hover:bg-brand-hover text-white font-heading font-bold text-sm rounded-xl transition-all shadow-xs min-h-11 md:min-h-9"
        >
          <FiPlus className="w-4 h-4" />
          Criar Novo Modelo
        </button>
      </div>

      {/* Caixa de Busca */}
      <div className="bg-brand-card p-4 rounded-2xl border border-brand-text/10 shadow-xs flex items-center gap-3">
        <FiSearch className="text-brand-text/40 w-5 h-5" />
        <input 
          type="text" 
          placeholder="Buscar modelo..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="bg-transparent w-full focus:outline-none text-base md:text-sm text-brand-text placeholder-brand-text/40"
        />
      </div>

      {/* Conteúdo de Modelos */}
      {loading ? (
        <div className="text-center py-12 text-brand-text/60 font-medium">Carregando modelos do banco de dados...</div>
      ) : (
        <div className="space-y-4">
          
          {/* ==========================================
              VISTA MOBILE
             ========================================== */}
          <div className="block md:hidden space-y-3">
            {filteredModelos.map(modelo => {
                const totalUnidades = Object.values(modelo?.grade || {}).reduce((a: any, b: any) => a + b, 0);
                // Blindagem: Garante que categories sempre seja interpretado como array
                const categoria = (categories || []).find(cat => cat.id === modelo.categoryId)?.name || 'Geral';
                
                return (
                  <div 
                    key={modelo.id}
                    onClick={() => setSelectedModel(modelo)}
                    className="bg-brand-card border border-brand-text/10 rounded-2xl p-5 space-y-4 shadow-xs hover:border-brand-primary/50 active:scale-[0.99] transition-all"
                  >
                    <div className="flex justify-between items-start">
                      <div className="space-y-1">
                        <span className="inline-block px-2 py-0.5 bg-brand-neutral text-brand-primary text-[10px] font-heading font-extrabold rounded-md uppercase tracking-wider">
                          {categoria}
                        </span>
                        <h4 className="font-heading font-bold text-brand-text text-base leading-snug">
                          {modelo.nome}
                        </h4>
                      </div>
                      <span className="text-sm font-heading font-extrabold text-brand-text/80 bg-brand-neutral px-2.5 py-1 rounded-lg">
                        R$ {Number(modelo.price || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 bg-brand-neutral/40 p-3 rounded-xl border border-brand-text/5 text-xs">
                      <div>
                        <span className="block text-[9px] font-heading font-bold text-brand-text/40 uppercase tracking-wider">Combinações</span>
                        <span className="font-semibold text-brand-text">
                          {(modelo?.cores || []).length} Cor(es) • {(modelo?.tamanhos || []).length} Tam.
                        </span>
                      </div>
                      <div>
                        <span className="block text-[9px] font-heading font-bold text-brand-text/40 uppercase tracking-wider">Total em Estoque</span>
                        <span className="font-extrabold text-brand-primary">
                          {totalUnidades} un.
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setSelectedModel(modelo)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-3 bg-brand-primary hover:bg-brand-hover text-white text-xs font-heading font-bold rounded-xl transition-all min-h-11"
                      >
                        <FiEdit2 className="w-3.5 h-3.5" />
                        Editar Grade
                      </button>
                      
                      <button
                        onClick={(e) => handleDeleteModel(modelo.id, e)}
                        className="px-4 bg-brand-neutral hover:bg-red-50 text-brand-text/50 hover:text-red-500 border border-brand-text/5 rounded-xl transition-all flex items-center justify-center min-h-11"
                        title="Excluir Modelo"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

          {/* ==========================================
              VISTA DESKTOP
             ========================================== */}
          <div className="hidden md:grid grid-cols-2 gap-4">
            {filteredModelos.map(modelo => {
                const totalUnidades = Object.values(modelo?.grade || {}).reduce((a: any, b: any) => a + b, 0);
                return (
                  <div 
                    key={modelo.id}
                    onClick={() => setSelectedModel(modelo)}
                    className="bg-brand-card p-6 rounded-2xl border border-brand-text/10 shadow-xs hover:shadow-md hover:border-brand-primary/50 transition-all cursor-pointer flex justify-between items-start group"
                  >
                    <div className="space-y-1.5">
                      <h3 className="font-heading font-bold text-lg text-brand-text group-hover:text-brand-primary transition-colors">{modelo.nome}</h3>
                      <p className="text-xs text-brand-text/60">
                        {(modelo?.cores || []).length} Cores • {(modelo?.tamanhos || []).length} Tamanhos
                      </p>
                      <p className="text-sm font-heading font-extrabold text-brand-primary">{totalUnidades} unidades em estoque</p>
                    </div>
                    
                    <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                      <button 
                        onClick={() => setSelectedModel(modelo)}
                        className="p-2 text-brand-text/60 hover:text-brand-primary hover:bg-brand-neutral rounded-lg transition-colors"
                        title="Editar Modelo"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={(e) => handleDeleteModel(modelo.id, e)}
                        className="p-2 text-brand-text/60 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Deletar Modelo"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>

        </div>
      )}

      {/* Modal para Cadastro de Modelo */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateModel} className="bg-brand-card border border-brand-text/10 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
            <h3 className="text-lg font-heading font-bold text-brand-text">Novo Modelo</h3>
            
            <div className="space-y-1.5">
              <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-brand-text/75">Nome do Modelo</label>
              <input 
                type="text" 
                required
                placeholder="Ex: Saia Marrante Plissada"
                value={newModelName}
                onChange={(e) => setNewModelName(e.target.value)}
                className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-base md:text-sm text-brand-text focus:outline-none focus:border-brand-primary"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-brand-text/75">Preço Base (R$)</label>
                <input 
                  type="number" 
                  step="0.01"
                  required
                  placeholder="79.90"
                  value={newModelPrice || ''}
                  onChange={(e) => setNewModelPrice(parseFloat(e.target.value) || 0)}
                  className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-base md:text-sm text-brand-text focus:outline-none focus:border-brand-primary"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-heading font-extrabold uppercase tracking-widest text-brand-text/75">Categoria</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-base md:text-sm text-brand-text focus:outline-none focus:border-brand-primary"
                >
                  {(categories || []).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2.5 border border-brand-text/20 rounded-xl text-xs font-heading font-bold text-brand-text hover:bg-brand-neutral transition-all min-h-11 md:min-h-9"
              >
                Cancelar
              </button>
              <button 
                type="submit"
                className="px-4 py-2.5 bg-brand-primary hover:bg-brand-hover text-white rounded-xl text-xs font-heading font-bold transition-all min-h-11 md:min-h-9"
              >
                Criar & Configurar
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}