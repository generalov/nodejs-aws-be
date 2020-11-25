// task 5
resource "aws_s3_bucket" "task5_csv" {
  bucket = "nodejs-aws-task5-csv"
  acl    = "private"

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["PUT"]
    allowed_origins = ["*"]
    expose_headers  = ["ETag"]
    max_age_seconds = 3000
  }
}
