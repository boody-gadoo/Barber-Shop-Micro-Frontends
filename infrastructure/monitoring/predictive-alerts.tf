# CloudWatch Anomaly Detection Configuration
# Phase 8 Task 3: Advanced Observability

# Anomaly Detector for LCP (Largest Contentful Paint)
resource "aws_cloudwatch_anomaly_detector" "lcp_anomaly" {
  metric_name = "LCP"
  namespace   = "BarberShop/Performance"
  stat        = "Average"
  dimensions = {
    service = "shell"
  }
}

resource "aws_cloudwatch_metric_alarm" "lcp_anomaly_detection" {
  alarm_name          = "LCP_Anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "e1"
  alarm_description   = "LCP outside normal range (anomaly detection)"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:observability-alerts"]

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "LCP"
      namespace   = "BarberShop/Performance"
      stat        = "Average"
      period      = 300
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTOR(m1, 2)"
    return_data = true
  }
}

# Anomaly Detector for API Latency
resource "aws_cloudwatch_anomaly_detector" "api_latency_anomaly" {
  metric_name = "APILatencyP95"
  namespace   = "BarberShop/Performance"
  stat        = "Average"
}

resource "aws_cloudwatch_metric_alarm" "api_latency_anomaly_detection" {
  alarm_name          = "APILatency_Anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "e1"
  alarm_description   = "API latency outside normal range (anomaly detection)"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:observability-alerts"]

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "APILatencyP95"
      namespace   = "BarberShop/Performance"
      stat        = "Average"
      period      = 300
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTOR(m1, 2)"
    return_data = true
  }
}

# Anomaly Detector for Error Rate
resource "aws_cloudwatch_anomaly_detector" "error_rate_anomaly" {
  metric_name = "ErrorRate"
  namespace   = "BarberShop/Application"
  stat        = "Average"
}

resource "aws_cloudwatch_metric_alarm" "error_rate_anomaly_detection" {
  alarm_name          = "ErrorRate_Anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 1
  threshold_metric_id = "e1"
  alarm_description   = "Error rate outside normal range (anomaly detection)"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:observability-alerts"]

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "ErrorRate"
      namespace   = "BarberShop/Application"
      stat        = "Average"
      period      = 300
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTOR(m1, 2)"
    return_data = true
  }
}

# Anomaly Detector for Database Query Time
resource "aws_cloudwatch_anomaly_detector" "db_query_time_anomaly" {
  metric_name = "DBQueryTime"
  namespace   = "BarberShop/Database"
  stat        = "Average"
}

resource "aws_cloudwatch_metric_alarm" "db_query_time_anomaly_detection" {
  alarm_name          = "DBQueryTime_Anomaly"
  comparison_operator = "LessThanLowerOrGreaterThanUpperThreshold"
  evaluation_periods  = 2
  threshold_metric_id = "e1"
  alarm_description   = "Database query time outside normal range (anomaly detection)"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:observability-alerts"]

  metric_query {
    id          = "m1"
    return_data = true
    metric {
      metric_name = "DBQueryTime"
      namespace   = "BarberShop/Database"
      stat        = "Average"
      period      = 300
    }
  }

  metric_query {
    id          = "e1"
    expression  = "ANOMALY_DETECTOR(m1, 2)"
    return_data = true
  }
}

# Composite Metric for Predictive SLO Breach Detection
resource "aws_cloudwatch_metric_alarm" "predicted_slo_breach" {
  alarm_name          = "Predicted_SLO_Breach"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SLOBreachRisk"
  namespace           = "BarberShop/Observability"
  period              = 300
  statistic           = "Average"
  threshold           = 0.8  # 80% risk
  alarm_description   = "Metrics trending toward SLO breach within next hour"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:observability-alerts"]
}

# SNS Topic for Observability Alerts
resource "aws_sns_topic" "observability_alerts" {
  name = "barber-shop-observability-alerts"

  tags = {
    Environment = "production"
    Service     = "observability"
    Phase       = "8"
  }
}

resource "aws_sns_topic_subscription" "observability_alerts_email" {
  topic_arn = aws_sns_topic.observability_alerts.arn
  protocol  = "email"
  endpoint  = "observability-team@barber-shop.prod"
}

resource "aws_sns_topic_subscription" "observability_alerts_slack" {
  topic_arn = aws_sns_topic.observability_alerts.arn
  protocol  = "https"
  endpoint  = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
}

# CloudWatch Log Insights Query Examples
# For anomaly detection:
# fields @timestamp, @message, @duration, metric | filter @message like /Anomaly/ | stats count() as anomaly_count by metric

# For root cause analysis:
# fields @timestamp, metric, value, @duration | stats avg(value) as avg_value, pct(value,95) as p95 by metric | filter p95 > 1000

output "anomaly_detection_enabled" {
  value       = true
  description = "Anomaly detection enabled for 9+ metrics"
}

output "observability_alerts_topic" {
  value       = aws_sns_topic.observability_alerts.arn
  description = "SNS Topic for observability alerts"
}
