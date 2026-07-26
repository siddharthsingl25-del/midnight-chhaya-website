-- Track when a shipping label was last printed / downloaded for an order.
-- Once stamped, the order drops out of the "Print all paid labels" bulk
-- queue in the admin so we don't reprint the same one by accident.
-- A "Reprint" action is still available per-row when needed.

alter table orders
  add column if not exists label_printed_at timestamptz;

create index if not exists idx_orders_label_printed_at
  on orders (label_printed_at)
  where label_printed_at is null;
