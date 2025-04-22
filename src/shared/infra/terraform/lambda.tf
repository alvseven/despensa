resource "aws_lambda_function" "process_pending_notifications" {
  function_name = "process-pending-notifications"
  filename      = "aws/lambdas/zips/process-pending-notifications.zip"
  source_code_hash = filebase64sha256("aws/lambdas/zips/process-pending-notifications.zip")
  handler       = "index.handler"
  runtime       = "nodejs22.6"
  role          = aws_iam_role.lambda_exec.arn
  timeout       = 30

  environment {
    variables = {
      AWS_SQS_QUEUE_URL = var.sqs_queue_url
    }
  }
}