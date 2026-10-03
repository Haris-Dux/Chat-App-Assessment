INSERT INTO businesses (id, slug, name, timezone, opens_at, closes_at, working_days)
VALUES ('0a802981-19c0-48c0-b702-0eab33bd1d25', 'lumen-physio', 'Lumen Physio', 'Asia/Karachi', '09:00', '18:00', '{1,2,3,4,5,6}')
ON CONFLICT DO NOTHING;

INSERT INTO services (id, business_id, name, description, duration_minutes)
VALUES
  ('12648568-6b58-4741-b2ee-fe0e40703523', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'Initial assessment', 'First visit: history, movement screening and a personalised treatment plan.', 60),
  ('ed0e245a-2230-4023-8d40-fb7c60bf667b', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'Follow-up session', 'Hands-on treatment and exercise progression for existing patients.', 30),
  ('63a975fa-0bf7-4997-b9ae-034abc790490', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'Sports massage', 'Deep tissue massage focused on recovery and mobility.', 45)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, business_id, email, password_hash, full_name)
VALUES ('f2ff91a4-a379-47ee-9024-f0377bc484f1', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'demo@lumenphysio.test', '$argon2id$v=19$m=65536,p=4,t=3$hzrRUondsXtLHQuNKK2s0g$01ub7IbvHYRjNXslhxiGgLFCqlQPUuM+RhD/cEitl1M', 'Demo Patient')
ON CONFLICT DO NOTHING;

INSERT INTO chat_sessions (id, business_id, user_id, title, draft, last_message_at, created_at)
VALUES ('b46f9931-dc34-41bb-8ee0-b7005d613c2f', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'f2ff91a4-a379-47ee-9024-f0377bc484f1', 'Assessment for my knee', '{"serviceId": "12648568-6b58-4741-b2ee-fe0e40703523", "notes": "Knee pain"}', now() - interval '6 days', now() - interval '6 days')
ON CONFLICT DO NOTHING;

INSERT INTO chat_messages (id, session_id, role, content, mentions, attachment, created_at)
VALUES
  ('e623cca8-80d7-415f-a45c-83c8673901a7', 'b46f9931-dc34-41bb-8ee0-b7005d613c2f', 'user', 'Assessment for my knee', '[{"text": "Assessment", "field": "service", "value": "12648568-6b58-4741-b2ee-fe0e40703523"}]', NULL, now() - interval '6 days'),
  ('774412f3-c9f3-45a7-b5b4-71c618a09078', 'b46f9931-dc34-41bb-8ee0-b7005d613c2f', 'assistant', 'Happy to help with your knee. Which day works best for you?', '[]', NULL, now() - interval '6 days' + interval '2 seconds')
ON CONFLICT DO NOTHING;

INSERT INTO appointments (id, business_id, user_id, service_id, chat_session_id, starts_at, ends_at, status, notes, created_at, cancelled_at)
VALUES
  (
    'd623fd71-6ae3-40fe-b822-fb17e77e227c', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'f2ff91a4-a379-47ee-9024-f0377bc484f1', '12648568-6b58-4741-b2ee-fe0e40703523', 'b46f9931-dc34-41bb-8ee0-b7005d613c2f',
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') - interval '5 days' + interval '10 hours') AT TIME ZONE 'Asia/Karachi',
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') - interval '5 days' + interval '11 hours') AT TIME ZONE 'Asia/Karachi',
    'confirmed', 'Left knee pain when climbing stairs', now() - interval '6 days', NULL
  ),
  (
    '80cb9ebd-f273-4ad1-bff9-a83e2b07c0d9', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'f2ff91a4-a379-47ee-9024-f0377bc484f1', 'ed0e245a-2230-4023-8d40-fb7c60bf667b', NULL,
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') + interval '2 days 11 hours') AT TIME ZONE 'Asia/Karachi',
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') + interval '2 days 11 hours 30 minutes') AT TIME ZONE 'Asia/Karachi',
    'confirmed', NULL, now() - interval '4 days', NULL
  ),
  (
    '3c9e5f1d-8a27-4b6e-9d40-5e2a7c1b8f93', '0a802981-19c0-48c0-b702-0eab33bd1d25', 'f2ff91a4-a379-47ee-9024-f0377bc484f1', '63a975fa-0bf7-4997-b9ae-034abc790490', NULL,
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') + interval '4 days 15 hours') AT TIME ZONE 'Asia/Karachi',
    (date_trunc('day', now() AT TIME ZONE 'Asia/Karachi') + interval '4 days 15 hours 45 minutes') AT TIME ZONE 'Asia/Karachi',
    'cancelled', NULL, now() - interval '3 days', now() - interval '1 day'
  )
ON CONFLICT DO NOTHING;
