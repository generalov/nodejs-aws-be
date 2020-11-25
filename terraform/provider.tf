provider "aws" {
  region  = "us-east-2"
  version = "~> 3.15"
}

terraform {
  required_version = "~> 0.13.0"
  backend "s3" {
    bucket         = "nodejs-aws-terraform-up-and-running-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "nodejs-aws-terraform-up-and-running-locks"
    encrypt        = true
  }
}
