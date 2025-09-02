<?php

test('basic math works', function () {
    expect(2 + 2)->toBe(4);
});

test('string operations work', function () {
    expect('Hello World')->toContain('World');
});

test('array operations work', function () {
    $array = [1, 2, 3];
    expect($array)->toHaveCount(3);
    expect($array)->toContain(2);
});

test('PHP version is correct', function () {
    expect(version_compare(PHP_VERSION, '8.2.0', '>='))->toBeTrue();
});

test('Pest is working', function () {
    expect(true)->toBeTrue();
});
