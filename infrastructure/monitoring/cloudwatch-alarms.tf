/**
 * CloudWatch Alarms for Barber Shop Micro Frontend
 * 
 * Monitors:
 * - Error rates (HTTP 5xx)
 * - Latency (p99, p95)
 * - Availability (healthy hosts)
 * - Resource utilization (CPU, memory)
 * - Database performance
 * - Cost anomalies
 */

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "barber-shop"
}

variable "alarm_actions" {
  description = "SNS topic ARNs for alarm notifications"
  type        = list(string)
  default     = []
}

variable "ok_actions" {
  description = "SNS topic ARNs for OK state notifications"
  type        = list(string)
  default     = []
}

variable "enable_pagerduty" {
  description = "Enable PagerDuty integration"
  type        = bool
  default     = true
}

variable "pagerduty_integration_key" {
  description = "PagerDuty integration key"
  type        = string
  sensitive   = true
  default     = ""
}

locals {
  alarm_name_prefix = "${var.app_name}-${var.environment}"
  
  # Thresholds per environment
  thresholds = {
    dev = {
      error_rate_threshold     = 0.05  # 5%
      latency_p99_threshold    = 5000  # 5 seconds
      cpu_threshold            = 80    # 80%
      unhealthy_host_threshold = 1     # 1 unhealthy host
    }
    staging = {
      error_rate_threshold     = 0.02  # 2%
      latency_p99_threshold    = 3000  # 3 seconds
      cpu_threshold            = 75    # 75%
      unhealthy_host_threshold = 0     # 0 unhealthy hosts
    }
    prod = {
      error_rate_threshold     = 0.01  # 1%
      latency_p99_threshold    = 2500  # 2.5 seconds
      cpu_threshold            = 70    # 70%
      unhealthy_host_threshold = 0     # 0 unhealthy hosts
    }
  }

  current_thresholds = lookup(local.thresholds, var.environment, local.thresholds.prod)
}

