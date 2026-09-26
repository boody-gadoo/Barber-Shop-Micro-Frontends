aws_region              = "us-east-1"
environment             = "prod"
project_name            = "barber-shop"
domain_name             = "barber-shop.com"
alternative_domains     = ["www.barber-shop.com"]
acm_certificate_arn     = "arn:aws:acm:us-east-1:ACCOUNT_ID:certificate/CERTIFICATE_ID"
vpc_id                  = "vpc-PROD_VPC_ID"
alb_subnets             = ["subnet-PROD_SUBNET_1", "subnet-PROD_SUBNET_2"]
cloudfront_default_ttl  = 3600
cloudfront_max_ttl      = 86400
cloudfront_min_ttl      = 0
log_retention_days      = 90

s3_lifecycle_rules = [
  {
    id      = "archive-old-assets"
    enabled = true
    transition = {
      days          = 90
      storage_class = "GLACIER"
    }
  },
  {
    id      = "delete-very-old-assets"
    enabled = true
    expiration = {
      days = 365
    }
  }
]

additional_tags = {
  CostCenter = "Engineering"
  Owner      = "DevOps"
  Compliance = "SOC2"
}
