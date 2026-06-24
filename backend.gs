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

/**
 * Run this function ONCE to set up the spreadsheet automatically.
 */
function setup() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  
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
    recipesSheet.appendRow(['ID', 'MenuName', 'TargetMarginPercent', 'Ingredients']);
    recipesSheet.getRange("A1:D1").setFontWeight("bold");
  }
  
  // Delete the default "Sheet1" if it exists
  const sheet1 = ss.getSheetByName('Sheet1');
  if (sheet1) {
    ss.deleteSheet(sheet1);
  }
}

/**
 * Handle GET requests (Fetch Initial Data)
 */
function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    
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

    // Read Recipes
    const recipesData = readSheetData(ss.getSheetByName(SHEET_RECIPES));
    const recipes = recipesData.map(row => {
      let ingredients = [];
      try {
        ingredients = JSON.parse(row.Ingredients || '[]');
      } catch (err) {
        ingredients = [];
      }
      return {
        id: row.ID,
        menuName: row.MenuName,
        targetMarginPercent: Number(row.TargetMarginPercent),
        ingredients: ingredients
      };
    });

    const response = {
      status: 'success',
      data: {
        purchases: purchases,
        overheadCosts: overheadCosts,
        recipes: recipes
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
    const action = payload.action;
    const data = payload.data;
    
    let result = {};

    switch (action) {
      // --- PURCHASES ---
      case 'addPurchase':
        result = addRowToSheet(SHEET_PURCHASES, [data.id, data.date, data.itemName, data.unit, data.quantity, data.totalPrice]);
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
        result = addRowToSheet(SHEET_RECIPES, [data.id, data.menuName, data.targetMarginPercent, JSON.stringify(data.ingredients || [])]);
        break;
      case 'deleteRecipe':
        result = deleteRowById(SHEET_RECIPES, data.id);
        break;
      case 'updateRecipe':
        // Digunakan ketika menambah bahan (ingredient) baru ke resep, 
        // merubah nama menu, atau target margin
        result = updateRecipeRow(data);
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
 * Updates an entire Recipe row based on ID.
 */
function updateRecipeRow(recipeData) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_RECIPES);
  const data = sheet.getDataRange().getValues();
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][0] == recipeData.id) {
      const rowNum = i + 1;
      sheet.getRange(rowNum, 2).setValue(recipeData.menuName);
      sheet.getRange(rowNum, 3).setValue(recipeData.targetMarginPercent);
      sheet.getRange(rowNum, 4).setValue(JSON.stringify(recipeData.ingredients || []));
      return { message: "Recipe updated successfully" };
    }
  }
  throw new Error("Recipe ID not found for update");
}
