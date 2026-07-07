-- Member provenance: who added a shopping list item
-- SET NULL on user delete so removing a member never cascade-deletes list rows
ALTER TABLE "shopping_list_item"
	ADD COLUMN IF NOT EXISTS added_by_user_id text REFERENCES "user"(id) ON DELETE SET NULL;
