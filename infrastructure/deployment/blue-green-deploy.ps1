<#
.SYNOPSIS
Blue-green deployment orchestration for Barber Shop Micro Frontend platform.

.DESCRIPTION
Implements blue-green deployment strategy with automated smoke tests,
canary rollout (10% -> 25% -> 50% -> 100%), and automatic rollback.

.PARAMETER Environment
Environment to deploy to (dev, staging, prod)

.PARAMETER Version
Version to deploy (e.g., v6.0.0)

.PARAMETER CanaryDuration
Duration for each canary stage in seconds (default: 300)

.PARAMETER RollbackOnError
Automatically rollback if error rate exceeds threshold (default: $true)

.PARAMETER ErrorRateThreshold
Error rate threshold for automatic rollback (default: 0.01 = 1%)

.EXAMPLE
.\blue-green-deploy.ps1 -Environment prod -Version v6.0.0

.EXAMPLE
.\blue-green-deploy.ps1 -Environment staging -Version v6.0.0 -CanaryDuration 120 -Verbose
#>

param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('dev', 'staging', 'prod')]
    [string]$Environment,

    [Parameter(Mandatory = $true)]
    [ValidatePattern('^v\d+\.\d+\.\d+')]
    [string]$Version,

    [Parameter(Mandatory = $false)]
    [int]$CanaryDuration = 300,

    [Parameter(Mandatory = $false)]
    [bool]$RollbackOnError = $true,

    [Parameter(Mandatory = $false)]
    [decimal]$ErrorRateThreshold = 0.01
)

$ErrorActionPreference = "Stop"
$VerbosePreference = "Continue"

# ============================================
# Configuration
# ============================================

$deploymentConfig = @{
    dev     = @{ region = "us-east-1"; timeout = 600; smokeTestCount = 10 }
    staging = @{ region = "us-east-1"; timeout = 900; smokeTestCount = 50 }
    prod    = @{ region = "us-east-1"; timeout = 1800; smokeTestCount = 100 }
}

$config = $deploymentConfig[$Environment]
$timestamp = Get-Date -Format "yyyyMMdd-HHmmss"
$deploymentId = "${Environment}-${Version}-${timestamp}"
$logFile = "deployment-${deploymentId}.log"

# Canary stages
$canaryStages = @(
    @{ name = "10% Traffic"; percentage = 0.10; duration = $CanaryDuration }
    @{ name = "25% Traffic"; percentage = 0.25; duration = $CanaryDuration }
    @{ name = "50% Traffic"; percentage = 0.50; duration = $CanaryDuration }
    @{ name = "100% Traffic"; percentage = 1.00; duration = 300 }
)

# ============================================
# Logging Functions
# ============================================

