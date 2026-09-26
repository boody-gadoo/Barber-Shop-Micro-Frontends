# Team & Process Scaling Infrastructure
# Phase 8 Task 6: Organization Optimization
# 
# Manages on-call rotation, team dashboards, and communication infrastructure

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# ============================================================================
# 1. ON-CALL ROTATION MANAGEMENT
# ============================================================================

# SNS Topic for on-call notifications
resource "aws_sns_topic" "oncall_notifications" {
  name = "barber-shop-oncall-notifications"

  tags = {
    Name        = "On-Call Notifications"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# SNS Topic for critical incidents (Tier 1)
resource "aws_sns_topic" "critical_incidents" {
  name = "barber-shop-critical-incidents"

  tags = {
    Name        = "Critical Incidents (Tier 1)"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# SNS Topic for escalations (Tier 2/3)
resource "aws_sns_topic" "incident_escalations" {
  name = "barber-shop-incident-escalations"

  tags = {
    Name        = "Incident Escalations (Tier 2/3)"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# Subscribe on-call engineers to notifications
resource "aws_sns_topic_subscription" "oncall_email" {
  count     = 6
  topic_arn = aws_sns_topic.oncall_notifications.arn
  protocol  = "email"
  endpoint  = "oncall-engineer-${count.index + 1}@company.com"
}

# Subscribe on-call engineers to critical incidents
resource "aws_sns_topic_subscription" "critical_sms" {
  count     = 6
  topic_arn = aws_sns_topic.critical_incidents.arn
  protocol  = "sms"
  endpoint  = "+1-555-000-${1000 + count.index}"
}

# ============================================================================
# 2. TRAINING & CERTIFICATION PROGRAM
# ============================================================================

# DynamoDB table for training records
resource "aws_dynamodb_table" "training_records" {
  name           = "barber-shop-training-records"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "engineer_id"
  range_key      = "course_id"

  attribute {
    name = "engineer_id"
    type = "S"
  }

  attribute {
    name = "course_id"
    type = "S"
  }

  attribute {
    name = "completed_date"
    type = "N"
  }

  # GSI for querying by completion date
  global_secondary_index {
    name            = "CompletedDateIndex"
    hash_key        = "course_id"
    range_key       = "completed_date"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "expiration_time"
    enabled        = false
  }

  tags = {
    Name        = "Training Records"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# S3 bucket for training materials and certifications
resource "aws_s3_bucket" "training_materials" {
  bucket = "barber-shop-training-materials-${data.aws_caller_identity.current.account_id}"

  tags = {
    Name        = "Training Materials"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

resource "aws_s3_bucket_versioning" "training_materials" {
  bucket = aws_s3_bucket.training_materials.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_public_access_block" "training_materials" {
  bucket = aws_s3_bucket.training_materials.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ============================================================================
# 3. RUNBOOK AUTOMATION & EXECUTION
# ============================================================================

# DynamoDB table for runbook definitions
resource "aws_dynamodb_table" "runbooks" {
  name           = "barber-shop-runbooks"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "runbook_id"

  attribute {
    name = "runbook_id"
    type = "S"
  }

  attribute {
    name = "severity"
    type = "S"
  }

  # GSI for querying by severity
  global_secondary_index {
    name            = "SeverityIndex"
    hash_key        = "severity"
    projection_type = "ALL"
  }

  tags = {
    Name        = "Runbooks"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# DynamoDB table for runbook execution history
resource "aws_dynamodb_table" "runbook_executions" {
  name           = "barber-shop-runbook-executions"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "execution_id"
  range_key      = "executed_at"

  attribute {
    name = "execution_id"
    type = "S"
  }

  attribute {
    name = "executed_at"
    type = "N"
  }

  attribute {
    name = "runbook_id"
    type = "S"
  }

  # GSI for querying executions by runbook
  global_secondary_index {
    name            = "RunbookExecutionsIndex"
    hash_key        = "runbook_id"
    range_key       = "executed_at"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "Runbook Executions"
    Environment = "production"
    Phase       = "8-team-scaling"
  }
}

# Lambda function for executing runbooks
resource "aws_iam_role" "runbook_executor" {
  name = "barber-shop-runbook-executor"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "runbook_executor" {
  name = "barber-shop-runbook-executor-policy"
  role = aws_iam_role.runbook_executor.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:PutItem"
        ]
        Resource = [
          aws_dynamodb_table.runbooks.arn,
          aws_dynamodb_table.runbook_executions.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.oncall_notifications.arn,
          aws_sns_topic.critical_incidents.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

# ============================================================================
# 4. TEAM DASHBOARDS & METRICS
# ============================================================================

# CloudWatch Dashboard for On-Call Operations
resource "aws_cloudwatch_dashboard" "oncall_operations" {
  dashboard_name = "barber-shop-oncall-operations"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SNS", "NumberOfMessagesPublished", { stat = "Sum" }],
            [".", "NumberOfNotificationsFailed", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "On-Call Notifications"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", { dimensions = { TableName = aws_dynamodb_table.runbook_executions.name }, stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Runbook Executions (Write Activity)"
        }
      },
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, @message, severity | stats count() by severity"
          region  = "us-east-1"
          title   = "Incident Distribution by Severity"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SNS", "NumberOfMessagesPublished", { stat = "Sum" }]
          ]
          period = 3600
          stat   = "Sum"
          region = "us-east-1"
          title  = "Daily Notifications"
        }
      }
    ]
  })
}

# CloudWatch Dashboard for Training & Development
resource "aws_cloudwatch_dashboard" "training_development" {
  dashboard_name = "barber-shop-training-development"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { dimensions = { TableName = aws_dynamodb_table.training_records.name }, stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Training Records Accessed"
        }
      },
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, engineer_id, course_id, score | stats count(), avg(score) by engineer_id"
          region  = "us-east-1"
          title   = "Training Completion by Engineer"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "NumberOfObjects", { dimensions = { BucketName = aws_s3_bucket.training_materials.id } }]
          ]
          period = 86400
          stat   = "Average"
          region = "us-east-1"
          title  = "Training Materials in S3"
        }
      }
    ]
  })
}

