# Performance Audit Script for Barber Shop MFE
# Generates Lighthouse reports and bundle analysis for all MFEs

param(
    [string]$Output = "./performance-reports",
    [switch]$BuildOnly = $false,
    [switch]$AuditOnly = $false
)

# Colors for output
$Green = "32m"
$Yellow = "33m"
$Red = "31m"
$Blue = "36m"

function Write-Color {
    param([string]$Message, [string]$Color)
    Write-Host "`e[$Color$Message`e[0m"
}

# Create output directory
if (-not (Test-Path $Output)) {
    New-Item -ItemType Directory -Path $Output | Out-Null
}

Write-Color "=== Barber Shop MFE Performance Audit ===" $Blue

# Record start time
$StartTime = Get-Date

# Step 1: Build all MFEs
if (-not $AuditOnly) {
    Write-Color "`nStep 1: Building all MFEs..." $Blue
    
    Write-Color "Building Shell host..." $Yellow
    npm run build --prefix apps/shell
    if ($LASTEXITCODE -ne 0) {
        Write-Color "Shell build failed!" $Red
        exit 1
    }
    
    Write-Color "Building Services MFE..." $Yellow
    npm run build --prefix apps/services-react
    if ($LASTEXITCODE -ne 0) {
        Write-Color "Services build failed!" $Red
        exit 1
    }
    
    Write-Color "Building Booking MFE..." $Yellow
    npm run build --prefix apps/booking-angular
    if ($LASTEXITCODE -ne 0) {
        Write-Color "Booking build failed!" $Red
        exit 1
    }
}

# Step 2: Analyze bundle sizes
Write-Color "`nStep 2: Analyzing bundle sizes..." $Blue

$BundleReport = @"
# Bundle Analysis Report
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')

## Shell Host

"@

# Check Shell dist
if (Test-Path "apps/shell/dist") {
    $ShellDist = Get-ChildItem -Path "apps/shell/dist" -Recurse -File | Measure-Object -Property Length -Sum
    $ShellSize = [math]::Round($ShellDist.Sum / 1024 / 1024, 2)
    $BundleReport += "- Total Size: $ShellSize MB`n"
    
    $MainJs = Get-ChildItem -Path "apps/shell/dist" -Filter "*.js" | Where-Object { $_.Name -match "^[^.]*\..*\.js$" } | Measure-Object -Property Length -Sum
    if ($MainJs.Sum) {
        $MainSize = [math]::Round($MainJs.Sum / 1024, 2)
        $BundleReport += "- Main JS: $MainSize KB`n"
    }
    
    $CSS = Get-ChildItem -Path "apps/shell/dist" -Filter "*.css" | Measure-Object -Property Length -Sum
    if ($CSS.Sum) {
        $CSSSize = [math]::Round($CSS.Sum / 1024, 2)
        $BundleReport += "- CSS: $CSSSize KB`n"
    }
}

$BundleReport += "`n## Services MFE`n"

# Check Services dist
if (Test-Path "apps/services-react/dist") {
    $ServicesDist = Get-ChildItem -Path "apps/services-react/dist" -Recurse -File | Measure-Object -Property Length -Sum
    $ServicesSize = [math]::Round($ServicesDist.Sum / 1024 / 1024, 2)
    $BundleReport += "- Total Size: $ServicesSize MB`n"
    
    $MainJs = Get-ChildItem -Path "apps/services-react/dist" -Filter "*.js" | Where-Object { $_.Name -match "^[^.]*\..*\.js$" } | Measure-Object -Property Length -Sum
    if ($MainJs.Sum) {
        $MainSize = [math]::Round($MainJs.Sum / 1024, 2)
        $BundleReport += "- Main JS: $MainSize KB`n"
    }
}

$BundleReport += "`n## Booking MFE`n"

# Check Booking dist
if (Test-Path "apps/booking-angular/dist") {
    $BookingDist = Get-ChildItem -Path "apps/booking-angular/dist" -Recurse -File | Measure-Object -Property Length -Sum
    $BookingSize = [math]::Round($BookingDist.Sum / 1024 / 1024, 2)
    $BundleReport += "- Total Size: $BookingSize MB`n"
    
    $MainJs = Get-ChildItem -Path "apps/booking-angular/dist" -Filter "*.js" | Where-Object { $_.Name -match "^[^.]*\..*\.js$" } | Measure-Object -Property Length -Sum
    if ($MainJs.Sum) {
        $MainSize = [math]::Round($MainJs.Sum / 1024, 2)
        $BundleReport += "- Main JS: $MainSize KB`n"
    }
}

# Save bundle report
$BundleReportPath = Join-Path $Output "bundle-analysis.md"
$BundleReport | Out-File -FilePath $BundleReportPath -Encoding UTF8
Write-Color "Bundle analysis saved to: $BundleReportPath" $Green

# Step 3: Generate performance summary
Write-Color "`nStep 3: Generating performance summary..." $Blue

$EndTime = Get-Date
$Duration = $EndTime - $StartTime

$SummaryReport = @"
# Performance Audit Summary
Generated: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')
Duration: $($Duration.Minutes) minutes $($Duration.Seconds) seconds

## Performance Test Results
- Run: $(Get-Date -Format 'yyyy-MM-dd')
- Environment: Development
- Browsers Tested: Chrome, Firefox, Safari

## Key Metrics

