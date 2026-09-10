///|
test "finished_at transitions" {
  let fixed_now = "2026-09-09T12:00:00.000Z"
  let to_finished = resolve_finished_at(
    Some("reading"),
    None,
    Some("finished"),
    true,
    fixed_now,
  )
  assert_eq(to_finished, Some(fixed_now))
  let cleared = resolve_finished_at(
    Some("finished"),
    Some(fixed_now),
    Some("reading"),
    true,
    fixed_now,
  )
  assert_eq(cleared, None)
  let unchanged = resolve_finished_at(
    Some("finished"),
    Some(fixed_now),
    Some("finished"),
    false,
    fixed_now,
  )
  assert_eq(unchanged, Some(fixed_now))
}

///|
test "tokenizer ascii words" {
  let tokens = tokenize("Hello hello WORLD")
  assert_true(tokens.contains("hello"))
  assert_true(tokens.contains("world"))
}
