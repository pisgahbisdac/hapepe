const fs = require('fs');
let c = fs.readFileSync('index.html', 'utf8');

c = c.replace(
  `    const parseNumberInput = (value) => {
      return parseFloat(String(value).replace(/\\./g, '').replace(',', '.')) || 0;
    };`,
  `    const parseNumberInput = (value) => {
      if (typeof value === 'number') return value;
      if (value === null || value === undefined || value === '') return 0;
      let s = String(value);
      if (s.includes(',')) {
        s = s.replace(/\\./g, '').replace(/,/g, '.');
      }
      const n = parseFloat(s);
      return isNaN(n) ? 0 : n;
    };`
);

c = c.replace(
  `      const handleAddSale = (e) => {
        e.preventDefault();
        const parsedQty = parseNumberInput(newSale.quantitySold);
        if (!newSale.recipeId || parsedQty <= 0) return;

        const recipe = recipes.find(r => String(r.id) === String(newSale.recipeId));
        const menuName = recipe ? recipe.menuName : '';
        const saleData = { id: Date.now(), ...newSale, quantitySold: parsedQty, menuName };
        setSales([...sales, saleData]);
        sendApiRequest('addSale', saleData);
        setNewSale({ ...newSale, recipeId: '', quantitySold: '' });
      };`,
  `      const handleAddSale = (e) => {
        e.preventDefault();
        const parsedQty = parseNumberInput(newSale.quantitySold);
        if (!newSale.recipeId || parsedQty <= 0) return;

        const recipe = recipes.find(r => r.menuName === newSale.recipeId || String(r.id) === String(newSale.recipeId));
        if (!recipe) {
          alert("Menu tidak ditemukan.");
          return;
        }
        const menuName = recipe.menuName;
        const saleData = { id: Date.now(), ...newSale, recipeId: recipe.id, quantitySold: parsedQty, menuName };
        setSales([...sales, saleData]);
        sendApiRequest('addSale', saleData);
        setNewSale({ ...newSale, recipeId: '', quantitySold: '' });
      };`
);

c = c.replace(
  `                      <div>
                        <label className="text-sm font-semibold">Menu Terjual</label>
                        <select className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={newSale.recipeId} onChange={e => setNewSale({ ...newSale, recipeId: e.target.value })} required>
                          <option value="">-- Pilih Menu --</option>
                          {recipes.filter(r => r.recipeType !== 'sub').map(r => (
                            <option key={r.id} value={r.id}>{r.menuName}</option>
                          ))}
                        </select>
                      </div>`,
  `                      <div>
                        <label className="text-sm font-semibold">Menu Terjual</label>
                        <input type="text" list="menu-terjual-list" placeholder="Ketik nama menu..." className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-emerald-500" value={newSale.recipeId} onChange={e => setNewSale({ ...newSale, recipeId: e.target.value })} required />
                        <datalist id="menu-terjual-list">
                          {recipes.filter(r => r.recipeType !== 'sub').map(r => (
                            <option key={r.id} value={r.menuName} />
                          ))}
                        </datalist>
                      </div>`
);

c = c.replace(
  `                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[600px]">`,
  `                <div className="lg:col-span-3 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-[calc(100vh-250px)] min-h-[600px]">`
);

c = c.replace(
  `                  <div className="overflow-x-auto overflow-y-auto max-h-[600px] rounded-lg border border-slate-200 shadow-inner">`,
  `                  <div className="overflow-x-auto overflow-y-auto max-h-[calc(100vh-250px)] min-h-[600px] rounded-lg border border-slate-200 shadow-inner">`
);

fs.writeFileSync('index.html', c);
console.log('Fixed index.html via node script.');