# CloudWatch Dashboard for Team & Process Metrics
resource "aws_cloudwatch_dashboard" "team_metrics" {
  dashboard_name = "barber-shop-team-metrics"

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedWriteCapacityUnits", { dimensions = { TableName = aws_dynamodb_table.runbook_executions.name }, stat = "Sum" }]
          ]
          period = 300
          stat   = "Sum"
          region = "us-east-1"
          title  = "Runbook Automations Executed"
        }
      },
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, status | stats count() as total, count(status=\"success\") as successful | fields total, successful, (successful*100.0/total) as success_rate"
          region  = "us-east-1"
          title   = "Runbook Execution Success Rate"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/SNS", "NumberOfMessagesPublished", { stat = "Sum" }]
          ]
          period = 3600
          stat   = "Sum"
          region = "us-east-1"
          title  = "Incident Communications Per Hour"
        }
      },
      {
        type = "log"
        properties = {
          query   = "fields @timestamp, duration | stats avg(duration) as avg_duration_ms, max(duration) as max_duration_ms"
          region  = "us-east-1"
          title   = "Runbook Execution Performance"
        }
      }
    ]
  })
}

# ============================================================================
# 5. ALERTING FOR TEAM OPERATIONAL HEALTH
# ============================================================================

# Alarm: High rate of critical incidents
resource "aws_cloudwatch_metric_alarm" "critical_incident_spike" {
  alarm_name          = "barber-shop-critical-incident-spike"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "NumberOfMessagesPublished"
  namespace           = "AWS/SNS"
  period              = 300
  statistic           = "Sum"
  threshold           = 10 # More than 10 incidents in 5 minutes
  alarm_description   = "Alert when critical incidents spike"
  alarm_actions       = [aws_sns_topic.incident_escalations.arn]

  dimensions = {
    TopicName = aws_sns_topic.critical_incidents.name
  }
}

# Alarm: Training engagement declining
resource "aws_cloudwatch_metric_alarm" "training_engagement_low" {
  alarm_name          = "barber-shop-training-engagement-low"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = 7 # Weekly evaluation
  metric_name         = "ConsumedReadCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 86400 # Daily
  statistic           = "Sum"
  threshold           = 100 # Less than 100 daily reads
  alarm_description   = "Alert when training engagement is low"
  alarm_actions       = [aws_sns_topic.oncall_notifications.arn]

  dimensions = {
    TableName = aws_dynamodb_table.training_records.name
  }
}

# Alarm: Runbook execution failures
resource "aws_cloudwatch_metric_alarm" "runbook_failures" {
  alarm_name          = "barber-shop-runbook-failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConsumedWriteCapacityUnits"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5 # More than 5 failed executions
  alarm_description   = "Alert when runbook execution failures increase"
  alarm_actions       = [aws_sns_topic.incident_escalations.arn]

  dimensions = {
    TableName = aws_dynamodb_table.runbook_executions.name
  }
}

# ============================================================================
# 6. DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

# ============================================================================
# 7. OUTPUTS
# ============================================================================

output "oncall_notifications_topic_arn" {
  description = "SNS topic for on-call notifications"
  value       = aws_sns_topic.oncall_notifications.arn
}

output "critical_incidents_topic_arn" {
  description = "SNS topic for critical incidents"
  value       = aws_sns_topic.critical_incidents.arn
}

output "training_records_table" {
  description = "DynamoDB table for training records"
  value       = aws_dynamodb_table.training_records.name
}

output "runbooks_table" {
  description = "DynamoDB table for runbook definitions"
  value       = aws_dynamodb_table.runbooks.name
}

output "training_materials_bucket" {
  description = "S3 bucket for training materials"
  value       = aws_s3_bucket.training_materials.id
}

output "oncall_operations_dashboard" {
  description = "CloudWatch dashboard for on-call operations"
  value       = aws_cloudwatch_dashboard.oncall_operations.dashboard_name
}

output "team_metrics_dashboard" {
  description = "CloudWatch dashboard for team metrics"
  value       = aws_cloudwatch_dashboard.team_metrics.dashboard_name
}
