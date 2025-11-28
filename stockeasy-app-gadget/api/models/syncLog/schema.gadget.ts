import type { GadgetModel } from "gadget-server";

// This file describes the schema for the "syncLog" model, go to https://stockeasy-app.gadget.app/edit to view/edit your model in Gadget
// For more information on how to update this file http://docs.gadget.dev

export const schema: GadgetModel = {
  type: "gadget/model-schema/v2",
  storageKey: "rHX4oS_a_do2",
  comment:
    "This model represents a log of synchronization events between Shopify and Stockeasy, used for auditing and debugging purposes.",
  fields: {
    direction: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["shopify_to_stockeasy", "stockeasy_to_shopify"],
      validations: { required: true },
      storageKey: "1hhMNezuij8M",
    },
    entity: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: [
        "product",
        "inventory",
        "order",
        "webhook",
        "api_call",
        "warehouse",
      ],
      validations: { required: true },
      storageKey: "tImV9hRo6ZK-",
    },
    message: { type: "string", storageKey: "wqC9YtAEG65G" },
    operation: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["create", "update", "delete", "sync", "error"],
      validations: { required: true },
      storageKey: "iy_--Rbn0p8o",
    },
    payload: {
      type: "json",
      storageKey: "t7TWp80ko_Iq",
      filterIndex: false,
      searchIndex: false,
    },
    processingTimeMs: {
      type: "number",
      decimals: 0,
      storageKey: "SlQbyyJetTPL",
      searchIndex: false,
    },
    shop: {
      type: "belongsTo",
      validations: { required: true },
      parent: { model: "shopifyShop" },
      storageKey: "omrWtSwfDXH2",
      searchIndex: false,
    },
    shopifyId: { type: "string", storageKey: "4ElZOy27htWO" },
    status: {
      type: "enum",
      acceptMultipleSelections: false,
      acceptUnlistedOptions: false,
      options: ["success", "error", "pending", "skipped"],
      validations: { required: true },
      storageKey: "RO4XyHYA3vcr",
    },
    stockEasySku: { type: "string", storageKey: "-RTsAnV75dKg" },
    webhookTopic: { type: "string", storageKey: "bKy5RBWz4Ln4" },
  },
};
