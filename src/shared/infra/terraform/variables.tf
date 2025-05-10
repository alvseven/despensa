variable "sqs_queue_url" {
  description = "URL of the SQS queue used by the lambda"
  type        = string
}

variable "aws_region" {
  description = "AWS region"
  type        = string
}