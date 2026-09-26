variable "aws_region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-\\d{1}$", var.aws_region))
    error_message = "AWS region must be a valid region format (e.g., us-east-1)."
  }
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "Environment must be dev, staging, or prod."
  }
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "barber-shop"

  validation {
    condition     = length(var.project_name) <= 32 && can(regex("^[a-z0-9-]+$", var.project_name))
    error_message = "Project name must be lowercase alphanumeric with hyphens, max 32 characters."
  }
}

variable "domain_name" {
  description = "Primary domain name (e.g., barber-shop.com)"
  type        = string

  validation {
    condition     = can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z]{2,})+$", var.domain_name))
    error_message = "Domain name must be a valid domain format."
  }
}

variable "alternative_domains" {
  description = "Alternative domain names (e.g., www.barber-shop.com)"
  type        = list(string)
  default     = []

  validation {
    condition = alltrue([
      for domain in var.alternative_domains :
      can(regex("^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\\.[a-z]{2,})+$", domain))
    ])
    error_message = "All alternative domains must be valid domain formats."
  }
}

variable "acm_certificate_arn" {
  description = "ARN of the ACM certificate for HTTPS"
  type        = string

  validation {
    condition     = can(regex("^arn:aws:acm:[a-z0-9-]+:\\d{12}:certificate/[a-f0-9-]+$", var.acm_certificate_arn))
    error_message = "ACM certificate ARN must be a valid format."
  }
}

variable "vpc_id" {
  description = "VPC ID for ALB and other resources"
  type        = string

  validation {
    condition     = can(regex("^vpc-[a-f0-9]{17}$", var.vpc_id))
    error_message = "VPC ID must be a valid format (e.g., vpc-xxxxxxxxx)."
  }
}

variable "alb_subnets" {
  description = "Subnets for ALB (must be in different AZs)"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.alb_subnets) >= 2
    error_message = "ALB subnets must include at least 2 subnets in different AZs."
  }
}

# CloudFront caching configuration
variable "cloudfront_default_ttl" {
  description = "Default TTL for CloudFront cache (seconds)"
  type        = number
  default     = 3600

  validation {
    condition     = var.cloudfront_default_ttl >= 0 && var.cloudfront_default_ttl <= 31536000
    error_message = "Default TTL must be between 0 and 31536000 seconds (1 year)."
  }
}

variable "cloudfront_max_ttl" {
  description = "Max TTL for CloudFront cache (seconds)"
  type        = number
  default     = 86400

  validation {
    condition     = var.cloudfront_max_ttl >= 0 && var.cloudfront_max_ttl <= 31536000
    error_message = "Max TTL must be between 0 and 31536000 seconds (1 year)."
  }
}

variable "cloudfront_min_ttl" {
  description = "Min TTL for CloudFront cache (seconds)"
  type        = number
  default     = 0

  validation {
    condition     = var.cloudfront_min_ttl >= 0
    error_message = "Min TTL must be greater than or equal to 0."
  }
}

# S3 lifecycle rules
variable "s3_lifecycle_rules" {
  description = "S3 lifecycle rules for assets bucket"
  type = list(object({
    id      = string
    enabled = bool
    expiration = optional(object({
      days = number
    }))
    transition = optional(object({
      days          = number
      storage_class = string
    }))
  }))

  default = [
    {
      id      = "archive-old-assets"
      enabled = true
      transition = {
        days          = 90
        storage_class = "GLACIER"
      }
    }
  ]
}

# Logging configuration
variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 30

  validation {
    condition     = contains([1, 3, 5, 7, 14, 30, 60, 90, 120, 150, 180, 365, 400, 545, 731, 1827, 3653], var.log_retention_days)
    error_message = "Log retention days must be one of the AWS allowed values."
  }
}

# Tags
variable "additional_tags" {
  description = "Additional tags to apply to all resources"
  type        = map(string)
  default     = {}
}
