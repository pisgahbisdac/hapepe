/**
 * FoodCost Pro - Backend Google Apps Script
 * 
 * SETUP INSTRUCTIONS:
 * 1. Create a new Google Spreadsheet at https://sheets.google.com
 * 2. On the menu, click Extensions > Apps Script.
 * 3. Delete the default code (myFunction) and paste this entire code.
 * 4. Select the "setup" function from the dropdown at the top toolbar and click "Run".
 *    (This will create the necessary sheets and columns in your Spreadsheet).
 * 5. Grant the required permissions when Google prompts you (Advanced > Go to script).
 * 6. Click "Deploy" (top right blue button) > "New deployment".
 * 7. Click the gear icon next to "Select type" and choose "Web app".
 * 8. Description: "FoodCost API", Set "Execute as" to "Me", and "Who has access" to "Anyone".
 * 9. Click Deploy and COPY the "Web app URL" provided.
 * 10. Use that URL in your frontend `fetch` calls.
 */

const SHEET_PURCHASES = 'Purchases';
const SHEET_OVERHEAD = 'Overhead';
const SHEET_RECIPES = 'Recipes';
const SHEET_SETTINGS = 'Settings';
const SHEET_SALES = 'Sales';
const SHEET_ADJUSTMENTS = 'Adjustments';
const SHEET_CONVERSIONS = 'Conversions';
const SHEET_USERS = 'Users';
const SHEET_AUDIT = 'AuditTrail';
const SHEET_BUTCHER = 'Butcher';
/**
 * Run this function ONCE to set up the spreadsheet automatically.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Users sheet for User Management
  let usersSheet = ss.getSheetByName(SHEET_USERS);
  if (!usersSheet) {
    usersSheet = ss.insertSheet(SHEET_USERS);
    usersSheet.appendRow(['ID', 'Username', 'Password', 'Role', 'Permissions']);
    usersSheet.getRange("A1:E1").setFontWeight("bold");
    usersSheet.appendRow([new Date().getTime(), 'admin', 'biev1234', 'admin', '[]']);
  }

  // Create Purchases sheet
  let purchasesSheet = ss.getSheetByName(SHEET_PURCHASES);
  if (!purchasesSheet) {
    purchasesSheet = ss.insertSheet(SHEET_PURCHASES);
    purchasesSheet.appendRow(['ID', 'Date', 'ItemName', 'Unit', 'Quantity', 'TotalPrice']);
    purchasesSheet.getRange("A1:F1").setFontWeight("bold");
  }
  
  // Create Overhead sheet
  let overheadSheet = ss.getSheetByName(SHEET_OVERHEAD);
  if (!overheadSheet) {
    overheadSheet = ss.insertSheet(SHEET_OVERHEAD);
    overheadSheet.appendRow(['ID', 'Name', 'Amount']);
    overheadSheet.getRange("A1:C1").setFontWeight("bold");
  }

  // Create Recipes sheet
  let recipesSheet = ss.getSheetByName(SHEET_RECIPES);
  if (!recipesSheet) {
    recipesSheet = ss.insertSheet(SHEET_RECIPES);
    recipesSheet.appendRow(['ID', 'MenuName', 'TargetMarginPercent', 'ImageUrl', 'YieldQty', 'YieldUnit', 'YieldType', 'Bahan 1', 'Qty 1', 'Satuan 1']);
    recipesSheet.getRange("A1:J1").setFontWeight("bold");
  }

  // Create Butcher sheet
  let butcherSheet = ss.getSheetByName(SHEET_BUTCHER);
  if (!butcherSheet) {
    butcherSheet = ss.insertSheet(SHEET_BUTCHER);
    butcherSheet.appendRow(['ID', 'ItemName', 'NetWeight', 'ImageURL', 'Category', 'Details']);
    butcherSheet.getRange("A1:E1").setFontWeight("bold");
  }

  // Create Sales sheet
  let salesSheet = ss.getSheetByName(SHEET_SALES);
  if (!salesSheet) {
    salesSheet = ss.insertSheet(SHEET_SALES);
    salesSheet.appendRow(['ID', 'Date', 'RecipeID', 'QuantitySold', 'MenuName']);
    salesSheet.getRange("A1:D1").setFontWeight("bold");
  }

  // Create Adjustments sheet
  let adjSheet = ss.getSheetByName(SHEET_ADJUSTMENTS);
  if (!adjSheet) {
    adjSheet = ss.insertSheet(SHEET_ADJUSTMENTS);
    adjSheet.appendRow(['ID', 'Date', 'ItemName', 'Quantity', 'Reason']);
    adjSheet.getRange("A1:E1").setFontWeight("bold");
  }

  // Create Conversions sheet
  let convSheet = ss.getSheetByName(SHEET_CONVERSIONS);
  if (!convSheet) {
    convSheet = ss.insertSheet(SHEET_CONVERSIONS);
    convSheet.appendRow(['ItemName', 'PackUnit', 'BaseQty']);
    convSheet.getRange("A1:C1").setFontWeight("bold");
  }

  // Create Audit Trail sheet
  let auditSheet = ss.getSheetByName(SHEET_AUDIT);
  if (!auditSheet) {
    auditSheet = ss.insertSheet(SHEET_AUDIT);
    auditSheet.appendRow(['Timestamp', 'Username', 'Action', 'Details']);
    auditSheet.getRange("A1:D1").setFontWeight("bold");
  }
  
  // Delete the default "Sheet1" if it exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
}

function logAudit(ss, username, action, details) {
  try {
    let sheet = ss.getSheetByName(SHEET_AUDIT);
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_AUDIT);
      sheet.appendRow(['Timestamp', 'Username', 'Action', 'Details']);
      sheet.getRange("A1:D1").setFontWeight("bold");
    }
    const timestamp = new Date().toISOString();
    sheet.appendRow([timestamp, username, action, details]);
  } catch (e) {
    // Ignore logging errors to prevent breaking main flows
  }
}

function verifyUser(ss, inputUsername, inputPassword) {
  let sheet = ss.getSheetByName(SHEET_USERS);
  if (!sheet) {
    // Fallback if setup hasn't run, create default admin
    sheet = ss.insertSheet(SHEET_USERS);
    sheet.appendRow(['ID', 'Username', 'Password', 'Role', 'Permissions']);
    sheet.getRange("A1:E1").setFontWeight("bold");
    sheet.appendRow([new Date().getTime(), 'admin', 'biev1234', 'admin', '[]']);
  }
  
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).trim() === String(inputUsername).trim() && String(data[i][2]).trim() === String(inputPassword).trim()) {
      let permissions = [];
      if (data[i][4]) {
        try { permissions = JSON.parse(data[i][4]); } catch (e) {}
      }
      return { isValid: true, role: data[i][3], permissions: permissions };
    }
  }
  
  return { isValid: false, role: null };
}

/**
 * Handle GET requests (Fetch Initial Data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auth Check
    const username = e && e.parameter ? e.parameter.username : '';
    const password = e && e.parameter ? e.parameter.password : '';
    const authResult = verifyUser(ss, username, password);
    if (!authResult.isValid) {
      return createJsonResponse({ status: 'unauthorized', message: 'Username atau Sandi salah' });
    }
    
    // Read Purchases
    const purchasesData = readSheetData(ss.getSheetByName(SHEET_PURCHASES));
    const purchases = purchasesData.map(row => ({
      id: row.ID,
      date: row.Date,
      itemName: row.ItemName,
      unit: row.Unit,
      quantity: Number(row.Quantity),
      totalPrice: Number(row.TotalPrice)
    }));

    // Read Overhead
    const overheadData = readSheetData(ss.getSheetByName(SHEET_OVERHEAD));
    const overheadCosts = overheadData.map(row => ({
      id: row.ID,
      name: row.Name,
      amount: Number(row.Amount)
    }));

    // Read Recipes (Custom logic for separated columns)
    const recipesSheet = ss.getSheetByName(SHEET_RECIPES);
    const recipesRawData = recipesSheet ? recipesSheet.getDataRange().getValues() : [];
    const recipes = [];
    if (recipesRawData.length > 1) {
      for (let i = 1; i < recipesRawData.length; i++) {
        const row = recipesRawData[i];
        if (!row[0]) continue;
        
        let ingredients = [];
        
        // Cek apakah data lama (JSON string di kolom ke-4/index 3)
        if (String(row[3]).trim().startsWith('[')) {
          try { ingredients = JSON.parse(row[3]); } catch(e){}
          recipes.push({
            id: row[0],
            menuName: row[1],
            targetMarginPercent: Number(row[2]),
            imageUrl: '',
            ingredients: ingredients
          });
          continue;
        }
        
        // Data baru: baca Yield dari kolom E, F, G (index 4, 5, 6)
        if (row[4] !== undefined && row[4] !== '') {
          ingredients.push({
            id: 'META_YIELD',
            qty: row[4],
            unit: row[5] || 'porsi',
            type: row[6] || 'final'
          });
        }
        
        let instructions = '';
        let netWeights = {};
        let realIngIndex = 0;
        // Baca Bahan dari Kolom H dst (index 7, 8, 9, 10, 11, 12...)
        for (let j = 7; j < row.length; j += 3) {
          if (row[j] === 'META_INSTRUCTIONS') {
            instructions = row[j+1] || '';
            if (typeof instructions === 'string' && instructions.trim().startsWith('{')) {
              try { instructions = JSON.parse(instructions); } catch(e) {}
            }
          } else if (row[j] === 'META_NET_WEIGHTS') {
            try { netWeights = JSON.parse(row[j+1]); } catch(e) {}
          } else if (row[j] && String(row[j]).trim() !== '') {
            ingredients.push({
              id: new Date().getTime() + j, // ID sementara untuk UI React
              itemName: row[j],
              quantity: row[j+1],
              unit: row[j+2] || '',
              __origIndex: realIngIndex
            });
            realIngIndex++;
          }
        }
        
        ingredients = ingredients.map(ing => {
          let meta = null;
          if (netWeights && ing.__origIndex !== undefined && netWeights[ing.__origIndex]) {
            meta = netWeights[ing.__origIndex];
          } else if (netWeights && netWeights[ing.itemName]) {
            meta = netWeights[ing.itemName];
          }

          if (meta) {
            ing.netQty = meta.netQty;
            ing.measure = meta.measure;
            ing.category = meta.category;
          }
          delete ing.__origIndex;
          return ing;
        });
        
        recipes.push({
          id: row[0],
          menuName: row[1],
          targetMarginPercent: Number(row[2]),
          imageUrl: row[3] || '',
          ingredients: ingredients,
          instructions: instructions
        });
      }
    }

    const convSheet = ss.getSheetByName(SHEET_CONVERSIONS);
    let conversions = [];
    if (convSheet) {
      conversions = readSheetData(convSheet).map(row => ({
        itemName: row.ItemName,
        packUnit: row.PackUnit,
        baseQty: Number(row.BaseQty)
      }));
    }

    const butcherSheet = ss.getSheetByName(SHEET_BUTCHER);
    let butcherItems = [];
    if (butcherSheet) {
      const headers = butcherSheet.getRange(1, 1, 1, butcherSheet.getLastColumn()).getValues()[0];
        if (headers.indexOf('Category') === -1) {
          butcherSheet.getRange(1, headers.length + 1).setValue('Category');
        }
        if (headers.indexOf('Details') === -1) {
          butcherSheet.getRange(1, butcherSheet.getLastColumn() + 1).setValue('Details');
        }
        butcherItems = readSheetData(butcherSheet).map(row => ({
          id: row.ID,
          itemName: row.ItemName,
          netWeight: row.NetWeight,
          imageUrl: row.ImageURL,
          category: row.Category || 'Bahan Baku & Potongan',
          details: row.Details || ''
        }));
    }

    const response = {
      status: 'success',
      data: {
        purchases: purchases,
        overheadCosts: overheadCosts,
        recipes: recipes,
        sales: readSheetData(ss.getSheetByName(SHEET_SALES)).map(row => ({
          id: row.ID,
          date: row.Date,
          recipeId: row.RecipeID,
          quantitySold: Number(row.QuantitySold)
        })),
        adjustments: readSheetData(ss.getSheetByName(SHEET_ADJUSTMENTS)).map(row => ({
          id: row.ID,
          date: row.Date,
          itemName: row.ItemName,
          quantity: Number(row.Quantity),
          reason: row.Reason
        })),
        conversions: conversions,
        butcherItems: butcherItems
      }
    };
    
    // Include user list only if the authenticated user is an admin
    if (authResult.role === 'admin') {
      const usersSheet = ss.getSheetByName(SHEET_USERS);
      let usersList = [];
      if (usersSheet) {
        usersList = readSheetData(usersSheet).map(row => {
          let perms = [];
          if (row.Permissions) {
             try { perms = JSON.parse(row.Permissions); } catch (e) {}
          }
          return {
            id: row.ID,
            username: row.Username,
            password: row.Password,
            role: row.Role,
            permissions: perms
          };
        });
      }
      response.data.users = usersList;
      
      const auditSheet = ss.getSheetByName(SHEET_AUDIT);
      let auditLogs = [];
      if (auditSheet) {
        auditLogs = readSheetData(auditSheet).map(row => ({
          timestamp: row.Timestamp,
          username: row.Username,
          action: row.Action,
          details: row.Details
        })).reverse(); // Send newest first
      }
      response.data.auditLogs = auditLogs;
    }
    response.data.role = authResult.role;
    response.data.permissions = authResult.permissions || [];
    
    return createJsonResponse(response);
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

/**
 * Handle POST requests (Create, Update, Delete)
 */
