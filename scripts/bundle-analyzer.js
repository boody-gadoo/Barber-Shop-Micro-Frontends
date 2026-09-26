#!/usr/bin/env node

/**
 * Bundle Size Analyzer
 * 
 * Analyzes bundle sizes and generates reports for performance optimization.
 * Compares against target and previous builds.
 * 
 * Usage:
 * node scripts/bundle-analyzer.js
 * node scripts/bundle-analyzer.js --target 200kb
 * node scripts/bundle-analyzer.js --compare baseline.json
 */

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

class BundleAnalyzer {
  constructor() {
    this.targetSize = 200 * 1024; // 200KB in bytes
    this.buildDir = path.join(process.cwd(), 'dist');
    this.results = {
      timestamp: new Date().toISOString(),
      bundles: [],
      totals: {
        uncompressed: 0,
        gzipped: 0,
      },
      warnings: [],
      recommendations: [],
    };
  }

  /**
   * Analyze all bundles
   */
  async analyze() {
    console.log('📦 Bundle Size Analysis\n');
    console.log(`Build directory: ${this.buildDir}`);
    console.log(`Target size: ${this.formatSize(this.targetSize)}\n`);

    if (!fs.existsSync(this.buildDir)) {
      console.error('❌ Build directory not found. Run: npm run build');
      process.exit(1);
    }

    // Analyze all JS files
    this.analyzeDirectory(this.buildDir);

    // Generate report
    this.generateReport();

    // Check for warnings
    this.checkWarnings();

    // Save results
    this.saveResults();
  }

  /**
   * Recursively analyze directory
   */
  analyzeDirectory(dir, baseDir = dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        this.analyzeDirectory(filePath, baseDir);
      } else if (file.match(/\.(js|css)$/)) {
        this.analyzeFile(filePath, baseDir);
      }
    }
  }

  /**
   * Analyze single file
   */
  analyzeFile(filePath, baseDir) {
    const content = fs.readFileSync(filePath);
    const uncompressed = content.length;

    // Calculate gzipped size
    const gzipped = zlib.gzipSync(content).length;

    const relativePath = path.relative(baseDir, filePath);
    const bundle = {
      path: relativePath,
      uncompressed,
      gzipped,
      ratio: ((gzipped / uncompressed) * 100).toFixed(2),
      isChunk: /chunk|\./.test(relativePath),
    };

    this.results.bundles.push(bundle);
    this.results.totals.uncompressed += uncompressed;
    this.results.totals.gzipped += gzipped;
  }

  /**
   * Generate console report
   */
  generateReport() {
    console.log('📊 Bundle Breakdown:\n');
    console.log(
      'File'.padEnd(50) +
        'Uncompressed'.padEnd(15) +
        'Gzipped'.padEnd(15) +
        'Ratio',
    );
    console.log('─'.repeat(95));

    // Sort by gzipped size descending
    const sorted = [...this.results.bundles].sort(
      (a, b) => b.gzipped - a.gzipped,
    );

    for (const bundle of sorted.slice(0, 20)) {
      const fileName = bundle.path.length > 48 ? '...' + bundle.path.slice(-45) : bundle.path;
      console.log(
        fileName.padEnd(50) +
          this.formatSize(bundle.uncompressed).padEnd(15) +
          this.formatSize(bundle.gzipped).padEnd(15) +
          bundle.ratio + '%',
      );
    }

    console.log('\n📈 Totals:\n');
    console.log(`Uncompressed: ${this.formatSize(this.results.totals.uncompressed)}`);
    console.log(`Gzipped:      ${this.formatSize(this.results.totals.gzipped)}`);
    console.log(`Ratio:        ${((this.results.totals.gzipped / this.results.totals.uncompressed) * 100).toFixed(2)}%`);

    // Check against target
    console.log(`\n🎯 Target:    ${this.formatSize(this.targetSize)}`);

    if (this.results.totals.gzipped <= this.targetSize) {
      console.log(`✅ Status:    PASS - Under target by ${this.formatSize(this.targetSize - this.results.totals.gzipped)}`);
    } else {
      const excess = this.results.totals.gzipped - this.targetSize;
      console.log(`⚠️  Status:    FAIL - Over target by ${this.formatSize(excess)}`);
    }
  }

  /**
   * Check for warnings and recommendations
   */
  checkWarnings() {
    console.log('\n⚠️  Analysis:\n');

    // Check for large chunks
    const largeChunks = this.results.bundles.filter(
      (b) => b.gzipped > 100 * 1024,
    );

    if (largeChunks.length > 0) {
      console.log(`📍 Found ${largeChunks.length} chunks over 100KB:`);
      for (const chunk of largeChunks) {
        console.log(`   - ${chunk.path}: ${this.formatSize(chunk.gzipped)}`);
      }
      console.log('   💡 Consider code-splitting these modules\n');
    }

    // Check compression ratio
    const avgRatio =
      (this.results.totals.gzipped / this.results.totals.uncompressed) * 100;
    if (avgRatio > 35) {
      console.log(
        `📍 Compression ratio is ${avgRatio.toFixed(2)}% (high)\n`,
      );
      console.log('   💡 Recommendations:');
      console.log('   - Check for unminified code');
      console.log('   - Enable tree-shaking');
      console.log('   - Review dependencies\n');
    }

    // Check for duplicate dependencies
    const vendors = this.results.bundles.filter((b) =>
      b.path.includes('vendor'),
    );
    if (vendors.length > 3) {
      console.log(`📍 Found ${vendors.length} vendor bundles (possible duplication)\n`);
      console.log('   💡 Consider hoisting shared dependencies\n');
    }
  }

  /**
   * Compare with baseline
   */
  compareWithBaseline(baselineFile) {
    if (!fs.existsSync(baselineFile)) {
      console.error(`Baseline file not found: ${baselineFile}`);
      return;
    }

    const baseline = JSON.parse(fs.readFileSync(baselineFile, 'utf8'));
    const current = this.results.totals.gzipped;
    const previous = baseline.totals.gzipped;
    const diff = current - previous;
    const percentChange = ((diff / previous) * 100).toFixed(2);

    console.log('\n📉 Comparison with baseline:\n');
    console.log(`Baseline:    ${this.formatSize(previous)}`);
    console.log(`Current:     ${this.formatSize(current)}`);

    if (diff > 0) {
      console.log(`Change:      +${this.formatSize(diff)} (+${percentChange}%) ⚠️`);
    } else {
      console.log(`Change:      ${this.formatSize(diff)} (${percentChange}%) ✅`);
    }
  }

  /**
   * Save results to JSON
   */
  saveResults() {
    const outputFile = path.join(process.cwd(), 'bundle-report.json');
    fs.writeFileSync(outputFile, JSON.stringify(this.results, null, 2));
    console.log(`\n📄 Full report saved to: ${outputFile}`);
  }

  /**
   * Format bytes to human readable
   */
  formatSize(bytes) {
    const units = ['B', 'KB', 'MB'];
    let size = bytes;
    let unitIndex = 0;

    while (size > 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(2)} ${units[unitIndex]}`;
  }
}

// Parse command line arguments
const args = process.argv.slice(2);
const analyzer = new BundleAnalyzer();

// Check for custom target
const targetIndex = args.indexOf('--target');
if (targetIndex >= 0 && args[targetIndex + 1]) {
  const target = args[targetIndex + 1];
  analyzer.targetSize = parseInt(target) * 1024;
}

// Run analysis
analyzer.analyze().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
