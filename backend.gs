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

/**
 * Run this function ONCE to set up the spreadsheet automatically.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // Create Settings sheet for Password
  let settingsSheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!settingsSheet) {
    settingsSheet = ss.insertSheet(SHEET_SETTINGS);
    settingsSheet.appendRow(['Key', 'Value']);
    settingsSheet.getRange("A1:B1").setFontWeight("bold");
    settingsSheet.appendRow(['PASSWORD', 'admin123']);
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
  
  // Delete the default "Sheet1" if it exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
}

function verifyPassword(ss, inputPassword) {
  let sheet = ss.getSheetByName(SHEET_SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_SETTINGS);
    sheet.appendRow(['Key', 'Value']);
    sheet.getRange("A1:B1").setFontWeight("bold");
    sheet.appendRow(['PASSWORD', 'admin123']);
  }
  
  const data = sheet.getDataRange().getValues();
  let correctPassword = 'admin123';
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] === 'PASSWORD') {
      correctPassword = String(data[i][1] || '').trim();
      break;
    }
  }
  
  return String(inputPassword || '').trim() === correctPassword;
}

/**
 * Handle GET requests (Fetch Initial Data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
    // Auth Check
    const password = e && e.parameter ? e.parameter.password : '';
    if (!verifyPassword(ss, password)) {
      return createJsonResponse({ status: 'unauthorized', message: 'Sandi salah atau belum diisi' });
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
        
        // Baca Bahan dari Kolom H dst (index 7, 8, 9, 10, 11, 12...)
        for (let j = 7; j < row.length; j += 3) {
          if (row[j] && String(row[j]).trim() !== '') {
            ingredients.push({
              id: new Date().getTime() + j, // ID sementara untuk UI React
              itemName: row[j],
              quantity: row[j+1],
              unit: row[j+2] || ''
            });
          }
        }
        
        recipes.push({
          id: row[0],
          menuName: row[1],
          targetMarginPercent: Number(row[2]),
          imageUrl: row[3] || '',
          ingredients: ingredients
        });
      }
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
        }))
      }
    };
    
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
    
    // Auth Check
    const password = payload.password;
    if (!verifyPassword(ss, password)) {
      return createJsonResponse({ status: 'unauthorized', message: 'Sandi salah atau belum diisi' });
    }

    const action = payload.action;
    const data = payload.data;
    
    let result = {};

    switch (action) {
      // --- PURCHASES ---
      case 'addPurchase':
        result = addRowToSheet(SHEET_PURCHASES, [data.id, data.date, data.itemName, data.unit, data.quantity, data.totalPrice]);
        break;
      case 'editPurchase':
        result = editRowById(SHEET_PURCHASES, data.id, [data.id, data.date, data.itemName, data.unit, data.quantity, data.totalPrice]);
        break;
      case 'deletePurchase':
        result = deleteRowById(SHEET_PURCHASES, data.id);
        break;
        
      // --- OVERHEAD ---
      case 'addOverhead':
        result = addRowToSheet(SHEET_OVERHEAD, [data.id, data.name, data.amount]);
        break;
      case 'deleteOverhead':
        result = deleteRowById(SHEET_OVERHEAD, data.id);
        break;
        
      // --- RECIPES ---
      case 'addRecipe':
        const newRow = addRecipeRowData(data);
        ensureRecipeHeaders(ss, (newRow.length - 7) / 3);
        result = addRowToSheet(SHEET_RECIPES, newRow);
        break;
      case 'deleteRecipe':
        result = deleteRowById(SHEET_RECIPES, data.id);
        break;
      case 'updateRecipe':
        result = updateRecipeRow(data);
        break;
        
      // --- SALES ---
      case 'addSale':
        result = addRowToSheet(SHEET_SALES, [data.id, data.date, data.recipeId, data.quantitySold, data.menuName]);
        break;
      case 'deleteSale':
        result = deleteRowById(SHEET_SALES, data.id);
        break;
        
      // --- ADJUSTMENTS ---
      case 'addAdjustment':
        result = addRowToSheet(SHEET_ADJUSTMENTS, [data.id, data.date, data.itemName, data.quantity, data.reason]);
        break;
      case 'deleteAdjustment':
        result = deleteRowById(SHEET_ADJUSTMENTS, data.id);
        break;
        
      default:
        throw new Error("Invalid action provided");
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
      rowObj[headers[j]] = data[i][j];
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
  const realIngs = ings.filter(i => i.id !== 'META_YIELD');
  for (let i = 0; i < realIngs.length; i++) {
    row.push(realIngs[i].itemName);
    row.push(realIngs[i].quantity !== undefined ? realIngs[i].quantity : (realIngs[i].qty || 0));
    row.push(realIngs[i].unit || '');
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
