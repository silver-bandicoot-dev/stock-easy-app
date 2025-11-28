import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "productMapping" model, go to https://stockeasy-app.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "Vs5vCFyT_6UB",
  comment:
    "This model represents the mapping between Shopify products/variants and StockEasy SKUs, used for product reconciliation.",
  fields: {
    lastSyncDirection: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["supabase_to_shopify", "shopify_to_supabase"],
      storageKey: "syncDir_antiLoop_v1",
    },
    lastSyncedAt: {
      type: "dateTime",
      includeTime: true,
      storageKey: "xPJI1RIVGMp4",
    },
    productTitle: { type: "string", storageKey: "9p7Sn7mynwte" },
    shop: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "shopifyShop" },
      storageKey: "PvY5VVDcWfwN",
      searchIndex: false,
    },
    shopifyInventoryItemId: {
      type: "string",
      storageKey: "Bb3-Nd06hZMi",
    },
    shopifyProductId: {
      type: "string",
      validations: { required: true },
      storageKey: "uNL5pPGTtZMe",
    },
    shopifySku: { type: "string", storageKey: "COxBFSZ0WPjF" },
    shopifyVariantId: {
      type: "string",
      validations: {
        required: true,
        unique: { scopeByField: "shop" },
      },
      storageKey: "V7UPKh45X6dF",
    },
    stockEasyProductId: {
      type: "string",
      storageKey: "7TzjB5wZ4c-O",
      searchIndex: false,
    },
    stockEasySku: {
      type: "string",
      validations: { required: true },
      storageKey: "LMVb1fevMAkz",
    },
    syncSource: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["shopify", "stockeasy", "manual"],
      storageKey: "yONLx0DIeFXK",
    },
    variantTitle: { type: "string", storageKey: "pq1Kx4KwNvfz" },
  },
};
