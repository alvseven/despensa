resource "aws_cloudwatch_event_rule" "daily_notification_trigger" {
  name                = "daily-notification-trigger"
  schedule_expression = "cron(0 12 * * ? *)"
}

resource "aws_cloudwatch_event_target" "lambda_target" {
  rule      = aws_cloudwatch_event_rule.daily_notification_trigger.name
  target_id = "lambda-process-pending"
  arn       = aws_lambda_function.process_pending_notifications.arn
}

resource "aws_lambda_permission" "allow_eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_pending_notifications.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.daily_notification_trigger.arn
}
