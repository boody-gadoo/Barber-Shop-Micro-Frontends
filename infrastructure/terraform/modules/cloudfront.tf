variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "origin_domain" {
  description = "Origin domain name (S3 regional domain)"
  type        = string
}

variable "s3_bucket_id" {
  description = "S3 bucket ID for bucket policy"
  type        = string
}

variable "origin_access_identity_arn" {
  description = "CloudFront OAI ARN for S3 access"
  type        = string
}

variable "domain_name" {
  description = "Primary domain name for the distribution"
  type        = string
}

variable "alternative_domains" {
  description = "Alternative domain names"
  type        = list(string)
  default     = []
}

variable "acm_certificate_arn" {
  description = "ACM certificate ARN for HTTPS"
  type        = string
}

variable "default_ttl" {
  description = "Default TTL for cache (seconds)"
  type        = number
  default     = 3600
}

variable "max_ttl" {
  description = "Max TTL for cache (seconds)"
  type        = number
  default     = 86400
}

variable "min_ttl" {
  description = "Min TTL for cache (seconds)"
  type        = number
  default     = 0
}

variable "enable_security_headers" {
  description = "Enable security headers in responses"
  type        = bool
  default     = true
}

variable "logging_bucket_name" {
  description = "S3 bucket for CloudFront logs"
  type        = string
  default     = ""
}

variable "logging_prefix" {
  description = "Prefix for CloudFront logs"
  type        = string
  default     = "cloudfront/"
}

variable "custom_headers" {
  description = "Custom headers to add to responses"
  type        = map(string)
  default     = {}
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}

# ============================================
# CloudFront Distribution
# ============================================

resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.origin_domain
    origin_id   = "S3Origin"

    s3_origin_config {
      origin_access_identity = var.origin_access_identity_arn
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }

      headers = ["Host"]
    }

    min_ttl             = var.min_ttl
    default_ttl         = var.default_ttl
    max_ttl             = var.max_ttl
    compress            = true
    viewer_protocol_policy = "redirect-to-https"
  }

  # Cache behavior for API requests (no caching)
  ordered_cache_behavior {
    path_pattern     = "/api/*"
    allowed_methods  = ["GET", "HEAD", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = true

      cookies {
        forward = "all"
      }

      headers = ["*"]
    }

    min_ttl             = 0
    default_ttl         = 0
    max_ttl             = 0
    compress            = true
    viewer_protocol_policy = "https-only"
  }

  # Cache behavior for static assets with long TTL
  ordered_cache_behavior {
    path_pattern     = "/static/*"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = false

      cookies {
        forward = "none"
      }
    }

    min_ttl             = 31536000  # 1 year
    default_ttl         = 31536000
    max_ttl             = 31536000
    compress            = true
    viewer_protocol_policy = "https-only"
  }

  # Cache behavior for HTML files (versioning via query string)
  ordered_cache_behavior {
    path_pattern     = "*.html"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3Origin"

    forwarded_values {
      query_string = true

      cookies {
        forward = "none"
      }
    }

    min_ttl             = 0
    default_ttl         = 300  # 5 minutes
    max_ttl             = 3600  # 1 hour
    compress            = true
    viewer_protocol_policy = "https-only"
  }

  # Domain aliases
  aliases = concat([var.domain_name], var.alternative_domains)

  # Enabled
  enabled = true

  # Default root object
  default_root_object = "index.html"

  # Logging
  dynamic "logging_config" {
    for_each = var.logging_bucket_name != "" ? [1] : []

    content {
      include_cookies = false
      bucket          = var.logging_bucket_name
      prefix          = var.logging_prefix
    }
  }

  # Custom error responses
  custom_error_response {
    error_code            = 403
    response_code         = 200
    response_page_path    = "/index.html"
    error_caching_min_ttl = 300
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/404.html"
    error_caching_min_ttl = 300
  }

  # Viewer certificate (HTTPS)
  viewer_certificate {
    cloudfront_default_certificate = false
    acm_certificate_arn            = var.acm_certificate_arn
    ssl_support_method             = "sni-only"
    minimum_protocol_version       = "TLSv1.2_2021"
  }

  # HTTP/2 and HTTP/3 support
  http_version       = "http2and3"
  is_ipv6_enabled    = true

  # Restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = merge(var.tags, {
    Name = "${var.name_prefix}-cloudfront"
  })

  depends_on = [var.acm_certificate_arn]
}

# ============================================
# S3 Bucket Policy (allow CloudFront access)
# ============================================

resource "aws_s3_bucket_policy" "cloudfront_access" {
  bucket = var.s3_bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontAccess"
        Effect = "Allow"
        Principal = {
          AWS = var.origin_access_identity_arn
        }
        Action   = "s3:GetObject"
        Resource = "arn:aws:s3:::${var.s3_bucket_id}/*"
      }
    ]
  })
}

# ============================================
# Outputs
# ============================================

output "distribution_id" {
  value       = aws_cloudfront_distribution.main.id
  description = "CloudFront distribution ID"
}

output "domain_name" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront distribution domain name"
}

output "etag" {
  value       = aws_cloudfront_distribution.main.etag
  description = "Current version ID of the distribution"
}

output "distribution_arn" {
  value       = aws_cloudfront_distribution.main.arn
  description = "CloudFront distribution ARN"
}
