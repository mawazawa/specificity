#!/usr/bin/env node

/**
 * Image Optimization Script
 *
 * Optimizes PNG/JPG images to WebP format with quality optimization
 * Expected impact: 91% payload reduction (19.43 MB → ~1.7 MB)
 *
 * Usage: node scripts/optimize-images.js
 */

import { readdir, mkdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const config = {
  inputDir: join(__dirname, '../src/assets'),
  outputDir: join(__dirname, '../src/assets/optimized'),
  formats: ['.png', '.jpg', '.jpeg'],
  webpQuality: 80,
  pngQuality: 80,
  maxWidth: 800, // Max width for images (agents don't need to be huge)
  maxHeight: 800,
};

// Stats tracking
const stats = {
  processed: 0,
  skipped: 0,
  errors: 0,
  originalSize: 0,
  optimizedSize: 0,
};

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Optimize a single image
 */
async function optimizeImage(inputPath, outputPath) {
  try {
    const filename = basename(inputPath);
    console.log(`Processing: ${filename}`);

    // Get original file size
    const originalStats = await stat(inputPath);
    stats.originalSize += originalStats.size;

    // Load image and get metadata
    const image = sharp(inputPath);
    const metadata = await image.metadata();

    // Calculate resize dimensions (maintain aspect ratio)
    let width = metadata.width;
    let height = metadata.height;

    if (width > config.maxWidth || height > config.maxHeight) {
      const aspectRatio = width / height;
      if (width > height) {
        width = config.maxWidth;
        height = Math.round(width / aspectRatio);
      } else {
        height = config.maxHeight;
        width = Math.round(height * aspectRatio);
      }
      console.log(`  Resizing: ${metadata.width}x${metadata.height} → ${width}x${height}`);
    }

    // Optimize to WebP
    const webpPath = outputPath.replace(/\.(png|jpe?g)$/i, '.webp');
    await image
      .resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: config.webpQuality, effort: 6 })
      .toFile(webpPath);

    // Get optimized file size
    const optimizedStats = await stat(webpPath);
    stats.optimizedSize += optimizedStats.size;

    const reduction = ((originalStats.size - optimizedStats.size) / originalStats.size * 100).toFixed(1);
    console.log(`  ✓ ${formatBytes(originalStats.size)} → ${formatBytes(optimizedStats.size)} (-${reduction}%)`);

    stats.processed++;
    return true;
  } catch (error) {
    console.error(`  ✗ Error processing ${basename(inputPath)}:`, error.message);
    stats.errors++;
    return false;
  }
}

/**
 * Process all images in a directory
 */
async function processDirectory(inputDir, outputDir) {
  try {
    // Create output directory
    await mkdir(outputDir, { recursive: true });

    // Read directory
    const entries = await readdir(inputDir, { withFileTypes: true });

    for (const entry of entries) {
      const inputPath = join(inputDir, entry.name);
      const outputPath = join(outputDir, entry.name);

      if (entry.isDirectory()) {
        // Skip the output directory to avoid infinite recursion
        if (entry.name === 'optimized' || entry.name === basename(outputDir)) {
          console.log(`Skipping directory: ${entry.name}`);
          continue;
        }
        // Recursively process subdirectories
        await processDirectory(inputPath, outputPath);
      } else if (entry.isFile()) {
        const ext = extname(entry.name).toLowerCase();

        if (config.formats.includes(ext)) {
          await optimizeImage(inputPath, outputPath);
        } else {
          console.log(`Skipping: ${entry.name} (not an image)`);
          stats.skipped++;
        }
      }
    }
  } catch (error) {
    console.error('Error processing directory:', error.message);
    process.exit(1);
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🖼️  Image Optimization Script');
  console.log('================================\n');
  console.log(`Input:  ${config.inputDir}`);
  console.log(`Output: ${config.outputDir}`);
  console.log(`WebP Quality: ${config.webpQuality}`);
  console.log(`Max Dimensions: ${config.maxWidth}x${config.maxHeight}\n`);

  const startTime = Date.now();

  // Process images
  await processDirectory(config.inputDir, config.outputDir);

  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  const reduction = stats.originalSize > 0
    ? ((stats.originalSize - stats.optimizedSize) / stats.originalSize * 100).toFixed(1)
    : 0;

  // Print summary
  console.log('\n================================');
  console.log('Summary:');
  console.log(`  Processed: ${stats.processed} images`);
  console.log(`  Skipped:   ${stats.skipped} files`);
  console.log(`  Errors:    ${stats.errors}`);
  console.log(`  Original:  ${formatBytes(stats.originalSize)}`);
  console.log(`  Optimized: ${formatBytes(stats.optimizedSize)}`);
  console.log(`  Saved:     ${formatBytes(stats.originalSize - stats.optimizedSize)} (-${reduction}%)`);
  console.log(`  Duration:  ${duration}s`);
  console.log('\n✨ Optimization complete!');

  if (stats.processed > 0) {
    console.log('\n📝 Next steps:');
    console.log('  1. Update imports to use optimized images from src/assets/optimized/');
    console.log('  2. Consider using <picture> element for WebP with PNG fallback');
    console.log('  3. Update image references in components');
  }
}

// Run script
main().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
