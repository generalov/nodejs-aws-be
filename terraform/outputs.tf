output "import_s3_bucket" {
  value = aws_s3_bucket.task5_csv.bucket
}
output "import_s3_region" {
  value = aws_s3_bucket.task5_csv.region
}
