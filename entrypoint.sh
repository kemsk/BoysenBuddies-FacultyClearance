#!/bin/bash

mkdir -p /app/staticfiles/frontend
cp -r /app/frontend_dist/* /app/staticfiles/frontend/

mkdir -p /app/static

python manage.py collectstatic --noinput
python manage.py makemigrations FC --noinput
python manage.py migrate --noinput

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" --ssl=0 "${DB_NAME}" << 'EOF'
-- Seed Users
INSERT INTO FC_user (email, university_id, password, first_name, last_name, role_value, created_at, is_active, is_staff, is_superuser)
VALUES 
('20220025546@my.xu.edu.ph', '20220025546', 'capstone', 'Albert Floyd', 'Villanueva', 2, NOW(), 1, 1, 1),
('20190016375@my.xu.edu.ph', '20190016375', 'kemeru', 'Nesyl', 'Ylanan', 3, NOW(), 1, 1, 1),
('20220024573@my.xu.edu.ph', '20220024573', 'kim', 'Kim', 'Flores', 3, NOW(), 1, 0, 0),
('approver.seed@xu.edu.ph', 'APPROVER-SEED-1', 'capstone', 'Angela', 'Santos', 4, NOW(), 1, 1, 0),
('assistant.seed@xu.edu.ph', 'ASSISTANT-SEED-1', 'capstone', 'Seed', 'Assistant', 5, NOW(), 1, 1, 0),
('faculty.seed@xu.edu.ph', 'FACULTY-SEED-1', 'capstone', 'John', 'Doe', 6, NOW(), 1, 0, 0),
('hro.seed@xu.edu.ph', 'HRO-SEED-1', 'capstone', 'Jane', 'Smith', 1, NOW(), 1, 1, 0),
('ovphe.seed@xu.edu.ph', 'OVPHE-SEED-1', 'capstone', 'Maria', 'Reyes', 3, NOW(), 1, 1, 0),
('dual.seed@xu.edu.ph', 'DUAL-ROLE-SEED-1', 'capstone', 'Carlos', 'Santos', 7, NOW(), 1, 1, 0)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    role_value = VALUES(role_value),
    is_active = VALUES(is_active),
    is_staff = VALUES(is_staff),
    is_superuser = VALUES(is_superuser);

-- Seed SystemAdmins
INSERT INTO FC_systemadmin (user_id, admin_role, is_active)
SELECT 
    id,
    'CISO',
    1
FROM FC_user WHERE email = '20220025546@my.xu.edu.ph'
ON DUPLICATE KEY UPDATE
    admin_role = VALUES(admin_role),
    is_active = VALUES(is_active);

INSERT INTO FC_systemadmin (user_id, admin_role, is_active)
SELECT 
    id,
    'OVPHE',
    1
FROM FC_user WHERE email = '20190016375@my.xu.edu.ph'
ON DUPLICATE KEY UPDATE
    admin_role = VALUES(admin_role),
    is_active = VALUES(is_active);

-- Seed Colleges
INSERT INTO FC_college (name, abbreviation)
SELECT * FROM (
    SELECT 'College of Computer Studies' AS name, 'CCS' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.abbreviation = v.abbreviation
);

INSERT INTO FC_college (name, abbreviation)
SELECT * FROM (
    SELECT 'College of Arts and Sciences' AS name, 'CAS' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.abbreviation = v.abbreviation
);

-- Get college IDs
SET @ccs_id = (SELECT id FROM FC_college WHERE abbreviation = 'CCS' LIMIT 1);
SET @cas_id = (SELECT id FROM FC_college WHERE abbreviation = 'CAS' LIMIT 1);

-- Seed Departments for CCS
INSERT INTO FC_department (college_id, name, abbreviation)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Computer Science' AS name, 'CS' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.abbreviation = v.abbreviation
);

INSERT INTO FC_department (college_id, name, abbreviation)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Information Technology' AS name, 'IT' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.abbreviation = v.abbreviation
);

-- Get department IDs
SET @cs_id = (SELECT id FROM FC_department WHERE abbreviation = 'CS' AND college_id = @ccs_id LIMIT 1);

-- Seed Offices
INSERT INTO FC_office (name, abbreviation)
SELECT * FROM (
    SELECT 'Office of the Vice President for Higher Education' AS name, 'OVPHE' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation)
SELECT * FROM (
    SELECT 'University Registrar' AS name, 'REG' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation)
SELECT * FROM (
    SELECT 'University Library' AS name, 'LIB' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation)
SELECT * FROM (
    SELECT 'Human Resources Office' AS name, 'HRO' AS abbreviation
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

-- Get admin IDs
SET @ciso_admin_id = (SELECT sa.id FROM FC_systemadmin sa 
                      INNER JOIN FC_user u ON sa.user_id = u.id 
                      WHERE u.email = '20220025546@my.xu.edu.ph' LIMIT 1);
SET @ovphe_admin_id = (SELECT sa.id FROM FC_systemadmin sa 
                       INNER JOIN FC_user u ON sa.user_id = u.id 
                       WHERE u.email = '20190016375@my.xu.edu.ph' LIMIT 1);

-- Get user IDs
SET @approver_user_id = (SELECT id FROM FC_user WHERE email = 'approver.seed@xu.edu.ph' LIMIT 1);
SET @assistant_user_id = (SELECT id FROM FC_user WHERE email = 'assistant.seed@xu.edu.ph' LIMIT 1);
SET @ciso_user_id = (SELECT id FROM FC_user WHERE email = '20220025546@my.xu.edu.ph' LIMIT 1);
SET @ovphe_user_id = (SELECT id FROM FC_user WHERE email = '20190016375@my.xu.edu.ph' LIMIT 1);

-- Seed ApproverFlowConfig
INSERT INTO FC_approverflowconfig (created_by_id, created_at, updated_at)
SELECT * FROM (
    SELECT @ovphe_admin_id AS created_by_id, NOW() AS created_at, NOW() AS updated_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowconfig
);

-- Get config ID (single-config assumption)
SET @config_id = (SELECT id FROM FC_approverflowconfig ORDER BY id ASC LIMIT 1);

-- Seed ApproverFlowSteps only if they don't exist
INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 0 AS `order`, 'Department Chair' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 1 AS `order`, 'College Dean' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 2 AS `order`, 'University Registrar' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 3 AS `order`, 'University Library' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 4 AS `order`, 'OVPHE' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category)
SELECT * FROM (
    SELECT @config_id AS config_id, 5 AS `order`, 'Human Resources Office' AS category
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

-- Get step IDs and link colleges
INSERT IGNORE INTO FC_approverflowstep_colleges (approverflowstep_id, college_id)
SELECT afs.id, c.id
FROM FC_approverflowstep afs
CROSS JOIN FC_college c
WHERE afs.config_id = @config_id 
AND c.abbreviation IN ('CCS', 'CAS');

-- Seed Approver
INSERT INTO FC_approver (user_id, approver_type, college_id, department_id, is_dual_role, is_hro)
VALUES 
(@approver_user_id, 'College', @ccs_id, @cs_id, 0, 0)
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    college_id = VALUES(college_id),
    department_id = VALUES(department_id);

-- Seed StudentAssistant
INSERT INTO FC_studentassistant (user_id, college_id, department_id)
VALUES 
(@assistant_user_id, @ccs_id, @cs_id)
ON DUPLICATE KEY UPDATE
    college_id = VALUES(college_id),
    department_id = VALUES(department_id);

-- Seed Announcements
INSERT INTO FC_announcement (title, body, created_by_id, pin_announcement, is_active, start_date, created_at)
SELECT * FROM (
    SELECT 'System Maintenance Notice' AS title, 'This is seeded announcement data.' AS body, @ovphe_admin_id AS created_by_id, 1 AS pin_announcement, 1 AS is_active, NOW() AS start_date, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_announcement a WHERE a.title = v.title
);

INSERT INTO FC_announcement (title, body, created_by_id, pin_announcement, is_active, start_date, created_at)
SELECT * FROM (
    SELECT 'Welcome OVPHE' AS title, 'Welcome! This is seeded announcement data.' AS body, @ovphe_admin_id AS created_by_id, 0 AS pin_announcement, 1 AS is_active, NOW() AS start_date, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_announcement a WHERE a.title = v.title
);

-- Seed SystemGuidelines
INSERT INTO FC_systemguideline (title, body, created_by_id, is_active, created_at)
SELECT * FROM (
    SELECT 'General Safety Guidelines' AS title, 'This is seeded guideline data.' AS body, @ovphe_user_id AS created_by_id, 1 AS is_active, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_systemguideline sg WHERE sg.title = v.title
);

INSERT INTO FC_systemguideline (title, body, created_by_id, is_active, created_at)
SELECT * FROM (
    SELECT 'Clearance Reminders' AS title, 'This is seeded guideline data.' AS body, @ovphe_user_id AS created_by_id, 1 AS is_active, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_systemguideline sg WHERE sg.title = v.title
);

-- Seed ClearanceTimeline
INSERT INTO FC_clearancetimeline (academic_year, term, term_start_date, term_end_date, clearance_start_date, clearance_end_date, created_by_id, is_active, created_at)
SELECT * FROM (
    SELECT YEAR(NOW()) AS academic_year, '1ST' AS term, CURDATE() AS term_start_date, CURDATE() AS term_end_date, CURDATE() AS clearance_start_date, CURDATE() AS clearance_end_date, @ovphe_admin_id AS created_by_id, 1 AS is_active, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearancetimeline ct WHERE ct.academic_year = v.academic_year AND ct.term = v.term
);

-- Seed Notifications for OVPHE user
INSERT INTO FC_notification (user_id, title, status, details, is_read, created_at)
SELECT * FROM (
    SELECT @ovphe_user_id AS user_id, 'Department Chair' AS title, 'approved' AS status, '["Submission of Syllabus", "Submission of Grades"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

INSERT INTO FC_notification (user_id, title, status, details, is_read, created_at)
SELECT * FROM (
    SELECT @ovphe_user_id AS user_id, 'University Registrar' AS title, 'rejected' AS status, '["Submission of Grades", "Remarks: incomplete submission"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed Notifications for CISO user
INSERT INTO FC_notification (user_id, title, status, details, is_read, created_at)
SELECT * FROM (
    SELECT @ciso_user_id AS user_id, 'Department Chair' AS title, 'approved' AS status, '["Submission of Syllabus", "Submission of Grades"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

INSERT INTO FC_notification (user_id, title, status, details, is_read, created_at)
SELECT * FROM (
    SELECT @ciso_user_id AS user_id, 'University Registrar' AS title, 'rejected' AS status, '["Submission of Grades", "Remarks: incomplete submission"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed SystemAnalytics
INSERT INTO FC_systemanalytics (college_id, academic_year, term, completion_rate, generated_by_id, generated_at)
SELECT * FROM (
    SELECT @ccs_id AS college_id, YEAR(NOW()) AS academic_year, '1ST' AS term, 70.00 AS completion_rate, @ovphe_admin_id AS generated_by_id, NOW() AS generated_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_systemanalytics sa WHERE sa.college_id = v.college_id AND sa.academic_year = v.academic_year AND sa.term = v.term
);

INSERT INTO FC_systemanalytics (college_id, academic_year, term, completion_rate, generated_by_id, generated_at)
SELECT * FROM (
    SELECT @cas_id AS college_id, YEAR(NOW()) AS academic_year, '1ST' AS term, 71.00 AS completion_rate, @ovphe_admin_id AS generated_by_id, NOW() AS generated_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_systemanalytics sa WHERE sa.college_id = v.college_id AND sa.academic_year = v.academic_year AND sa.term = v.term
);

-- Seed ActivityLogs
INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, approver_department, university_id, request_id, details, created_at)
SELECT * FROM (
    SELECT 'approved_clearance' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, 'College of Computer Studies' AS approver_department, '2005123456789' AS university_id, '2005123456789' AS request_id, '["Seeded log"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al
    WHERE al.event_type = v.event_type
      AND al.actor_user_id = v.actor_user_id
      AND (al.actor_admin_id <=> v.actor_admin_id)
      AND al.university_id = v.university_id
      AND al.request_id = v.request_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, approver_department, university_id, request_id, details, created_at)
SELECT * FROM (
    SELECT 'approved_clearance' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, 'College of Computer Studies' AS approver_department, '2005123456789' AS university_id, '2005123456789' AS request_id, '["Seeded log"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al
    WHERE al.event_type = v.event_type
      AND al.actor_user_id = v.actor_user_id
      AND (al.actor_admin_id <=> v.actor_admin_id)
      AND al.university_id = v.university_id
      AND al.request_id = v.request_id
);
EOF

echo "Database initialized."

# Start the application using Gunicorn
python -m gunicorn --bind 0.0.0.0:8001 --workers 3 XUFC.wsgi:application