///|
async fn handle_stats(ctx : @mars.Context) -> Unit raise Error {
  if !require_auth(ctx) {
    ()
  } else if get_db() is None {
    ctx.json(
      Json::object({ "error": Json::string("Database not configured") }),
      status=500,
    )
  } else {
    let db = get_db().unwrap()
    let user_id = get_user_id(ctx).unwrap()
    let counts_row = @readings.get_stats_counts(
      db,
      @readings.GetStatsCountsParams::new(user_id),
    )
    let (start, end) = jst_month_range()
    let pages_row = @readings.get_stats_pages_this_month(
      db,
      @readings.GetStatsPagesThisMonthParams::new(user_id, Some(start), Some(end)),
    )
    let finished = match counts_row {
      Some(row) =>
        match row.finished {
          Some(v) => v.to_int()
          None => 0
        }
      None => 0
    }
    let reading = match counts_row {
      Some(row) =>
        match row.reading {
          Some(v) => v.to_int()
          None => 0
        }
      None => 0
    }
    let tsundoku = match counts_row {
      Some(row) =>
        match row.tsundoku {
          Some(v) => v.to_int()
          None => 0
        }
      None => 0
    }
    let pages_this_month = match pages_row {
      Some(row) => int_from_int64(row.pages_this_month)
      None => 0
    }
    ctx.json(
      Json::object({
        "finished": Json::number(finished.to_double()),
        "reading": Json::number(reading.to_double()),
        "tsundoku": Json::number(tsundoku.to_double()),
        "pagesThisMonth": Json::number(pages_this_month.to_double()),
      }),
    )
  }
}
