# CloudWatch Dashboard for Feature Flag Rollout Monitoring
# Phase 8 Task 2: Feature Flag Phased Rollout

resource "aws_cloudwatch_dashboard" "feature_rollout" {
  dashboard_name = "BarberShop-FeatureRollout"

  dashboard_body = jsonencode({
    widgets = [
      # Feature Allocation Progress
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/FeatureFlags", "AllocationPercentage", 
             { dimensions = { feature = "new_booking_flow" }, label = "new_booking_flow" }],
            ["...", ".", { dimensions = { feature = "analytics_beta" }, label = "analytics_beta" }],
            ["...", ".", { dimensions = { feature = "ui_redesign" }, label = "ui_redesign" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Feature Allocation (%)"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },

      # Conversion Rate: Control vs Variant
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/ABTest", "ConversionRate",
             { dimensions = { group = "control", feature = "new_booking_flow" }, label = "Control" }],
            ["...", ".",
             { dimensions = { group = "variant", feature = "new_booking_flow" }, label = "Variant" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Conversion Rate: Control vs Variant"
          yAxis = {
            left = {
              min = 0
              max = 0.3
            }
          }
        }
      },

      # Error Rate Comparison
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/ABTest", "ErrorRate",
             { dimensions = { group = "control" }, label = "Control" }],
            ["...", ".",
             { dimensions = { group = "variant" }, label = "Variant" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "Error Rate: Control vs Variant (%)"
          yAxis = {
            left = {
              min = 0
              max = 2
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Rollback Threshold (2x)"
                value = 2.0
              }
            ]
          }
        }
      },

      # User Satisfaction Score
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/ABTest", "SatisfactionScore",
             { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "User Satisfaction Score"
          yAxis = {
            left = {
              min = 1
              max = 5
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Target (4.0+)"
                value = 4.0
              },
              {
                label = "Rollback Threshold (3.0)"
                value = 3.0
              }
            ]
          }
        }
      },

      # Sample Size Progress
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/ABTest", "SampleCount",
             { dimensions = { feature = "new_booking_flow" }, label = "new_booking_flow" }],
            ["...", ".",
             { dimensions = { feature = "analytics_beta" }, label = "analytics_beta" }],
            ["...", ".",
             { dimensions = { feature = "ui_redesign" }, label = "ui_redesign" }]
          ]
          period = 3600
          stat   = "Sum"
          region = "us-east-1"
          title  = "Sample Size (cumulative)"
        }
      },

      # Statistical Significance (P-Value)
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/ABTest", "PValue",
             { stat = "Average" }]
          ]
          period = 3600
          stat   = "Average"
          region = "us-east-1"
          title  = "Statistical Significance (P-Value)"
          yAxis = {
            left = {
              min = 0
              max = 1
            }
          }
          annotations = {
            horizontal = [
              {
                label = "Significant (< 0.05)"
                value = 0.05
              }
            ]
          }
        }
      },

      # Feature Adoption Rate
      {
        type = "metric"
        properties = {
          metrics = [
            ["BarberShop/FeatureFlags", "AdoptionRate",
             { dimensions = { feature = "new_booking_flow" }, label = "new_booking_flow" }],
            ["...", ".",
             { dimensions = { feature = "analytics_beta" }, label = "analytics_beta" }],
            ["...", ".",
             { dimensions = { feature = "ui_redesign" }, label = "ui_redesign" }]
          ]
          period = 3600
          stat   = "Average"
          region = "us-east-1"
          title  = "Feature Adoption Rate (%)"
          yAxis = {
            left = {
              min = 0
              max = 100
            }
          }
        }
      },

      # Rollout Stage Progress
      {
        type = "log"
        properties = {
          query = "fields @timestamp, @message, stage, allocation | filter @message like /Stage/ | stats count() as stage_transitions by stage"
          region = "us-east-1"
          title  = "Rollout Stage Transitions"
        }
      },
    ]
  })
}

# CloudWatch Alarms for Feature Rollout

resource "aws_cloudwatch_metric_alarm" "rollout_error_rate_high" {
  alarm_name          = "FeatureRollout_ErrorRateHigh"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ErrorRate"
  namespace           = "BarberShop/ABTest"
  period              = 300
  statistic           = "Average"
  threshold           = 2.0  # 2x control = rollback trigger
  alarm_description   = "Variant error rate exceeds 2x control - consider rollback"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:feature-rollout-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "rollout_conversion_drop" {
  alarm_name          = "FeatureRollout_ConversionDrop"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "ConversionRate"
  namespace           = "BarberShop/ABTest"
  period              = 300
  statistic           = "Average"
  threshold           = 0.162  # 90% of control baseline (0.182 * 0.9)
  alarm_description   = "Variant conversion rate down 10%+ vs control - manual review"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:feature-rollout-alerts"]
}

resource "aws_cloudwatch_metric_alarm" "rollout_satisfaction_low" {
  alarm_name          = "FeatureRollout_SatisfactionLow"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 2
  metric_name         = "SatisfactionScore"
  namespace           = "BarberShop/ABTest"
  period              = 300
  statistic           = "Average"
  threshold           = 3.0  # 3.0/5 = rollback trigger
  alarm_description   = "User satisfaction below 3.0/5 - consider rollback"
  alarm_actions       = ["arn:aws:sns:us-east-1:123456789012:feature-rollout-alerts"]
}

# SNS Topic for Rollout Alerts
resource "aws_sns_topic" "feature_rollout_alerts" {
  name = "barber-shop-feature-rollout-alerts"

  tags = {
    Environment = "production"
    Service     = "feature-flags"
    Phase       = "8"
  }
}

resource "aws_sns_topic_subscription" "rollout_alerts_email" {
  topic_arn = aws_sns_topic.feature_rollout_alerts.arn
  protocol  = "email"
  endpoint  = "product-team@barber-shop.prod"
}

resource "aws_sns_topic_subscription" "rollout_alerts_slack" {
  topic_arn = aws_sns_topic.feature_rollout_alerts.arn
  protocol  = "https"
  endpoint  = "https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK"
}

# CloudWatch Log Group for Rollout Logs
resource "aws_cloudwatch_log_group" "feature_rollout_logs" {
  name              = "/barber-shop/feature-rollout"
  retention_in_days = 30

  tags = {
    Environment = "production"
    Service     = "feature-flags"
    Phase       = "8"
  }
}

# Outputs
output "rollout_dashboard_url" {
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=us-east-1#dashboards:name=${aws_cloudwatch_dashboard.feature_rollout.dashboard_name}"
  description = "Feature Rollout Dashboard URL"
}

output "rollout_alerts_topic" {
  value       = aws_sns_topic.feature_rollout_alerts.arn
  description = "SNS Topic ARN for rollout alerts"
}
