/**
 * Stockeasy Help Center Content - English Version
 * Complete documentation for merchants - Version 2.0 (Audit & Redesign)
 */

import {
  Rocket,
  ShoppingBag,
  RefreshCw,
  Package,
  Truck,
  Activity,
  ClipboardList,
  TrendingUp,
  Settings,
  AlertTriangle,
  HelpCircle,
  LayoutDashboard,
  Lightbulb,
  Zap
} from 'lucide-react';

// Help center categories
export const HELP_CATEGORIES = [
  {
    id: 'onboarding',
    title: 'Quick Start',
    description: 'Your first successes in 5 minutes',
    icon: Rocket,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    id: 'dashboard',
    title: 'Daily Management',
    description: 'Your efficient morning routine',
    icon: LayoutDashboard,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'orders',
    title: 'Restock',
    description: 'Order at the right time',
    icon: ShoppingBag,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 'tracking',
    title: 'Tracking & Receiving',
    description: 'From order to warehouse',
    icon: Truck,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  },
  {
    id: 'stock',
    title: 'Stock Health',
    description: 'Avoid stockouts and overstock',
    icon: Activity,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  {
    id: 'inventory',
    title: 'Inventory Ledger',
    description: 'Your accounting source of truth',
    icon: ClipboardList,
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  },
  {
    id: 'analytics',
    title: 'Analytics & AI',
    description: 'Understand to decide better',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-pink-500 to-pink-600'
  },
  {
    id: 'settings',
    title: 'Settings',
    description: 'Customize your experience',
    icon: Settings,
    color: 'bg-gradient-to-br from-slate-600 to-slate-700'
  },
  {
    id: 'troubleshooting',
    title: 'Help & Support',
    description: 'Solutions to common problems',
    icon: AlertTriangle,
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  }
];

// Documentation articles
export const HELP_ARTICLES = {
  // ============================================
  // ONBOARDING (QUICK START)
  // ============================================
  onboarding: [
    {
      id: 'welcome',
      title: 'Welcome: Your mission starts here',
      summary: 'Why Stockeasy will change your daily life as a merchant.',
      content: `
## Welcome to the Stockeasy adventure!

Managing inventory is a bit like juggling: you have to maintain the balance between **having enough products** to sell, and **not having too many** to avoid tying up your cash flow. Stockeasy is here to catch the balls before they fall.

### What you will accomplish

With Stockeasy, you move from "Reaction" mode to "Anticipation" mode:

1.  **No more Excel files**: Everything is automated and synced with Shopify.
2.  **No more "I think there's some left"**: You'll know exactly when to order.
3.  **No more idle money**: Identify dead stock that's hurting your profitability.

> **Did you know?**
> An average merchant loses **15% of their annual revenue** due to stockouts. Our goal is to reduce this to 0%.

### Your success journey in 3 steps

1.  **Connect** your store (Done?)
2.  **Configure** your suppliers (The key to good calculations!)
3.  **Follow** our order recommendations.

Ready? Read the next article to connect your store.
      `
    },
    {
      id: 'shopify-connection',
      title: 'Shopify Sync: The heart of the system',
      summary: 'How we retrieve your data to work.',
      content: `
## Connecting your store: The foundation

For Stockeasy to be smart, it needs data. By connecting Shopify, you give us access to your activity history.

### What we sync (and why)

| Data | Why is it crucial? |
|------|-------------------|
| **Products** | To know what you sell, your prices, and your SKUs. |
| **Orders** | To analyze your sales pace and predict the future. |
| **Inventory** | To know your current starting point. |

### Sync FAQ

**"Will this slow down my site?"**
No. We use Shopify's official APIs in the background. Your customer site stays lightning fast.

**"How long does it take?"**
The first time, it may take a few minutes if you have thousands of products. After that, it's almost instant.

> **Pro Tip**: 
> If you add a new product on Shopify, it will appear in Stockeasy at the next automatic sync (every hour) or if you click the "Refresh" button in the top right.
      `
    },
    {
      id: 'create-suppliers',
      title: 'Suppliers: The secret to good calculations',
      summary: 'Why configuring your suppliers is the most important step.',
      content: `
## No suppliers, no magic!

This is the #1 mistake new users make: neglecting supplier configuration.
For Stockeasy to tell you **"Order now!"**, it needs to know **"How long does it take to arrive?"**.

### Anatomy of a well-configured supplier

Go to **Settings > Suppliers** and create your partners.

#### 1. Lead Time
This is the time between clicking "Send order" and receiving the boxes.
*   *Example:* If your Chinese supplier takes 30 days to produce + 15 days by sea = **45 days**.
*   *Impact:* If you enter 5 days instead of 45, you'll be out of stock for 40 days!

#### 2. Safety Stock Days
This is your safety cushion. How many days do you want to "hold" in case of delay?

### Linking products (Mapping)

Once the supplier is created, go to **Settings > Mapping**.
You need to tell Stockeasy: *"This Blue T-shirt comes from Paris Wholesaler"*.

> **Quick Tip**
> You can assign products in bulk! Select 50 products at once and assign them to the same supplier in 2 clicks.
      `
    },
    {
      id: 'initial-setup',
      title: 'Initial Settings: Your compass',
      summary: 'Currency, thresholds, and safety.',
      content: `
## Adjust Stockeasy to your reality

Every business is unique. A fresh product seller doesn't manage inventory like a furniture seller.

Go to **Settings > General**.

### 1. Overstock Threshold (The financial red zone)
When do you consider a product has been "sleeping" too long?
*   **Fashion / Trend**: 60 days (Turns fast!)
*   **Standard**: 90 days (Recommended)
*   **Spare parts / Furniture**: 180 days

### 2. Safety Multiplier (Your insurance)
This is a small coefficient we apply to your forecasted sales to never run short.
*   **1.0**: You're a risk-taker. We order exactly what we expect to sell.
*   **1.2 (Default)**: We plan 20% more "just in case". This is the standard.
*   **1.5**: You hate stockouts and have warehouse space.

> **Expert Advice**
> Start with the default settings (**90 days** and **1.2**). Let it run for a month, then adjust if you find you're stocking too much or not enough.
      `
    }
  ],

  // ============================================
  // DASHBOARD (DAILY MANAGEMENT)
  // ============================================
  dashboard: [
    {
      id: 'dashboard-routine',
      title: 'Your 30-second morning routine',
      summary: 'How to read your dashboard efficiently.',
      content: `
## Morning coffee with Stockeasy

Your dashboard isn't there to look pretty. It's designed to answer one question: **"What's burning today?"**

### Priority reading order

1.  **Red Badge "To Order"**: This is the absolute emergency. These products will soon be out of stock (or already are).
    *   *Action:* Click on it to create supplier orders.

2.  **Active Orders**: Where are my shipments?
    *   *Action:* Check if there are any delivery delays.

3.  **Stock Health**: The overall weather.
    *   If the green bar is growing: Congratulations, your management is improving.
    *   If red is gaining ground: Warning, your restock parameters may be too tight.

### The Performance Chart

It compares your actual revenue vs your Goals. It's your daily motivation!
      `
    }
  ],

  // ============================================
  // ORDERS (RESTOCK)
  // ============================================
  orders: [
    {
      id: 'order-logic',
      title: 'The magic of order calculation',
      summary: 'How we decide WHEN and HOW MUCH to order.',
      content: `
## "How did you know I needed to order that?"

This is the question we get asked the most. Here's the behind-the-scenes of our algorithm, explained simply.

### The White T-shirt example

Let's imagine:
*   You sell an average of **2 T-shirts per day**.
*   Your supplier takes **10 days** to deliver.
*   You want **5 days** of safety stock.

#### 1. When to order? (The Reorder Point)
You need to order when you have enough stock to last through delivery + safety.
*   Need during delivery: 10 days × 2 sales = 20 T-shirts.
*   Safety: 5 days × 2 sales = 10 T-shirts.
*   **Result**: As soon as your stock drops to **30 T-shirts**, Stockeasy sounds the alarm! 🚨

#### 2. How much to order?
The goal is to raise stock to a comfortable level (e.g., to last 60 days).
*   Target: 60 days × 2 sales = 120 T-shirts.
*   If you have 30, Stockeasy will suggest ordering **90**.

> **Did you know?**
> Our algorithm smooths out exceptional spikes. If an influencer talks about you and you sell 50 T-shirts on a Tuesday (when it's usually 2), we won't ask you to order 5000 the next day. We analyze the long-term trend.
      `
    },
    {
      id: 'create-po',
      title: 'Creating and sending an order (PO)',
      summary: 'The A to Z process for restocking.',
      content: `
## From recommendation to purchase order

In the "Place Order" tab, Stockeasy has already done the sorting work for you.

### Step 1: Verification (The "Sanity Check")
Stockeasy suggests, but YOU decide.
*   Look at the "Rec Qty" column (Recommended Quantity).
*   Do you know something we don't? (E.g., "This product is being discontinued").
*   Manually modify the number if needed.

### Step 2: Validation
Click on **"Create Order"**.
*   A window opens with the summary.
*   Choose the destination warehouse (Important for receiving!).

### Step 3: Sending to supplier
Two options are available:
1.  **Email Send**: If you've connected Gmail/Outlook, a clean draft is ready to go with the PDF attached.
2.  **CSV/PDF Export**: Download the purchase order to send via WhatsApp, WeChat, or your own email system.

> **Important Note**
> Until you click "Confirm", the order remains a "Draft". The "On Order" stock is only updated after confirmation.
      `
    }
  ],

  // ============================================
  // TRACKING (TRACKING & RECEIVING)
  // ============================================
  tracking: [
    {
      id: 'receiving',
      title: 'Receiving an order (Check-in)',
      summary: 'Turning received boxes into sellable stock.',
      content: `
## The moment of truth: The delivery has arrived

The truck has left, the boxes are in the warehouse. Now you need to tell Stockeasy (and Shopify) that the stock is here.

### Why use Reconciliation?
Don't just manually modify stock in Shopify!
The "Reconciliation" function allows you to:
1.  Check if products are missing.
2.  Track who received what and when.
3.  Update the "Weighted Average Cost" (if your purchase prices change).

### The 3-click procedure

1.  Go to **My Orders** > **In Transit** tab.
2.  Open the concerned order and click **"Receive"**.
3.  **Count!**
    *   If everything is perfect: Click "Receive All".
    *   If there are discrepancies: Enter the actual quantity received.

### Handling problems (Missing/Damaged)
If you expected 100 pieces and only received 90:
*   Enter "90" in the "Received" box.
*   Stockeasy will mark the order as "Partially Received".
*   You can either **close** the order (and request a refund), or leave the rest **pending** (Backorder) if the supplier will send the remainder later.
      `
    }
  ],

  // ============================================
  // STOCK & INVENTORY (HEALTH & INVENTORY)
  // ============================================
  stock: [
    {
      id: 'stock-health-colors',
      title: 'Understanding health colors',
      summary: 'Green, Orange, Red: What to do?',
      content: `
## The Traffic Light of your Stock

We've simplified complex analysis into a simple color code.

### 🔴 Red: URGENT (Imminent stockout)
*   **Situation**: You have fewer days of stock than your supplier's delivery time.
*   **Translation**: Even if you order *now*, you risk being out of stock before it arrives.
*   **Action**: Order immediately! Consider express delivery if possible.

### 🟠 Orange: WATCH (Attention zone)
*   **Situation**: You're approaching the reorder point.
*   **Translation**: You still have stock, but you need to prepare the next order this week.
*   **Action**: Check if you can bundle with other products to reach the minimum order value (Franco).

### 🟢 Green: HEALTHY (Comfort zone)
*   **Situation**: You have enough stock to see ahead.
*   **Action**: Nothing to do. Sleep peacefully.

### 🔵 Blue: OVERSTOCK (Too much fat)
*   **Situation**: You have more than 90 days (or your custom threshold) of stock.
*   **Risk**: Your money is stuck on shelves.
*   **Action**: Plan a promotion, bundle, or marketing push to move this surplus and recover cash.
      `
    },
    {
      id: 'abc-analysis',
      title: 'Expert Inventory (ABC)',
      summary: 'Not all products are equal.',
      content: `
## The Pareto Law (80/20) in your stock

In the Inventory tab, don't treat all products equally.

### Class A: The Stars 🌟
These are your 20% of products that make 80% of your revenue.
*   **Strategy**: Zero tolerance for stockouts. Overstock slightly if needed. Watch them like a hawk.

### Class B: The Classics 👔
Regular products, stable sales.
*   **Strategy**: Automate as much as possible with standard settings.

### Class C: The "Slow movers" 🐌
Products that sell little, accessories, old collections.
*   **Strategy**: Beware of overstock! Only reorder if you have a firm customer order. Don't hesitate to liquidate to make room.

> **Tip**: Use column filters in the Inventory tab to sort by "Stock Value (Sales)" and identify your A, B, C classes.
      `
    }
  ],

  // ============================================
  // ANALYTICS & AI
  // ============================================
  analytics: [
    {
      id: 'forecast-explained',
      title: 'How does AI predict the future?',
      summary: 'Seasonality, trend, and noise.',
      content: `
## No crystal ball, just mathematics

Stockeasy uses advanced statistical models to draw the dotted line of the future.

### What AI detects

1.  **Trend**: "Your beanie sales are increasing by 10% every month for 3 months."
2.  **Seasonality**: "Every year in November, sales double." (We need at least 12 months of history to be accurate here).
3.  **Exceptional events**: If you ran a big "Buy 1 Get 1 Free" promo last year, AI tries to understand that's not "normal" demand.

### Helping AI get better

AI learns from your past.
*   **If you're often out of stock**: AI sees 0 sales and may think demand has dropped. Stockeasy corrects this by checking if stock was at 0.
*   **Be consistent**: The cleaner your data (up-to-date stock, validated receipts), the finer the prediction.
      `
    }
  ],

  // ============================================
  // SETTINGS
  // ============================================
  settings: [
    {
      id: 'integrations-setup',
      title: 'Connect your emails (Gmail / Outlook)',
      summary: 'Send supplier orders directly from Stockeasy.',
      content: `
## Simplify your order sending

Stockeasy can connect to your Gmail or Outlook account to send Purchase Orders (PO) without leaving the app.

### Why connect?
*   **Save time**: No need to download PDF, open your mail, create new message, attach file...
*   **Professionalism**: Emails are sent from YOUR address, with your usual signature.
*   **Traceability**: You find sent emails in your "Sent Items" folder.

### How to do it?
1.  Go to **Settings > Integrations**.
2.  Choose your provider (Google or Microsoft).
3.  Click "Connect" and validate permissions.
4.  That's it! Next time you create an order, the "Send by email" option will be active.
      `
    },
    {
      id: 'advanced-params',
      title: 'Advanced Calculation Settings',
      summary: 'Adjust algorithm sensitivity.',
      content: `
## Master the algorithm

In **Settings > General**, you can fine-tune Stockeasy behavior.

### Main levers

#### 1. Analysis Period (History)
By default, we look at the **last 90 days** of sales to calculate your daily average.
*   *Selling highly seasonal products?* Reduce to 30 days to be more reactive.
*   *Very stable sales?* Increase to 180 days to smooth out spikes.

#### 2. Safety Stock Days (Default)
This is the value applied to new suppliers if you don't specify anything.
*   Increase this value if your suppliers are unreliable.
*   Decrease it if you want to operate Just-in-Time.

#### 3. Order Frequency
How often do you like to place orders?
*   If you order **weekly**, Stockeasy will suggest smaller quantities.
*   If you order **monthly**, recommended quantities will be larger to last the duration.
      `
    }
  ],

  // ============================================
  // TROUBLESHOOTING & FAQ
  // ============================================
  troubleshooting: [
    {
      id: 'faq-top',
      title: 'Top 5 frequently asked questions',
      summary: 'Quick answers to unblock you.',
      content: `
## SOS Stockeasy

### 1. "My stock doesn't match Shopify!"
This is often a sync delay.
*   **Solution**: Click the "Refresh" button (the two arrows) in the top right. Wait 30 seconds. Still the same? Check if you have "unfulfilled" orders reserving stock.

### 2. "Why am I being asked to order 1000 pieces?"
*   **Probable cause**: A supplier configuration error.
*   **Check**: Go see the **Lead Time** of this supplier. Did you put 100 days instead of 10? Or is the **MOQ** (Minimum Order Quantity) set to 1000?

### 3. "I'm not receiving order emails"
*   **Check**: Have you checked your spam? Have you configured the "Sender" address in settings?
*   **Temporary solution**: Download the order PDF and send it manually from your personal mailbox.

### 4. "Does Stockeasy manage multiple warehouses?"
Currently, Stockeasy manages only a single stock location (the sum of all your Shopify locations).
Multi-site management (distinct warehouses) is a feature planned for a future major update.

### 5. "Can I cancel an order receipt?"
Ouch, this is tricky because it has already modified your Shopify stocks.
*   No, you can't "cancel" in one click because products may have already been sold in the meantime.
*   **Solution**: You need to make a manual stock adjustment in Shopify to correct the error.
      `
    },
    {
      id: 'support',
      title: 'Contact Human Support',
      summary: 'When AI isn\'t enough.',
      content: `
## We're here for you!

Are you stuck? Do you have a genius idea for a new feature?

### Channels

*   📧 **Email**: support@stockeasy.app (Response within 24h)
*   💬 **Chat**: Bubble in the bottom right (9am-6pm CET)

### To help us help you
If you're reporting a bug, give us the **SKU** of the problematic product or the **order number** (PO-xxxx). "It doesn't work" is hard to diagnose. "Product TSHIRT-BLUE shows 0 stock when I have 10" is an investigation we can solve in 5 minutes!
      `
    }
  ]
};

// Utility function to search articles
export const searchArticles = (query) => {
  if (!query || query.trim().length < 2) return [];
  
  const normalizedQuery = query.toLowerCase().trim();
  const results = [];
  
  Object.entries(HELP_ARTICLES).forEach(([categoryId, articles]) => {
    articles.forEach(article => {
      const titleMatch = article.title.toLowerCase().includes(normalizedQuery);
      const summaryMatch = article.summary.toLowerCase().includes(normalizedQuery);
      const contentMatch = article.content.toLowerCase().includes(normalizedQuery);
      
      if (titleMatch || summaryMatch || contentMatch) {
        results.push({
          ...article,
          categoryId,
          relevance: titleMatch ? 3 : summaryMatch ? 2 : 1
        });
      }
    });
  });
  
  // Sort by relevance
  return results.sort((a, b) => b.relevance - a.relevance);
};

// Function to get article by ID
export const getArticleById = (articleId) => {
  for (const [categoryId, articles] of Object.entries(HELP_ARTICLES)) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      return { ...article, categoryId };
    }
  }
  return null;
};

// Function to get category by ID
export const getCategoryById = (categoryId) => {
  return HELP_CATEGORIES.find(c => c.id === categoryId);
};