function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents);
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Public Endpoints (No Auth Required)
    if (payload.action === 'getPublicRecipes') {
      let publicRecipes = [];
      const recipeSheet = ss.getSheetByName(SHEET_RECIPES);
      if (recipeSheet) {
        const recipeData = recipeSheet.getDataRange().getValues();
        for (let i = 1; i < recipeData.length; i++) {
          const row = recipeData[i];
          if (!row[0] || String(row[3]).trim().startsWith('[')) continue;
          
          let ingredients = [];
          if (row[4] !== undefined && row[4] !== '') {
            ingredients.push({
              id: 'META_YIELD',
              qty: row[4],
              unit: row[5] || 'porsi',
              type: row[6] || 'final'
            });
          }
          
          let instructions = '';
          let netWeights = {};
          let realIngIndex = 0;
          for (let j = 7; j < row.length; j += 3) {
            if (row[j] === 'META_INSTRUCTIONS') {
              instructions = row[j+1] || '';
              if (typeof instructions === 'string' && instructions.trim().startsWith('{')) {
                try { instructions = JSON.parse(instructions); } catch(e) {}
              }
            } else if (row[j] === 'META_NET_WEIGHTS') {
              try { netWeights = JSON.parse(row[j+1]); } catch(e) {}
            } else if (row[j] && String(row[j]).trim() !== '') {
              ingredients.push({
                id: new Date().getTime() + j,
                itemName: row[j],
                quantity: row[j+1],
                unit: row[j+2] || '',
                __origIndex: realIngIndex
              });
              realIngIndex++;
            }
          }
          
          ingredients = ingredients.map(ing => {
            let meta = null;
            if (netWeights && ing.__origIndex !== undefined && netWeights[ing.__origIndex]) {
              meta = netWeights[ing.__origIndex];
            } else if (netWeights && netWeights[ing.itemName]) {
              meta = netWeights[ing.itemName];
            }

            if (meta) {
              ing.netQty = meta.netQty;
              ing.measure = meta.measure;
              ing.category = meta.category;
            }
            delete ing.__origIndex;
            return ing;
          });
          
          publicRecipes.push({
            id: row[0],
            menuName: row[1],
            imageUrl: row[3] || '',
            ingredients: ingredients,
            instructions: instructions
          });
        }
      }
      let purchases = [];
      const purchasesSheet = ss.getSheetByName(SHEET_PURCHASES);
      if (purchasesSheet) {
        const pData = purchasesSheet.getDataRange().getValues();
        for (let i = 1; i < pData.length; i++) {
          if (!pData[i][0]) continue;
          purchases.push({
            id: pData[i][0],
            date: pData[i][1],
            itemName: pData[i][2],
            unit: pData[i][3],
            quantity: Number(pData[i][4])
            // Do NOT expose totalPrice for public endpoint
          });
        }
      }

      let sales = [];
      const salesSheet = ss.getSheetByName(SHEET_SALES);
      if (salesSheet) {
        const sData = salesSheet.getDataRange().getValues();
        for (let i = 1; i < sData.length; i++) {
          if (!sData[i][0]) continue;
          sales.push({
            id: sData[i][0],
            date: sData[i][1],
            recipeId: sData[i][2],
            quantitySold: Number(sData[i][3]),
            menuName: sData[i][4]
          });
        }
      }

      let adjustments = [];
      const adjSheet = ss.getSheetByName(SHEET_ADJUSTMENTS);
      if (adjSheet) {
        const aData = adjSheet.getDataRange().getValues();
        for (let i = 1; i < aData.length; i++) {
          if (!aData[i][0]) continue;
          adjustments.push({
            id: aData[i][0],
            date: aData[i][1],
            itemName: aData[i][2],
            quantity: Number(aData[i][3])
          });
        }
      }

      return createJsonResponse({ 
        status: 'success', 
        data: { 
          recipes: publicRecipes,
          purchases: purchases,
          sales: sales,
          adjustments: adjustments
        } 
      });
    }

    if (payload.action === 'getPublicButcher') {
      let butcherItems = [];
      const butcherSheet = ss.getSheetByName(SHEET_BUTCHER);
      if (butcherSheet) {
        // Ensure header exists for Category
        const headers = butcherSheet.getRange(1, 1, 1, butcherSheet.getLastColumn()).getValues()[0];
        if (headers.indexOf('Category') === -1) {
          butcherSheet.getRange(1, headers.length + 1).setValue('Category');
        }
        if (headers.indexOf('Details') === -1) {
          butcherSheet.getRange(1, butcherSheet.getLastColumn() + 1).setValue('Details');
        }
        
        butcherItems = readSheetData(butcherSheet).map(row => ({
          id: row.ID,
          itemName: row.ItemName,
          netWeight: row.NetWeight,
          imageUrl: row.ImageURL,
          category: row.Category || 'Bahan Baku & Potongan',
          details: row.Details || ''
        }));
      }
      return createJsonResponse({ status: 'success', data: butcherItems });
    }

    // Auth Check
    const username = payload.username;
    const password = payload.password;
    const authResult = verifyUser(ss, username, password);
    if (!authResult.isValid) {
      return createJsonResponse({ status: 'unauthorized', message: 'Username atau Sandi salah' });
    }

    const action = payload.action;
    const data = payload.data;
    
    let result = {};

    switch (action) {
      // --- PURCHASES ---
      case 'addPurchase':
        result = addRowToSheet(SHEET_PURCHASES, [data.id, data.date, data.itemName, data.unit, data.quantity, data.totalPrice]);
        logAudit(ss, username, 'Tambah Pembelian', `Menambahkan pembelian bahan: ${data.itemName} (${data.quantity} ${data.unit})`);
        break;
      case 'importMultiplePurchases':
        result = importMultipleRows(SHEET_PURCHASES, data.purchases.map(p => [p.id, p.date, p.itemName, p.unit, p.quantity, p.totalPrice]));
        logAudit(ss, username, 'Impor Massal Pembelian', `Mengimpor ${data.purchases.length} riwayat pembelian.`);
        break;
      case 'editPurchase':
        result = editRowById(SHEET_PURCHASES, data.id, [data.id, data.date, data.itemName, data.unit, data.quantity, data.totalPrice]);
        logAudit(ss, username, 'Edit Pembelian', `Mengubah pembelian bahan: ${data.itemName} (${data.quantity} ${data.unit})`);
        break;
      case 'deletePurchase':
        result = deleteRowById(SHEET_PURCHASES, data.id);
        logAudit(ss, username, 'Hapus Pembelian', `Menghapus pembelian (ID: ${data.id})`);
        break;
        
      // --- OVERHEAD ---
      case 'addOverhead':
        result = addRowToSheet(SHEET_OVERHEAD, [data.id, data.name, data.amount]);
        logAudit(ss, username, 'Tambah Biaya Operasional', `Menambahkan biaya: ${data.name}`);
        break;
      case 'deleteOverhead':
        result = deleteRowById(SHEET_OVERHEAD, data.id);
        logAudit(ss, username, 'Hapus Biaya Operasional', `Menghapus biaya operasional (ID: ${data.id})`);
        break;
        
      // --- RECIPES ---
      case 'addRecipe':
        const newRow = addRecipeRowData(data);
        ensureRecipeHeaders(ss, (newRow.length - 7) / 3);
        result = addRowToSheet(SHEET_RECIPES, newRow);
        logAudit(ss, username, 'Tambah Resep', `Membuat resep baru: ${data.menuName}`);
        break;
      case 'deleteRecipe':
        result = deleteRowById(SHEET_RECIPES, data.id);
        logAudit(ss, username, 'Hapus Resep', `Menghapus resep (ID: ${data.id})`);
        break;
      case 'updateRecipe':
        result = updateRecipeRow(data);
        logAudit(ss, username, 'Edit Resep', `Mengubah resep: ${data.menuName || data.id}`);
        break;
      case 'updateMultipleRecipes':
        result = updateMultipleRecipes(data.recipes);
        logAudit(ss, username, 'Impor Massal Resep', `Melakukan pembaruan/impor massal pada ${data.recipes.length} resep.`);
        break;
        
      // --- SALES ---
      case 'addSale':
        result = addRowToSheet(SHEET_SALES, [data.id, data.date, data.recipeId, data.quantitySold, data.menuName]);
        logAudit(ss, username, 'Input Penjualan', `Mencatat penjualan: ${data.menuName} (${data.quantitySold} porsi)`);
        break;
      case 'importMultipleSales':
        result = importMultipleRows(SHEET_SALES, data.sales.map(s => [s.id, s.date, s.recipeId, s.quantitySold, s.menuName]));
        logAudit(ss, username, 'Impor Massal Penjualan', `Mengimpor ${data.sales.length} riwayat penjualan.`);
        break;
      case 'deleteSale':
        result = deleteRowById(SHEET_SALES, data.id);
        logAudit(ss, username, 'Hapus Penjualan', `Menghapus catatan penjualan (ID: ${data.id})`);
        break;
        
      // --- ADJUSTMENTS ---
      case 'addAdjustment':
        result = addRowToSheet(SHEET_ADJUSTMENTS, [data.id, data.date, data.itemName, data.quantity, data.reason]);
        logAudit(ss, username, 'Penyesuaian Manual', `Penyesuaian stok ${data.itemName}: ${data.quantity} (${data.reason})`);
        break;
      case 'deleteAdjustment':
        result = deleteRowById(SHEET_ADJUSTMENTS, data.id);
        logAudit(ss, username, 'Hapus Penyesuaian', `Menghapus penyesuaian manual (ID: ${data.id})`);
        break;
        
      // --- CONVERSIONS ---
      case 'saveConversion':
        const convSheet = ss.getSheetByName(SHEET_CONVERSIONS);
        let updated = false;
        if (convSheet) {
          const cData = convSheet.getDataRange().getValues();
          for (let i = 1; i < cData.length; i++) {
            if (cData[i][0] === data.itemName) {
              convSheet.getRange(i + 1, 2).setValue(data.packUnit);
              convSheet.getRange(i + 1, 3).setValue(data.baseQty);
              updated = true;
              break;
            }
          }
        }
        if (!updated) {
          result = addRowToSheet(SHEET_CONVERSIONS, [data.itemName, data.packUnit, data.baseQty]);
        } else {
          result = { success: true };
        }
        logAudit(ss, username, 'Simpan Konversi', `Mengatur satuan konversi untuk: ${data.itemName}`);
        break;
      case 'deleteConversion':
        const cSheet = ss.getSheetByName(SHEET_CONVERSIONS);
        if (cSheet) {
          const dData = cSheet.getDataRange().getValues();
          for (let i = 1; i < dData.length; i++) {
            if (dData[i][0] === data.itemName) {
              cSheet.deleteRow(i + 1);
              break;
            }
          }
        }
        result = { success: true };
        logAudit(ss, username, 'Hapus Konversi', `Menghapus konversi untuk: ${data.itemName}`);
        break;

      // --- USERS ---
      case 'addUser':
        if (authResult.role !== 'admin') throw new Error("Unauthorized");
        result = addRowToSheet(SHEET_USERS, [data.id, data.username, data.password, data.role, data.permissions ? JSON.stringify(data.permissions) : '[]']);
        logAudit(ss, username, 'Tambah Pengguna', `Membuat akun pengguna baru: ${data.username}`);
        break;
      case 'editUser':
        if (authResult.role !== 'admin') throw new Error("Unauthorized");
        result = editRowById(SHEET_USERS, data.id, [data.id, data.username, data.password, data.role, data.permissions ? JSON.stringify(data.permissions) : '[]']);
        logAudit(ss, username, 'Edit Pengguna', `Mengubah akun pengguna: ${data.username}`);
        break;
      case 'deleteUser':
        if (authResult.role !== 'admin') throw new Error("Akses ditolak");
        result = deleteRowById(SHEET_USERS, data.id);
        logAudit(ss, username, 'Hapus User', `Menghapus ID pengguna: ${data.id}`);
        break;
        
      case 'addButcherItem':
        if (authResult.role !== 'admin' && !(authResult.permissions && authResult.permissions.includes('butcher'))) throw new Error("Akses ditolak");
        const bSheet = ss.getSheetByName(SHEET_BUTCHER);
        if (!bSheet) throw new Error("Sheet Butcher tidak ditemukan");
        
        // Ensure header exists for Category
        const headers = bSheet.getRange(1, 1, 1, bSheet.getLastColumn()).getValues()[0];
        if (headers.indexOf('Category') === -1) {
          bSheet.getRange(1, headers.length + 1).setValue('Category');
        }
        if (headers.indexOf('Details') === -1) {
          bSheet.getRange(1, bSheet.getLastColumn() + 1).setValue('Details');
        }
        
        bSheet.appendRow([data.id, data.itemName, data.netWeight, data.imageUrl || '', data.category || 'Bahan Baku & Potongan', data.details || '']);
        result = { message: "Item butcher ditambahkan" };
        logAudit(ss, username, 'Tambah Butcher', `Menambah item butcher: ${data.itemName} (${data.netWeight})`);
        break;

      case 'editButcherItem':
        if (authResult.role !== 'admin' && !(authResult.permissions && authResult.permissions.includes('butcher'))) throw new Error("Akses ditolak");
        const bSheetEdit = ss.getSheetByName(SHEET_BUTCHER);
        if (bSheetEdit) {
          const editHeaders = bSheetEdit.getRange(1, 1, 1, bSheetEdit.getLastColumn()).getValues()[0];
          if (editHeaders.indexOf('Category') === -1) {
            bSheetEdit.getRange(1, editHeaders.length + 1).setValue('Category');
          }
          if (editHeaders.indexOf('Details') === -1) {
            bSheetEdit.getRange(1, bSheetEdit.getLastColumn() + 1).setValue('Details');
          }
        }
        result = editRowById(SHEET_BUTCHER, data.id, [data.id, data.itemName, data.netWeight, data.imageUrl || '', data.category || 'Bahan Baku & Potongan', data.details || '']);
        logAudit(ss, username, 'Edit Butcher', `Mengubah item butcher: ${data.itemName}`);
        break;

      case 'deleteButcherItem':
        if (authResult.role !== 'admin' && !(authResult.permissions && authResult.permissions.includes('butcher'))) throw new Error("Akses ditolak");
        result = deleteRowById(SHEET_BUTCHER, data.id);
        logAudit(ss, username, 'Hapus Butcher', `Menghapus item butcher ID: ${data.id}`);
        break;

      default:
        throw new Error("Action not found");
    }

    return createJsonResponse({ status: 'success', result: result });
  } catch (error) {
    return createJsonResponse({ status: 'error', message: error.toString() });
  }
}

