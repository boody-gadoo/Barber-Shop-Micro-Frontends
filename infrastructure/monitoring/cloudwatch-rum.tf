/**
 * CloudWatch Real User Monitoring (RUM) Configuration
 * 
 * Tracks real user interactions:
 * - Page views, sessions
 * - JavaScript errors
 * - Core Web Vitals
 * - User engagement metrics
 */

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "app_name" {
  description = "Application name for RUM"
  type        = string
  default     = "barber-shop"
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "domain" {
  description = "Domain to monitor"
  type        = string
}

variable "enable_rum" {
  description = "Enable CloudWatch RUM"
  type        = bool
  default     = true
}

variable "log_retention_days" {
  description = "CloudWatch Logs retention in days"
  type        = number
  default     = 30
}

# ============================================
# CloudWatch RUM App Monitor
# ============================================

resource "aws_rum_app_monitor" "main" {
  count = var.enable_rum ? 1 : 0

  name            = "${var.app_name}-${var.environment}"
  domain          = var.domain
  tags_query_key  = "Environment"
  tags_query_value = var.environment

  app_monitor_configuration {
    allow_cookies = true
    enable_xray   = true

    # Session tracking
    session_sample_rate = var.environment == "prod" ? 0.1 : 1.0

    # Guest role for cross-origin requests
    guest_role_arn = aws_iam_role.rum_guest_role[0].arn

    # Telemetry collection
    telemetry_enabled = true

    # Metrics and events
    metrics_destination = "CloudWatch"
  }

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# CloudWatch RUM IAM Role
# ============================================

resource "aws_iam_role" "rum_guest_role" {
  count = var.enable_rum ? 1 : 0

  name_prefix = "${var.app_name}-rum-guest-"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "rum.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

resource "aws_iam_role_policy" "rum_guest_policy" {
  count = var.enable_rum ? 1 : 0

  name_prefix = "${var.app_name}-rum-guest-"
  role        = aws_iam_role.rum_guest_role[0].id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "xray:PutTraceSegments"
        ]
        Resource = "*"
      }
    ]
  })
}

# ============================================
# CloudWatch Log Group for RUM
# ============================================

resource "aws_cloudwatch_log_group" "rum" {
  count = var.enable_rum ? 1 : 0

  name_prefix = "/aws/rum/${var.app_name}-${var.environment}-"
  retention_in_days = var.log_retention_days

  tags = {
    Environment = var.environment
    Application = var.app_name
  }
}

# ============================================
# Outputs
# ============================================

output "rum_app_monitor_id" {
  value       = var.enable_rum ? aws_rum_app_monitor.main[0].id : null
  description = "CloudWatch RUM App Monitor ID"
}

output "rum_guest_role_arn" {
  value       = var.enable_rum ? aws_iam_role.rum_guest_role[0].arn : null
  description = "RUM Guest Role ARN (for SDK configuration)"
}

output "rum_log_group_name" {
  value       = var.enable_rum ? aws_cloudwatch_log_group.rum[0].name : null
  description = "RUM CloudWatch Log Group name"
}
