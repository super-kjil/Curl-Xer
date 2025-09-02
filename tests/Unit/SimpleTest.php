<?php

test('Pest is working correctly', function () {
    expect(true)->toBeTrue();
});

test('PHP version is supported', function () {
    expect(version_compare(PHP_VERSION, '8.2.0', '>='))->toBeTrue();
});

test('Laravel application can be booted', function () {
    expect(app())->not->toBeNull();
});

test('String manipulation works', function () {
    $text = 'Hello World';
    expect(strlen($text))->toBe(11);
    expect(strtoupper($text))->toBe('HELLO WORLD');
});

test('Array operations work', function () {
    $numbers = [1, 2, 3, 4, 5];
    expect(array_sum($numbers))->toBe(15);
    expect(count($numbers))->toBe(5);
});