// CORS Preflight Handler
function doOptions(e) {
  return createJsonResponse({ status: 'ok' });
}

// ==========================================
// HELPER FUNCTIONS
// ==========================================

function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Reads all data from a sheet and returns an array of objects based on header names.
 */
function readSheetData(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return []; // Only headers or empty
  
  const headers = data[0];
  const rows = [];
  
  for (let i = 1; i < data.length; i++) {
    let rowObj = {};
    for (let j = 0; j < headers.length; j++) {
      let val = data[i][j];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      rowObj[headers[j]] = val;
    }
    rows.push(rowObj);
  }
  
  return rows;
}

/**
 * Appends a new row to a specific sheet.
 */
function addRowToSheet(sheetName, rowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  sheet.appendRow(rowData);
  return { message: "Row added successfully" };
}

/**
 * Deletes a row based on the ID in the first column.
 */
function deleteRowById(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  // Find the row where the ID (Column A) matches
  // Start from 1 to skip headers
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      sheet.deleteRow(i + 1); // deleteRow is 1-indexed
      return { message: "Row deleted successfully" };
    }
  }
  throw new Error("ID not found in " + sheetName);
}

/**
 * Edits a row based on the ID in the first column.
 */
function editRowById(sheetName, id, newRowData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == id) {
      const range = sheet.getRange(i + 1, 1, 1, newRowData.length);
      range.setValues([newRowData]);
      return { message: "Row edited successfully" };
    }
  }
  throw new Error("ID not found for edit in " + sheetName);
}