function Write-Log {
    param(
        [string]$Message,
        [ValidateSet('Info', 'Warning', 'Error', 'Success')]
        [string]$Level = 'Info'
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $prefix = "[$timestamp] [$Level]"

    switch ($Level) {
        'Error' { Write-Host "$prefix $Message" -ForegroundColor Red }
        'Warning' { Write-Host "$prefix $Message" -ForegroundColor Yellow }
        'Success' { Write-Host "$prefix $Message" -ForegroundColor Green }
        default { Write-Host "$prefix $Message" -ForegroundColor White }
    }

    Add-Content -Path $logFile -Value "$prefix $Message"
}

function Write-Progress {
    param(
        [string]$Activity,
        [string]$Status,
        [int]$PercentComplete = -1
    )

    Write-Host "▶ $Activity : $Status" -ForegroundColor Cyan
    Add-Content -Path $logFile -Value "$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss') [PROGRESS] $Activity : $Status"
}

# ============================================
# Pre-Deployment Checks
# ============================================

function Invoke-PreDeploymentChecks {
    Write-Progress -Activity "Pre-Deployment Checks" -Status "Starting..."

    # Check AWS credentials
    try {
        $identity = aws sts get-caller-identity --region $config.region | ConvertFrom-Json
        Write-Log "AWS Account: $($identity.Account)" -Level Success
    }
    catch {
        Write-Log "Failed to authenticate with AWS: $_" -Level Error
        throw
    }

    # Check if version exists in ECR/S3
    Write-Progress -Activity "Pre-Deployment Checks" -Status "Verifying version..."
    $versionExists = aws s3 ls "s3://barber-shop-releases/$Version/" --region $config.region 2>$null
    if (-not $versionExists) {
        Write-Log "Version $Version not found in S3. Available versions:" -Level Warning
        aws s3 ls s3://barber-shop-releases/ --region $config.region
        throw "Version $Version not found"
    }

    Write-Log "Pre-deployment checks completed successfully" -Level Success
}

# ============================================
# Blue-Green Setup
# ============================================

function Invoke-BlueGreenSetup {
    Write-Progress -Activity "Blue-Green Setup" -Status "Creating green environment..."

    # Get current blue target group
    $blueTargetGroupArn = (aws elbv2 describe-target-groups `
        --load-balancer-arn "arn:aws:elasticloadbalancing:$($config.region):ACCOUNT_ID:loadbalancer/app/barber-shop-$Environment/ABC123" `
        --region $config.region `
        --query "TargetGroups[0].TargetGroupArn" --output text)

    if (-not $blueTargetGroupArn) {
        throw "Could not find ALB target group"
    }

    Write-Log "Current (Blue) Target Group: $blueTargetGroupArn" -Level Info

    # Create new (Green) target group
    $greenTargetGroupName = "barber-shop-$Environment-green-$timestamp"

    Write-Progress -Activity "Blue-Green Setup" -Status "Creating green target group..."

    $greenResponse = aws elbv2 create-target-group `
        --name $greenTargetGroupName `
        --protocol HTTP `
        --port 80 `
        --vpc-id (aws ec2 describe-vpcs --filters "Name=tag:Environment,Values=$Environment" --region $config.region --query "Vpcs[0].VpcId" --output text) `
        --health-check-protocol HTTP `
        --health-check-path "/health" `
        --health-check-interval-seconds 30 `
        --health-check-timeout-seconds 5 `
        --healthy-threshold-count 2 `
        --unhealthy-threshold-count 3 `
        --region $config.region | ConvertFrom-Json

    $greenTargetGroupArn = $greenResponse.TargetGroups[0].TargetGroupArn
    Write-Log "New (Green) Target Group Created: $greenTargetGroupArn" -Level Success

    # Get instances to migrate
    Write-Progress -Activity "Blue-Green Setup" -Status "Discovering instances..."

    $instances = aws elbv2 describe-target-health `
        --target-group-arn $blueTargetGroupArn `
        --region $config.region `
        --query "TargetHealthDescriptions[*].Target.Id" --output text

    Write-Log "Found instances: $instances" -Level Info

    # Deregister instances from blue, register to green
    foreach ($instance in $instances.Split(' ')) {
        Write-Progress -Activity "Blue-Green Setup" -Status "Registering $instance to green..."

        aws elbv2 register-targets `
            --target-group-arn $greenTargetGroupArn `
            --targets Id=$instance `
            --region $config.region

        Write-Log "Registered $instance to green target group" -Level Info
    }

    return @{
        blueTargetGroupArn  = $blueTargetGroupArn
        greenTargetGroupArn = $greenTargetGroupArn
        instances           = $instances.Split(' ')
    }
}

# ============================================
# Deployment to Green
# ============================================

function Invoke-DeploymentToGreen {
    param(
        [string]$GreenTargetGroupArn,
        [string[]]$Instances
    )

    Write-Progress -Activity "Deployment" -Status "Deploying $Version to green environment..."

    foreach ($instance in $Instances) {
        Write-Progress -Activity "Deployment" -Status "Deploying to $instance..."

        # SSH into instance and pull new version
        aws ssm start-session `
            --target $instance `
            --region $config.region `
            --document-name "AWS-RunShellScript" `
            --parameters 'command=[
                "cd /opt/barber-shop",
                "git pull",
                "git checkout $Version",
                "npm ci --production",
                "npm run build",
                "sudo systemctl restart barber-shop"
            ]'

        Write-Log "Deployed $Version to $instance" -Level Info

        Start-Sleep -Seconds 5
    }

    # Wait for instances to become healthy
    Write-Progress -Activity "Deployment" -Status "Waiting for instances to become healthy..."

    $maxWaitTime = $config.timeout
    $elapsedTime = 0
    $healthyCount = 0

    while ($elapsedTime -lt $maxWaitTime -and $healthyCount -lt $Instances.Count) {
        $health = aws elbv2 describe-target-health `
            --target-group-arn $GreenTargetGroupArn `
            --region $config.region | ConvertFrom-Json

        $healthyCount = ($health.TargetHealthDescriptions | Where-Object { $_.TargetHealth.State -eq 'healthy' }).Count
        $totalCount = $health.TargetHealthDescriptions.Count

        Write-Log "Health check: $healthyCount/$totalCount instances healthy" -Level Info

        if ($healthyCount -eq $totalCount) {
            Write-Log "All instances are healthy" -Level Success
            break
        }

        Start-Sleep -Seconds 10
        $elapsedTime += 10
    }

    if ($healthyCount -ne $Instances.Count) {
        throw "Deployment failed: Not all instances became healthy within $maxWaitTime seconds"
    }

    Write-Log "Green environment is ready" -Level Success
}

