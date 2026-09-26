terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state management
  # Use: terraform init -backend-config="bucket=barber-shop-tfstate-prod" etc.
  backend "s3" {
    # These values are provided via -backend-config flags during init
    # This prevents hardcoding sensitive values in source control
    encrypt        = true
    dynamodb_table = "terraform-lock"
    region         = "us-east-1"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
      CreatedAt   = timestamp()
    }
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables for common values
locals {
  env_short      = substr(var.environment, 0, 1) # p, s, d
  project_short  = substr(var.project_name, 0, 3) # bsh
  name_prefix    = "${var.project_name}-${var.environment}"
  account_id     = data.aws_caller_identity.current.account_id
  current_region = data.aws_region.current.name

  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "Terraform"
    CreatedAt   = timestamp()
  }
}

# ====================
# S3 Buckets
# ====================

module "s3_assets" {
  source = "./modules/s3"

  bucket_name          = "${local.name_prefix}-assets"
  environment          = var.environment
  enable_versioning    = true
  enable_encryption    = true
  enable_logging       = var.environment == "prod"
  enable_public_access = false
  lifecycle_rules      = var.s3_lifecycle_rules

  cors_rules = [
    {
      allowed_headers = ["*"]
      allowed_methods = ["GET", "HEAD"]
      allowed_origins = [var.domain_name]
      expose_headers  = ["ETag"]
      max_age_seconds = 3600
    }
  ]

  tags = local.common_tags
}

module "s3_logs" {
  source = "./modules/s3"

  bucket_name          = "${local.name_prefix}-logs"
  environment          = var.environment
  enable_versioning    = false
  enable_encryption    = true
  enable_logging       = false
  enable_public_access = false
  lifecycle_rules = [
    {
      id      = "delete-old-logs"
      enabled = true
      expiration = {
        days = 90
      }
    }
  ]

  tags = local.common_tags
}

# ====================
# CloudFront Distribution
# ====================

module "cloudfront" {
  source = "./modules/cloudfront"

  name_prefix = local.name_prefix
  environment = var.environment

  # Origin configuration
  origin_domain    = module.s3_assets.bucket_regional_domain_name
  s3_bucket_id     = module.s3_assets.bucket_id
  origin_access_identity_arn = aws_cloudfront_origin_access_identity.s3.iam_arn

  # Domain and SSL
  domain_name            = var.domain_name
  alternative_domains    = var.alternative_domains
  acm_certificate_arn    = var.acm_certificate_arn
  enable_security_headers = true

  # Caching behavior
  default_ttl = var.cloudfront_default_ttl
  max_ttl     = var.cloudfront_max_ttl
  min_ttl     = var.cloudfront_min_ttl

  # Enable logging
  logging_bucket_name = module.s3_logs.bucket_name
  logging_prefix      = "cloudfront/"

  # Custom headers
  custom_headers = {
    "X-Environment"     = var.environment
    "X-Project"         = var.project_name
    "X-Deployed-By"     = "Terraform"
    "Strict-Transport-Security" = "max-age=31536000; includeSubDomains; preload"
    "X-Content-Type-Options"    = "nosniff"
    "X-Frame-Options"           = "DENY"
    "X-XSS-Protection"          = "1; mode=block"
    "Referrer-Policy"           = "strict-origin-when-cross-origin"
    "Permissions-Policy"        = "geolocation=(), microphone=(), camera=()"
  }

  tags = local.common_tags
}

resource "aws_cloudfront_origin_access_identity" "s3" {
  comment = "OAI for ${local.name_prefix} S3 assets bucket"
}

# ====================
# Application Load Balancer (for API Gateway proxying)
# ====================

module "alb" {
  source = "./modules/alb"

  name_prefix = local.name_prefix
  environment = var.environment
  vpc_id      = var.vpc_id

  # Network configuration
  subnets            = var.alb_subnets
  security_group_ids = [aws_security_group.alb.id]

  # TLS certificate
  certificate_arn = var.acm_certificate_arn

  # Logging
  enable_logging      = var.environment == "prod"
  logging_bucket_name = module.s3_logs.bucket_name
  logging_prefix      = "alb/"

  # Health check configuration
  health_check_path     = "/health"
  health_check_interval = 30
  health_check_timeout  = 5
  healthy_threshold     = 2
  unhealthy_threshold   = 3

  tags = local.common_tags
}

# Security group for ALB
resource "aws_security_group" "alb" {
  name_prefix = "${local.name_prefix}-alb-"
  description = "Security group for ${local.name_prefix} ALB"
  vpc_id      = var.vpc_id

  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTP"
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow HTTPS"
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb-sg"
  })
}

# ====================
# Lambda Execution Role
# ====================

resource "aws_iam_role" "lambda_execution" {
  name_prefix = "${local.project_short}-lambda-exec-"

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

  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

resource "aws_iam_role_policy_attachment" "lambda_xray_write" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess"
}

# ====================
# CloudWatch Log Groups
# ====================

resource "aws_cloudwatch_log_group" "lambda" {
  name_prefix = "/aws/lambda/${local.name_prefix}-"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

resource "aws_cloudwatch_log_group" "alb" {
  name_prefix = "/aws/alb/${local.name_prefix}-"
  retention_in_days = var.log_retention_days

  tags = local.common_tags
}

# ====================
# Outputs
# ====================

output "s3_assets_bucket" {
  value       = module.s3_assets.bucket_name
  description = "Name of the S3 assets bucket"
}

output "cloudfront_distribution_id" {
  value       = module.cloudfront.distribution_id
  description = "CloudFront distribution ID"
}

output "cloudfront_domain_name" {
  value       = module.cloudfront.domain_name
  description = "CloudFront domain name"
}

output "alb_dns_name" {
  value       = module.alb.dns_name
  description = "ALB DNS name"
}

output "alb_arn" {
  value       = module.alb.arn
  description = "ALB ARN"
}

output "lambda_role_arn" {
  value       = aws_iam_role.lambda_execution.arn
  description = "Lambda execution role ARN"
}

output "account_id" {
  value       = local.account_id
  description = "AWS account ID"
}

output "region" {
  value       = local.current_region
  description = "AWS region"
}