// ==========================================
// RECIPES DYNAMIC COLUMN HANDLERS
// ==========================================

/**
 * Formats a single recipe object into a flat row array (expanding ingredients to columns)
 */
function addRecipeRowData(data) {
  let row = [
    data.id, 
    data.menuName, 
    data.targetMarginPercent, 
    data.imageUrl || ''
  ];
  
  const ings = data.ingredients || [];
  
  // 1. Extract META_YIELD into fixed columns E, F, G
  const yieldMeta = ings.find(i => i.id === 'META_YIELD') || {};
  row.push(yieldMeta.qty !== undefined ? yieldMeta.qty : 1);
  row.push(yieldMeta.unit || 'porsi');
  row.push(yieldMeta.type || 'final');
  
  // 2. Extract real ingredients dynamically into remaining columns
  const realIngs = ings.filter(i => i.id !== 'META_YIELD' && i.id !== 'META_INSTRUCTIONS');
  for (let i = 0; i < realIngs.length; i++) {
    row.push(realIngs[i].itemName);
    row.push(realIngs[i].quantity !== undefined ? realIngs[i].quantity : (realIngs[i].qty || 0));
    row.push(realIngs[i].unit || '');
  }
  
  // 3. Append META_INSTRUCTIONS
  const instructionMeta = ings.find(i => i.id === 'META_INSTRUCTIONS');
  if (instructionMeta || data.instructions) {
    row.push('META_INSTRUCTIONS');
    let instructionsData = instructionMeta ? instructionMeta.instructions : (data.instructions || '');
    if (typeof instructionsData === 'object') {
      instructionsData = JSON.stringify(instructionsData);
    }
    row.push(instructionsData);
    row.push('');
  }
  
  // 4. Append META_NET_WEIGHTS
  let netWeightsObj = {};
  realIngs.forEach((ing, index) => {
    if (ing.netQty !== undefined || ing.measure !== undefined || ing.category !== undefined) {
      netWeightsObj[index] = { netQty: ing.netQty, measure: ing.measure, category: ing.category };
    }
  });
  if (Object.keys(netWeightsObj).length > 0) {
    row.push('META_NET_WEIGHTS');
    row.push(JSON.stringify(netWeightsObj));
    row.push('');
  }
  
  return row;
}