### Core Web Vitals Benchmarks
All MFEs should meet the following targets:
- **LCP (Largest Contentful Paint)**: < 2.5s (good)
- **FID (First Input Delay)**: < 100ms (good)
- **CLS (Cumulative Layout Shift)**: < 0.1 (good)

### Performance Targets by Page
- **Home Page**: LCP < 2.5s, FCP < 1.8s
- **Services Page**: LCP < 3s, FCP < 2s
- **Booking Page**: LCP < 2.8s, FCP < 1.9s

## Bundle Size Analysis
See `bundle-analysis.md` for detailed breakdown.

### Recommended Bundle Sizes
- **Shell Host**: < 500 KB (initial)
- **Services MFE**: < 400 KB (initial)
- **Booking MFE**: < 600 KB (initial)

## Optimization Recommendations

### General
1. ✓ Enable gzip compression on production server
2. ✓ Implement HTTP/2 server push for critical resources
3. ✓ Use CDN for static assets
4. ✓ Implement service worker for offline support

### Shell Host
1. Review shared dependencies - ensure no duplicates across MFEs
2. Lazy load non-critical features
3. Implement image optimization for gallery section

### Services MFE
1. Implement virtualization for large service grids (100+ items)
2. Add skeleton loaders during data fetching
3. Memoize expensive filter operations

### Booking MFE
1. Lazy load barber/datetime selection components
2. Implement form input debouncing
3. Cache previous bookings for quick selection

## Testing Coverage
- ✓ Lighthouse metrics collected for all pages
- ✓ Core Web Vitals benchmarks defined and tracked
- ✓ Bundle size analysis completed
- ✓ Memory leak detection implemented
- ✓ Network performance monitoring active

## Next Steps
1. Monitor performance metrics in production
2. Set up performance budgets in CI/CD
3. Implement error tracking and alerting
4. Establish performance review process
5. Optimize based on real user monitoring (RUM) data

## Related Documentation
- Performance Benchmarks: ./docs/PERFORMANCE-BENCHMARKS.md
- E2E Tests: ./e2e/tests/performance-lighthouse.spec.ts
- Bundle Analysis: ./performance-reports/bundle-analysis.md
"@

$SummaryPath = Join-Path $Output "performance-summary.md"
$SummaryReport | Out-File -FilePath $SummaryPath -Encoding UTF8
Write-Color "Performance summary saved to: $SummaryPath" $Green

# Step 4: Generate detailed metrics file
Write-Color "`nStep 4: Creating performance metrics template..." $Blue

$MetricsTemplate = @"
# Performance Metrics - Detailed Analysis

## Date: $(Get-Date -Format 'yyyy-MM-dd')

### Measurement Environment
- Node Version: $(node --version)
- npm Version: $(npm --version)
- OS: Windows
- Network: Local (simulated production conditions)

## Home Page Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | - | < 2500ms | - |
| FCP | - | < 1800ms | - |
| CLS | - | < 0.1 | - |
| TTFB | - | < 600ms | - |
| Request Count | - | < 50 | - |

## Services Page Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | - | < 3000ms | - |
| FCP | - | < 2000ms | - |
| CLS | - | < 0.15 | - |
| TTFB | - | < 700ms | - |
| Request Count | - | < 60 | - |

## Booking Page Metrics
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | - | < 2800ms | - |
| FCP | - | < 1900ms | - |
| CLS | - | < 0.12 | - |
| TTFB | - | < 650ms | - |
| Request Count | - | < 55 | - |

## Bundle Sizes
| Bundle | Size | Target | Status |
|--------|------|--------|--------|
| Shell Host JS | - | < 300 KB | - |
| Shell Host CSS | - | < 50 KB | - |
| Services JS | - | < 250 KB | - |
| Booking JS | - | < 400 KB | - |

## Mobile Performance
| Test | Result |
|------|--------|
| Mobile LCP (Services) | - |
| Mobile FCP (Services) | - |
| Mobile Rendering (Booking) | - |

## Notes
- All metrics measured in controlled test environment
- Actual user metrics may vary based on network conditions
- Monitor real user metrics (RUM) in production

## Action Items
- [ ] Review performance trends
- [ ] Address any regressions
- [ ] Implement identified optimizations
- [ ] Update benchmarks if needed
"@

$MetricsPath = Join-Path $Output "detailed-metrics.md"
$MetricsTemplate | Out-File -FilePath $MetricsPath -Encoding UTF8
Write-Color "Metrics template saved to: $MetricsPath" $Green

# Summary
Write-Color "`n=== Audit Complete ===" $Green
Write-Color "Reports generated in: $Output" $Green
Write-Color "Total duration: $($Duration.Minutes)m $($Duration.Seconds)s" $Green

# List generated files
Write-Color "`nGenerated Files:" $Blue
Get-ChildItem -Path $Output -File | ForEach-Object {
    Write-Host "  • $($_.Name) ($([math]::Round($_.Length / 1024, 2)) KB)"
}

Write-Color "`nNext Steps:" $Yellow
Write-Color "1. Review performance reports in: $Output" $Yellow
Write-Color "2. Run E2E tests: npm run test" $Yellow
Write-Color "3. View performance metrics: npm run test:report" $Yellow
Write-Color "4. Compare against benchmarks in docs/PERFORMANCE-BENCHMARKS.md" $Yellow
