# CloudFront Distribution with optimized caching policies
# Target: 250KB → 200KB bundle reduction through strategic caching
# Static assets: 1-year cache, versioned with content hash

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "domain_name" {
  type        = string
  description = "Domain name for CloudFront distribution"
  default     = "barber-shop.example.com"
}

variable "origin_domain" {
  type        = string
  description = "S3 bucket or origin domain"
  default     = "barber-shop.s3.amazonaws.com"
}

# Custom cache policy for static assets (1 year TTL)
resource "aws_cloudfront_cache_policy" "static_assets" {
  name    = "barber-shop-static-assets"
  comment = "Cache policy for static assets - 1 year TTL"

  default_ttl = 31536000  # 1 year in seconds
  max_ttl     = 31536000  # 1 year
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies {
      behavior = "none"
    }

    headers {
      behavior = "none"
    }

    query_strings {
      behavior = "none"
    }
  }
}

# Custom cache policy for API endpoints (short TTL)
resource "aws_cloudfront_cache_policy" "api_endpoints" {
  name    = "barber-shop-api-endpoints"
  comment = "Cache policy for API endpoints - 5 minute TTL"

  default_ttl = 300   # 5 minutes
  max_ttl     = 3600  # 1 hour
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies {
      behavior = "all"
    }

    headers {
      behavior = "whitelist"
      headers  = ["Authorization", "Content-Type", "Accept"]
    }

    query_strings {
      behavior = "all"
    }
  }
}

# Custom cache policy for HTML documents (no cache)
resource "aws_cloudfront_cache_policy" "html_documents" {
  name    = "barber-shop-html-documents"
  comment = "Cache policy for HTML - validate with origin"

  default_ttl = 0   # No cache by default
  max_ttl     = 0   # No cache
  min_ttl     = 0

  parameters_in_cache_key_and_forwarded_to_origin {
    cookies {
      behavior = "all"
    }

    headers {
      behavior = "whitelist"
      headers  = ["Authorization", "Content-Type", "Accept"]
    }

    query_strings {
      behavior = "all"
    }
  }
}

# Origin request policy
resource "aws_cloudfront_origin_request_policy" "default" {
  name    = "barber-shop-origin-request"
  comment = "Origin request policy for Barber Shop"

  cookies_config {
    cookie_behavior = "all"
  }

  headers_config {
    header_behavior = "whitelist"
    headers         = ["Authorization", "Content-Type", "Accept", "Accept-Language"]
  }

  query_strings_config {
    query_string_behavior = "all"
  }
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "main" {
  origin {
    domain_name = var.origin_domain
    origin_id   = "S3Origin"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"
  http_version        = "http2and3"

  # Cache behaviors: Static assets with 1-year TTL
  ordered_cache_behavior {
    path_pattern           = "*/js/*-*.js"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behaviors: CSS assets
  ordered_cache_behavior {
    path_pattern           = "*/css/*-*.css"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behaviors: Images
  ordered_cache_behavior {
    path_pattern           = "*/images/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behaviors: Fonts
  ordered_cache_behavior {
    path_pattern           = "*/fonts/*"
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = aws_cloudfront_cache_policy.static_assets.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Cache behaviors: API endpoints
  ordered_cache_behavior {
    path_pattern           = "/api/*"
    allowed_methods        = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods         = ["GET", "HEAD"]
    compress               = true
    viewer_protocol_policy = "https-only"

    cache_policy_id          = aws_cloudfront_cache_policy.api_endpoints.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id
  }

  # Default cache behavior: HTML documents
  default_cache_behavior {
    allowed_methods        = ["GET", "HEAD", "OPTIONS"]
    cached_methods         = ["GET", "HEAD"]
    target_origin_id       = "S3Origin"
    compress               = true
    viewer_protocol_policy = "redirect-to-https"

    cache_policy_id          = aws_cloudfront_cache_policy.html_documents.id
    origin_request_policy_id = aws_cloudfront_origin_request_policy.default.id

    response_headers_policy_id = aws_cloudfront_response_headers_policy.security_headers.id

    function_association {
      event_type   = "viewer-request"
      function_arn = aws_cloudfront_function.security_headers.arn
    }
  }

  # Response headers policy for security
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
    # In production, use:
    # acm_certificate_arn      = aws_acm_certificate.cert.arn
    # ssl_support_method       = "sni-only"
    # minimum_protocol_version = "TLSv1.2_2021"
  }

  tags = {
    Name        = "barber-shop-cdn"
    Environment = "production"
    Project     = "barber-shop-mfe"
  }
}

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = "OAI for Barber Shop S3 bucket"
}

# Response headers policy
resource "aws_cloudfront_response_headers_policy" "security_headers" {
  name    = "barber-shop-security-headers"
  comment = "Security headers for Barber Shop"

  security_headers_config {
    frame_options {
      frame_option = "DENY"
      override     = true
    }

    xss_protection {
      mode_block = true
      protection = true
      override   = true
    }

    referrer_policy {
      override        = true
      referrer_policy = "strict-origin-when-cross-origin"
    }

    content_type_options {
      override = true
    }

    strict_transport_security {
      access_control_max_age_sec = 63072000
      include_subdomains         = true
      override                   = true
    }

    content_security_policy {
      content_security_policy = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self'; connect-src 'self'; frame-ancestors 'none';"
      override                = true
    }
  }

  custom_headers_config {
    items {
      header   = "Cache-Control"
      value    = "public, max-age=31536000, immutable"
      override = false
    }

    items {
      header   = "X-Content-Type-Options"
      value    = "nosniff"
      override = false
    }
  }
}

# CloudFront function for viewer requests
resource "aws_cloudfront_function" "security_headers" {
  name    = "barber-shop-security-headers"
  runtime = "cloudfront-js-1.0"
  publish = true
  code    = file("${path.module}/cloudfront-function.js")
}

# Output CloudFront domain
output "cloudfront_domain_name" {
  value       = aws_cloudfront_distribution.main.domain_name
  description = "CloudFront distribution domain name"
}

output "cloudfront_distribution_id" {
  value       = aws_cloudfront_distribution.main.id
  description = "CloudFront distribution ID"
}

# Cache invalidation for deployments
resource "aws_cloudfront_invalidation" "main" {
  distribution_id = aws_cloudfront_distribution.main.id
  paths           = ["/*"]

  # Invalidate on every deployment
  triggers = {
    deployment = filemd5("${path.module}/index.html")
  }

  # Don't invalidate immediately - only on new deployments
  depends_on = [aws_cloudfront_distribution.main]
}