/**
 * Ensures that the header row has enough columns for all dynamic ingredients.
 */
function ensureRecipeHeaders(ss, maxBahan) {
  const sheet = ss.getSheetByName(SHEET_RECIPES);
  if (!sheet) return;
  const data = sheet.getDataRange().getValues();
  let headers = data.length > 0 ? data[0] : ['ID', 'MenuName', 'TargetMarginPercent', 'ImageUrl', 'YieldQty', 'YieldUnit', 'YieldType'];
  
  const expectedLength = 7 + (maxBahan * 3);
  if (headers.length < expectedLength) {
    let newHeaders = ['ID', 'MenuName', 'TargetMarginPercent', 'ImageUrl', 'YieldQty', 'YieldUnit', 'YieldType'];
    for (let i = 1; i <= Math.max(maxBahan, Math.floor((headers.length - 7) / 3)); i++) {
      newHeaders.push(`Bahan ${i}`);
      newHeaders.push(`Qty ${i}`);
      newHeaders.push(`Satuan ${i}`);
    }
    // Update headers in spreadsheet
    sheet.getRange(1, 1, 1, newHeaders.length).setValues([newHeaders]);
    sheet.getRange(1, 1, 1, newHeaders.length).setFontWeight("bold");
  }
}

/**
 * Updates an entire Recipe row based on ID.
 */
