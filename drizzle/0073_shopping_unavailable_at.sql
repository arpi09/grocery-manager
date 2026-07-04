-- Shop mode "not in store": item stays on the list but is parked for the current trip
ALTER TABLE "shopping_list_item"
	ADD COLUMN IF NOT EXISTS unavailable_at timestamp with time zone;
