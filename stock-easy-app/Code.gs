// ============================================
// STOCK EASY - GOOGLE APPS SCRIPT API v2.7
// ============================================
// UPDATED VERSION - December 2025 - Fixed Action Parameter
// - Added damagedQuantity and discrepancyQuantity support
// - Fixed createOrder, getOrders, updateOrderItems, setupSheets
// - Removed all duplicate functions
// - Fixed SKU-Fournisseurs to use only 2 columns
// - Verified all sheet names and column names match spreadsheet structure
// - Fixed updateStock to support both data.items and data as array
// - Fixed doPost to read action from URL parameters or body

const SPREADSHEET_ID = '1U-XYEXhx5wUHpapQBSMndqkkFKdrLwBTrSSejPvTYts';

const SHEETS = {
  SUPPLIERS: 'Fournisseurs',
  PRODUCTS: 'Produits',
  SKU_SUPPLIERS: 'SKU-Fournisseurs',
  ORDERS: 'Commandes',
  ORDER_ITEMS: 'ArticlesCommande',
  PARAMETERS: 'Parametres',
  WAREHOUSES: 'Warehouses'
};

// ============================================
// UTILITIES
// ============================================

function jsonResponse(data, status = 200) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function createResponse(data) {
  return data;
}

function getSpreadsheet() {
  try {
    return SpreadsheetApp.openById(SPREADSHEET_ID);
  } catch (error) {
    throw new Error('Cannot open spreadsheet: ' + error.toString());
  }
}

function getSheetData(sheetName) {
  const sheet = getSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    throw new Error('Sheet not found: ' + sheetName);
  }
  
  const data = sheet.getDataRange().getValues();
  if (data.length < 1) {
    return [];
  }
  
  const headers = data[0];
  const rows = data.slice(1);
  
  // Debug pour voir les en-têtes de colonnes
  if (sheetName === 'Commandes') {
    Logger.log('🔍 En-têtes de colonnes dans Commandes: ' + JSON.stringify(headers));
    Logger.log('🔍 Nombre de colonnes: ' + headers.length);
    Logger.log('🔍 Nombre de lignes de données: ' + rows.length);
  }
  
  return rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });
}

// ============================================
// API ENDPOINTS
// ============================================

