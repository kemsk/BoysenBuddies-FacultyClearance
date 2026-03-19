#!/bin/bash

mkdir -p /app/staticfiles/frontend
cp -r /app/frontend_dist/* /app/staticfiles/frontend/

mkdir -p /app/static

echo "Waiting for MySQL TCP port at ${DB_HOST}:${DB_PORT:-3306}..."
until bash -c "</dev/tcp/${DB_HOST}/${DB_PORT:-3306}" >/dev/null 2>&1; do
  echo "MySQL is unavailable - retrying in 2 seconds..."
  sleep 2
done

python manage.py collectstatic --noinput
until python manage.py migrate --noinput; do
  echo "Django migration failed because database is not fully ready - retrying in 2 seconds..."
  sleep 2
done

mysql -h "${DB_HOST}" -P "${DB_PORT:-3306}" -u "${DB_USER}" -p"${DB_PASSWORD}" --ssl=0 "${DB_NAME}" << 'EOF'
-- Seed Users
INSERT INTO FC_user (email, university_id, first_name, last_name, created_at)
VALUES 
('20220025546@my.xu.edu.ph', 20220025546, 'Albert Floyd', 'Villanueva', NOW()),
('20190016375@my.xu.edu.ph', 20190016375, 'Nesyl', 'Ylanan', NOW()),
('20220024573@my.xu.edu.ph', 20220024573, 'Kim', 'Flores', NOW()),
('approver.seed@xu.edu.ph', 1000000001, 'Angela', 'Santos', NOW()),
('assistant.seed@xu.edu.ph', 1000000002, 'Seed', 'Assistant', NOW()),
('faculty.seed@xu.edu.ph', 1000000003, 'John', 'Doe', NOW()),
('ovphe.seed@xu.edu.ph', 1000000005, 'Maria', 'Reyes', NOW())
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name);

-- Seed Roles
INSERT INTO FC_role (name, description, is_system_role, created_at)
SELECT * FROM (
    SELECT 'CISO' AS name, 'CISO System Administrator' AS description, 1 AS is_system_role, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_role r WHERE r.name = v.name
);

INSERT INTO FC_role (name, description, is_system_role, created_at)
SELECT * FROM (
    SELECT 'OVPHE' AS name, 'OVPHE System Administrator' AS description, 1 AS is_system_role, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_role r WHERE r.name = v.name
);

INSERT INTO FC_role (name, description, is_system_role, created_at)
SELECT * FROM (
    SELECT 'Approver' AS name, 'Approver (handles college, department, and office contexts)' AS description, 1 AS is_system_role, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_role r WHERE r.name = v.name
);

INSERT INTO FC_role (name, description, is_system_role, created_at)
SELECT * FROM (
    SELECT 'Student Assistant' AS name, 'Student Assistant' AS description, 1 AS is_system_role, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_role r WHERE r.name = v.name
);

INSERT INTO FC_role (name, description, is_system_role, created_at)
SELECT * FROM (
    SELECT 'Faculty' AS name, 'Faculty Member' AS description, 1 AS is_system_role, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_role r WHERE r.name = v.name
);

-- Seed UserRoles for admin users
INSERT INTO FC_userrole (user_id, role_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    u.id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220024573@my.xu.edu.ph' AND r.name = 'CISO'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    u.id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20190016375@my.xu.edu.ph' AND r.name = 'OVPHE'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    u.id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220024573@my.xu.edu.ph' AND r.name = 'OVPHE'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

-- Seed UserRoles for other users
INSERT INTO FC_userrole (user_id, role_id, college_id, department_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    @ccs_id AS college_id,
    @cs_id AS department_id,
    u.id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = 'approver.seed@xu.edu.ph' AND r.name = 'Approver'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, college_id, department_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    @ccs_id AS college_id,
    @cs_id AS department_id,
    @ciso_user_id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220025546@my.xu.edu.ph' AND r.name = 'Approver'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, college_id, department_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    @ccs_id AS college_id,
    @cs_id AS department_id,
    @approver_user_id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = 'assistant.seed@xu.edu.ph' AND r.name = 'Student Assistant'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    u.id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220024573@my.xu.edu.ph' AND r.name = 'Faculty'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

-- Seed Colleges
INSERT INTO FC_college (name, abbreviation, is_active)
SELECT * FROM (
    SELECT 'College of Computer Studies' AS name, 'CCS' AS abbreviation, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.abbreviation = v.abbreviation
);

INSERT INTO FC_college (name, abbreviation, is_active)
SELECT * FROM (
    SELECT 'College of Arts and Sciences' AS name, 'CAS' AS abbreviation, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.abbreviation = v.abbreviation
);

-- Get college IDs
SET @ccs_id = (SELECT id FROM FC_college WHERE abbreviation = 'CCS' LIMIT 1);
SET @cas_id = (SELECT id FROM FC_college WHERE abbreviation = 'CAS' LIMIT 1);

-- Seed Departments for CCS
INSERT INTO FC_department (college_id, name, abbreviation, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Computer Science' AS name, 'CS' AS abbreviation, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.abbreviation = v.abbreviation
);

INSERT INTO FC_department (college_id, name, abbreviation, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Information Technology' AS name, 'IT' AS abbreviation, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.abbreviation = v.abbreviation
);

-- Get department IDs
SET @cs_id = (SELECT id FROM FC_department WHERE abbreviation = 'CS' AND college_id = @ccs_id LIMIT 1);

-- Seed Offices
INSERT INTO FC_office (name, abbreviation, is_active, display_order)
SELECT * FROM (
    SELECT 'Office of the Vice President for Higher Education' AS name, 'OVPHE' AS abbreviation, 1 AS is_active, 2 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation, is_active, display_order)
SELECT * FROM (
    SELECT 'University Registrar' AS name, 'REG' AS abbreviation, 1 AS is_active, 0 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation, is_active, display_order)
SELECT * FROM (
    SELECT 'University Library' AS name, 'LIB' AS abbreviation, 1 AS is_active, 1 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

INSERT INTO FC_office (name, abbreviation, is_active, display_order)
SELECT * FROM (
    SELECT 'Human Resources Office' AS name, 'HRO' AS abbreviation, 1 AS is_active, 3 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.abbreviation = v.abbreviation
);

-- Enforce Office display_order alignment with current approver flow office-step order
UPDATE FC_office SET display_order = 0 WHERE abbreviation = 'REG';
UPDATE FC_office SET display_order = 1 WHERE abbreviation = 'LIB';
UPDATE FC_office SET display_order = 2 WHERE abbreviation = 'OVPHE';
UPDATE FC_office SET display_order = 3 WHERE abbreviation = 'HRO';

-- Get admin IDs (using User directly)
SET @ciso_user_id = (SELECT id FROM FC_user WHERE email = '20220025546@my.xu.edu.ph' LIMIT 1);
SET @ovphe_user_id = (SELECT id FROM FC_user WHERE email = '20190016375@my.xu.edu.ph' LIMIT 1);

-- Get user IDs
SET @approver_user_id = (SELECT id FROM FC_user WHERE email = 'approver.seed@xu.edu.ph' LIMIT 1);
SET @assistant_user_id = (SELECT id FROM FC_user WHERE email = 'assistant.seed@xu.edu.ph' LIMIT 1);
SET @faculty_user_id = (SELECT id FROM FC_user WHERE email = 'faculty.seed@xu.edu.ph' LIMIT 1);
SET @ciso_user_id = (SELECT id FROM FC_user WHERE email = '20220025546@my.xu.edu.ph' LIMIT 1);
SET @ovphe_user_id = (SELECT id FROM FC_user WHERE email = '20190016375@my.xu.edu.ph' LIMIT 1);



-- Seed Approver
INSERT INTO FC_approver (user_id, approver_type, college_id, department_id)
VALUES 
(@approver_user_id, 'College', @ccs_id, @cs_id)
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    college_id = VALUES(college_id),
    department_id = VALUES(department_id);

-- Seed Approver for main user
INSERT INTO FC_approver (user_id, approver_type, college_id, department_id)
VALUES 
(@ciso_user_id, 'College', @ccs_id, @cs_id)
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

-- Seed Faculty (needed for real analytics)
INSERT INTO FC_faculty (user_id, employee_id, first_name, last_name, college_id, department_id)
SELECT * FROM (
    SELECT @faculty_user_id AS user_id, 'EMP-SEED-1' AS employee_id, 'Faye' AS first_name, 'Faculty' AS last_name, @ccs_id AS college_id, @cs_id AS department_id
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_faculty f WHERE f.user_id = v.user_id
);

SET @faculty_id = (SELECT id FROM FC_faculty WHERE user_id = @faculty_user_id LIMIT 1);

-- Seed Clearances for real analytics
INSERT INTO FC_clearance (faculty_id, academic_year, term, status, submitted_date, completed_date)
SELECT * FROM (
    SELECT @faculty_id AS faculty_id, YEAR(NOW()) AS academic_year, '1ST' AS term, 'COMPLETED' AS status, NOW() AS submitted_date, NOW() AS completed_date
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearance c WHERE c.faculty_id = v.faculty_id AND c.academic_year = v.academic_year AND c.term = v.term AND c.status = v.status
);

INSERT INTO FC_clearance (faculty_id, academic_year, term, status, submitted_date, completed_date)
SELECT * FROM (
    SELECT @faculty_id AS faculty_id, YEAR(NOW()) AS academic_year, '1ST' AS term, 'PENDING' AS status, NOW() AS submitted_date, NULL AS completed_date
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearance c WHERE c.faculty_id = v.faculty_id AND c.academic_year = v.academic_year AND c.term = v.term AND c.status = v.status
);

-- Seed ClearanceTimeline FIRST
INSERT INTO FC_clearancetimeline (name, academic_year_start, academic_year_end, term, clearance_start_date, clearance_end_date, created_by_id, is_active, created_at, updated_at)
SELECT * FROM (
    SELECT CONCAT('S.Y. 2025-2026 First Semester') AS name, 2025 AS academic_year_start, 2026 AS academic_year_end, '1ST' AS term, CURDATE() AS clearance_start_date, CURDATE() AS clearance_end_date, @ovphe_user_id AS created_by_id, 1 AS is_active, NOW() AS created_at, NOW() AS updated_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearancetimeline ct WHERE ct.academic_year_start = v.academic_year_start AND ct.academic_year_end = v.academic_year_end AND ct.term = v.term
);

-- Seed minimal Requirement + ClearanceRequest for the latest clearance row
SET @latest_timeline_id = (
    SELECT id FROM FC_clearancetimeline ORDER BY id DESC LIMIT 1
);

INSERT INTO FC_requirement (id, title, description, required_physical, clearance_timeline_id, last_updated, is_active, recipient_scope, created_by_id)
SELECT * FROM (
    SELECT 1 AS id, 'Grades Roster' AS title, 'Submit screenshot via this link: googleforms.com' AS description, 0 AS required_physical, @latest_timeline_id AS clearance_timeline_id, NOW() AS last_updated, 1 AS is_active, 'all' AS recipient_scope, NULL AS created_by_id
) AS v
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    required_physical = VALUES(required_physical),
    clearance_timeline_id = VALUES(clearance_timeline_id),
    last_updated = VALUES(last_updated),
    is_active = VALUES(is_active),
    recipient_scope = VALUES(recipient_scope);

SET @latest_clearance_id = (
    SELECT id FROM FC_clearance WHERE faculty_id = @faculty_id ORDER BY id DESC LIMIT 1
);

SET @latest_timeline_id = (
    SELECT id FROM FC_clearancetimeline ORDER BY id DESC LIMIT 1
);

-- Seed ApproverFlowConfig
INSERT INTO FC_approverflowconfig (created_by_id, clearance_timeline_id, created_at, updated_at)
SELECT * FROM (
    SELECT @ovphe_user_id AS created_by_id, @latest_timeline_id AS clearance_timeline_id, NOW() AS created_at, NOW() AS updated_at
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

-- Link office-based steps to actual Office rows
SET @reg_office_id = (SELECT id FROM FC_office WHERE abbreviation = 'REG' LIMIT 1);
SET @lib_office_id = (SELECT id FROM FC_office WHERE abbreviation = 'LIB' LIMIT 1);
SET @ovphe_office_id = (SELECT id FROM FC_office WHERE abbreviation = 'OVPHE' LIMIT 1);
SET @hro_office_id = (SELECT id FROM FC_office WHERE abbreviation = 'HRO' LIMIT 1);

INSERT INTO FC_approverflowstep (config_id, `order`, category, office_id)
SELECT * FROM (
    SELECT @config_id AS config_id, 2 AS `order`, 'University Registrar' AS category, @reg_office_id AS office_id
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category, office_id)
SELECT * FROM (
    SELECT @config_id AS config_id, 3 AS `order`, 'University Library' AS category, @lib_office_id AS office_id
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category, office_id)
SELECT * FROM (
    SELECT @config_id AS config_id, 4 AS `order`, 'Office of the Vice President for Higher Education' AS category, @ovphe_office_id AS office_id
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_approverflowstep s WHERE s.config_id = v.config_id AND s.`order` = v.`order`
);

INSERT INTO FC_approverflowstep (config_id, `order`, category, office_id)
SELECT * FROM (
    SELECT @config_id AS config_id, 5 AS `order`, 'Human Resources Office' AS category, @hro_office_id AS office_id
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

INSERT INTO FC_clearancerequest (request_id, faculty_id, requirement_id, clearance_timeline_id, status, submission_notes, submission_link, submitted_date, approved_by_id, approved_date, remarks)
SELECT * FROM (
    SELECT 
        CONCAT(
            (SELECT RIGHT(academic_year_start, 2) FROM FC_clearancetimeline WHERE id = @latest_timeline_id),
            CASE 
                WHEN (SELECT term FROM FC_clearancetimeline WHERE id = @latest_timeline_id) = '1ST' THEN '01'
                WHEN (SELECT term FROM FC_clearancetimeline WHERE id = @latest_timeline_id) = '2ND' THEN '02'
                ELSE '03'
            END,
            '-',
            (SELECT university_id FROM FC_user WHERE id = (SELECT user_id FROM FC_faculty WHERE id = @faculty_id)),
            '-',
            (SELECT abbreviation FROM FC_department WHERE id = (SELECT department_id FROM FC_faculty WHERE id = @faculty_id)),
            '-',
            '001'
        ) AS request_id, 
        @faculty_id AS faculty_id, 1 AS requirement_id, @latest_timeline_id AS clearance_timeline_id, 'PENDING' AS status, '' AS submission_notes, '' AS submission_link, NOW() AS submitted_date, NULL AS approved_by_id, NULL AS approved_date, '' AS remarks
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearancerequest cr WHERE cr.request_id = v.request_id
);

-- Seed Announcements
INSERT INTO FC_announcement (title, body, created_by_id, pin_announcement, is_active, start_date, created_at)
SELECT * FROM (
    SELECT 'System Maintenance Notice' AS title, 'This is seeded announcement data.' AS body, @ovphe_user_id AS created_by_id, 1 AS pin_announcement, 1 AS is_active, NOW() AS start_date, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_announcement a WHERE a.title = v.title
);

INSERT INTO FC_announcement (title, body, created_by_id, pin_announcement, is_active, start_date, created_at)
SELECT * FROM (
    SELECT 'Welcome OVPHE' AS title, 'Welcome! This is seeded announcement data.' AS body, @ovphe_user_id AS created_by_id, 0 AS pin_announcement, 1 AS is_active, NOW() AS start_date, NOW() AS created_at
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

-- Seed Notifications for OVPHE user
SET @seed_school_year_label = CONCAT('S.Y. ', YEAR(NOW()), '-', YEAR(NOW()) + 1);
SET @seed_term_label = 'First Semester';
SET @seed_dept_office_name = 'University Registrar';
SET @seed_days_left = '7 days';
SET @seed_announcement_title = 'System Maintenance Notice';

-- Seed Notifications for OVPHE user
INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @ovphe_user_id AS user_id, 'Clearance Timeline Started' AS title, 'submitted' AS status, CONCAT('The clearance timeline for ', @seed_school_year_label, ' ', @seed_term_label, ' is now active. Faculty Members may begin submitting requests.') AS body, '[]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @ovphe_user_id AS user_id, 'Workflow Update' AS title, 'submitted' AS status, CONCAT(@seed_dept_office_name, ' has been added to the approval flow. You may now receive clearance requests.') AS body, '[]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed Notifications for CISO user
INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @ciso_user_id AS user_id, 'New Announcement' AS title, 'submitted' AS status, CONCAT(@seed_announcement_title, ', Check announcements section for more details.') AS body, '[]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @ciso_user_id AS user_id, 'Faculty Data Dump Uploaded' AS title, 'submitted' AS status, CONCAT('A new faculty data dump has been successfully downloaded for ', @seed_school_year_label, ' ', @seed_term_label, '.') AS body, '[]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed Notifications for Faculty user
INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @faculty_user_id AS user_id, 'Deadline Approaching' AS title, 'submitted' AS status, CONCAT('The clearance period is coming to end in ', @seed_days_left, '. Ensure to submit your requirements on time to maintain timely submissions.') AS body, '["Submission of Requirement 1", "Submission of Requirement 2"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed Notifications for Faculty user
INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @faculty_user_id AS user_id, 'Deadline Approaching' AS title, 'submitted' AS status, CONCAT('The clearance period is coming to end in ', @seed_days_left, '. Ensure to submit your requirements on time to maintain timely submissions.') AS body, '["Submission of Requirement 1", "Submission of Requirement 2"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed Notifications for Faculty user
INSERT INTO FC_notification (user_id, title, status, body, details, is_read, created_at)
SELECT * FROM (
    SELECT @faculty_user_id AS user_id, 'Deadline Approaching' AS title, 'submitted' AS status, CONCAT('The clearance period is coming to end in ', @seed_days_left, '. Ensure to submit your requirements on time to maintain timely submissions.') AS body, '["Submission of Requirement 1", "Submission of Requirement 2"]' AS details, 0 AS is_read, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_notification n WHERE n.user_id = v.user_id AND n.title = v.title AND n.status = v.status
);

-- Seed ActivityLogs
INSERT INTO FC_activitylog (event_type, user_id, approver_department, university_id, request_id, details, created_at)
SELECT * FROM (
    SELECT 'approved_clearance' AS event_type, @ovphe_user_id AS user_id, 'College of Computer Studies' AS approver_department, '2005123456789' AS university_id, '2005123456789' AS request_id, '["Seeded log"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al
    WHERE al.event_type = v.event_type
      AND al.user_id = v.user_id
      AND al.university_id = v.university_id
      AND al.request_id = v.request_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_guideline' AS event_type, @ciso_user_id AS user_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_guideline' AS event_type, @ciso_user_id AS user_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_guideline_status_active' AS event_type, @ciso_user_id AS user_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_guideline_status_inactive' AS event_type, @ciso_user_id AS user_id, '["Guideline Title: Clearance Reminders"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'archived_guideline' AS event_type, @ciso_user_id AS user_id, '["Guideline Title: Clearance Reminders"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_announcement' AS event_type, @ovphe_user_id AS user_id, '["Announcement Title: System Maintenance Notice"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_announcement_status_active' AS event_type, @ovphe_user_id AS user_id, '["Announcement Title: System Maintenance Notice"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_announcement_status_inactive' AS event_type, @ovphe_user_id AS user_id, '["Announcement Title: Welcome OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_timeline' AS event_type, @ovphe_user_id AS user_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_timeline' AS event_type, @ovphe_user_id AS user_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_timeline_status_active' AS event_type, @ovphe_user_id AS user_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'set_timeline_status_inactive' AS event_type, @ovphe_user_id AS user_id, '["School Year: S.Y. 2024-2025", "Semester: Second Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_college' AS event_type, @ovphe_user_id AS user_id, '["College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_college' AS event_type, @ovphe_user_id AS user_id, '["College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_college' AS event_type, @ovphe_user_id AS user_id, '["College: College of Arts and Sciences"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_department' AS event_type, @ovphe_user_id AS user_id, '["Department: Computer Science", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_department' AS event_type, @ovphe_user_id AS user_id, '["Department: Computer Science", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_department' AS event_type, @ovphe_user_id AS user_id, '["Department: Information Technology", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'created_office' AS event_type, @ovphe_user_id AS user_id, '["Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_office' AS event_type, @ovphe_user_id AS user_id, '["Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_office' AS event_type, @ovphe_user_id AS user_id, '["Office: University Library"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'added_to_approver_flow' AS event_type, @ovphe_user_id AS user_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_approver_flow' AS event_type, @ovphe_user_id AS user_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'removed_from_approver_flow' AS event_type, @ovphe_user_id AS user_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'exported_clearance_results' AS event_type, @ovphe_user_id AS user_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'user_login' AS event_type, @ovphe_user_id AS user_id, '["Role: OVPHE", "Department/Office: OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, details, created_at)
SELECT * FROM (
    SELECT 'user_logout' AS event_type, @ovphe_user_id AS user_id, '["Role: OVPHE", "Department/Office: OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.user_id = v.user_id
);

INSERT INTO FC_activitylog (event_type, user_id, approver_department, university_id, request_id, details, created_at)
SELECT * FROM (
    SELECT 'approved_clearance' AS event_type, @ciso_user_id AS user_id, 'College of Computer Studies' AS approver_department, '2005123456789' AS university_id, '2005123456789' AS request_id, '["Seeded log"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al
    WHERE al.event_type = v.event_type
      AND al.user_id = v.user_id
      AND al.university_id = v.university_id
      AND al.request_id = v.request_id
);
EOF

echo "Database initialized."

# Start the application using Gunicorn
python -m gunicorn --bind 0.0.0.0:8001 --workers 3 XUFC.wsgi:application