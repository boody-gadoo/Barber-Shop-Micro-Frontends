# CloudWatch Performance Monitoring Configuration
# Phase 8 Task 1: Continuous Performance Optimization

# Custom namespace for performance metrics
resource "aws_cloudwatch_namespace" "performance" {
  namespace = "BarberShop/Performance"
}

# Core Web Vitals Metrics

resource "aws_cloudwatch_metric_alarm" "lcp_high" {
  alarm_name          = "LCP_HighLatency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "LCP"
  namespace           = "BarberShop/Performance"
  period              = 300
  statistic           = "Average"
  threshold           = 2500  # 2.5 seconds (good threshold)
  alarm_description   = "LCP exceeds good threshold of 2.5s"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "fid_high" {
  alarm_name          = "FID_HighLatency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "FID"
  namespace           = "BarberShop/Performance"
  period              = 300
  statistic           = "Average"
  threshold           = 100  # 100ms (good threshold)
  alarm_description   = "FID exceeds good threshold of 100ms"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "cls_high" {
  alarm_name          = "CLS_HighShift"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "CLS"
  namespace           = "BarberShop/Performance"
  period              = 300
  statistic           = "Average"
  threshold           = 0.1  # 0.1 (good threshold)
  alarm_description   = "CLS exceeds good threshold of 0.1"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "bundle_size_increase" {
  alarm_name          = "BundleSize_Increased"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BundleSizeBytes"
  namespace           = "BarberShop/Performance"
  period              = 3600
  statistic           = "Maximum"
  threshold           = 250000  # 250KB alert threshold (target: 200KB)
  alarm_description   = "Main bundle size exceeds 250KB threshold"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "api_latency_p95_high" {
  alarm_name          = "APILatency_P95_High"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "APILatencyP95"
  namespace           = "BarberShop/Performance"
  period              = 300
  statistic           = "Average"
  threshold           = 500  # 500ms (target: <300ms)
  alarm_description   = "API p95 latency exceeds 500ms threshold"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "cache_hit_rate_low" {
  alarm_name          = "CacheHitRate_Low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 1
  metric_name         = "CacheHitRate"
  namespace           = "BarberShop/Performance"
  period              = 3600
  statistic           = "Average"
  threshold           = 0.85  # 85% (target: >90%)
  alarm_description   = "CDN cache hit rate below 85% threshold"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:performance-alerts"]
}

# Performance Dashboard

resource "aws_cloudwatch_dashboard" "performance" {
  dashboard_name = "BarberShop-Performance"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/Performance", "LCP", { stat = "Average", label = "LCP (target: <2s)" }],
            ["...", "FID", { stat = "Average", label = "FID (target: <50ms)" }],
            ["...", "CLS", { stat = "Average", label = "CLS (target: <0.05)" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Core Web Vitals"
          yAxis = {
            left = {
              min = 0
              max = 3000
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/Performance", "APILatencyP50", { stat = "Average" }],
            ["...", "APILatencyP95", { stat = "Average" }],
            ["...", "APILatencyP99", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "API Latency Percentiles"
          yAxis = {
            left = {
              min = 0
              max = 1000
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/Performance", "BundleSizeBytes", { stat = "Average" }],
            ["...", "BundleSizeGzipped", { stat = "Average" }]
          ]
          period = 3600
          stat   = "Average"
          region = "us-east-1"
          title  = "Bundle Sizes"
          yAxis = {
            left = {
              min = 0
              max = 300000
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/Performance", "CacheHitRate", { stat = "Average" }],
            ["...", "CacheBytesSaved", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CDN Cache Performance"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/Performance", "LighthouseScore", { stat = "Average" }],
            ["...", "AccessibilityScore", { stat = "Average" }],
            ["...", "BestPracticesScore", { stat = "Average" }]
          ]
          period = 3600
          stat   = "Average"
          region = "us-east-1"
          title  = "Lighthouse Scores"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for Performance Metrics
resource "aws_cloudwatch_log_group" "performance_logs" {
  name              = "/barber-shop/performance"
  retention_in_days = 30

  tags = {
    Environment = "production"
    Service     = "performance-monitoring"
    Phase       = "8"
  }
}

# SNS Topic for Performance Alerts
resource "aws_sns_topic" "performance_alerts" {
  name = "barber-shop-performance-alerts"

  tags = {
    Environment = "production"
    Service     = "performance-monitoring"
  }
}

resource "aws_sns_topic_subscription" "performance_alerts_email" {
  topic_arn = aws_sns_topic.performance_alerts.arn
  protocol  = "email"
  endpoint  = "performance-team@barber-shop.prod"
}

resource "aws_sns_topic_subscription" "performance_alerts_slack" {
  topic_arn = aws_sns_topic.performance_alerts.arn
  protocol  = "https"
  endpoint  = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
}

# Outputs
output "performance_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.performance.dashboard_name}"
  description = "CloudWatch Performance Dashboard URL"
}

output "performance_alerts_topic" {
  value       = aws_sns_topic.performance_alerts.arn
  description = "SNS Topic ARN for performance alerts"
}
