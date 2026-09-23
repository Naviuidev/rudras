<?php
// Cron job: Run daily to process milk deliveries
// Add to crontab: 0 6 * * * php /path/to/backend/cron/daily_delivery.php

require_once __DIR__ . '/../vendor/autoload.php';

use App\Config\Env;

Env::load();

use App\Models\Subscription;

Subscription::processDailyDelivery();
echo "Daily delivery processed at " . date('Y-m-d H:i:s') . "\n";
