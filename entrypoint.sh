#!/bin/bash

mkdir -p /app/staticfiles/frontend
cp -r /app/frontend_dist/* /app/staticfiles/frontend/

mkdir -p /app/static

python manage.py collectstatic --noinput
python manage.py makemigrations FC --noinput
python manage.py migrate --noinput

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" --ssl=0 "${DB_NAME}" << 'EOF'
-- Seed Users
INSERT INTO FC_user (email, university_id, password, first_name, last_name, user_type, created_at, is_active, is_staff, is_superuser)
VALUES 
('20220025546@my.xu.edu.ph', '20220025546', 'capstone', 'Albert Floyd', 'Villanueva', 'ADMIN', NOW(), 1, 1, 1),
('20190016375@my.xu.edu.ph', '20190016375', 'kemeru', 'Nesyl', 'Ylanan', 'ADMIN', NOW(), 1, 1, 1),
('approver.seed@xu.edu.ph', 'APPROVER-SEED-1', 'capstone', 'Angela', 'Santos', 'APPROVER', NOW(), 1, 1, 0),
('assistant.seed@xu.edu.ph', 'ASSISTANT-SEED-1', 'capstone', 'Seed', 'Assistant', 'ASSISTANT', NOW(), 1, 1, 0),
('faculty.seed@xu.edu.ph', 'FACULTY-SEED-1', 'capstone', 'Faye', 'Faculty', 'FACULTY', NOW(), 1, 0, 0)
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    user_type = VALUES(user_type),
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
SET @faculty_user_id = (SELECT id FROM FC_user WHERE email = 'faculty.seed@xu.edu.ph' LIMIT 1);
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

-- Seed minimal Requirement + ClearanceRequest for the latest clearance row
INSERT INTO FC_requirement (id, title, description, required_physical, created_date, deadline_date, is_active, created_by_id)
SELECT * FROM (
    SELECT 1 AS id, 'Grades Roster' AS title, 'Submit screenshot via this link: googleforms.com' AS description, 0 AS required_physical, NOW() AS created_date, NULL AS deadline_date, 1 AS is_active, NULL AS created_by_id
) AS v
ON DUPLICATE KEY UPDATE
    title = VALUES(title),
    description = VALUES(description),
    required_physical = VALUES(required_physical),
    is_active = VALUES(is_active);

SET @latest_clearance_id = (
    SELECT id FROM FC_clearance WHERE faculty_id = @faculty_id ORDER BY id DESC LIMIT 1
);

INSERT INTO FC_clearancerequest (clearance_id, requirement_id, status, remarks, approved_by_id, approved_date)
SELECT * FROM (
    SELECT @latest_clearance_id AS clearance_id, 1 AS requirement_id, 'PENDING' AS status, '' AS remarks, NULL AS approved_by_id, NULL AS approved_date
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearancerequest cr WHERE cr.clearance_id = v.clearance_id AND cr.requirement_id = v.requirement_id
);

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
SET @seed_school_year_label = CONCAT('S.Y. ', YEAR(NOW()), '-', YEAR(NOW()) + 1);
SET @seed_term_label = 'First Semester';
SET @seed_dept_office_name = 'University Registrar';
SET @seed_days_left = '7 days';
SET @seed_announcement_title = 'System Maintenance Notice';

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

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_guideline' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_guideline' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_guideline_status_active' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, '["Guideline Title: General Safety Guidelines"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_guideline_status_inactive' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, '["Guideline Title: Clearance Reminders"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'archived_guideline' AS event_type, @ciso_user_id AS actor_user_id, @ciso_admin_id AS actor_admin_id, '["Guideline Title: Clearance Reminders"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_announcement' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Announcement Title: System Maintenance Notice"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_announcement_status_active' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Announcement Title: System Maintenance Notice"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_announcement_status_inactive' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Announcement Title: Welcome OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_timeline' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_timeline' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_timeline_status_active' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'set_timeline_status_inactive' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["School Year: S.Y. 2024-2025", "Semester: Second Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_college' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_college' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_college' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["College: College of Arts and Sciences"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_department' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department: Computer Science", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_department' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department: Computer Science", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_department' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department: Information Technology", "College: College of Computer Studies"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'created_office' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_office' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'deleted_office' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Office: University Library"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'added_to_approver_flow' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'edited_approver_flow' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'removed_from_approver_flow' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Department/Office: University Registrar"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'exported_clearance_results' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["School Year: S.Y. 2025-2026", "Semester: First Semester"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'user_login' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Role: System Admin", "Department/Office: OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
);

INSERT INTO FC_activitylog (event_type, actor_user_id, actor_admin_id, details, created_at)
SELECT * FROM (
    SELECT 'user_logout' AS event_type, @ovphe_user_id AS actor_user_id, @ovphe_admin_id AS actor_admin_id, '["Role: System Admin", "Department/Office: OVPHE"]' AS details, NOW() AS created_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_activitylog al WHERE al.event_type = v.event_type AND al.actor_user_id = v.actor_user_id
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