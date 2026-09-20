<?php

return [
    'paths' => ['*'],

    'allowed_methods' => ['*'],

    // Scheme is part of the origin: http://foo and https://foo are different.
    // Keep this as * so HTTP→HTTPS (and www/non-www) never needs a whitelist update.
    'allowed_origins' => ['*'],

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 86400,

    // Must stay false with allowed_origins *. Browsers reject * + credentials.
    'supports_credentials' => false,
];
