const fs = require('fs');
let code = fs.readFileSync('index.html', 'utf8');

const startListIndex = code.indexOf('{[...recipes].sort((a, b) => (a.isActive === false ? 1 : 0) - (b.isActive === false ? 1 : 0)).map(recipe => {');
const endListIndex = code.indexOf('{/* TAB 4: SIMULASI */}');

if (startListIndex === -1 || endListIndex === -1) {
  console.log('Cannot find indices. start:', startListIndex, 'end:', endListIndex);
  process.exit(1);
}

// Find the exact closing tags before TAB 4 to replace up to there
const actualEndIndex = code.lastIndexOf('</div>', endListIndex);

const originalList = code.slice(startListIndex, actualEndIndex);

const gridContent = `
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {[...recipes].sort((a, b) => (a.isActive === false ? 1 : 0) - (b.isActive === false ? 1 : 0)).map(recipe => {
                    const hppBahan = calculateRecipeHPP(recipe.id);
                    const hargaJualIdeal = hppBahan / (1 - (recipe.targetMarginPercent / 100));
                    const profitPerPorsi = hargaJualIdeal - hppBahan;
                    const bepPorsi = profitPerPorsi > 0 ? Math.ceil(totalOverheadMonthly / profitPerPorsi) : 0;
                    const maxPortions = calculateMaxPortions(recipe.id);

                    return (
                      <div 
                        key={recipe.id} 
                        onClick={() => setSelectedCostingRecipe(recipe.id)} 
                        className={\`bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden group cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col \${recipe.isActive === false ? 'opacity-75 grayscale-[30%]' : ''}\`}
                      >
                        <div className="w-full aspect-square bg-slate-100 relative overflow-hidden flex items-center justify-center shrink-0 border-b border-slate-100">
                          {recipe.imageUrl ? (
                            <img src={recipe.imageUrl} alt={recipe.menuName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'flex'; }} />
                          ) : (
                            <div className="text-slate-300 flex flex-col items-center">
                              <i className="fas fa-image text-4xl mb-2"></i>
                              <span className="text-sm font-medium">Tanpa Foto</span>
                            </div>
                          )}
                          <div className="text-slate-300 flex flex-col items-center hidden w-full h-full justify-center">
                            <i className="fas fa-image text-4xl mb-2"></i>
                            <span className="text-sm font-medium">Tanpa Foto</span>
                          </div>
                          
                          {/* Badges on image */}
                          <div className="absolute top-3 left-3 flex flex-col gap-2">
                            {recipe.recipeType === 'sub' && (
                              <span className="bg-amber-100/90 backdrop-blur-sm text-amber-700 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider border border-amber-200/50 flex items-center">
                                <i className="fas fa-box-open mr-1"></i> Bahan Setengah Jadi
                              </span>
                            )}
                            {recipe.isActive === false && (
                              <span className="bg-slate-800/90 backdrop-blur-sm text-slate-100 text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider border border-slate-700/50 flex items-center">
                                <i className="fas fa-power-off mr-1"></i> Nonaktif
                              </span>
                            )}
                          </div>
                          <div className="absolute top-3 right-3 flex flex-col gap-2">
                             <span className={\`text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider border backdrop-blur-sm \${maxPortions > 0 ? 'bg-emerald-100/90 text-emerald-700 border-emerald-200/50' : 'bg-rose-100/90 text-rose-700 border-rose-200/50'}\`} title="Berdasarkan stok bahan baku yang tersedia di inventori">
                                <i className="fas fa-boxes mr-1"></i> Est: {maxPortions}
                              </span>
                          </div>
                        </div>

                        <div className="p-4 flex flex-col flex-1">
                          <h3 className="font-bold text-lg text-slate-800 mb-3 truncate group-hover:text-emerald-600 transition-colors" title={recipe.menuName}>{recipe.menuName}</h3>
                          
                          <div className="mt-auto space-y-2">
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">HPP / {recipe.yieldUnit || 'porsi'}</span>
                              <span className="font-bold text-rose-600">{formatRp(hppBahan)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs">
                              <span className="text-slate-500 font-medium">Harga Jual Ideal</span>
                              <span className="font-bold text-slate-700">{formatRp(hargaJualIdeal)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs bg-emerald-50/50 p-1.5 rounded border border-emerald-100 mt-2">
                              <span className="text-emerald-600 font-bold">Profit ({recipe.targetMarginPercent}%)</span>
                              <span className="font-black text-emerald-600">{formatRp(profitPerPorsi)}</span>
                            </div>
                            <div className="flex justify-between items-center text-xs mt-2 border-t border-slate-100 pt-2">
                              <span className="text-slate-400 font-medium">Target BEP</span>
                              <span className="font-bold text-sky-600">{formatNum(bepPorsi)} porsi</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* MODAL EDIT COSTING RECIPE */}
                {selectedCostingRecipe && (
                  (() => {
                    const recipe = recipes.find(r => r.id === selectedCostingRecipe);
                    if (!recipe) return null;
                    const hppBahan = calculateRecipeHPP(recipe.id);
                    const hargaJualIdeal = hppBahan / (1 - (recipe.targetMarginPercent / 100));
                    const profitPerPorsi = hargaJualIdeal - hppBahan;
                    const bepPorsi = profitPerPorsi > 0 ? Math.ceil(totalOverheadMonthly / profitPerPorsi) : 0;
                    const maxPortions = calculateMaxPortions(recipe.id);

                    return (
                      <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-6 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
                        <div className="bg-slate-50 sm:rounded-2xl w-full max-w-7xl min-h-full sm:min-h-0 max-h-[100vh] sm:max-h-[95vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
                          {/* MODAL HEADER */}
                          <div className="bg-white border-b border-slate-200 px-4 sm:px-6 py-4 shrink-0 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 sticky top-0 z-10">
                            <div className="flex items-center gap-4 flex-1 w-full">
                              <div className="flex flex-col items-start gap-1 w-full">
                                <input
                                  type="text"
                                  className="font-black text-xl sm:text-2xl text-slate-800 bg-transparent border border-transparent hover:border-slate-300 focus:border-emerald-500 focus:bg-white outline-none rounded px-2 py-1 w-full transition-colors"
                                  value={recipe.menuName}
                                  onChange={(e) => handleEditMenuName(recipe.id, e.target.value)}
                                  onBlur={() => handleSaveRecipe(recipe.id)}
                                  title="Klik untuk mengubah nama menu"
                                />
                                <div className="flex flex-wrap items-center gap-2 px-2 mt-1">
                                  {recipe.recipeType === 'sub' && (
                                    <span className="bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-amber-200">
                                      <i className="fas fa-box-open mr-1"></i> Bahan Setengah Jadi
                                    </span>
                                  )}
                                  <span className={\`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border \${maxPortions > 0 ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-rose-100 text-rose-700 border-rose-200'}\`} title="Berdasarkan stok bahan baku yang tersedia di inventori">
                                    <i className="fas fa-boxes mr-1"></i> Est. Tersedia: {maxPortions} Porsi
                                  </span>
                                  <button 
                                    onClick={(e) => { e.preventDefault(); handleSaveRecipe(recipe.id, { ...recipe, isActive: recipe.isActive === false ? true : false }); }}
                                    className={\`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border transition-colors \${recipe.isActive !== false ? 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-rose-100 hover:text-rose-700 hover:border-rose-200' : 'bg-slate-200 text-slate-500 border-slate-300 hover:bg-emerald-100 hover:text-emerald-700 hover:border-emerald-200'}\`}
                                    title="Klik untuk mengubah status menu"
                                  >
                                    <i className={\`fas fa-\${recipe.isActive !== false ? 'check-circle' : 'power-off'} mr-1\`}></i> {recipe.isActive !== false ? 'Aktif' : 'Nonaktif'}
                                  </button>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                              <button onClick={() => { if(confirm('Hapus menu ini?')) { handleDeleteRecipe(recipe.id); setSelectedCostingRecipe(null); } }} className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 p-2 rounded-lg transition-colors font-bold flex items-center gap-2">
                                <i className="fas fa-trash-alt"></i> <span className="hidden sm:inline">Hapus Menu</span>
                              </button>
                              <button onClick={() => setSelectedCostingRecipe(null)} className="bg-slate-200 hover:bg-slate-300 text-slate-700 p-2 rounded-lg transition-colors font-bold flex items-center gap-2 px-4">
                                <i className="fas fa-times"></i> Tutup
                              </button>
                            </div>
                          </div>

                          {/* MODAL BODY */}
                          <div className="flex-1 overflow-y-auto">
`;

const innerModalStart = originalList.indexOf('<div className="grid grid-cols-1 xl:grid-cols-2 bg-white">');
const innerModalEnd = originalList.lastIndexOf('</details>');

if (innerModalStart === -1 || innerModalEnd === -1) {
  console.log('Cannot find inner details block. Start:', innerModalStart, 'End:', innerModalEnd);
  process.exit(1);
}

const modalBody = originalList.slice(innerModalStart, innerModalEnd);

const replacement = gridContent + modalBody + `
                          </div>
                        </div>
                      </div>
                    );
                  })()
                )}
`;

code = code.substring(0, startListIndex) + replacement + code.substring(actualEndIndex);
fs.writeFileSync('index.html', code);
console.log('Success');
