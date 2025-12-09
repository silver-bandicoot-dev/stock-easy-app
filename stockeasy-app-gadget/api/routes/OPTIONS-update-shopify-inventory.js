import { RouteHandler } from "gadget-server";

/**
 * OPTIONS handler for CORS preflight requests
 * @type {RouteHandler}
 */
const route = async ({ request, reply, logger }) => {
  const allowedOrigins = [
    'https://stockeasy.app',
    'https://www.stockeasy.app',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:3000'
  ];
  
  const origin = request.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    reply.header('Access-Control-Allow-Origin', origin);
  }
  
  reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
  reply.header('Access-Control-Allow-Credentials', 'true');
  reply.header('Access-Control-Max-Age', '86400'); // 24 hours cache
  
  logger.info({ origin }, 'CORS preflight request handled');
  
  return reply.code(204).send();
};

export default route;





