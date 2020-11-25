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