# ============================================
# Alarm: High Error Rate (5xx)
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_error_rate" {
  alarm_name          = "${local.alarm_name_prefix}-high-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "HTTPCode_Target_5XX_Count"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Alert when error rate exceeds ${local.current_thresholds.error_rate_threshold * 100}%"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions

  dimensions = {
    LoadBalancer = "app/${local.alarm_name_prefix}/abc123" # Replace with actual ALB name
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: High Latency (p99)
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_latency" {
  alarm_name          = "${local.alarm_name_prefix}-high-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TargetResponseTime"
  namespace           = "AWS/ApplicationELB"
  period              = 300  # 5 minutes
  statistic           = "Average"
  threshold           = local.current_thresholds.latency_p99_threshold / 1000  # Convert to seconds
  alarm_description   = "Alert when latency exceeds ${local.current_thresholds.latency_p99_threshold}ms"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  dimensions = {
    LoadBalancer = "app/${local.alarm_name_prefix}/abc123"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Unhealthy Hosts
# ============================================

resource "aws_cloudwatch_metric_alarm" "unhealthy_hosts" {
  alarm_name          = "${local.alarm_name_prefix}-unhealthy-hosts"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "UnHealthyHostCount"
  namespace           = "AWS/ApplicationELB"
  period              = 60
  statistic           = "Average"
  threshold           = local.current_thresholds.unhealthy_host_threshold
  alarm_description   = "Alert when unhealthy host count exceeds threshold"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions

  dimensions = {
    LoadBalancer = "app/${local.alarm_name_prefix}/abc123"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: High CPU Utilization
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_cpu" {
  alarm_name          = "${local.alarm_name_prefix}-high-cpu"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = 300
  statistic           = "Average"
  threshold           = local.current_thresholds.cpu_threshold
  alarm_description   = "Alert when CPU exceeds ${local.current_thresholds.cpu_threshold}%"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: High Memory Utilization
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_memory" {
  alarm_name          = "${local.alarm_name_prefix}-high-memory"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "MemoryUsage"
  namespace           = "BarberShop"
  period              = 300
  statistic           = "Average"
  threshold           = 80  # 80% of available memory
  alarm_description   = "Alert when memory usage exceeds 80%"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: High Cache Miss Rate
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_cache_miss_rate" {
  alarm_name          = "${local.alarm_name_prefix}-high-cache-miss-rate"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CacheHitRate"
  namespace           = "BarberShop"
  period              = 300
  statistic           = "Average"
  threshold           = 80  # Hit rate below 80%
  alarm_description   = "Alert when cache hit rate drops below 80%"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Database Query Performance
# ============================================

resource "aws_cloudwatch_metric_alarm" "slow_database_queries" {
  alarm_name          = "${local.alarm_name_prefix}-slow-database-queries"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "DatabaseQueryTime"
  namespace           = "BarberShop"
  period              = 300
  statistic           = "Maximum"
  threshold           = 3000  # 3 seconds
  alarm_description   = "Alert when database queries exceed 3 seconds"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: CloudFront Cache Invalidation Rate
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_cloudfront_invalidations" {
  alarm_name          = "${local.alarm_name_prefix}-high-cloudfront-invalidations"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "InvalidationRequest"
  namespace           = "AWS/CloudFront"
  period              = 3600  # 1 hour
  statistic           = "Sum"
  threshold           = 50  # More than 50 invalidations per hour
  alarm_description   = "Alert when excessive CloudFront invalidations detected"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Web Vitals Degradation
# ============================================

resource "aws_cloudwatch_metric_alarm" "poor_web_vitals" {
  alarm_name          = "${local.alarm_name_prefix}-poor-web-vitals"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "WebVital_LCP"
  namespace           = "BarberShop"
  period              = 300
  statistic           = "Average"
  threshold           = 4000  # LCP > 4 seconds = poor
  alarm_description   = "Alert when LCP exceeds 4 seconds (poor rating)"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Booking Failure Rate
# ============================================

resource "aws_cloudwatch_metric_alarm" "high_booking_failure_rate" {
  alarm_name          = "${local.alarm_name_prefix}-high-booking-failure-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "BookingFailures"
  namespace           = "BarberShop"
  period              = 300
  statistic           = "Sum"
  threshold           = 10  # More than 10 failures per 5 minutes
  alarm_description   = "Alert when booking failures exceed threshold"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Lambda Errors
# ============================================

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${local.alarm_name_prefix}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "Alert when Lambda errors exceed threshold"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Alarm: Anomaly Detection
# ============================================

resource "aws_cloudwatch_metric_alarm" "request_count_anomaly" {
  alarm_name          = "${local.alarm_name_prefix}-request-count-anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  metric_name         = "RequestCount"
  namespace           = "AWS/ApplicationELB"
  period              = 300
  statistic           = "Average"
  threshold_metric_id = "e1"
  alarm_description   = "Alert when request count deviates from normal pattern"
  alarm_actions       = var.alarm_actions
  ok_actions          = var.ok_actions
  treat_missing_data  = "notBreaching"

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "RequestCount"
      namespace   = "AWS/ApplicationELB"
      period      = 300
      stat        = "Sum"

      dimensions = {
        LoadBalancer = "app/${local.alarm_name_prefix}/abc123"
      }
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTION_BAND(m1, 2)"
    label       = "RequestCount (Expected)"
    return_data = true
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Outputs
# ============================================

output "alarm_arns" {
  value = {
    high_error_rate = aws_cloudwatch_metric_alarm.high_error_rate.arn
    high_latency    = aws_cloudwatch_metric_alarm.high_latency.arn
    unhealthy_hosts = aws_cloudwatch_metric_alarm.unhealthy_hosts.arn
    high_cpu        = aws_cloudwatch_metric_alarm.high_cpu.arn
    high_memory     = aws_cloudwatch_metric_alarm.high_memory.arn
  }
  description = "CloudWatch Alarm ARNs"
}

output "alarm_names" {
  value = {
    high_error_rate = aws_cloudwatch_metric_alarm.high_error_rate.alarm_name
    high_latency    = aws_cloudwatch_metric_alarm.high_latency.alarm_name
    unhealthy_hosts = aws_cloudwatch_metric_alarm.unhealthy_hosts.alarm_name
    high_cpu        = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
    high_memory     = aws_cloudwatch_metric_alarm.high_memory.alarm_name
  }
  description = "CloudWatch Alarm names"
}
