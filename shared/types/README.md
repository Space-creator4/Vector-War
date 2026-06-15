# Shared Types

This MVP is plain JavaScript for fast deployment. Runtime shapes are shared through constants and API payload conventions:

- Player: `discord_id`, `username`, `country_id`, `role`
- Country: `country_id`, `name`, `leader_discord_id`, `allies`, `enemies`
- Unit: `unit_id`, `country_id`, `type`, `assigned_player`, `health`, `lat`, `lng`
- MovementOrder: `order_id`, `unit_id`, `start_lat`, `start_lng`, `end_lat`, `end_lng`, `start_time`, `end_time`, `status`
