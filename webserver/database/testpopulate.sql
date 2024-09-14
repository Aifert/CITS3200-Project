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

INSERT INTO "sessions" (session_id, auth_token)
VALUES (1, 32345978623457985);
INSERT INTO "sessions" (session_id, auth_token)
VALUES (2, 92317635287643543);
INSERT INTO "sessions" (session_id, auth_token)
VALUES (3, 44561672369236228);

INSERT INTO "session_listeners" (session_id, c_id)
VALUES (1, 1);
INSERT INTO "session_listeners" (session_id, c_id)
VALUES (3, 1);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (1, 1, 1725547143, -71.34709614139982);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (2, 1, 1725547148, -72.72054876190623);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (3, 1, 1725547153, -66.46837904196241);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (4, 1, 1725547158, -67.60606260348102);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (5, 1, 1725547163, -72.71356287160499);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (6, 1, 1725547168, -73.90898992027194);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (7, 1, 1725547173, -68.26283756332114);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (8, 1, 1725547178, -70.79487988238002);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (9, 1, 1725547183, -66.21372290587142);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (10, 1, 1725547188, -71.86019962085707);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (11, 2, 1725547142, -113.92182725184362);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (12, 2, 1725547147, -106.01870098335682);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (13, 2, 1725547152, -112.90792513515122);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (14, 2, 1725547157, -114.91047087222911);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (15, 2, 1725547162, -108.62431835276342);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (16, 2, 1725547167, -109.5981734941747);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (17, 2, 1725547172, -113.29041018845513);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (18, 2, 1725547177, -110.74520656155596);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (19, 2, 1725547182, -114.42921625268897);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (20, 2, 1725547187, -111.75014154870652);

INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (21, 4, 1725547142, -68.50859972356398);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (22, 4, 1725547147, -77.6885495298458);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (23, 4, 1725547152, -92.32390436056141);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (24, 4, 1725547157, -113.01493038234403);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (25, 4, 1725547162, -81.99612501836309);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (26, 4, 1725547167, -81.8659004515987);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (27, 4, 1725547172, -92.4586789188063);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (28, 4, 1725547177, -99.3140108285559);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (29, 4, 1725547182, -79.79955241872723);
INSERT INTO "strength" (s_id, c_id, s_sample_time, s_strength)
VALUES (30, 4, 1725547187, -95.73695105828416);

SELECT setval('"strength_s_id_seq"', (SELECT MAX(s_id) from "strength"));

INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (1, 4, 1725547142, 1725547154, 12, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (2, 4, 1725547163, 1725547164, 1, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (3, 4, 1725547166, 1725547177, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (4, 4, 1725547187, 1725547194, 7, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (5, 4, 1725547209, 1725547218, 9, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (6, 4, 1725547236, 1725547244, 8, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (7, 4, 1725547249, 1725547260, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (8, 4, 1725547270, 1725547272, 2, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (9, 4, 1725547281, 1725547293, 12, FALSE);

INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (11, 1, 1725547142, 1725547152, 10, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (12, 1, 1725547156, 1725547166, 10, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (13, 1, 1725547180, 1725547187, 7, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (14, 1, 1725547208, 1725547213, 5, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (15, 1, 1725547227, 1725547237, 10, TRUE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (16, 1, 1725547246, 1725547257, 11, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (17, 1, 1725547270, 1725547271, 1, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (18, 1, 1725547282, 1725547284, 2, FALSE);
INSERT INTO "utilisation" (u_id, c_id, a_start_time, a_end_time, duration, is_active)
VALUES (19, 1, 1725547285, 1725547293, 8, FALSE);
SELECT setval('"utilisation_u_id_seq"', (SELECT MAX(u_id) from "utilisation"));