# ============================================
# Smoke Tests
# ============================================

function Invoke-SmokeTests {
    Write-Progress -Activity "Smoke Tests" -Status "Running smoke tests..."

    $testsPassed = 0
    $testsFailed = 0

    for ($i = 1; $i -le $config.smokeTestCount; $i++) {
        $testName = "smoke-test-$i"

        try {
            $response = Invoke-WebRequest `
                -Uri "https://barber-shop-$Environment.example.com/health" `
                -TimeoutSec 10

            if ($response.StatusCode -eq 200) {
                $testsPassed++
                Write-Log "✓ $testName: PASSED" -Level Success
            }
            else {
                $testsFailed++
                Write-Log "✗ $testName: FAILED (Status: $($response.StatusCode))" -Level Error
            }
        }
        catch {
            $testsFailed++
            Write-Log "✗ $testName: FAILED ($_)" -Level Error
        }
    }

    $passRate = [decimal]$testsPassed / $config.smokeTestCount

    Write-Log "Smoke Tests: $testsPassed/$config.smokeTestCount passed ($('{0:P}' -f $passRate))" -Level $(if ($passRate -ge 0.95) { 'Success' } else { 'Error' })

    if ($passRate -lt 0.95) {
        throw "Smoke tests failed: Pass rate $passRate is below 95% threshold"
    }
}

# ============================================
# Canary Deployment
# ============================================

function Invoke-CanaryDeployment {
    param(
        [string]$BlueTargetGroupArn,
        [string]$GreenTargetGroupArn
    )

    Write-Progress -Activity "Canary Deployment" -Status "Starting canary rollout..."

    foreach ($stage in $canaryStages) {
        Write-Log "▶ Canary Stage: $($stage.name)" -Level Info

        # Update traffic weight
        $blueWeight = [int]((1 - $stage.percentage) * 100)
        $greenWeight = [int]($stage.percentage * 100)

        Write-Log "Traffic distribution - Blue: $blueWeight%, Green: $greenWeight%" -Level Info

        # Get listener ARN and update rule
        $listenerArn = aws elbv2 describe-listeners `
            --load-balancer-arn (aws elbv2 describe-load-balancers `
                --names "barber-shop-$Environment" `
                --region $config.region `
                --query "LoadBalancers[0].LoadBalancerArn" --output text) `
            --region $config.region `
            --query "Listeners[0].ListenerArn" --output text

        # Update listener rule to distribute traffic
        aws elbv2 modify-rule `
            --rule-arn (aws elbv2 describe-rules `
                --listener-arn $listenerArn `
                --region $config.region `
                --query "Rules[0].RuleArn" --output text) `
            --forward-config "TargetGroups=[{TargetGroupArn=$BlueTargetGroupArn,Weight=$blueWeight},{TargetGroupArn=$GreenTargetGroupArn,Weight=$greenWeight}]" `
            --region $config.region

        # Monitor metrics during canary stage
        Write-Progress -Activity "Canary Deployment" -Status "Monitoring $($stage.name) for $($stage.duration)s..."

        $errorRate = Invoke-CanaryMonitoring -Duration $stage.duration -TargetGroupArn $GreenTargetGroupArn

        if ($errorRate -gt $ErrorRateThreshold -and $RollbackOnError) {
            Write-Log "Error rate $errorRate exceeded threshold $ErrorRateThreshold" -Level Warning
            Invoke-RollbackDeployment -BlueTargetGroupArn $BlueTargetGroupArn -GreenTargetGroupArn $GreenTargetGroupArn
            throw "Canary deployment failed during stage: $($stage.name)"
        }

        Write-Log "✓ Canary Stage $($stage.name) passed (Error rate: $('{0:P}' -f $errorRate))" -Level Success
    }

    Write-Log "✓ All canary stages completed successfully" -Level Success
}