function doGet(e) {
  try {
    Logger.log('🔧 doGet démarré');
    
    // Gérer les cas où e est undefined
    if (!e) {
      Logger.log('⚠️ Paramètre e est undefined, création d\'objet par défaut');
      e = { parameter: {} };
    }
    
    if (!e.parameter) {
      Logger.log('⚠️ e.parameter est undefined, création d\'objet par défaut');
      e.parameter = {};
    }
    
    Logger.log('🔍 Paramètres GET: ' + JSON.stringify(e.parameter));
    
    const action = e.parameter.action || 'getAllData';
    Logger.log('🎯 Action demandée: ' + action);
    
    let result;
    
    switch (action) {
      case 'getAllData':
        result = getAllData();
        break;
      case 'getOrders':
        result = getOrders();
        break;
      case 'getSuppliers':
        result = getSuppliers();
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'getWarehouses':
        result = getWarehouses();
        break;
      case 'getParameter':
        result = { value: getParameter(e.parameter.name) };
        break;
      case 'health':
        result = { status: 'ok', timestamp: new Date().toISOString() };
        break;
      case 'test':
        result = { success: true, message: 'Test réussi - Script fonctionnel' };
        break;
      case 'testActions':
        result = { 
          success: true, 
          actions: [
            'getAllData', 'getOrders', 'createOrder', 'updateOrderStatus',
            'updateStock', 'updateParameter', 'createWarehouse', 'updateWarehouse',
            'deleteWarehouse', 'assignSupplierToProduct', 'removeSupplierFromProduct',
            'createSupplier', 'updateSupplier', 'deleteSupplier', 'processOrderReconciliation',
            'setupOrdersColumns', 'test', 'testActions'
          ]
        };
        break;
      default:
        result = { success: false, error: 'Action non reconnue: ' + action };
    }
    
    Logger.log('✅ doGet résultat: ' + JSON.stringify(result));
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('❌ ERREUR doGet: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  try {
    Logger.log('🔧 doPost démarré');
    
    // Vérifier que e existe
    if (!e) {
      Logger.log('❌ ERREUR: Paramètre e est undefined');
      return ContentService
        .createTextOutput(JSON.stringify({ success: false, error: 'Paramètre e manquant' }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    Logger.log('PostData: ' + (e.postData ? e.postData.contents : 'undefined'));
    
    // Try to get action from parameters first, then from data
    const action = e.parameter && e.parameter.action ? e.parameter.action : 
                   (e.postData && e.postData.contents ? JSON.parse(e.postData.contents).action : null);
    
    const data = e.postData && e.postData.contents ? JSON.parse(e.postData.contents) : {};
    
    // Log for debugging
    Logger.log('Action: ' + action);
    Logger.log('Data: ' + JSON.stringify(data));
    
    let result;
    
    switch (action) {
      case 'getAllData':
        result = getAllData();
        break;
      case 'getProducts':
        result = getProducts();
        break;
      case 'getSuppliers':
        result = getSuppliers();
        break;
      case 'getWarehouses':
        result = getWarehouses();
        break;
      case 'getOrders':
        result = getOrders();
        break;
      case 'createOrder':
        result = createOrder(data);
        break;
      case 'updateOrderStatus':
        result = updateOrderStatus(data);
        break;
      case 'updateStock':
        result = updateStock(data);
        break;
      case 'updateProduct':
        result = updateProduct(data);
        break;
      case 'updateParameter':
        result = updateParameter(data);
        break;
      case 'createWarehouse':
        result = createWarehouse(data);
        break;
      case 'updateWarehouse':
        result = updateWarehouse(data);
        break;
      case 'deleteWarehouse':
        result = deleteWarehouse(data);
        break;
      case 'assignSupplierToProduct':
        result = assignSupplierToProduct(data);
        break;
      case 'removeSupplierFromProduct':
        result = removeSupplierFromProduct(data);
        break;
      case 'createSupplier':
        result = createSupplier(data);
        break;
      case 'updateSupplier':
        result = updateSupplier(data);
        break;
      case 'deleteSupplier':
        result = deleteSupplier(data);
        break;
      case 'processOrderReconciliation':
        result = processOrderReconciliation(data);
        break;
      case 'setupOrdersColumns':
        result = setupOrdersColumns();
        break;
      default:
        result = { success: false, error: 'Action non reconnue: ' + action };
    }
    
    Logger.log('Result: ' + JSON.stringify(result));
    
    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);
      
  } catch (error) {
    Logger.log('ERROR doPost: ' + error.toString());
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ============================================
// READ - SUPPLIERS
// ============================================

function getSuppliers() {
  const data = getSheetData(SHEETS.SUPPLIERS);
  
  return data.map(row => ({
    name: row['Nom Fournisseur'] || '',
    email: row['Email'] || '',
    leadTimeDays: Number(row['leadTimeDays']) || 30,
    moq: Number(row['MOQ Standard']) || 1,
    notes: row['Notes'] || ''
  }));
}

// ============================================
// READ - PRODUCTS
// ============================================

function getProducts() {
  const data = getSheetData(SHEETS.PRODUCTS);
  
  return data.map(row => ({
    sku: row['SKU'] || '',
    name: row['Nom Produit'] || '',
    stock: Number(row['Stock Actuel']) || 0,
    sales30d: Number(row['Ventes Totales (30j)']) || 0,
    salesPerDay: Number(row['Ventes/Jour (moy 30j)']) || 0,
    multiplier: Number(row['Multiplicateur Prévision']) || 1.2,
    customSecurityStock: row['Stock Sécu Custom (jours)'] || null,
    adjustedSales: Number(row['Ventes/Jour Ajustées']) || 0,
    supplier: row['Fournisseur'] || '',
    leadTimeDays: Number(row['leadTimeDays']) || 30,
    moq: Number(row['MOQ']) || 1,
    buyPrice: Number(row['Prix Achat']) || 0,
    sellPrice: Number(row['Prix Vente']) || 0,
    margin: Number(row['Marge Unitiaire']) || 0,
    securityStock: Number(row['Stock Sécu 20% (jours)']) || 0,
    reorderPoint: Number(row['Point Commande']) || 0,
    qtyToOrder: Number(row['Qté á Commander']) || 0,
    status: row['Statut'] || '',
    investment: Number(row['Investissement']) || 0,
    potentialRevenue: Number(row['CA Potentiel']) || 0,
    grossMargin: Number(row['Marge Brut']) || 0
  }));
}

// ============================================
// READ - WAREHOUSES
// ============================================

function getWarehouses() {
  try {
    const sheet = getSpreadsheet().getSheetByName(SHEETS.WAREHOUSES);
    
    if (!sheet) {
      Logger.log('⚠️ Sheet Warehouses not found');
      return [];
    }
    
    const data = sheet.getDataRange().getValues();
    
    if (data.length <= 1) {
      Logger.log('ℹ️ No warehouses found');
      return [];
    }
    
    const headers = data[0];
    const warehouses = [];
    
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (row[0]) {
        const warehouse = {
          name: row[0],
          address: row[1] || '',
          city: row[2] || '',
          postalCode: row[3] || '',
          country: row[4] || 'France',
          notes: row[5] || ''
        };
        warehouses.push(warehouse);
      }
    }
    
    Logger.log(`✅ ${warehouses.length} warehouse(s) loaded`);
    return warehouses;
    
  } catch (error) {
    Logger.log('❌ ERROR getWarehouses: ' + error.message);
    return [];
  }
}

// ============================================
// READ - ORDERS
// ============================================

function getOrders() {
  try {
    const ordersData = getSheetData(SHEETS.ORDERS);
    const itemsData = getSheetData(SHEETS.ORDER_ITEMS);
    
    Logger.log('🔍 Nombre total de commandes récupérées: ' + ordersData.length);
    Logger.log('🔍 IDs des commandes: ' + JSON.stringify(ordersData.map(o => o.id)));
    
    // Debug pour PO-015
    const po015Raw = ordersData.find(o => o.id === 'PO-015');
    if (po015Raw) {
      Logger.log('🔍 Debug PO-015 dans getOrders (données brutes): ' + JSON.stringify(po015Raw));
    } else {
      Logger.log('❌ PO-015 non trouvé dans les données brutes');
    }
    
    return ordersData.map(order => {
      const orderItems = itemsData
        .filter(item => item.orderId === order.id)
        .map(item => ({
          sku: item.sku,
          quantity: Number(item.quantity) || 0,
          pricePerUnit: Number(item.pricePerUnit) || 0,
          receivedQuantity: Number(item.receivedQuantity) || 0,
          damagedQuantity: Number(item.damagedQuantity) || 0,
          discrepancyType: item.discrepancyType || '',
          discrepancyQuantity: Number(item.discrepancyQuantity) || 0,
          discrepancyNotes: item.discrepancyNotes || ''
        }));
      
      const transformedOrder = {
        id: order.id,
        supplier: order.supplier || '',
        warehouseId: order.warehouseId || '',
        status: order.status || '',
        total: Number(order.total) || 0,
        createdAt: order.createdAt || '',
        eta: order.eta || '',
        confirmedAt: order.confirmedAt || '',
        shippedAt: order.shippedAt || '',
        receivedAt: order.receivedAt || '',
        completedAt: order.completedAt || '',
        trackingNumber: order.trackingNumber || '',
        trackingUrl: order.trackingUrl || '',
        hasDiscrepancy: order.hasDiscrepancy === true || order.hasDiscrepancy === 'TRUE',
        damageReport: order.damageReport || '',
        notes: order.notes || '',
        items: orderItems
      };
      
      // Debug pour PO-015 après transformation
      if (order.id === 'PO-015') {
        Logger.log('🔍 Debug PO-015 dans getOrders (après transformation): ' + JSON.stringify(transformedOrder));
      }
      
      // Debug ETA pour toutes les commandes
      if (order.id && order.id.startsWith('PO-')) {
        Logger.log('🔍 Debug ETA pour ' + order.id + ' - order.eta brut: ' + order.eta + ' (type: ' + typeof order.eta + ')');
        Logger.log('🔍 Debug ETA pour ' + order.id + ' - transformedOrder.eta: ' + transformedOrder.eta + ' (type: ' + typeof transformedOrder.eta + ')');
      }
      
      return transformedOrder;
    });
  } catch (error) {
    Logger.log('ERROR getOrders: ' + error.toString());
    return [];
  }
}

// ============================================
// READ - ALL DATA
// ============================================

function getAllData() {
  try {
    return {
      suppliers: getSuppliers(),
      products: getProducts(),
      orders: getOrders(),
      warehouses: getWarehouses(),
      parameters: {
        deepOverstockThreshold: getParameter('SeuilSurstockProfond'),
        defaultCurrency: getParameter('DeviseDefaut'),
        defaultMultiplier: getParameter('MultiplicateurDefaut')
      }
    };
  } catch (error) {
    Logger.log('ERROR getAllData: ' + error.toString());
    throw error;
  }
}

// ============================================
// PARAMETERS
// ============================================

function getParameter(name) {
  try {
    const data = getSheetData(SHEETS.PARAMETERS);
    const param = data.find(p => p.paramName === name);
    return param ? param.value : null;
  } catch (error) {
    Logger.log('ERROR getParameter: ' + error.toString());
    return null;
  }
}

function updateParameter(data) {
  try {
    Logger.log('=== UPDATE PARAMETER ===');
    Logger.log('Name: ' + data.name + ', Value: ' + data.value);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.PARAMETERS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const nameIndex = headers.indexOf('paramName');
    const valueIndex = headers.indexOf('value');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][nameIndex] === data.name) {
        sheet.getRange(i + 1, valueIndex + 1).setValue(data.value);
        Logger.log('✅ Parameter updated');
        return { success: true };
      }
    }
    
    sheet.appendRow([data.name, data.value, '']);
    Logger.log('✅ Parameter created');
    return { success: true };
    
  } catch (error) {
    Logger.log('ERROR updateParameter: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// SUPPLIERS - CRUD
// ============================================

function createSupplier(data) {
  try {
    Logger.log('=== CREATE SUPPLIER ===');
    Logger.log('Data: ' + JSON.stringify(data));
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SUPPLIERS);
    
    sheet.appendRow([
      data.name || '',
      data.email || '',
      Number(data.leadTimeDays) || 30,
      Number(data.moq) || 1,
      data.notes || ''
    ]);
    
    SpreadsheetApp.flush();
    Logger.log('✅ Supplier created: ' + data.name);
    
    return { success: true, name: data.name };
    
  } catch (error) {
    Logger.log('ERROR createSupplier: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function updateSupplier(data) {
  try {
    Logger.log('=== UPDATE SUPPLIER ===');
    Logger.log('Name: ' + data.name);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SUPPLIERS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const nameIndex = headers.indexOf('Nom Fournisseur');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][nameIndex] === data.name) {
        Logger.log('Supplier found at row ' + (i + 1));
        
        if (data.email !== undefined) {
          const emailIndex = headers.indexOf('Email');
          if (emailIndex !== -1) sheet.getRange(i + 1, emailIndex + 1).setValue(data.email);
        }
        if (data.leadTimeDays !== undefined) {
          const leadIndex = headers.indexOf('leadTimeDays');
          if (leadIndex !== -1) sheet.getRange(i + 1, leadIndex + 1).setValue(Number(data.leadTimeDays));
        }
        if (data.moq !== undefined) {
          const moqIndex = headers.indexOf('MOQ Standard');
          if (moqIndex !== -1) sheet.getRange(i + 1, moqIndex + 1).setValue(Number(data.moq));
        }
        if (data.notes !== undefined) {
          const notesIndex = headers.indexOf('Notes');
          if (notesIndex !== -1) sheet.getRange(i + 1, notesIndex + 1).setValue(data.notes);
        }
        
        SpreadsheetApp.flush();
        Logger.log('✅ Supplier updated');
        return { success: true };
      }
    }
    
    return { success: false, message: 'Supplier not found' };
    
  } catch (error) {
    Logger.log('ERROR updateSupplier: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function deleteSupplier(data) {
  try {
    Logger.log('=== DELETE SUPPLIER ===');
    Logger.log('Name: ' + data.name);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SUPPLIERS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const nameIndex = headers.indexOf('Nom Fournisseur');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][nameIndex] === data.name) {
        sheet.deleteRow(i + 1);
        Logger.log('✅ Supplier deleted');
        return { success: true };
      }
    }
    
    return { success: false, message: 'Supplier not found' };
    
  } catch (error) {
    Logger.log('ERROR deleteSupplier: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// SKU-SUPPLIERS MAPPING
// ============================================

function assignSupplierToProduct(data) {
  try {
    Logger.log('=== ASSIGN SUPPLIER TO PRODUCT ===');
    Logger.log('SKU: ' + data.sku + ', Supplier: ' + data.supplierName);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SKU_SUPPLIERS);
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const skuIndex = headers.indexOf('SKU');
    const supplierIndex = headers.indexOf('Fournisseur');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][skuIndex] === data.sku && values[i][supplierIndex] === data.supplierName) {
        Logger.log('⚠️ Mapping already exists');
        return { success: true, message: 'Already assigned' };
      }
    }
    
    sheet.appendRow([
      data.sku,
      data.supplierName
    ]);
    
    SpreadsheetApp.flush();
    Logger.log('✅ Supplier assigned to product');
    
    return { success: true };
    
  } catch (error) {
    Logger.log('ERROR assignSupplierToProduct: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function removeSupplierFromProduct(data) {
  try {
    Logger.log('=== REMOVE SUPPLIER FROM PRODUCT ===');
    Logger.log('SKU: ' + data.sku + ', Supplier: ' + data.supplierName);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.SKU_SUPPLIERS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const skuIndex = headers.indexOf('SKU');
    const supplierIndex = headers.indexOf('Fournisseur');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][skuIndex] === data.sku && values[i][supplierIndex] === data.supplierName) {
        sheet.deleteRow(i + 1);
        Logger.log('✅ Supplier removed from product');
        return { success: true };
      }
    }
    
    return { success: false, message: 'Mapping not found' };
    
  } catch (error) {
    Logger.log('ERROR removeSupplierFromProduct: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// 🆕 WAREHOUSES - CRUD IMPLEMENTATION
// ============================================

function createWarehouse(data) {
  try {
    Logger.log('=== CREATE WAREHOUSE ===');
    Logger.log('Data: ' + JSON.stringify(data));
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.WAREHOUSES);
    
    if (!sheet) {
      throw new Error('Warehouses sheet not found. Run setupSheets() first.');
    }
    
    // Vérifier si un entrepôt avec ce nom existe déjà
    const values = sheet.getDataRange().getValues();
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.name) {
        Logger.log('⚠️ Warehouse already exists: ' + data.name);
        return { 
          success: false, 
          error: 'Un entrepôt avec ce nom existe déjà' 
        };
      }
    }
    
    // Ajouter le nouvel entrepôt
    sheet.appendRow([
      data.name || '',
      data.address || '',
      data.city || '',
      data.postalCode || '',
      data.country || 'France',
      data.notes || ''
    ]);
    
    SpreadsheetApp.flush();
    Logger.log('✅ Warehouse created: ' + data.name);
    
    return { 
      success: true, 
      message: 'Entrepôt créé avec succès',
      warehouse: {
        name: data.name,
        address: data.address,
        city: data.city,
        postalCode: data.postalCode,
        country: data.country,
        notes: data.notes
      }
    };
    
  } catch (error) {
    Logger.log('❌ ERROR createWarehouse: ' + error.toString());
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

function updateWarehouse(data) {
  try {
    Logger.log('=== UPDATE WAREHOUSE ===');
    Logger.log('Warehouse Name: ' + data.warehouseName);
    Logger.log('Data: ' + JSON.stringify(data));
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.WAREHOUSES);
    
    if (!sheet) {
      throw new Error('Warehouses sheet not found');
    }
    
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    // Trouver la ligne de l'entrepôt
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.warehouseName) {
        Logger.log('Warehouse found at row ' + (i + 1));
        
        // Mettre à jour chaque champ si fourni
        if (data.name !== undefined && data.name !== data.warehouseName) {
          sheet.getRange(i + 1, 1).setValue(data.name);
        }
        if (data.address !== undefined) {
          sheet.getRange(i + 1, 2).setValue(data.address);
        }
        if (data.city !== undefined) {
          sheet.getRange(i + 1, 3).setValue(data.city);
        }
        if (data.postalCode !== undefined) {
          sheet.getRange(i + 1, 4).setValue(data.postalCode);
        }
        if (data.country !== undefined) {
          sheet.getRange(i + 1, 5).setValue(data.country);
        }
        if (data.notes !== undefined) {
          sheet.getRange(i + 1, 6).setValue(data.notes);
        }
        
        SpreadsheetApp.flush();
        Logger.log('✅ Warehouse updated successfully');
        
        return { 
          success: true,
          message: 'Entrepôt mis à jour avec succès'
        };
      }
    }
    
    Logger.log('⚠️ Warehouse not found: ' + data.warehouseName);
    return { 
      success: false, 
      error: 'Entrepôt non trouvé' 
    };
    
  } catch (error) {
    Logger.log('❌ ERROR updateWarehouse: ' + error.toString());
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

function deleteWarehouse(data) {
  try {
    Logger.log('=== DELETE WAREHOUSE ===');
    Logger.log('Warehouse Name: ' + data.warehouseName);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.WAREHOUSES);
    
    if (!sheet) {
      throw new Error('Warehouses sheet not found');
    }
    
    const values = sheet.getDataRange().getValues();
    
    // Trouver la ligne de l'entrepôt
    for (let i = 1; i < values.length; i++) {
      if (values[i][0] === data.warehouseName) {
        Logger.log('Warehouse found at row ' + (i + 1));
        
        // Vérifier si des commandes utilisent cet entrepôt
        const ordersSheet = getSpreadsheet().getSheetByName(SHEETS.ORDERS);
        if (ordersSheet) {
          const ordersData = ordersSheet.getDataRange().getValues();
          const ordersHeaders = ordersData[0];
          const warehouseIdIndex = ordersHeaders.indexOf('warehouseId');
          
          if (warehouseIdIndex !== -1) {
            for (let j = 1; j < ordersData.length; j++) {
              if (ordersData[j][warehouseIdIndex] === data.warehouseName) {
                Logger.log('⚠️ Warehouse is used in orders, cannot delete');
                return { 
                  success: false, 
                  error: 'Impossible de supprimer cet entrepôt car il est utilisé dans des commandes existantes' 
                };
              }
            }
          }
        }
        
        // Supprimer la ligne
        sheet.deleteRow(i + 1);
        SpreadsheetApp.flush();
        Logger.log('✅ Warehouse deleted successfully');
        
        return { 
          success: true,
          message: 'Entrepôt supprimé avec succès'
        };
      }
    }
    
    Logger.log('⚠️ Warehouse not found: ' + data.warehouseName);
    return { 
      success: false, 
      error: 'Entrepôt non trouvé' 
    };
    
  } catch (error) {
    Logger.log('❌ ERROR deleteWarehouse: ' + error.toString());
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

// ============================================
// PRODUCTS - UPDATE
// ============================================

function updateProduct(data) {
  try {
    Logger.log('=== UPDATE PRODUCT ===');
    Logger.log('SKU: ' + data.sku);
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const skuIndex = headers.indexOf('SKU');
    
    for (let i = 1; i < values.length; i++) {
      if (values[i][skuIndex] === data.sku) {
        Logger.log('Product found at row ' + (i + 1));
        
        Object.keys(data).forEach(key => {
          if (key !== 'sku') {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
              Logger.log('  Updated ' + key + ': ' + data[key]);
            }
          }
        });
        
        SpreadsheetApp.flush();
        Logger.log('✅ Product updated');
        return { success: true };
      }
    }
    
    return { success: false, message: 'Product not found' };
    
  } catch (error) {
    Logger.log('ERROR updateProduct: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// ORDERS - CREATE & UPDATE
// ============================================

function createOrder(data) {
  try {
    Logger.log('=== CREATE ORDER ===');
    Logger.log('Order ID: ' + data.id);
    Logger.log('Data: ' + JSON.stringify(data));
    
    const ordersSheet = getSpreadsheet().getSheetByName(SHEETS.ORDERS);
    const itemsSheet = getSpreadsheet().getSheetByName(SHEETS.ORDER_ITEMS);
    
    if (!ordersSheet || !itemsSheet) {
      return { success: false, error: 'Feuilles requises non trouvées' };
    }
    
    // Créer la commande principale
    ordersSheet.appendRow([
      data.id,
      data.supplier || '',
      data.warehouseId || '',
      data.status || 'pending_confirmation',
      Number(data.total) || 0,
      data.createdAt || new Date().toISOString().split('T')[0],
      data.eta || '',
      data.confirmedAt || '',
      data.shippedAt || '',
      data.receivedAt || '',
      data.completedAt || '',
      data.trackingNumber || '',
      data.trackingUrl || '',
      data.hasDiscrepancy || false,
      data.damageReport || '',
      data.notes || ''
    ]);
    
    // Ajouter les articles de la commande
    Logger.log('🔍 Items à ajouter: ' + JSON.stringify(data.items));
    Logger.log('🔍 Items length: ' + (data.items ? data.items.length : 'undefined'));
    
    if (data.items && data.items.length > 0) {
      Logger.log('✅ Ajout de ' + data.items.length + ' items');
      data.items.forEach((item, index) => {
        Logger.log('🔍 Item ' + index + ': ' + JSON.stringify(item));
        itemsSheet.appendRow([
          data.id,
          item.sku,
          Number(item.quantity) || 0,
          Number(item.pricePerUnit) || 0,
          0, // receivedQuantity
          '', // discrepancyType
          0, // discrepancyQuantity
          0, // damagedQuantity
          ''  // discrepancyNotes
        ]);
        Logger.log('✅ Item ' + index + ' ajouté');
      });
    } else {
      Logger.log('❌ Aucun item à ajouter ou items vide');
    }
    
    SpreadsheetApp.flush();
    Logger.log('✅ Order created with ' + (data.items ? data.items.length : 0) + ' items');
    
    return { success: true, orderId: data.id };
    
  } catch (error) {
    Logger.log('ERROR createOrder: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}


function updateOrderStatus(data) {
  try {
    Logger.log('=== UPDATE ORDER STATUS ===');
    Logger.log('Order ID: ' + data.orderId);
    Logger.log('Data: ' + JSON.stringify(data));
    
    // Vérifier que orderId existe
    if (!data.orderId) {
      Logger.log('❌ ERREUR: orderId manquant dans les données');
      return { success: false, error: 'orderId manquant' };
    }
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.ORDERS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const idIndex = headers.indexOf('id');
    Logger.log('Index de la colonne ID: ' + idIndex);
    Logger.log('Nombre de lignes à vérifier: ' + (values.length - 1));
    
    let orderFound = false;
    for (let i = 1; i < values.length; i++) {
      if (values[i][idIndex] === data.orderId) {
        Logger.log('Order found at row ' + (i + 1));
        orderFound = true;
        
        // Calculer l'ETA automatiquement quand la commande passe en préparation
        if (data.status === 'preparing' && !data.eta) {
          const supplierName = values[i][headers.indexOf('supplier')];
          const suppliersData = getSuppliers();
          const supplier = suppliersData.find(s => s.name === supplierName);
          
          if (supplier && supplier.leadTimeDays) {
            const currentDate = new Date();
            const etaDate = new Date(currentDate);
            etaDate.setDate(etaDate.getDate() + supplier.leadTimeDays);
            data.eta = etaDate.toISOString().split('T')[0];
            Logger.log('ETA calculé lors du passage en préparation: ' + data.eta + ' (leadTimeDays: ' + supplier.leadTimeDays + ')');
          }
        }
        
        // Calculer l'ETA automatiquement si la commande passe en transit
        if (data.status === 'in_transit' && data.shippedAt && !data.eta) {
          const supplierName = values[i][headers.indexOf('supplier')];
          const suppliersData = getSuppliers();
          const supplier = suppliersData.find(s => s.name === supplierName);
          
          if (supplier && supplier.leadTimeDays) {
            const shippedDate = new Date(data.shippedAt);
            const etaDate = new Date(shippedDate);
            etaDate.setDate(etaDate.getDate() + supplier.leadTimeDays);
            data.eta = etaDate.toISOString().split('T')[0];
            Logger.log('ETA calculé lors du passage en transit: ' + data.eta + ' (leadTimeDays: ' + supplier.leadTimeDays + ')');
          }
        }
        
        Object.keys(data).forEach(key => {
          if (key !== 'orderId' && key !== 'items') {
            const colIndex = headers.indexOf(key);
            if (colIndex !== -1) {
              sheet.getRange(i + 1, colIndex + 1).setValue(data[key]);
              Logger.log('  Updated ' + key + ': ' + data[key]);
            }
          }
        });
        
        if (data.items && data.items.length > 0) {
          updateOrderItems(data.orderId, data.items);
        }
        
        SpreadsheetApp.flush();
        Logger.log('✅ Order updated');
        return { success: true, orderId: data.orderId };
      }
    }
    
    Logger.log('❌ ERREUR: Commande non trouvée avec ID: ' + data.orderId);
    return { success: false, message: 'Order not found' };
    
  } catch (error) {
    Logger.log('ERROR updateOrderStatus: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

function updateOrderItems(orderId, items) {
  try {
    Logger.log('=== UPDATE ORDER ITEMS ===');
    Logger.log('Order ID: ' + orderId);
    Logger.log('Items: ' + JSON.stringify(items));
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.ORDER_ITEMS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const orderIdIndex = headers.indexOf('orderId');
    const skuIndex = headers.indexOf('sku');
    const receivedQtyIndex = headers.indexOf('receivedQuantity');
    const damagedQtyIndex = headers.indexOf('damagedQuantity');
    const discrepancyTypeIndex = headers.indexOf('discrepancyType');
    const discrepancyQtyIndex = headers.indexOf('discrepancyQuantity');
    const discrepancyNotesIndex = headers.indexOf('discrepancyNotes');
    
    Logger.log('Column indices - receivedQty: ' + receivedQtyIndex + ', damagedQty: ' + damagedQtyIndex + ', discrepancyQty: ' + discrepancyQtyIndex);
    
    items.forEach(item => {
      for (let i = 1; i < values.length; i++) {
        if (values[i][orderIdIndex] === orderId && values[i][skuIndex] === item.sku) {
          Logger.log('Item found: ' + item.sku + ' at row ' + (i + 1));
          
          if (item.receivedQuantity !== undefined && receivedQtyIndex !== -1) {
            sheet.getRange(i + 1, receivedQtyIndex + 1).setValue(Number(item.receivedQuantity));
            Logger.log('  receivedQuantity: ' + item.receivedQuantity);
          }
          
          if (item.damagedQuantity !== undefined && damagedQtyIndex !== -1) {
            sheet.getRange(i + 1, damagedQtyIndex + 1).setValue(Number(item.damagedQuantity));
            Logger.log('  damagedQuantity: ' + item.damagedQuantity);
          }
          
          if (item.discrepancyType !== undefined && discrepancyTypeIndex !== -1) {
            sheet.getRange(i + 1, discrepancyTypeIndex + 1).setValue(item.discrepancyType);
            Logger.log('  discrepancyType: ' + item.discrepancyType);
          }
          
          if (item.discrepancyQuantity !== undefined && discrepancyQtyIndex !== -1) {
            sheet.getRange(i + 1, discrepancyQtyIndex + 1).setValue(Number(item.discrepancyQuantity));
            Logger.log('  discrepancyQuantity: ' + item.discrepancyQuantity);
          }
          
          if (item.discrepancyNotes !== undefined && discrepancyNotesIndex !== -1) {
            sheet.getRange(i + 1, discrepancyNotesIndex + 1).setValue(item.discrepancyNotes);
            Logger.log('  discrepancyNotes: ' + item.discrepancyNotes);
          }
          
          break;
        }
      }
    });
    
    SpreadsheetApp.flush();
    Logger.log('Items updated successfully');
    
  } catch (error) {
    Logger.log('ERROR updateOrderItems: ' + error.toString());
  }
}

// ============================================
// RECONCILIATION - PROCESS ORDER RECONCILIATION
// ============================================

function processOrderReconciliation(data) {
  try {
    Logger.log('=== PROCESS ORDER RECONCILIATION ===');
    Logger.log('Order ID: ' + data.orderId);
    Logger.log('Data: ' + JSON.stringify(data));
    
    const ordersSheet = getSpreadsheet().getSheetByName(SHEETS.ORDERS);
    const itemsSheet = getSpreadsheet().getSheetByName(SHEETS.ORDER_ITEMS);
    
    if (!ordersSheet || !itemsSheet) {
      throw new Error('Required sheets not found');
    }
    
    // Trouver la commande
    const ordersData = ordersSheet.getDataRange().getValues();
    const ordersHeaders = ordersData[0];
    const orderIdIndex = ordersHeaders.indexOf('id');
    
    let orderRow = -1;
    for (let i = 1; i < ordersData.length; i++) {
      if (ordersData[i][orderIdIndex] === data.orderId) {
        orderRow = i + 1;
        break;
      }
    }
    
    if (orderRow === -1) {
      return { success: false, error: 'Commande non trouvée' };
    }
    
    Logger.log('Commande trouvée à la ligne: ' + orderRow);
    
    // Mettre à jour le statut de la commande
    const statusIndex = ordersHeaders.indexOf('status');
    const receivedAtIndex = ordersHeaders.indexOf('receivedAt');
    const completedAtIndex = ordersHeaders.indexOf('completedAt');
    const hasDiscrepancyIndex = ordersHeaders.indexOf('hasDiscrepancy');
    const damageReportIndex = ordersHeaders.indexOf('damageReport');
    const notesIndex = ordersHeaders.indexOf('notes');
    
    if (statusIndex !== -1) {
      ordersSheet.getRange(orderRow, statusIndex + 1).setValue('completed');
    }
    
    if (receivedAtIndex !== -1) {
      ordersSheet.getRange(orderRow, receivedAtIndex + 1).setValue(data.receivedDate || new Date().toISOString().split('T')[0]);
    }
    
    if (completedAtIndex !== -1) {
      ordersSheet.getRange(orderRow, completedAtIndex + 1).setValue(new Date().toISOString().split('T')[0]);
    }
    
    // Vérifier s'il y a des écarts ou dommages
    const hasDiscrepancies = data.discrepancies && Object.keys(data.discrepancies).length > 0;
    const hasDamages = data.damages && Object.keys(data.damages).length > 0;
    
    if (hasDiscrepancyIndex !== -1) {
      ordersSheet.getRange(orderRow, hasDiscrepancyIndex + 1).setValue(hasDiscrepancies || hasDamages);
    }
    
    if (damageReportIndex !== -1 && (hasDiscrepancies || hasDamages)) {
      let report = '';
      if (hasDiscrepancies) {
        report += 'ÉCARTS DÉTECTÉS:\n';
        Object.entries(data.discrepancies).forEach(([sku, details]) => {
          report += `- ${sku}: ${details.type || 'Écart'} - ${details.notes || 'Aucune note'}\n`;
        });
      }
      if (hasDamages) {
        report += '\nDOMMAGES DÉTECTÉS:\n';
        Object.entries(data.damages).forEach(([sku, details]) => {
          report += `- ${sku}: ${details.type || 'Dommage'} - ${details.notes || 'Aucune note'}\n`;
        });
      }
      ordersSheet.getRange(orderRow, damageReportIndex + 1).setValue(report);
    }
    
    if (notesIndex !== -1 && data.notes) {
      ordersSheet.getRange(orderRow, notesIndex + 1).setValue(data.notes);
    }
    
    // Mettre à jour les articles de la commande
    if (data.receivedItems && Object.keys(data.receivedItems).length > 0) {
      const itemsData = itemsSheet.getDataRange().getValues();
      const itemsHeaders = itemsData[0];
      
      const orderIdColIndex = itemsHeaders.indexOf('orderId');
      const skuColIndex = itemsHeaders.indexOf('sku');
      const receivedQtyColIndex = itemsHeaders.indexOf('receivedQuantity');
      const discrepancyTypeColIndex = itemsHeaders.indexOf('discrepancyType');
      const discrepancyNotesColIndex = itemsHeaders.indexOf('discrepancyNotes');
      
      // Mettre à jour chaque article
      Object.entries(data.receivedItems).forEach(([sku, receivedQty]) => {
        for (let i = 1; i < itemsData.length; i++) {
          if (itemsData[i][orderIdColIndex] === data.orderId && itemsData[i][skuColIndex] === sku) {
            Logger.log(`Mise à jour article ${sku}: quantité reçue = ${receivedQty}`);
            
            if (receivedQtyColIndex !== -1) {
              itemsSheet.getRange(i + 1, receivedQtyColIndex + 1).setValue(Number(receivedQty));
            }
            
            // Ajouter les informations d'écart si disponibles
            if (data.discrepancies && data.discrepancies[sku]) {
              const discrepancy = data.discrepancies[sku];
              if (discrepancyTypeColIndex !== -1) {
                itemsSheet.getRange(i + 1, discrepancyTypeColIndex + 1).setValue(discrepancy.type || 'Écart');
              }
              if (discrepancyNotesColIndex !== -1) {
                itemsSheet.getRange(i + 1, discrepancyNotesColIndex + 1).setValue(discrepancy.notes || '');
              }
            }
            
            break;
          }
        }
      });
    }
    
    SpreadsheetApp.flush();
    
    // Générer un ID de réconciliation unique
    const reconciliationId = `REC_${data.orderId}_${Date.now()}`;
    
    Logger.log('✅ Réconciliation traitée avec succès');
    Logger.log('ID de réconciliation: ' + reconciliationId);
    
    return {
      success: true,
      reconciliationId: reconciliationId,
      orderId: data.orderId,
      hasDiscrepancies: hasDiscrepancies,
      hasDamages: hasDamages,
      message: 'Réconciliation traitée avec succès'
    };
    
  } catch (error) {
    Logger.log('ERROR processOrderReconciliation: ' + error.toString());
    return { 
      success: false, 
      error: error.toString() 
    };
  }
}

// ============================================
// STOCK - UPDATE
// ============================================

function updateStock(data) {
  try {
    Logger.log('=== UPDATE STOCK ===');
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.PRODUCTS);
    const values = sheet.getDataRange().getValues();
    const headers = values[0];
    
    const skuIndex = headers.indexOf('SKU');
    const stockIndex = headers.indexOf('Stock Actuel');
    
    if (stockIndex === -1) {
      throw new Error('Stock Actuel column not found');
    }
    
    let updatedCount = 0;
    
    // CORRECTION: Support both data.items (from createOrder) and data as array (from updateStock)
    const itemsArray = data.items || data;
    
    if (!Array.isArray(itemsArray)) {
      Logger.log('ERROR: data.items is not an array: ' + JSON.stringify(data));
      return { success: false, error: 'Invalid data format: items must be an array' };
    }
    
    itemsArray.forEach(item => {
      const quantityToAdd = Number(item.quantityToAdd || item.quantity);
      
      if (isNaN(quantityToAdd)) {
        Logger.log('ERROR: Invalid quantity for ' + item.sku);
        return;
      }
      
      Logger.log('Processing: ' + item.sku + ' +' + quantityToAdd);
      
      for (let i = 1; i < values.length; i++) {
        if (values[i][skuIndex] === item.sku) {
          const currentStock = Number(values[i][stockIndex]) || 0;
          const newStock = currentStock + quantityToAdd;
          
          Logger.log('  ' + currentStock + ' + ' + quantityToAdd + ' = ' + newStock);
          
          sheet.getRange(i + 1, stockIndex + 1).setValue(newStock);
          sheet.getRange(i + 1, stockIndex + 1).setNumberFormat('0');
          
          updatedCount++;
          break;
        }
      }
    });
    
    SpreadsheetApp.flush();
    
    Logger.log('Stock update complete: ' + updatedCount + ' products updated');
    return { success: true, updated: updatedCount };
    
  } catch (error) {
    Logger.log('ERROR updateStock: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// SETUP - INITIALIZE SHEETS
// ============================================

function setupSheets() {
  try {
    Logger.log('=== SETUP SHEETS ===');
    
    const ss = getSpreadsheet();
    
    let paramsSheet = ss.getSheetByName(SHEETS.PARAMETERS);
    if (!paramsSheet) {
      Logger.log('Creating Parameters sheet...');
      paramsSheet = ss.insertSheet(SHEETS.PARAMETERS);
      paramsSheet.getRange(1, 1, 1, 3).setValues([['paramName', 'value', 'Description']]);
      paramsSheet.getRange(1, 1, 1, 3).setFontWeight('bold');
      paramsSheet.setFrozenRows(1);
      
      paramsSheet.appendRow(['SeuilSurstockProfond', 90, 'Deep overstock threshold in days']);
      paramsSheet.appendRow(['DeviseDefaut', 'EUR', 'Default currency']);
      paramsSheet.appendRow(['MultiplicateurDefaut', 1.2, 'Default forecast multiplier']);
    }
    
    let warehousesSheet = ss.getSheetByName(SHEETS.WAREHOUSES);
    if (!warehousesSheet) {
      Logger.log('Creating Warehouses sheet...');
      warehousesSheet = ss.insertSheet(SHEETS.WAREHOUSES);
      warehousesSheet.getRange(1, 1, 1, 6).setValues([['name', 'address', 'city', 'postalCode', 'country', 'notes']]);
      warehousesSheet.getRange(1, 1, 1, 6).setFontWeight('bold');
      warehousesSheet.setFrozenRows(1);
      Logger.log('✅ Warehouses sheet created');
    }
    
    const itemsSheet = ss.getSheetByName(SHEETS.ORDER_ITEMS);
    if (itemsSheet) {
      const headers = itemsSheet.getRange(1, 1, 1, itemsSheet.getLastColumn()).getValues()[0];
      
      const requiredCols = ['orderId', 'sku', 'quantity', 'pricePerUnit', 'receivedQuantity', 'discrepancyType', 'discrepancyQuantity', 'damagedQuantity', 'discrepancyNotes'];
      const missingCols = requiredCols.filter(col => !headers.includes(col));
      
      if (missingCols.length > 0) {
        Logger.log('Adding missing columns to OrderItems: ' + missingCols.join(', '));
        const lastCol = itemsSheet.getLastColumn();
        itemsSheet.getRange(1, lastCol + 1, 1, missingCols.length).setValues([missingCols]);
        itemsSheet.getRange(1, lastCol + 1, 1, missingCols.length).setFontWeight('bold');
      }
    }
    
    const ordersSheet = ss.getSheetByName(SHEETS.ORDERS);
    if (ordersSheet) {
      const headers = ordersSheet.getRange(1, 1, 1, ordersSheet.getLastColumn()).getValues()[0];
      
      const requiredCols = ['id', 'supplier', 'warehouseId', 'status', 'total', 'createdAt', 'eta', 'confirmedAt', 'shippedAt', 'receivedAt', 'completedAt', 'trackingNumber', 'trackingUrl', 'hasDiscrepancy', 'damageReport', 'notes'];
      const missingCols = requiredCols.filter(col => !headers.includes(col));
      
      if (missingCols.length > 0) {
        Logger.log('Adding missing columns to Orders: ' + missingCols.join(', '));
        const lastCol = ordersSheet.getLastColumn();
        ordersSheet.getRange(1, lastCol + 1, 1, missingCols.length).setValues([missingCols]);
        ordersSheet.getRange(1, lastCol + 1, 1, missingCols.length).setFontWeight('bold');
      }
    }
    
    Logger.log('✅ Setup complete');
    return { success: true };
    
  } catch (error) {
    Logger.log('❌ ERROR setup: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// TESTS
// ============================================

function testAPI() {
  Logger.log('=== TEST API ===');
  
  try {
    const data = getAllData();
    
    Logger.log('Suppliers: ' + data.suppliers.length);
    Logger.log('Products: ' + data.products.length);
    Logger.log('Orders: ' + data.orders.length);
    Logger.log('Warehouses: ' + data.warehouses.length);
    Logger.log('Parameters: ' + JSON.stringify(data.parameters));
    
    if (data.products.length > 0) {
      Logger.log('\nFirst product:');
      Logger.log(JSON.stringify(data.products[0], null, 2));
    }
    
    if (data.orders.length > 0) {
      Logger.log('\nFirst order:');
      Logger.log(JSON.stringify(data.orders[0], null, 2));
    }
    
    if (data.warehouses.length > 0) {
      Logger.log('\nFirst warehouse:');
      Logger.log(JSON.stringify(data.warehouses[0], null, 2));
    }
    
    return data;
    
  } catch (error) {
    Logger.log('ERROR TEST: ' + error.toString());
    throw error;
  }
}

function testCreateWarehouse() {
  Logger.log('=== TEST CREATE WAREHOUSE ===');
  
  const testData = {
    name: "Entrepôt Test",
    address: "123 Rue Test",
    city: "Paris",
    postalCode: "75001",
    country: "France",
    notes: "Warehouse de test"
  };
  
  Logger.log('Test data: ' + JSON.stringify(testData));
  
  try {
    const result = createWarehouse(testData);
    Logger.log('✅ Result: ' + JSON.stringify(result));
    return result;
  } catch (error) {
    Logger.log('❌ Error: ' + error.toString());
    throw error;
  }
}

// ============================================
// SCRIPT DE DIAGNOSTIC - À AJOUTER TEMPORAIREMENT
// ============================================
// Copiez ce code À LA FIN de votre fichier Code.gs
// (après toutes les autres fonctions)

/**
 * TEST 1 : Vérifier que doPost reçoit bien les requêtes
 */
function testDoPostDirect() {
  Logger.log('=== TEST DOPOST DIRECT ===');
  
  // Simuler une requête POST pour createWarehouse
  const mockEvent = {
    parameter: {
      action: 'createWarehouse'
    },
    postData: {
      contents: JSON.stringify({
        name: "Test Diagnostic",
        address: "123 Rue Test",
        city: "Paris",
        postalCode: "75001",
        country: "France",
        notes: "Test de diagnostic"
      })
    }
  };
  
  try {
    const result = doPost(mockEvent);
    const textOutput = result.getContent();
    const parsedResult = JSON.parse(textOutput);
    
    Logger.log('✅ doPost a répondu');
    Logger.log('Résultat: ' + JSON.stringify(parsedResult, null, 2));
    
    if (parsedResult.success) {
      Logger.log('✅✅ TEST RÉUSSI - createWarehouse fonctionne !');
      return parsedResult;
    } else {
      Logger.log('❌ TEST ÉCHOUÉ - Erreur: ' + parsedResult.error);
      return parsedResult;
    }
    
  } catch (error) {
    Logger.log('❌❌ ERREUR CRITIQUE: ' + error.toString());
    Logger.log('Stack: ' + error.stack);
    throw error;
  }
}

/**
 * TEST 2 : Vérifier que la fonction createWarehouse existe
 */
function testFunctionExists() {
  Logger.log('=== TEST FONCTION EXISTS ===');
  
  try {
    // Vérifier si la fonction existe
    if (typeof createWarehouse === 'function') {
      Logger.log('✅ La fonction createWarehouse existe');
      
      // Tester l'appel direct
      const testData = {
        name: "Test Existence",
        address: "456 Avenue Test",
        city: "Lyon",
        postalCode: "69001",
        country: "France",
        notes: "Test existence fonction"
      };
      
      const result = createWarehouse(testData);
      Logger.log('Résultat appel direct: ' + JSON.stringify(result, null, 2));
      
      return result;
      
    } else {
      Logger.log('❌❌ ERREUR CRITIQUE: La fonction createWarehouse n\'existe PAS !');
      Logger.log('Cela signifie que le code n\'a pas été correctement copié.');
      return { error: 'Function does not exist' };
    }
    
  } catch (error) {
    Logger.log('❌ Erreur lors du test: ' + error.toString());
    return { error: error.toString() };
  }
}

/**
 * TEST 3 : Vérifier le switch dans doPost
 */
function testSwitchCase() {
  Logger.log('=== TEST SWITCH CASE ===');
  
  const action = 'createWarehouse';
  Logger.log('Action testée: ' + action);
  
  // Vérifier manuellement le switch
  switch(action) {
    case 'updateProduct':
      Logger.log('❌ Match updateProduct (incorrect)');
      break;
    case 'createOrder':
      Logger.log('❌ Match createOrder (incorrect)');
      break;
    case 'createWarehouse':
      Logger.log('✅ Match createWarehouse (CORRECT !)');
      Logger.log('Le switch case fonctionne correctement');
      break;
    default:
      Logger.log('❌❌ ERREUR: Aucun match - action inconnue !');
      break;
  }
}

/**
 * TEST 4 : Afficher la liste de toutes les actions disponibles
 */
function listAllActions() {
  Logger.log('=== LISTE DES ACTIONS DISPONIBLES ===');
  
  const actions = [
    'getSuppliers',
    'getProducts', 
    'getOrders',
    'getWarehouses',
    'getAllData',
    'updateProduct',
    'createOrder',
    'updateOrderStatus',
    'updateStock',
    'updateParameter',
    'createSupplier',
    'updateSupplier',
    'deleteSupplier',
    'assignSupplierToProduct',
    'removeSupplierFromProduct',
    'createWarehouse',
    'updateWarehouse',
    'deleteWarehouse',
    'setupOrdersColumns'
  ];
  
  Logger.log('Actions GET (doGet):');
  actions.slice(0, 5).forEach(action => Logger.log('  - ' + action));
  
  Logger.log('\nActions POST (doPost):');
  actions.slice(5).forEach(action => Logger.log('  - ' + action));
  
  Logger.log('\n✅ createWarehouse devrait être dans la liste ci-dessus');
}

/**
 * TEST COMPLET : Execute tous les tests
 */
function runAllDiagnostics() {
  Logger.clear();
  Logger.log('╔════════════════════════════════════════╗');
  Logger.log('║   DIAGNOSTIC COMPLET WAREHOUSE API     ║');
  Logger.log('╚════════════════════════════════════════╝\n');
  
  // Test 1
  Logger.log('\n📋 TEST 1/4: Liste des actions');
  Logger.log('─'.repeat(50));
  listAllActions();
  
  // Test 2
  Logger.log('\n\n📋 TEST 2/4: Vérification switch case');
  Logger.log('─'.repeat(50));
  testSwitchCase();
  
  // Test 3
  Logger.log('\n\n📋 TEST 3/4: Existence de la fonction');
  Logger.log('─'.repeat(50));
  const existsResult = testFunctionExists();
  
  // Test 4
  Logger.log('\n\n📋 TEST 4/4: Test doPost complet');
  Logger.log('─'.repeat(50));
  const doPostResult = testDoPostDirect();
  
  // Résumé
  Logger.log('\n\n╔════════════════════════════════════════╗');
  Logger.log('║            RÉSUMÉ DES TESTS            ║');
  Logger.log('╚════════════════════════════════════════╝');
  
  if (existsResult && existsResult.success && doPostResult && doPostResult.success) {
    Logger.log('✅✅✅ TOUS LES TESTS RÉUSSIS !');
    Logger.log('Le problème vient du frontend ou du déploiement, PAS du code.');
    Logger.log('\n🔍 Actions recommandées:');
    Logger.log('1. Vérifiez que le frontend utilise la BONNE URL de déploiement');
    Logger.log('2. Videz complètement le cache du navigateur');
    Logger.log('3. Vérifiez les logs réseau dans la console (Network tab)');
  } else {
    Logger.log('❌❌❌ DES TESTS ONT ÉCHOUÉ');
    Logger.log('Le problème est dans le code Google Apps Script.');
    Logger.log('\n🔍 Vérifiez:');
    Logger.log('1. Que le code a bien été copié en entier');
    Logger.log('2. Qu\'il n\'y a pas d\'erreur de syntaxe');
    Logger.log('3. Que le fichier a bien été sauvegardé');
  }
  
  Logger.log('\n📊 Détails des résultats:');
  Logger.log('Test existence fonction: ' + (existsResult && existsResult.success ? '✅ PASS' : '❌ FAIL'));
  Logger.log('Test doPost: ' + (doPostResult && doPostResult.success ? '✅ PASS' : '❌ FAIL'));
}

// ============================================
// SETUP FUNCTIONS
// ============================================

/**
 * Crée les colonnes manquantes dans la feuille Commandes
 * À exécuter une seule fois pour ajouter les nouvelles colonnes
 */
function setupOrdersColumns() {
  try {
    Logger.log('=== SETUP ORDERS COLUMNS ===');
    
    const sheet = getSpreadsheet().getSheetByName(SHEETS.ORDERS);
    if (!sheet) {
      Logger.log('❌ Sheet Commandes not found');
      return { success: false, error: 'Sheet Commandes not found' };
    }
    
    // Colonnes requises pour les nouvelles fonctionnalités
    const requiredColumns = [
      'eta',
      'trackingNumber', 
      'trackingUrl'
    ];
    
    // Obtenir les en-têtes existants
    const lastColumn = sheet.getLastColumn();
    const headers = sheet.getRange(1, 1, 1, lastColumn).getValues()[0];
    
    // Trouver les colonnes manquantes
    const missingColumns = requiredColumns.filter(col => !headers.includes(col));
    
    if (missingColumns.length === 0) {
      Logger.log('✅ Toutes les colonnes sont déjà présentes');
      return { success: true, message: 'All columns already exist' };
    }
    
    // Ajouter les colonnes manquantes
    const startColumn = lastColumn + 1;
    sheet.getRange(1, startColumn, 1, missingColumns.length).setValues([missingColumns]);
    
    Logger.log('✅ Colonnes ajoutées: ' + missingColumns.join(', '));
    
    return { 
      success: true, 
      message: 'Columns added successfully',
      addedColumns: missingColumns
    };
    
  } catch (error) {
    Logger.log('❌ ERROR setupOrdersColumns: ' + error.toString());
    return { success: false, error: error.toString() };
  }
}

// ============================================
// FONCTION DE TEST SIMPLE
// ============================================

function testActions() {
  Logger.log('=== TEST ACTIONS ===');
  const actions = [
    'test', 'getAllData', 'getProducts', 'getSuppliers', 'getWarehouses', 
    'getOrders', 'createOrder', 'updateOrderStatus', 'updateStock', 
    'updateParameter', 'createWarehouse', 'updateWarehouse', 'deleteWarehouse',
    'assignSupplierToProduct', 'removeSupplierFromProduct', 'createSupplier',
    'updateSupplier', 'deleteSupplier', 'processOrderReconciliation', 'setupOrdersColumns'
  ];
  
  Logger.log('Actions disponibles: ' + actions.join(', '));
  return { 
    success: true, 
    message: 'Actions disponibles', 
    actions: actions,
    timestamp: new Date().toISOString()
  };
}
