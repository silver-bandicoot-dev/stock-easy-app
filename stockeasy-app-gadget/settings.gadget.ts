import type { GadgetSettings } from "gadget-server";

export const settings: GadgetSettings = {
  type: "gadget/settings/v1",
  frameworkVersion: "v1.5.0",
  plugins: {
    connections: {
      shopify: {
        apiVersion: "2025-10",
        enabledModels: [
          "shopifyAppInstallation",
          "shopifyInventoryItem",
          "shopifyLocation",
          "shopifyOrder",
          "shopifyOrderLineItem",
          "shopifyProduct",
        ],
        type: "partner",
        scopes: [
          "write_inventory",
          "write_locations",
          "write_orders",
          "write_products",
          "read_products",
          "read_orders",
          "read_inventory",
        ],
      },
    },
  },
};