# ============================================
# Canary Monitoring
# ============================================

function Invoke-CanaryMonitoring {
    param(
        [int]$Duration,
        [string]$TargetGroupArn
    )

    $startTime = Get-Date
    $endTime = $startTime.AddSeconds($Duration)
    $errors = 0
    $total = 0

    Write-Log "Monitoring for $Duration seconds..." -Level Info

    while ((Get-Date) -lt $endTime) {
        try {
            $response = Invoke-WebRequest `
                -Uri "https://barber-shop-$Environment.example.com/" `
                -TimeoutSec 5

            $total++

            if ($response.StatusCode -ne 200) {
                $errors++
            }
        }
        catch {
            $errors++
            $total++
        }

        Start-Sleep -Seconds 5
    }

    $errorRate = if ($total -gt 0) { [decimal]$errors / $total } else { 0 }

    Write-Log "Monitoring complete - Errors: $errors/$total (Error Rate: $('{0:P}' -f $errorRate))" -Level Info

    return $errorRate
}

# ============================================
# Rollback
# ============================================

function Invoke-RollbackDeployment {
    param(
        [string]$BlueTargetGroupArn,
        [string]$GreenTargetGroupArn
    )

    Write-Log "⚠ ROLLING BACK deployment" -Level Warning

    # Revert all traffic to blue
    $listenerArn = aws elbv2 describe-listeners `
        --load-balancer-arn (aws elbv2 describe-load-balancers `
            --names "barber-shop-$Environment" `
            --region $config.region `
            --query "LoadBalancers[0].LoadBalancerArn" --output text) `
        --region $config.region `
        --query "Listeners[0].ListenerArn" --output text

    aws elbv2 modify-rule `
        --rule-arn (aws elbv2 describe-rules `
            --listener-arn $listenerArn `
            --region $config.region `
            --query "Rules[0].RuleArn" --output text) `
        --forward-config "TargetGroups=[{TargetGroupArn=$BlueTargetGroupArn,Weight=100}]" `
        --region $config.region

    # Deregister green instances
    $greenInstances = aws elbv2 describe-target-health `
        --target-group-arn $GreenTargetGroupArn `
        --region $config.region `
        --query "TargetHealthDescriptions[*].Target.Id" --output text

    foreach ($instance in $greenInstances.Split(' ')) {
        aws elbv2 deregister-targets `
            --target-group-arn $GreenTargetGroupArn `
            --targets Id=$instance `
            --region $config.region
    }

    # Delete green target group
    aws elbv2 delete-target-group --target-group-arn $GreenTargetGroupArn --region $config.region

    Write-Log "✓ Rollback completed successfully" -Level Success
}

# ============================================
# Main Deployment Flow
# ============================================

try {
    Write-Log "Starting deployment of $Version to $Environment" -Level Info
    Write-Log "Deployment ID: $deploymentId" -Level Info

    Invoke-PreDeploymentChecks

    $blueGreenSetup = Invoke-BlueGreenSetup
    Invoke-DeploymentToGreen -GreenTargetGroupArn $blueGreenSetup.greenTargetGroupArn -Instances $blueGreenSetup.instances

    Invoke-SmokeTests

    Invoke-CanaryDeployment -BlueTargetGroupArn $blueGreenSetup.blueTargetGroupArn -GreenTargetGroupArn $blueGreenSetup.greenTargetGroupArn

    # Final step: decommission blue
    Write-Progress -Activity "Finalization" -Status "Decommissioning blue environment..."
    aws elbv2 delete-target-group --target-group-arn $blueGreenSetup.blueTargetGroupArn --region $config.region

    Write-Log "✓ Deployment completed successfully" -Level Success
    Write-Log "Version $Version is now live in $Environment" -Level Success

    exit 0
}
catch {
    Write-Log "✗ Deployment failed: $_" -Level Error
    Write-Log "Attempting automatic rollback..." -Level Warning

    if ($blueGreenSetup) {
        Invoke-RollbackDeployment -BlueTargetGroupArn $blueGreenSetup.blueTargetGroupArn -GreenTargetGroupArn $blueGreenSetup.greenTargetGroupArn
    }

    exit 1
}