function updateRecipeRow(recipeData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RECIPES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == recipeData.id) {
      const rowNum = i + 1;
      const newRowData = addRecipeRowData(recipeData);
      
      // Ensure we have enough header columns for this recipe
      ensureRecipeHeaders(ss, Math.floor((newRowData.length - 7) / 3));
      
      // Clear old data for this specific row to prevent leftover columns if new list is shorter
      const lastCol = sheet.getLastColumn();
      if (lastCol > 0) {
        sheet.getRange(rowNum, 1, 1, lastCol).clearContent();
      }
      
      // Write the new row data
      sheet.getRange(rowNum, 1, 1, newRowData.length).setValues([newRowData]);
      return { message: "Recipe updated successfully" };
    }
  }
  throw new Error("Recipe ID not found for update");
}

function updateMultipleRecipes(recipesList) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RECIPES);
  const data = sheet.getDataRange().getValues();
  
  const existingRowMap = new Map();
  for (let i = 1; i < data.length; i++) {
    existingRowMap.set(String(data[i][0]), i);
  }
  
  let maxColsNeeded = data.length > 0 ? data[0].length : 0;
  
  for (const recipe of recipesList) {
    const newRowData = addRecipeRowData(recipe);
    maxColsNeeded = Math.max(maxColsNeeded, newRowData.length);
    
    if (existingRowMap.has(String(recipe.id))) {
      const rowIndex = existingRowMap.get(String(recipe.id));
      data[rowIndex] = newRowData;
    } else {
      data.push(newRowData);
      existingRowMap.set(String(recipe.id), data.length - 1);
    }
  }
  
  // Pad all rows to match maxColsNeeded
  for (let i = 0; i < data.length; i++) {
    while (data[i].length < maxColsNeeded) {
      data[i].push("");
    }
  }
  
  // Ensure the sheet has enough columns before attempting to set values
  ensureRecipeHeaders(ss, Math.floor((maxColsNeeded - 7) / 3));
  
  // Ensure the sheet has enough rows
  if (data.length > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), data.length - sheet.getMaxRows());
  }
  
  sheet.clearContents();
  if (data.length > 0) {
    sheet.getRange(1, 1, data.length, maxColsNeeded).setValues(data);
  }
  
  return { message: "Multiple recipes updated successfully" };
}

function importMultipleRows(sheetName, rowsData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet || rowsData.length === 0) return { message: "No data to import" };
  
  const startRow = sheet.getLastRow() + 1;
  sheet.getRange(startRow, 1, rowsData.length, rowsData[0].length).setValues(rowsData);
  return { message: "Multiple rows imported successfully" };
}
