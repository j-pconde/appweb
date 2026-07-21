import { useState, useEffect } from 'react';
import type { Model } from './ProductsList';
import { FiArrowLeft, FiSave, FiTrash2 } from 'react-icons/fi';

const API_URL = 'http://localhost:3333';

// 1. Definição da ordem desejada dos tamanhos fixos
const TAMANHOS_PERMITIDOS = ['G1', 'GG', 'G', 'M', 'P'];

// Função auxiliar para ordenar os tamanhos com base na ordem de referência
function ordenarTamanhos(lista: string[]): string[] {
  return [...lista].sort((a, b) => {
    const indexA = TAMANHOS_PERMITIDOS.indexOf(a);
    const indexB = TAMANHOS_PERMITIDOS.indexOf(b);
    
    // Se algum tamanho não estiver na lista permitida, joga para o final
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;
    
    return indexA - indexB;
  });
}

interface ProductDetailsProps {
  model: Model;
  onBack: () => void;
  onSave: (updatedModel: Model) => void;
}

interface Estampa {
  nome: string; // Ex: "Liso" ou "Floral"
  cores: string[]; // Ex: ["Marrom", "Vermelho"]
}

export function ProductDetails({ model, onBack }: ProductDetailsProps) {
  console.log("DADOS DO MODELO RECEBIDOS NO COMPONENTE:", model);

  // Lista de chaves desativadas/excluídas no formato "Tamanho-Estampa-Cor"
  const [combinacoesDesativadas, setCombinacoesDesativadas] = useState<string[]>([]);
  const [nome, setNome] = useState(model.nome);
  const [description, setDescription] = useState(model.description || '');
  const [price, setPrice] = useState<number>(model.price || 79.90);
  const [categoryId, setCategoryId] = useState(model.categoryId || '');
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);

  // 1. Controle de Tamanhos (Iniciado já ordenado e filtrando inativos)
  const [tamanhos, setTamanhos] = useState<string[]>(() => {
    if (model.variants && model.variants.length > 0) {
      const tamanhosAtivos = model.variants
        .filter(v => {
          const activeValue = v.active as any;
          const isInactive = activeValue === false || activeValue === 0 || activeValue === "0" || v.stock === null;
          return !isInactive;
        })
        .map(v => v.size);
      return ordenarTamanhos(Array.from(new Set(tamanhosAtivos)));
    }
    const fallbacks = model.tamanhos && model.tamanhos.length ? model.tamanhos : ['P', 'M', 'G'];
    return ordenarTamanhos(fallbacks);
  });
  const [novoTamanho, setNovoTamanho] = useState('');

  // 2. Controle de Estampas e suas respectivas cores
  const [estampas, setEstampas] = useState<Estampa[]>(() => {
    if (model.variants && model.variants.length > 0) {
      const mapaEstampas: { [nome: string]: Set<string> } = {};
      
      model.variants.forEach(v => {
        const activeValue = v.active as any;
        const isInactive = activeValue === false || activeValue === 0 || activeValue === "0" || v.stock === null;
        if (isInactive) return;

        const nomeEstampa = v.estampa || 'Liso';
        if (!mapaEstampas[nomeEstampa]) {
          mapaEstampas[nomeEstampa] = new Set<string>();
        }
        if (v.color) {
          mapaEstampas[nomeEstampa].add(v.color);
        }
      });

      return Object.entries(mapaEstampas).map(([nome, coresSet]) => ({
        nome,
        cores: Array.from(coresSet)
      }));
    }

    const coresIniciais = model.cores && model.cores.length ? model.cores : ['Preto', 'Branco'];
    return [{ nome: 'Liso', cores: coresIniciais }];
  });
  const [novaEstampaNome, setNovaEstampaNome] = useState('');
  const [novaCorNome, setNovaCorNome] = useState<{ [estampaNome: string]: string }>({});

  // 3. Estrutura de Estoque Hierárquica
  const [gradeHierarquica, setGradeHierarquica] = useState<{ [key: string]: number }>(() => {
    const inicial: { [key: string]: number } = {};

    if (model.variants && model.variants.length > 0) {
      model.variants.forEach(v => {
        const activeValue = v.active as any;
        const isInactive = activeValue === false || activeValue === 0 || activeValue === "0" || v.stock === null;
        if (isInactive) return;

        const estampa = v.estampa || 'Liso';
        const chave = `${v.size}-${estampa}-${v.color}`;
        inicial[chave] = v.stock;
      });
      return inicial;
    }

    const tList = model.tamanhos && model.tamanhos.length ? model.tamanhos : ['P', 'M', 'G'];
    const cList = model.cores && model.cores.length ? model.cores : ['Preto', 'Branco'];
    
    tList.forEach(t => {
      cList.forEach(c => {
        inicial[`${t}-Liso-${c}`] = model.grade ? (model.grade[`${c}-${t}`] || 0) : 0;
      });
    });
    return inicial;
  });

  // Sincronizar dados iniciais e categorias ao abrir o componente
  useEffect(() => {
    if (!model) return;
    
    async function loadCategories() {
      try {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Erro na comunicação com o servidor');
        const data = await response.json();
        const categoriesList = Array.isArray(data) ? data : data.categories || [];
        setCategories(categoriesList);
      } catch (error) {
        console.error("Erro ao carregar categorias com fetch:", error);
      }
    }

    loadCategories();

    setNome(model.nome);
    setPrice(model.price || 79.90);
    setCategoryId(model.categoryId || '');
    setDescription(model.description || '');

    if (model.variants && model.variants.length > 0) {
      const tamanhosDoBanco = new Set<string>();
      const mapaEstampas: { [nome: string]: Set<string> } = {};
      const novaGrade: { [key: string]: number } = {};
      const desativadasNestaSessao: string[] = [];

      model.variants.forEach(v => {
        const nomeEstampa = v.estampa || 'Liso';
        const chave = `${v.size}-${nomeEstampa}-${v.color}`;

        const activeValue = v.active as any;
        const isInactive = activeValue === false || activeValue === 0 || activeValue === "0" || v.stock === null;

        if (isInactive) {
          desativadasNestaSessao.push(chave);
          novaGrade[chave] = v.stock ?? 0;
          return;
        }

        tamanhosDoBanco.add(v.size);
        if (!mapaEstampas[nomeEstampa]) {
          mapaEstampas[nomeEstampa] = new Set<string>();
        }
        if (v.color) {
          mapaEstampas[nomeEstampa].add(v.color);
        }

        novaGrade[chave] = v.stock ?? 0;
      });

      if (tamanhosDoBanco.size === 0) {
        setTamanhos(ordenarTamanhos(['P', 'M', 'G']));
        setEstampas([{ nome: 'Liso', cores: ['Preto', 'Branco'] }]);
      } else {
        setTamanhos(ordenarTamanhos(Array.from(tamanhosDoBanco)));
        
        const novasEstampas = Object.entries(mapaEstampas).map(([nome, coresSet]) => ({
          nome,
          cores: Array.from(coresSet)
        }));
        setEstampas(novasEstampas);
      }

      setGradeHierarquica(novaGrade);
      setCombinacoesDesativadas(desativadasNestaSessao);

    } else {
      const tList = model.tamanhos && model.tamanhos.length ? model.tamanhos : ['P', 'M', 'G'];
      const cList = model.cores && model.cores.length ? model.cores : ['Preto', 'Branco'];
      
      setTamanhos(ordenarTamanhos(tList));
      setEstampas([{ nome: 'Liso', cores: cList }]);
      
      const inicial: { [key: string]: number } = {};
      tList.forEach(t => {
        cList.forEach(c => {
          inicial[`${t}-Liso-${c}`] = model.grade ? (model.grade[`${c}-${t}`] || 0) : 0;
        });
      });
      setGradeHierarquica(inicial);
      setCombinacoesDesativadas([]);
    }
  }, [model]);

  // Adicionar Tamanho (Ordenação automática ao inserir)
  const handleAddTamanho = (e: React.FormEvent) => {
    e.preventDefault();
    const t = novoTamanho.trim();
    if (t && !tamanhos.includes(t)) {
      setTamanhos(prev => ordenarTamanhos([...prev, t]));
      setNovoTamanho('');
    }
  };

  // Remover Tamanho
  const handleRemoveTamanho = (t: string) => {
    setTamanhos(tamanhos.filter(item => item !== t));
    const novaGrade = { ...gradeHierarquica };
    Object.keys(novaGrade).forEach(key => {
      if (key.startsWith(`${t}-`)) delete novaGrade[key];
    });
    setGradeHierarquica(novaGrade);
  };

  // Adicionar Estampa
  const handleAddEstampa = (e: React.FormEvent) => {
    e.preventDefault();
    const nomeEstampa = novaEstampaNome.trim();
    if (nomeEstampa && !estampas.some(est => est.nome.toLowerCase() === nomeEstampa.toLowerCase())) {
      setEstampas([...estampas, { nome: nomeEstampa, cores: [] }]);
      setNovaEstampaNome('');
    }
  };

  // Remover Estampa
  const handleRemoveEstampa = (nomeEstampa: string) => {
    if (estampas.length === 1) {
      alert('O modelo deve conter pelo menos uma estampa.');
      return;
    }
    setEstampas(estampas.filter(est => est.nome !== nomeEstampa));

    const novaGrade = { ...gradeHierarquica };
    Object.keys(novaGrade).forEach(key => {
      const parts = key.split('-');
      if (parts[1] === nomeEstampa) {
        delete novaGrade[key];
      }
    });
    setGradeHierarquica(novaGrade);
  };

  // Adicionar Cor à Estampa
  const handleAddCorToEstampa = (estampaNome: string) => {
    const cor = novaCorNome[estampaNome]?.trim();
    if (!cor) return;

    setEstampas(prev => prev.map(est => {
      if (est.nome === estampaNome && !est.cores.includes(cor)) {
        return { ...est, cores: [...est.cores, cor] };
      }
      return est;
    }));
    setNovaCorNome(prev => ({ ...prev, [estampaNome]: '' }));
  };

  // Remover Cor da Estampa
  const handleRemoveCorFromEstampa = (estampaNome: string, corNome: string) => {
    setEstampas(prev => prev.map(est => {
      if (est.nome === estampaNome) {
        return { ...est, cores: est.cores.filter(c => c !== corNome) };
      }
      return est;
    }));

    const novaGrade = { ...gradeHierarquica };
    Object.keys(novaGrade).forEach(key => {
      if (key.includes(`-${estampaNome}-${corNome}`)) delete novaGrade[key];
    });
    setGradeHierarquica(novaGrade);
  };

  const handleQtyChangeHierarquica = (tamanho: string, estampa: string, cor: string, qty: number) => {
    const chave = `${tamanho}-${estampa}-${cor}`;
    setGradeHierarquica(prev => ({
      ...prev,
      [chave]: Math.max(0, qty)
    }));
  };

  // Salvar no Banco
  const handleSalvar = async () => {
    try {
      setSaving(true);
      const variantsList: { size: string; estampa: string; color: string; stock: number; active: boolean }[] = [];

      tamanhos.forEach(t => {
        estampas.forEach(est => {
          est.cores.forEach(c => {
            const chave = `${t}-${est.nome}-${c}`;
            const isExcluida = combinacoesDesativadas.includes(chave);
            
            variantsList.push({
              size: t,
              estampa: est.nome,
              color: c,
              stock: gradeHierarquica[chave] ?? 0,
              active: !isExcluida
            });
          });
        });
      });

      const precoValido = Number(price) > 0 ? Number(price) : 79.90;

      const response = await fetch(`${API_URL}/products/${model.id}/grid`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nome,
          price: precoValido,
          categoryId: categoryId || undefined,
          variants: variantsList,
          description,
        }),
      });

      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || `Erro do servidor (${response.status})`);
      }

      alert('Produto salvo com sucesso!');
      onBack();

    } catch (err: any) {
      alert(`Erro ao salvar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // Filtra as opções que ainda podem ser adicionadas
  const tamanhosDisponiveisParaAdicionar = TAMANHOS_PERMITIDOS.filter(
    t => !tamanhos.includes(t)
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 text-brand-text font-sans">
      
      {/* Voltar */}
      <div className="flex items-center justify-between">
        <button 
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-heading font-bold text-brand-text/50 hover:text-brand-text transition-all"
        >
          <FiArrowLeft className="w-4 h-4" />
          Voltar para Lista de Modelos
        </button>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-heading font-light tracking-tight text-brand-text">Configuração de Produto</h1>
          <p className="text-xs text-brand-text/50 mt-1">Configure estampas, tamanhos e estoque de forma hierárquica.</p>
        </div>
        
        <button 
          onClick={handleSalvar}
          disabled={saving}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-primary hover:bg-brand-hover text-white font-heading font-bold text-xs rounded-xl transition-all shadow-xs disabled:opacity-50"
        >
          <FiSave className="w-4 h-4" />
          {saving ? 'Sincronizando...' : 'Salvar Especificações'}
        </button>
      </div>

      {/* CARD 1: INFORMAÇÕES BÁSICAS */}
      <div className="bg-brand-card border border-brand-text/10 shadow-xs rounded-2xl p-6 space-y-5">
        <h3 className="text-sm font-heading font-bold text-brand-text uppercase tracking-wider">Informações Básicas</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-heading font-bold text-brand-text/60">Nome do Produto</label>
            <input 
              type="text" 
              value={nome}
              onChange={(e) => setNome(e.target.value)}
              className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-xs font-heading font-bold text-brand-text/60">Preço Sugerido (R$)</label>
            <input 
              type="number" 
              value={price}
              onChange={(e) => setPrice(parseFloat(e.target.value) || 0)}
              className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary focus:ring-1 focus:ring-brand-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="block text-xs font-heading font-bold text-brand-text/60">Categoria do Produto</label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-3 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
            >
              <option value="">Selecione uma categoria...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2 space-y-1.5">
            <label className="block text-xs font-heading font-bold text-brand-text/60">Descrição Comercial</label>
            <textarea 
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-brand-neutral border border-brand-text/10 rounded-xl px-4 py-2.5 text-sm text-brand-text focus:outline-none focus:border-brand-primary resize-none"
            />
          </div>
        </div>
      </div>

      {/* CARD 2: ATRIBUTOS DE GRADE (TAMANHOS E ESTAMPAS) */}
      <div className="bg-brand-card border border-brand-text/10 shadow-xs rounded-2xl p-6 space-y-6">
        <h3 className="text-sm font-heading font-bold text-brand-text uppercase tracking-wider">Atributos de Grade</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Gerenciar Tamanhos - Seleção fixa ordenada */}
          <div className="md:col-span-1 space-y-3 border-r border-brand-text/10 pr-4">
            <label className="block text-xs font-heading font-bold text-brand-text/60">1. Tamanhos Ativos</label>
            
            <form onSubmit={handleAddTamanho} className="flex gap-2">
              <select
                value={novoTamanho}
                onChange={(e) => setNovoTamanho(e.target.value)}
                className="flex-1 bg-brand-neutral border border-brand-text/10 rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
              >
                <option value="">Selecione um tamanho...</option>
                {tamanhosDisponiveisParaAdicionar.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button 
                type="submit" 
                disabled={!novoTamanho}
                className="px-3 bg-brand-neutral hover:bg-brand-neutral/80 border border-brand-text/10 rounded-xl text-xs font-heading font-bold text-brand-text disabled:opacity-50 transition-all"
              >
                + Add
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 pt-2">
              {tamanhos.map(t => (
                <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-neutral border border-brand-text/10 rounded-lg text-xs font-heading font-bold text-brand-text">
                  {t}
                  <button type="button" onClick={() => handleRemoveTamanho(t)} className="text-brand-text/40 hover:text-red-500 transition-colors">
                    <FiTrash2 className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Gerenciar Estampas e suas Cores */}
          <div className="md:col-span-2 space-y-4">
            <label className="block text-xs font-heading font-bold text-brand-text/60">2. Estampas</label>
            
            <form onSubmit={handleAddEstampa} className="flex gap-2 max-w-md">
              <input 
                type="text" 
                placeholder="Ex: Floral, Xadrez, Lisa..."
                value={novaEstampaNome}
                onChange={(e) => setNovaEstampaNome(e.target.value)}
                className="flex-1 bg-brand-neutral border border-brand-text/10 rounded-xl px-3 py-2 text-sm text-brand-text focus:outline-none focus:border-brand-primary"
              />
              <button type="submit" className="px-4 bg-brand-primary text-white hover:bg-brand-hover rounded-xl text-xs font-heading font-bold transition-all">
                Adicionar Estampa
              </button>
            </form>

            <div className="space-y-4 pt-2">
              {estampas.map((est, indexEstampa) => (
                <div key={indexEstampa} className="bg-brand-neutral/40 p-4 rounded-xl border border-brand-text/5 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <input
                      type="text"
                      defaultValue={est.nome}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') e.currentTarget.blur();
                      }}
                      onBlur={(e) => {
                        const novoNome = e.target.value.trim();
                        if (!novoNome || novoNome === est.nome) return;

                        setEstampas(prev => prev.map((item, idx) => {
                          if (idx === indexEstampa) return { ...item, nome: novoNome };
                          return item;
                        }));

                        setGradeHierarquica(prev => {
                          const novaG = { ...prev };
                          Object.keys(novaG).forEach(key => {
                            const [t, estampaNome, c] = key.split('-');
                            if (estampaNome === est.nome) {
                              novaG[`${t}-${novoNome}-${c}`] = novaG[key];
                              delete novaG[key];
                            }
                          });
                          return novaG;
                        });
                      }}
                      className="text-xs font-heading font-bold text-brand-text uppercase tracking-wider bg-transparent border-b border-brand-text/30 hover:border-brand-text focus:border-brand-primary focus:outline-none py-0.5 px-1"
                    />

                    <button 
                      type="button" 
                      onClick={() => handleRemoveEstampa(est.nome)}
                      className="text-xs font-heading font-bold text-red-500 hover:text-red-600 transition-colors"
                    >
                      Excluir Estampa
                    </button>
                  </div>

                  <div className="flex gap-2 max-w-sm">
                    <input 
                      type="text" 
                      placeholder={`Adicionar cor para ${est.nome}`}
                      value={novaCorNome[est.nome] || ''}
                      onChange={(e) => setNovaCorNome({ ...novaCorNome, [est.nome]: e.target.value })}
                      className="flex-1 bg-brand-card border border-brand-text/10 rounded-lg px-2.5 py-1.5 text-xs text-brand-text focus:outline-none focus:border-brand-primary"
                    />
                    <button 
                      type="button"
                      onClick={() => handleAddCorToEstampa(est.nome)}
                      className="px-3 py-1.5 bg-brand-neutral hover:bg-brand-neutral/80 border border-brand-text/10 rounded-lg text-xs font-heading font-bold text-brand-text transition-all"
                    >
                      + Cor
                    </button>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {est.cores.map((cor, indexCor) => (
                      <span key={indexCor} className="inline-flex items-center gap-1.5 px-2 py-1 bg-brand-card border border-brand-text/10 rounded-md text-[11px] font-semibold text-brand-text">
                        <input
                          type="text"
                          defaultValue={cor}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') e.currentTarget.blur();
                          }}
                          onBlur={(e) => {
                            const novoNomeCor = e.target.value.trim();
                            if (!novoNomeCor || novoNomeCor === cor) return;

                            setEstampas(prev => prev.map(item => {
                              if (item.nome === est.nome) {
                                const novasCores = [...item.cores];
                                novasCores[indexCor] = novoNomeCor;
                                return { ...item, cores: novasCores };
                              }
                              return item;
                            }));

                            setGradeHierarquica(prev => {
                              const novaG = { ...prev };
                              Object.keys(novaG).forEach(key => {
                                const [t, estampaNome, c] = key.split('-');
                                if (estampaNome === est.nome && c === cor) {
                                  novaG[`${t}-${estampaNome}-${novoNomeCor}`] = novaG[key];
                                  delete novaG[key];
                                }
                              });
                              return novaG;
                            });
                          }}
                          className="bg-transparent focus:outline-none focus:bg-brand-neutral/40 max-w-20 text-center font-bold text-brand-text"
                        />
                        <button type="button" onClick={() => handleRemoveCorFromEstampa(est.nome, cor)} className="text-brand-text/40 hover:text-red-500 font-bold transition-colors">
                          &times;
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

{/* CARD 4: ESTOQUE EM LISTA HIERÁRQUICA */}
<div className="bg-brand-card border border-brand-text/10 shadow-xs rounded-2xl overflow-hidden">
  <div className="p-6 border-b border-brand-text/10 flex items-center justify-between">
    <div>
      <h3 className="font-heading font-bold text-brand-text text-sm uppercase tracking-wider">Estoque por Hierarquia</h3>
      <p className="text-xs text-brand-text/50 mt-0.5">Defina a quantidade de estoque físico por variação.</p>
    </div>
  </div>

  {/* ========================================== */}
  {/* VISÃO DESKTOP: TABELA (Oculta no Mobile)   */}
  {/* ========================================== */}
  <div className="hidden md:block overflow-x-auto">
    <table className="w-full text-left border-collapse">
      <thead className="bg-brand-neutral/50 text-[10px] uppercase font-bold text-brand-text/50">
        <tr>
          <th className="px-6 py-3">Tamanho</th>
          <th className="px-6 py-3">Estampa</th>
          <th className="px-6 py-3">Cor</th>
          <th className="px-6 py-3 text-center">Quantidade</th>
          <th className="px-6 py-3 text-center">Ações</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-brand-text/10">
        {tamanhos.flatMap(tamanho => 
          estampas.flatMap(estampa => 
            estampa.cores
              .filter(cor => !combinacoesDesativadas.includes(`${tamanho}-${estampa.nome}-${cor}`))
              .map(cor => {
                const chave = `${tamanho}-${estampa.nome}-${cor}`;
                const valor = gradeHierarquica[chave] || 0;
                
                return (
                  <tr key={chave} className="text-xs hover:bg-brand-neutral/30 transition-colors">
                    <td className="px-6 py-3 font-extrabold text-brand-primary">{tamanho}</td>
                    <td className="px-6 py-3 text-brand-text">{estampa.nome}</td>
                    <td className="px-6 py-3 text-brand-text">{cor}</td>
                    <td className="px-6 py-3">
                      <input 
                        type="number"
                        min="0"
                        value={valor}
                        onChange={(e) => handleQtyChangeHierarquica(tamanho, estampa.nome, cor, parseInt(e.target.value) || 0)}
                        className="w-16 mx-auto block bg-white border border-brand-text/10 rounded-lg px-2 py-1 text-center font-bold text-brand-text focus:border-brand-primary focus:outline-none"
                      />
                    </td>
                    <td className="px-6 py-3 text-center">
                      <button 
                        type="button"
                        onClick={() => setCombinacoesDesativadas(prev => [...prev, chave])} 
                        className="text-brand-text/30 hover:text-red-500 transition-colors p-1"
                      >
                        <FiTrash2 className="w-4 h-4 mx-auto" />
                      </button>
                    </td>
                  </tr>
                );
              })
          )
        )}
      </tbody>
    </table>
  </div>

  {/* ========================================== */}
  {/* VISÃO MOBILE: CARDS (Oculta no Desktop)    */}
  {/* ========================================== */}
  <div className="block md:hidden p-6 space-y-8">
    {tamanhos.map(tamanho => {
      const estampasParaExibir = estampas.map(est => {
        const coresAtivas = est.cores.filter(cor => !combinacoesDesativadas.includes(`${tamanho}-${est.nome}-${cor}`));
        return { ...est, cores: coresAtivas };
      }).filter(est => est.cores.length > 0);

      const variacoesOcultas = estampas.flatMap(est => 
        est.cores
          .filter(cor => combinacoesDesativadas.includes(`${tamanho}-${est.nome}-${cor}`))
          .map(cor => ({ estampa: est.nome, cor }))
      );

      return (
        <div key={tamanho} className="border border-brand-text/10 rounded-2xl bg-brand-neutral/20 overflow-hidden">
          {/* Header do Tamanho com Seletor de Reativação */}
          <div className="bg-brand-neutral px-6 py-3 border-b border-brand-text/10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-[10px] font-heading font-bold text-brand-text/50 uppercase tracking-widest">Tamanho</span>
              <span className="px-3 py-1 bg-brand-primary text-white text-xs font-extrabold rounded-lg shadow-sm">{tamanho}</span>
            </div>

            {variacoesOcultas.length > 0 && (
              <select
                onChange={(e) => {
                  const valorSelect = e.target.value;
                  if (!valorSelect) return;
                  setCombinacoesDesativadas(prev => prev.filter(c => c !== valorSelect));
                  setGradeHierarquica(prev => ({ ...prev, [valorSelect]: 0 }));
                }}
                className="text-[11px] font-heading font-bold text-brand-primary bg-white border border-brand-primary/20 rounded-lg px-3 py-1.5 cursor-pointer hover:bg-brand-primary/5 transition-all"
              >
                <option value="">+ Reativar Variação</option>
                {variacoesOcultas.map(v => (
                  <option key={`${tamanho}-${v.estampa}-${v.cor}`} value={`${tamanho}-${v.estampa}-${v.cor}`}>
                    {v.estampa} - {v.cor}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="p-6 space-y-6">
            {estampasParaExibir.map(estampa => (
              <div key={estampa.nome} className="space-y-3">
                {/* Badge da Estampa */}
                <div className="flex items-center gap-2">
                  <div className="h-px flex-1 bg-brand-text/10" />
                  <span className="px-3 py-1 bg-brand-text/5 text-[10px] font-bold uppercase tracking-wider text-brand-text/60 rounded-full">
                    Estampa: {estampa.nome}
                  </span>
                  <div className="h-px flex-1 bg-brand-text/10" />
                </div>

                {/* Lista vertical de cores (uma embaixo da outra) */}
                <div className="flex flex-col gap-3">
                  {estampa.cores.map(cor => {
                    const chave = `${tamanho}-${estampa.nome}-${cor}`;
                    const valor = gradeHierarquica[chave] || 0;

                    return (
                      <div key={cor} className="bg-white border border-brand-text/10 p-3 rounded-xl shadow-2xs flex flex-col gap-2 hover:border-brand-primary/30 transition-all">
                        {/* Visual Path (Breadcrumb) */}
                        <div className="flex items-center gap-1.5 text-[9px] font-bold uppercase text-brand-text/30">
                          <span>{tamanho}</span>
                          <span>/</span>
                          <span>{estampa.nome}</span>
                          <span>/</span>
                          <span className="text-brand-primary">{cor}</span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-brand-text">{cor}</span>
                          <div className="flex items-center gap-2">
                            <input 
                              type="number"
                              min="0"
                              value={valor}
                              onChange={(e) => handleQtyChangeHierarquica(tamanho, estampa.nome, cor, parseInt(e.target.value) || 0)}
                              className="w-16 bg-brand-neutral/50 border border-brand-text/10 rounded-lg px-2 py-1 text-center text-xs font-bold text-brand-text focus:border-brand-primary focus:outline-none"
                            />
                            <button
                              type="button"
                              onClick={() => setCombinacoesDesativadas(prev => [...prev, chave])}
                              className="text-brand-text/20 hover:text-red-500 transition-colors p-1"
                            >
                              <FiTrash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
    })}
  </div>
</div>

    </div>
  );
}