variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "vpc_id" {
  description = "VPC ID"
  type        = string
}

variable "subnets" {
  description = "Subnet IDs for ALB"
  type        = list(string)
}

variable "security_group_ids" {
  description = "Security group IDs for ALB"
  type        = list(string)
}

variable "certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "enable_logging" {
  description = "Enable ALB access logs"
  type        = bool
  default     = false
}

variable "logging_bucket_name" {
  description = "S3 bucket for ALB logs"
  type        = string
  default     = ""
}

variable "logging_prefix" {
  description = "Prefix for ALB logs"
  type        = string
  default     = "alb/"
}

variable "health_check_path" {
  description = "Path for health check"
  type        = string
  default     = "/"
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 30
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "healthy_threshold" {
  description = "Number of successful health checks before marking healthy"
  type        = number
  default     = 2
}

variable "unhealthy_threshold" {
  description = "Number of failed health checks before marking unhealthy"
  type        = number
  default     = 3
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ============================================
# Application Load Balancer
# ============================================

resource "aws_lb" "main" {
  name_prefix        = replace(substr(var.name_prefix, 0, 6), "-", "")
  internal           = false
  load_balancer_type = "application"
  security_groups    = var.security_group_ids
  subnets            = var.subnets

  enable_deletion_protection = var.environment == "prod"
  enable_http2               = true
  enable_cross_zone_load_balancing = true

  dynamic "access_logs" {
    for_each = var.enable_logging ? [1] : []

    content {
      bucket  = var.logging_bucket_name
      prefix  = var.logging_prefix
      enabled = true
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-alb"
  })
}

# ============================================
# HTTP Listener (redirect to HTTPS)
# ============================================

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = "80"
  protocol          = "HTTP"

  default_action {
    type = "redirect"

    redirect {
      port        = "443"
      protocol    = "HTTPS"
      status_code = "HTTP_301"
    }
  }
}

# ============================================
# HTTPS Listener
# ============================================

resource "aws_lb_listener" "https" {
  load_balancer_arn = aws_lb.main.arn
  port              = "443"
  protocol          = "HTTPS"
  ssl_policy        = "ELBSecurityPolicy-TLS-1-2-2017-01"
  certificate_arn   = var.certificate_arn

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.main.arn
  }
}

# ============================================
# Target Group
# ============================================

resource "aws_lb_target_group" "main" {
  name_prefix = replace(substr(var.name_prefix, 0, 6), "-", "")
  port        = 80
  protocol    = "HTTP"
  vpc_id      = var.vpc_id

  health_check {
    path                = var.health_check_path
    interval            = var.health_check_interval
    timeout             = var.health_check_timeout
    healthy_threshold   = var.healthy_threshold
    unhealthy_threshold = var.unhealthy_threshold
    matcher             = "200-399"
  }

  stickiness {
    type            = "lb_cookie"
    enabled         = true
    cookie_duration = 86400  # 1 day
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-tg"
  })
}

# ============================================
# Outputs
# ============================================

output "arn" {
  value       = aws_lb.main.arn
  description = "ALB ARN"
}

output "dns_name" {
  value       = aws_lb.main.dns_name
  description = "ALB DNS name"
}

output "zone_id" {
  value       = aws_lb.main.zone_id
  description = "ALB zone ID (for Route 53 alias)"
}

output "target_group_arn" {
  value       = aws_lb_target_group.main.arn
  description = "Target group ARN"
}

output "target_group_name" {
  value       = aws_lb_target_group.main.name
  description = "Target group name"
}

output "listener_https_arn" {
  value       = aws_lb_listener.https.arn
  description = "HTTPS listener ARN"
}
