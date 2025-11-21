// 🛡️ SÉCURITÉ : Mettre à false pour désactiver une phase si elle casse
export const REFACTOR_FLAGS = {
  PHASE_1_ACTIVE: true, // Constantes (kpiTitles, statusLabels) - Aligné avec cursorrules.txt PHASE_1
  PHASE_2_ACTIVE: true, // Fonctions pures (getUserSignature, generateEmailDraft, generateReclamationEmail, exportHistoryToCSV) - Aligné avec cursorrules.txt PHASE_2
  PHASE_3_ACTIVE: true, // Handlers paramètres (handleUpdateSeuilSurstock, handleUpdateDevise, handleUpdateMultiplicateur)
  PHASE_4_ACTIVE: true, // Handlers warehouses (handleCreateWarehouse, handleUpdateWarehouse, handleDeleteWarehouse)
  PHASE_5_ACTIVE: true, // Handlers mapping (handleAssignSupplier, handleRemoveSupplierFromProduct)
  PHASE_6_ACTIVE: false, // Handlers produits - CODE SUPPRIMÉ (fonctions non utilisées)
  PHASE_7_ACTIVE: true, // Calculs useMemo (productsByStatus, toOrderBySupplier, notifications) - Aligné avec cursorrules.txt PHASE_6
  PHASE_8_ACTIVE: true, // Handlers commandes simples (handleCreateOrderFromTable, handleCreateOrder)
  PHASE_9_ACTIVE: true, // Handlers réconciliation (confirmReconciliationWithQuantities, handleReconciliationConfirm)
  // NE PAS TOUCHER
  KEEP_OLD_CODE: true,   // Garde l'ancien code commenté
  SAFE_MODE: true        // Mode ultra-sécurisé
};

// Fonction de vérification
export function checkRefactorStatus() {
  console.log('🛡️ Refactorisation Status:');
  Object.entries(REFACTOR_FLAGS).forEach(([key, value]) => {
    if (key.includes('PHASE')) {
      console.log(`${value ? '✅' : '❌'} ${key}`);
    }
  });
}

