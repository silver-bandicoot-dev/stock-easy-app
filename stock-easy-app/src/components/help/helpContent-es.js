/**
 * Contenido del Centro de Ayuda Stockeasy - Versión Española
 * Documentación completa para comerciantes - Versión 2.0 (Auditoría y Rediseño)
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

// Categorías del centro de ayuda
export const HELP_CATEGORIES = [
  {
    id: 'onboarding',
    title: 'Inicio Rápido',
    description: 'Tus primeros éxitos en 5 minutos',
    icon: Rocket,
    color: 'bg-gradient-to-br from-purple-500 to-purple-600'
  },
  {
    id: 'dashboard',
    title: 'Gestión Diaria',
    description: 'Tu rutina matutina eficiente',
    icon: LayoutDashboard,
    color: 'bg-gradient-to-br from-blue-500 to-blue-600'
  },
  {
    id: 'orders',
    title: 'Reabastecer',
    description: 'Pedir en el momento adecuado',
    icon: ShoppingBag,
    color: 'bg-gradient-to-br from-emerald-500 to-emerald-600'
  },
  {
    id: 'tracking',
    title: 'Seguimiento y Recepción',
    description: 'Del pedido al almacén',
    icon: Truck,
    color: 'bg-gradient-to-br from-indigo-500 to-indigo-600'
  },
  {
    id: 'stock',
    title: 'Salud del Stock',
    description: 'Evitar roturas y exceso de stock',
    icon: Activity,
    color: 'bg-gradient-to-br from-orange-500 to-orange-600'
  },
  {
    id: 'inventory',
    title: 'Libro Mayor de Inventario',
    description: 'Tu fuente de verdad contable',
    icon: ClipboardList,
    color: 'bg-gradient-to-br from-cyan-500 to-cyan-600'
  },
  {
    id: 'analytics',
    title: 'Análisis e IA',
    description: 'Entender para decidir mejor',
    icon: TrendingUp,
    color: 'bg-gradient-to-br from-pink-500 to-pink-600'
  },
  {
    id: 'settings',
    title: 'Configuración',
    description: 'Personalizar tu experiencia',
    icon: Settings,
    color: 'bg-gradient-to-br from-slate-600 to-slate-700'
  },
  {
    id: 'troubleshooting',
    title: 'Ayuda y Soporte',
    description: 'Soluciones a problemas comunes',
    icon: AlertTriangle,
    color: 'bg-gradient-to-br from-red-500 to-red-600'
  }
];

// Artículos de documentación
export const HELP_ARTICLES = {
  // ============================================
  // ONBOARDING (INICIO RÁPIDO)
  // ============================================
  onboarding: [
    {
      id: 'welcome',
      title: 'Bienvenido: Tu misión empieza aquí',
      summary: 'Por qué Stockeasy cambiará tu día a día como comerciante.',
      content: `
## ¡Bienvenido a la aventura Stockeasy!

Gestionar un inventario es como hacer malabares: tienes que mantener el equilibrio entre **tener suficientes productos** para vender, y **no tener demasiados** para no bloquear tu flujo de caja. Stockeasy está aquí para atrapar las bolas antes de que caigan.

### Lo que vas a lograr

Con Stockeasy, pasas del modo "Reacción" al modo "Anticipación":

1.  **Se acabaron los archivos Excel**: Todo está automatizado y sincronizado con Shopify.
2.  **Se acabó el "Creo que queda"**: Sabrás exactamente cuándo pedir.
3.  **Se acabó el dinero dormido**: Identifica el stock muerto que afecta tu rentabilidad.

> **¿Sabías que?**
> Un comerciante promedio pierde **15% de su facturación anual** debido a las roturas de stock. Nuestro objetivo es reducir esto a 0%.

### Tu camino al éxito en 3 pasos

1.  **Conecta** tu tienda (¿Hecho?)
2.  **Configura** tus proveedores (¡La clave de los buenos cálculos!)
3.  **Sigue** nuestras recomendaciones de pedido.

¿Listo? Lee el siguiente artículo para conectar tu tienda.
      `
    },
    {
      id: 'shopify-connection',
      title: 'Sincronización Shopify: El corazón del sistema',
      summary: 'Cómo recuperamos tus datos para trabajar.',
      content: `
## Conectar tu tienda: La primera piedra

Para que Stockeasy sea inteligente, necesita datos. Al conectar Shopify, nos das acceso al historial de tu actividad.

### Lo que sincronizamos (y por qué)

| Dato | ¿Por qué es crucial? |
|------|---------------------|
| **Productos** | Para saber qué vendes, tus precios y tus SKUs. |
| **Pedidos** | Para analizar tu ritmo de ventas y predecir el futuro. |
| **Inventario** | Para conocer tu punto de partida actual. |

### Preguntas frecuentes sobre sincronización

**"¿Esto ralentizará mi sitio?"**
No. Usamos las APIs oficiales de Shopify en segundo plano. Tu sitio de cliente sigue siendo rápido como un rayo.

**"¿Cuánto tiempo tarda?"**
La primera vez, puede tardar unos minutos si tienes miles de productos. Después, es casi instantáneo.

> **Consejo Pro**: 
> Si añades un nuevo producto en Shopify, aparecerá en Stockeasy en la próxima sincronización automática (cada hora) o si haces clic en el botón "Actualizar" en la esquina superior derecha.
      `
    },
    {
      id: 'create-suppliers',
      title: 'Proveedores: El secreto de los buenos cálculos',
      summary: 'Por qué configurar tus proveedores es el paso más importante.',
      content: `
## ¡Sin proveedores, no hay magia!

Este es el error n°1 de los nuevos usuarios: descuidar la configuración de proveedores.
Para que Stockeasy te diga **"¡Pide ahora!"**, necesita saber **"¿Cuánto tiempo tarda en llegar?"**.

### Anatomía de un proveedor bien configurado

Ve a **Configuración > Proveedores** y crea tus socios.

#### 1. Tiempo de Entrega (Lead Time)
Es el tiempo entre hacer clic en "Enviar pedido" y recibir las cajas.
*   *Ejemplo:* Si tu proveedor chino tarda 30 días en producir + 15 días de barco = **45 días**.
*   *Impacto:* ¡Si pones 5 días en lugar de 45, estarás sin stock durante 40 días!

#### 2. Días de Stock de Seguridad
Es tu colchón de seguridad. ¿Cuántos días quieres "aguantar" en caso de retraso?

### Vincular productos (Mapeo)

Una vez creado el proveedor, ve a **Configuración > Mapeo**.
Tienes que decirle a Stockeasy: *"Esta Camiseta Azul viene de Mayorista París"*.

> **Truco Rápido**
> ¡Puedes asignar productos en masa! Selecciona 50 productos de una vez y asígnalos al mismo proveedor en 2 clics.
      `
    },
    {
      id: 'initial-setup',
      title: 'Configuración inicial: Tu brújula',
      summary: 'Moneda, umbrales y seguridad.',
      content: `
## Ajusta Stockeasy a tu realidad

Cada negocio es único. Un vendedor de productos frescos no gestiona su inventario como un vendedor de muebles.

Ve a **Configuración > General**.

### 1. Umbral de Exceso de Stock (La zona roja financiera)
¿Cuándo consideras que un producto lleva "dormido" demasiado tiempo?
*   **Moda / Tendencia**: 60 días (¡Se mueve rápido!)
*   **Estándar**: 90 días (Recomendado)
*   **Repuestos / Muebles**: 180 días

### 2. Multiplicador de Seguridad (Tu seguro)
Es un pequeño coeficiente que aplicamos a tus ventas previstas para nunca quedarte corto.
*   **1.0**: Eres arriesgado. Pedimos exactamente lo que esperamos vender.
*   **1.2 (Por defecto)**: Prevemos 20% más "por si acaso". Es lo estándar.
*   **1.5**: Odias las roturas y tienes espacio en el almacén.

> **Consejo de Experto**
> Empieza con la configuración por defecto (**90 días** y **1.2**). Déjalo funcionar un mes, luego ajusta si encuentras que estás acumulando demasiado o no lo suficiente.
      `
    }
  ],

  // ============================================
  // DASHBOARD (GESTIÓN DIARIA)
  // ============================================
  dashboard: [
    {
      id: 'dashboard-routine',
      title: 'Tu rutina matutina de 30 segundos',
      summary: 'Cómo leer tu panel de control eficientemente.',
      content: `
## El café de la mañana con Stockeasy

Tu panel de control no está ahí para quedar bonito. Está diseñado para responder una sola pregunta: **"¿Qué está ardiendo hoy?"**

### Orden de lectura prioritario

1.  **Insignia Roja "A Pedir"**: Es la emergencia absoluta. Estos productos pronto estarán agotados (o ya lo están).
    *   *Acción:* Haz clic para crear los pedidos a proveedores.

2.  **Pedidos Activos**: ¿Dónde están mis envíos?
    *   *Acción:* Verifica si hay retrasos en las entregas.

3.  **Salud del Stock**: El clima general.
    *   Si la barra verde crece: Felicidades, tu gestión está mejorando.
    *   Si el rojo gana terreno: Atención, tus parámetros de reabastecimiento pueden estar demasiado ajustados.

### El Gráfico de Rendimiento

Compara tu facturación real vs tus Objetivos. ¡Es tu motivación diaria!
      `
    }
  ],

  // ============================================
  // ORDERS (REABASTECER)
  // ============================================
  orders: [
    {
      id: 'order-logic',
      title: 'La magia del cálculo de pedidos',
      summary: 'Cómo decidimos CUÁNDO y CUÁNTO pedir.',
      content: `
## "¿Cómo supieron que tenía que pedir eso?"

Es la pregunta que más nos hacen. Aquí está el detrás de escenas de nuestro algoritmo, explicado simplemente.

### El ejemplo de la Camiseta Blanca

Imaginemos:
*   Vendes un promedio de **2 camisetas por día**.
*   Tu proveedor tarda **10 días** en entregar.
*   Quieres **5 días** de stock de seguridad.

#### 1. ¿Cuándo pedir? (El Punto de Reorden)
Debes pedir cuando tengas suficiente stock para aguantar durante la entrega + seguridad.
*   Necesidad durante entrega: 10 días × 2 ventas = 20 camisetas.
*   Seguridad: 5 días × 2 ventas = 10 camisetas.
*   **Resultado**: ¡En cuanto tu stock baje a **30 camisetas**, Stockeasy da la alarma! 🚨

#### 2. ¿Cuánto pedir?
El objetivo es subir el stock a un nivel cómodo (por ejemplo, para aguantar 60 días).
*   Objetivo: 60 días × 2 ventas = 120 camisetas.
*   Si tienes 30, Stockeasy te sugerirá pedir **90**.

> **¿Sabías que?**
> Nuestro algoritmo suaviza los picos excepcionales. Si un influencer habla de ti y vendes 50 camisetas un martes (cuando normalmente son 2), no te pediremos que ordenes 5000 al día siguiente. Analizamos la tendencia a largo plazo.
      `
    },
    {
      id: 'create-po',
      title: 'Crear y enviar un pedido (PO)',
      summary: 'El proceso de A a Z para reabastecer.',
      content: `
## De la recomendación a la orden de compra

En la pestaña "Hacer Pedido", Stockeasy ya ha hecho el trabajo de clasificación por ti.

### Paso 1: Verificación (El "Sanity Check")
Stockeasy sugiere, pero TÚ decides.
*   Mira la columna "Cant. Rec." (Cantidad Recomendada).
*   ¿Sabes algo que nosotros no? (Ej: "Este producto se va a descontinuar").
*   Modifica el número manualmente si es necesario.

### Paso 2: Validación
Haz clic en **"Crear Pedido"**.
*   Se abre una ventana con el resumen.
*   Elige el almacén de destino (¡Importante para la recepción!).

### Paso 3: Envío al proveedor
Dos opciones disponibles:
1.  **Envío por Email**: Si has conectado Gmail/Outlook, un borrador limpio está listo para enviar con el PDF adjunto.
2.  **Exportar CSV/PDF**: Descarga la orden de compra para enviarla por WhatsApp, WeChat o tu propio sistema de correo.

> **Nota Importante**
> Hasta que hagas clic en "Confirmar", el pedido permanece como "Borrador". El stock "En Pedido" solo se actualiza después de la confirmación.
      `
    }
  ],

  // ============================================
  // TRACKING (SEGUIMIENTO Y RECEPCIÓN)
  // ============================================
  tracking: [
    {
      id: 'receiving',
      title: 'Recibir un pedido (Check-in)',
      summary: 'Convertir las cajas recibidas en stock vendible.',
      content: `
## El momento de la verdad: La entrega ha llegado

El camión se ha ido, las cajas están en el almacén. Ahora tienes que decirle a Stockeasy (y a Shopify) que el stock está aquí.

### ¿Por qué usar la Reconciliación?
¡No modifiques el stock manualmente en Shopify!
La función "Reconciliación" permite:
1.  Verificar si faltan productos.
2.  Rastrear quién recibió qué y cuándo.
3.  Actualizar el "Costo Promedio Ponderado" (si tus precios de compra cambian).

### El procedimiento en 3 clics

1.  Ve a **Mis Pedidos** > Pestaña **En Tránsito**.
2.  Abre el pedido correspondiente y haz clic en **"Recibir"**.
3.  **¡Cuenta!**
    *   Si todo es perfecto: Haz clic en "Recibir Todo".
    *   Si hay diferencias: Introduce la cantidad real recibida.

### Gestionar problemas (Faltantes/Dañados)
Si esperabas 100 piezas y solo recibiste 90:
*   Introduce "90" en la casilla "Recibido".
*   Stockeasy marcará el pedido como "Parcialmente Recibido".
*   Puedes **cerrar** el pedido (y pedir un reembolso), o dejar el resto **pendiente** (Backorder) si el proveedor enviará el resto más tarde.
      `
    }
  ],

  // ============================================
  // STOCK E INVENTARIO (SALUD E INVENTARIO)
  // ============================================
  stock: [
    {
      id: 'stock-health-colors',
      title: 'Entender los colores de salud',
      summary: 'Verde, Naranja, Rojo: ¿Qué hacer?',
      content: `
## El Semáforo de tu Stock

Hemos simplificado el análisis complejo en un código de colores simple.

### 🔴 Rojo: URGENTE (Rotura inminente)
*   **Situación**: Tienes menos días de stock que el tiempo de entrega de tu proveedor.
*   **Traducción**: Incluso si pides *ahora*, corres el riesgo de quedarte sin stock antes de que llegue.
*   **Acción**: ¡Pide inmediatamente! Considera la entrega express si es posible.

### 🟠 Naranja: VIGILAR (Zona de atención)
*   **Situación**: Te acercas al punto de reorden.
*   **Traducción**: Todavía tienes stock, pero necesitas preparar el próximo pedido esta semana.
*   **Acción**: Verifica si puedes agrupar con otros productos para alcanzar el pedido mínimo (Franco).

### 🟢 Verde: SALUDABLE (Zona de confort)
*   **Situación**: Tienes suficiente stock para ver venir.
*   **Acción**: Nada que hacer. Duerme tranquilo.

### 🔵 Azul: EXCESO DE STOCK (Demasiada grasa)
*   **Situación**: Tienes más de 90 días (o tu umbral personalizado) de stock.
*   **Riesgo**: Tu dinero está atrapado en estantes.
*   **Acción**: Planifica una promoción, bundle o campaña de marketing para mover este excedente y recuperar efectivo.
      `
    },
    {
      id: 'abc-analysis',
      title: 'Inventario Experto (ABC)',
      summary: 'No todos los productos son iguales.',
      content: `
## La Ley de Pareto (80/20) en tu stock

En la pestaña Inventario, no trates todos los productos igual.

### Clase A: Las Estrellas 🌟
Son tu 20% de productos que hacen el 80% de tu facturación.
*   **Estrategia**: Cero tolerancia para las roturas. Sobre-stockea ligeramente si es necesario. Vigílalos como un halcón.

### Clase B: Los Clásicos 👔
Productos regulares, ventas estables.
*   **Estrategia**: Automatiza al máximo con la configuración estándar.

### Clase C: Los "Lentos" 🐌
Productos que se venden poco, accesorios, colecciones antiguas.
*   **Estrategia**: ¡Cuidado con el exceso de stock! Solo reordena si tienes un pedido firme de cliente. No dudes en liquidar para hacer espacio.

> **Consejo**: Usa los filtros de columnas en la pestaña Inventario para ordenar por "Valor Stock (Ventas)" e identificar tus clases A, B, C.
      `
    }
  ],

  // ============================================
  // ANALYTICS E IA
  // ============================================
  analytics: [
    {
      id: 'forecast-explained',
      title: '¿Cómo predice el futuro la IA?',
      summary: 'Estacionalidad, tendencia y ruido.',
      content: `
## Sin bola de cristal, solo matemáticas

Stockeasy utiliza modelos estadísticos avanzados para trazar la línea punteada del futuro.

### Lo que detecta la IA

1.  **Tendencia**: "Tus ventas de gorros aumentan un 10% cada mes desde hace 3 meses."
2.  **Estacionalidad**: "Cada año en noviembre, las ventas se duplican." (Necesitamos al menos 12 meses de historial para ser precisos aquí).
3.  **Eventos excepcionales**: Si hiciste una gran promo "Compra 1 Llévate 1 Gratis" el año pasado, la IA intenta entender que eso no es demanda "normal".

### Ayudar a la IA a mejorar

La IA aprende de tu pasado.
*   **Si estás a menudo sin stock**: La IA ve 0 ventas y puede creer que la demanda ha bajado. Stockeasy corrige esto verificando si el stock estaba en 0.
*   **Sé consistente**: Cuanto más limpios sean tus datos (stocks actualizados, recepciones validadas), más fina será la predicción.
      `
    }
  ],

  // ============================================
  // SETTINGS (CONFIGURACIÓN)
  // ============================================
  settings: [
    {
      id: 'integrations-setup',
      title: 'Conectar tus emails (Gmail / Outlook)',
      summary: 'Envía pedidos a proveedores directamente desde Stockeasy.',
      content: `
## Simplifica tus envíos de pedidos

Stockeasy puede conectarse a tu cuenta de Gmail o Outlook para enviar Órdenes de Compra (PO) sin salir de la aplicación.

### ¿Por qué conectar?
*   **Ahorra tiempo**: No hace falta descargar PDF, abrir correo, crear mensaje, adjuntar archivo...
*   **Profesionalismo**: Los emails salen de TU dirección, con tu firma habitual.
*   **Trazabilidad**: Encuentras los emails enviados en tu carpeta de "Enviados".

### ¿Cómo hacerlo?
1.  Ve a **Configuración > Integraciones**.
2.  Elige tu proveedor (Google o Microsoft).
3.  Haz clic en "Conectar" y valida los permisos.
4.  ¡Listo! La próxima vez que crees un pedido, la opción "Enviar por email" estará activa.
      `
    },
    {
      id: 'advanced-params',
      title: 'Parámetros de Cálculo Avanzados',
      summary: 'Ajusta la sensibilidad del algoritmo.',
      content: `
## Domina el algoritmo

En **Configuración > General**, puedes afinar el comportamiento de Stockeasy.

### Palancas principales

#### 1. Período de análisis (Historial)
Por defecto, miramos los **últimos 90 días** de ventas para calcular tu promedio diario.
*   *¿Vendes productos muy estacionales?* Reduce a 30 días para ser más reactivo.
*   *¿Ventas muy estables?* Aumenta a 180 días para suavizar picos.

#### 2. Días de Stock de Seguridad (Por defecto)
Es el valor aplicado a nuevos proveedores si no especificas nada.
*   Aumenta este valor si tus proveedores son poco fiables.
*   Disminuye si quieres operar Just-in-Time.

#### 3. Frecuencia de pedido
¿Con qué frecuencia te gusta hacer pedidos?
*   Si pides **semanalmente**, Stockeasy sugerirá cantidades más pequeñas.
*   Si pides **mensualmente**, las cantidades recomendadas serán mayores para durar el periodo.
      `
    }
  ],

  // ============================================
  // TROUBLESHOOTING Y FAQ
  // ============================================
  troubleshooting: [
    {
      id: 'faq-top',
      title: 'Top 5 de preguntas frecuentes',
      summary: 'Respuestas rápidas para desbloquearte.',
      content: `
## SOS Stockeasy

### 1. "¡Mi stock no coincide con Shopify!"
A menudo es un retraso de sincronización.
*   **Solución**: Haz clic en el botón "Actualizar" (las dos flechas) arriba a la derecha. Espera 30 segundos. ¿Sigue igual? Verifica si tienes pedidos "sin cumplir" (Unfulfilled) que reservan stock.

### 2. "¿Por qué me piden que ordene 1000 piezas?"
*   **Causa probable**: Un error de configuración del proveedor.
*   **Verificación**: Ve a ver el **Tiempo de Entrega** (Lead Time) de este proveedor. ¿Pusiste 100 días en lugar de 10? ¿O el **MOQ** (Cantidad Mínima de Pedido) está fijado en 1000?

### 3. "No recibo los emails de pedido"
*   **Verificación**: ¿Has revisado tu spam? ¿Has configurado la dirección "Remitente" en configuración?
*   **Solución temporal**: Descarga el PDF del pedido y envíalo manualmente desde tu correo personal.

### 4. "¿Stockeasy gestiona múltiples almacenes?"
Por el momento, Stockeasy gestiona una única ubicación de stock (la suma de todas tus ubicaciones de Shopify).
La gestión multi-sitio (almacenes distintos) es una funcionalidad prevista para una próxima actualización mayor.

### 5. "¿Puedo cancelar una recepción de pedido?"
Ay, esto es complicado porque ya ha modificado tus stocks de Shopify.
*   No, no puedes "cancelar" en un clic porque los productos pueden haberse vendido mientras tanto.
*   **Solución**: Debes hacer un ajuste manual de stock en Shopify para corregir el error.
      `
    },
    {
      id: 'support',
      title: 'Contactar Soporte Humano',
      summary: 'Cuando la IA no es suficiente.',
      content: `
## ¡Estamos aquí para ti!

¿Estás atascado? ¿Tienes una idea genial para una nueva función?

### Canales

*   📧 **Email**: support@stockeasy.app (Respuesta en 24h)
*   💬 **Chat**: Burbuja abajo a la derecha (9h-18h CET)

### Para ayudarnos a ayudarte
Si reportas un bug, danos el **SKU** del producto problemático o el **número del pedido** (PO-xxxx). "No funciona" es difícil de diagnosticar. "El producto TSHIRT-BLUE muestra 0 stock cuando tengo 10" es una investigación que podemos resolver en 5 minutos!
      `
    }
  ]
};

// Función utilitaria para buscar artículos
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
  
  // Ordenar por relevancia
  return results.sort((a, b) => b.relevance - a.relevance);
};

// Función para obtener artículo por ID
export const getArticleById = (articleId) => {
  for (const [categoryId, articles] of Object.entries(HELP_ARTICLES)) {
    const article = articles.find(a => a.id === articleId);
    if (article) {
      return { ...article, categoryId };
    }
  }
  return null;
};

// Función para obtener categoría por ID
export const getCategoryById = (categoryId) => {
  return HELP_CATEGORIES.find(c => c.id === categoryId);
};

