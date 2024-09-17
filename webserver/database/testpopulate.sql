INSERT INTO "devices" (d_id, d_address, d_port)
VALUES (1, '8.8.8.8', 80);

INSERT INTO "devices" (d_id, d_address, d_port)
VALUES (2, '8.9.10.111', 922);

INSERT INTO "channels" (c_id, d_id, c_name, c_freq, c_endpoint)
VALUES (1, 1, 'Test channel 1', 467687500, 27832634);
INSERT INTO "channels" (c_id, d_id, c_name, c_freq, c_endpoint)
VALUES (2, 1, 'Test channel 2', 457712500, NULL);
INSERT INTO "channels" (c_id, d_id, c_name, c_freq, c_endpoint)
VALUES (3, 1, 'Test channel 3', 457575000, NULL);
INSERT INTO "channels" (c_id, d_id, c_name, c_freq, c_endpoint)
VALUES (4, 2, 'Test channel 4', 163250000, NULL);
INSERT INTO "channels" (c_id, d_id, c_name, c_freq, c_endpoint)
VALUES (5, 2, 'Test channel 4', 163290000, NULL);
SELECT setval('"channels_c_id_seq"', (SELECT MAX(c_id) from "channels"));

INSERT INTO "sessions" (session_id, auth_token)
VALUES (1, 32345978623457985);
INSERT INTO "sessions" (session_id, auth_token)
VALUES (2, 92317635287643543);
INSERT INTO "sessions" (session_id, auth_token)
VALUES (3, 44561672369236228);
SELECT setval('"sessions_session_id_seq"', (SELECT MAX(session_id) from "sessions"));

INSERT INTO "session_listeners" (session_id, c_id)
VALUES (1, 1);
INSERT INTO "session_listeners" (session_id, c_id)
VALUES (3, 1);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (1, 1, @@@+43, -71.34709614139982);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (2, 1, @@@+48, -72.72054876190623);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (3, 1, @@@+53, -66.46837904196241);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (4, 1, @@@+58, -67.60606260348102);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (5, 1, @@@+63, -72.71356287160499);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (6, 1, @@@+68, -73.90898992027194);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (7, 1, @@@+73, -68.26283756332114);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (8, 1, @@@+78, -70.79487988238002);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (9, 1, @@@+83, -66.21372290587142);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (10, 1, @@@+88, -71.86019962085707);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (11, 2, @@@+42, -113.92182725184362);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (12, 2, @@@+47, -106.01870098335682);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (13, 2, @@@+52, -112.90792513515122);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (14, 2, @@@+57, -114.91047087222911);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (15, 2, @@@+62, -108.62431835276342);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (16, 2, @@@+67, -109.5981734941747);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (17, 2, @@@+72, -113.29041018845513);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (18, 2, @@@+77, -110.74520656155596);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (19, 2, @@@+82, -114.42921625268897);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (20, 2, @@@+87, -111.75014154870652);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (21, 4, @@@+42, -68.50859972356398);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (22, 4, @@@+47, -77.6885495298458);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (23, 4, @@@+52, -92.32390436056141);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (24, 4, @@@+57, -113.01493038234403);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (25, 4, @@@+62, -81.99612501836309);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (26, 4, @@@+67, -81.8659004515987);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (27, 4, @@@+72, -92.4586789188063);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (28, 4, @@@+77, -99.3140108285559);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (29, 4, @@@+82, -79.79955241872723);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (30, 4, @@@+87, -95.73695105828416);

SELECT setval('"strength_s_id_seq"', (SELECT MAX(s_id) from "strength"));

INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (1, 4, @@@+42, @@@+54, 12, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (2, 4, @@@+63, @@@+64, 1, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (3, 4, @@@+66, @@@+77, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (4, 4, @@@+87, @@@+94, 7, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (5, 4, 100+@@@+09, 100+@@@+18, 9, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (6, 4, 100+@@@+36, 100+@@@+44, 8, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (7, 4, 100+@@@+49, 100+@@@+60, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (8, 4, 100+@@@+70, 100+@@@+72, 2, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (9, 4, 100+@@@+81, 100+@@@+93, 12, FALSE);

INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (11, 1, @@@+42, @@@+52, 10, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (12, 1, @@@+56, @@@+66, 10, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (13, 1, @@@+80, @@@+87, 7, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (14, 1, 100+@@@+08, 100+@@@+13, 5, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (15, 1, 100+@@@+27, 100+@@@+37, 10, TRUE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (16, 1, 100+@@@+46, 100+@@@+57, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (17, 1, 100+@@@+70, 100+@@@+71, 1, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (18, 1, 100+@@@+82, 100+@@@+84, 2, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (19, 1, 100+@@@+85, 100+@@@+93, 8, FALSE);
SELECT setval('"utilisation_u_id_seq"', (SELECT MAX(u_id) from "utilisation"));