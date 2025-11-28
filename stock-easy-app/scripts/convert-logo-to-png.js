/**
 * Script pour convertir le logo SVG en PNG
 * 
 * Usage: 
 *   cd stock-easy-app
 *   npm install sharp (si pas déjà installé)
 *   node scripts/convert-logo-to-png.js
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function convertSvgToPng() {
  try {
    const svgPath = path.join(__dirname, '../public/logos/stockeasy-cube.svg');
    const pngPath = path.join(__dirname, '../public/logos/stockeasy-cube.png');
    
    const svgBuffer = fs.readFileSync(svgPath);
    
    await sharp(svgBuffer)
      .resize(96, 96)
      .png()
      .toFile(pngPath);
    
    console.log('✅ Logo PNG créé avec succès !');
    console.log(`   📁 ${pngPath}`);
    console.log('   📐 96x96px');
    console.log('');
    console.log('🔗 URL après déploiement :');
    console.log('   https://stock-easy-app.vercel.app/logos/stockeasy-cube.png');
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

convertSvgToPng();

