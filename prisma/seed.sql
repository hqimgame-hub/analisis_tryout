INSERT INTO User (id, username, password, role, createdAt)
VALUES ('admin-id', 'admin', '$2b$10$jqvSIMJ6g89kDXK82ZsDmevyomGboPhiFD4o.6TTnIgfIMY9PYr3O', 'ADMIN', 1733458000000)
ON CONFLICT(username) DO NOTHING;
