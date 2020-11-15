terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 3.15"
    }
  }
  backend "s3" {
    bucket         = "nodejs-aws-terraform-up-and-running-state"
    key            = "global/s3/terraform.tfstate"
    region         = "us-east-2"
    dynamodb_table = "nodejs-aws-terraform-up-and-running-locks"
    encrypt        = true
  }
}

provider "aws" {
  profile = "default"
  region  = "us-east-2"
}

// state in s3
resource "aws_s3_bucket" "terraform_state" {
  bucket = "nodejs-aws-terraform-up-and-running-state"
  versioning {
    enabled = true
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
}
resource "aws_dynamodb_table" "terraform_locks" {
  name         = "nodejs-aws-terraform-up-and-running-locks"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "LockID"
  attribute {
    name = "LockID"
    type = "S"
  }
}

// task 4
resource "aws_db_instance" "pg" {
  identifier             = "nodejs-aws"
  allocated_storage      = 20
  engine                 = "postgres"
  engine_version         = "12.3"
  instance_class         = "db.t2.micro"
  username               = "postgres"
  password               = var.pg_password
  publicly_accessible    = true
  vpc_security_group_ids = [aws_security_group.pg.id]
}
resource "aws_security_group" "pg" {
  name        = "nodejs-aws-postgres"
  description = "Created by RDS management console"

  ingress {
    cidr_blocks = ["0.0.0.0/0"]
    protocol    = "tcp"
    from_port   = 5432
    to_port     = 5432
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}
