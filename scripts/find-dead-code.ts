/**
 * Dead Code Analyzer
 * Finds unused exports in the codebase by analyzing export and import statements
 *
 * Usage: npm run find-dead-code
 */

import * as fs from 'fs';
import * as path from 'path';

interface ExportInfo {
  name: string;
  type: 'named' | 'default' | 'namespace';
  file: string;
  line: number;
  isUsed: boolean;
}

interface AnalysisResult {
  totalExports: number;
  usedExports: number;
  unusedExports: ExportInfo[];
  files: number;
}

// Files to exclude from analysis
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /__tests__/,
  /\.d\.ts$/,
  /vite-env\.d\.ts$/,
  /main\.tsx$/, // Entry point
  /App\.tsx$/, // Root component
];

// Directories to scan
const SRC_DIR = path.resolve(process.cwd(), 'src');

/**
 * Recursively get all TypeScript/TSX files in a directory
 */
function getAllFiles(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);

  files.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      getAllFiles(filePath, fileList);
    } else if (/\.(ts|tsx)$/.test(file)) {
      if (!EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath))) {
        fileList.push(filePath);
      }
    }
  });

  return fileList;
}

/**
 * Extract all exports from a file
 */
function extractExports(filePath: string): ExportInfo[] {
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n');
  const exports: ExportInfo[] = [];

  lines.forEach((line, index) => {
    // Match: export function foo()
    const namedFunctionMatch = line.match(/export\s+(?:async\s+)?function\s+(\w+)/);
    if (namedFunctionMatch) {
      exports.push({
        name: namedFunctionMatch[1],
        type: 'named',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }

    // Match: export const foo = ...
    const namedConstMatch = line.match(/export\s+const\s+(\w+)/);
    if (namedConstMatch) {
      exports.push({
        name: namedConstMatch[1],
        type: 'named',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }

    // Match: export class Foo
    const namedClassMatch = line.match(/export\s+class\s+(\w+)/);
    if (namedClassMatch) {
      exports.push({
        name: namedClassMatch[1],
        type: 'named',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }

    // Match: export interface Foo
    const namedInterfaceMatch = line.match(/export\s+interface\s+(\w+)/);
    if (namedInterfaceMatch) {
      exports.push({
        name: namedInterfaceMatch[1],
        type: 'named',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }

    // Match: export type Foo = ...
    const namedTypeMatch = line.match(/export\s+type\s+(\w+)/);
    if (namedTypeMatch) {
      exports.push({
        name: namedTypeMatch[1],
        type: 'named',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }

    // Match: export { foo, bar }
    const namedExportMatch = line.match(/export\s+\{\s*([^}]+)\s*\}/);
    if (namedExportMatch) {
      const names = namedExportMatch[1].split(',').map(n => n.trim());
      names.forEach(name => {
        // Handle "foo as bar" syntax
        const cleanName = name.split(' as ')[0].trim();
        if (cleanName && cleanName !== '*') {
          exports.push({
            name: cleanName,
            type: 'named',
            file: filePath,
            line: index + 1,
            isUsed: false,
          });
        }
      });
    }

    // Match: export default
    if (/export\s+default\s+/.test(line)) {
      exports.push({
        name: 'default',
        type: 'default',
        file: filePath,
        line: index + 1,
        isUsed: false,
      });
    }
  });

  return exports;
}

/**
 * Check if an export is used in any file
 */
function isExportUsed(exportInfo: ExportInfo, allFiles: string[]): boolean {
  const exportFileName = path.basename(exportInfo.file, path.extname(exportInfo.file));
  const exportDirPath = path.dirname(exportInfo.file);

  for (const filePath of allFiles) {
    // Skip the file that exports it
    if (filePath === exportInfo.file) continue;

    const content = fs.readFileSync(filePath, 'utf-8');

    // Check for named imports: import { foo } from './file'
    if (exportInfo.type === 'named') {
      const importRegex = new RegExp(`import\\s+\\{[^}]*\\b${exportInfo.name}\\b[^}]*\\}\\s+from`, 'g');
      if (importRegex.test(content)) return true;

      // Check for namespace import: import * as foo from './file'
      const namespaceRegex = new RegExp(`import\\s+\\*\\s+as\\s+\\w+\\s+from\\s+['"][^'"]*${exportFileName}['"]`);
      if (namespaceRegex.test(content)) return true;

      // Check for re-exports: export { foo } from './file'
      const reExportRegex = new RegExp(`export\\s+\\{[^}]*\\b${exportInfo.name}\\b[^}]*\\}\\s+from`, 'g');
      if (reExportRegex.test(content)) return true;
    }

    // Check for default import: import Foo from './file'
    if (exportInfo.type === 'default') {
      const defaultImportRegex = new RegExp(`import\\s+\\w+\\s+from\\s+['"][^'"]*${exportFileName}['"]`);
      if (defaultImportRegex.test(content)) return true;

      // Check for default re-export: export { default } from './file'
      const defaultReExportRegex = new RegExp(`export\\s+\\{[^}]*default[^}]*\\}\\s+from\\s+['"][^'"]*${exportFileName}['"]`);
      if (defaultReExportRegex.test(content)) return true;
    }

    // Check if the identifier is used anywhere in the file (conservative check)
    if (exportInfo.name !== 'default') {
      const usageRegex = new RegExp(`\\b${exportInfo.name}\\b`);
      if (usageRegex.test(content)) {
        // Double check it's actually imported from this file
        const relativePathFromFile = path.relative(path.dirname(filePath), exportInfo.file);
        const importPathNoExt = relativePathFromFile.replace(/\.(ts|tsx)$/, '');
        const pathRegex = new RegExp(`['"]${importPathNoExt.replace(/\\/g, '/')}['"]`);
        if (pathRegex.test(content)) return true;
      }
    }
  }

  return false;
}

/**
 * Main analysis function
 */
function analyzeDeadCode(): AnalysisResult {
  console.log('🔍 Scanning for TypeScript/TSX files...\n');

  const allFiles = getAllFiles(SRC_DIR);
  console.log(`📁 Found ${allFiles.length} files to analyze\n`);

  console.log('📊 Extracting exports...\n');

  const allExports: ExportInfo[] = [];
  let filesWithExports = 0;

  allFiles.forEach(file => {
    const exports = extractExports(file);
    if (exports.length > 0) {
      filesWithExports++;
      allExports.push(...exports);
    }
  });

  console.log(`✅ Found ${allExports.length} exports in ${filesWithExports} files\n`);
  console.log('🔎 Checking usage...\n');

  // Check each export for usage
  allExports.forEach((exportInfo, index) => {
    if ((index + 1) % 50 === 0) {
      console.log(`   Progress: ${index + 1}/${allExports.length} exports checked`);
    }
    exportInfo.isUsed = isExportUsed(exportInfo, allFiles);
  });

  const unusedExports = allExports.filter(e => !e.isUsed);

  return {
    totalExports: allExports.length,
    usedExports: allExports.length - unusedExports.length,
    unusedExports,
    files: filesWithExports,
  };
}

/**
 * Format file path for display
 */
function formatPath(filePath: string): string {
  return path.relative(process.cwd(), filePath);
}

/**
 * Print analysis results
 */
function printResults(result: AnalysisResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('📈 DEAD CODE ANALYSIS REPORT');
  console.log('='.repeat(80) + '\n');

  console.log(`Total Exports Found:     ${result.totalExports}`);
  console.log(`Used Exports:            ${result.usedExports} (${((result.usedExports / result.totalExports) * 100).toFixed(1)}%)`);
  console.log(`Unused Exports:          ${result.unusedExports.length} (${((result.unusedExports.length / result.totalExports) * 100).toFixed(1)}%)`);
  console.log(`Files Analyzed:          ${result.files}`);

  if (result.unusedExports.length > 0) {
    console.log('\n' + '-'.repeat(80));
    console.log('🗑️  UNUSED EXPORTS');
    console.log('-'.repeat(80) + '\n');

    // Group by file
    const byFile = new Map<string, ExportInfo[]>();
    result.unusedExports.forEach(exp => {
      if (!byFile.has(exp.file)) {
        byFile.set(exp.file, []);
      }
      byFile.get(exp.file)!.push(exp);
    });

    // Sort files by number of unused exports
    const sortedFiles = Array.from(byFile.entries())
      .sort((a, b) => b[1].length - a[1].length);

    sortedFiles.forEach(([file, exports]) => {
      console.log(`📄 ${formatPath(file)}`);
      exports.forEach(exp => {
        console.log(`   Line ${exp.line}: ${exp.type === 'default' ? 'default export' : `export ${exp.name}`}`);
      });
      console.log('');
    });

    console.log('-'.repeat(80));
    console.log(`\n⚠️  Found ${result.unusedExports.length} potentially unused exports`);
    console.log('⚠️  Review each carefully before removal - some may be:');
    console.log('   • Public API exports');
    console.log('   • Used in tests (excluded from this scan)');
    console.log('   • Used by external consumers');
    console.log('   • Re-exported from index files\n');
  } else {
    console.log('\n✨ No unused exports found! Clean codebase.\n');
  }
}

// Run the analysis
try {
  const result = analyzeDeadCode();
  printResults(result);

  // Exit with error code if unused exports found (for CI)
  process.exit(result.unusedExports.length > 0 ? 1 : 0);
} catch (error) {
  console.error('❌ Error during analysis:', error);
  process.exit(1);
}
