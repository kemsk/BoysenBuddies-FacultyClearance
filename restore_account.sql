-- Restore user account for 201131134@my.xu.edu.ph
INSERT INTO FC_user (email, university_id, first_name, middle_name, last_name, password, is_active, created_at, updated_at)
VALUES 
('201131134@my.xu.edu.ph', '201131134', 'Farrah', '', 'Apag', 'pbkdf2_sha256$600000$example$hash', 1, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    email = VALUES(email),
    university_id = VALUES(university_id),
    first_name = VALUES(first_name),
    middle_name = VALUES(middle_name),
    last_name = VALUES(last_name),
    is_active = VALUES(is_active),
    updated_at = VALUES(updated_at);

-- Get the user ID
SET @farrah_user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph' LIMIT 1);

-- Get college and department IDs
SET @ccs_id = (SELECT id FROM FC_college WHERE code = 'CCS' LIMIT 1);
SET @it_id = (SELECT id FROM FC_department WHERE code = 'IT' AND college_id = @ccs_id LIMIT 1);

-- Restore user role as Approver
INSERT INTO FC_userrole (user_id, role_id, college_id, department_id, is_active, created_at, updated_at)
SELECT 
    @farrah_user_id AS user_id, 
    r.id AS role_id,
    @ccs_id AS college_id,
    @it_id AS department_id,
    1 AS is_active,
    NOW() AS created_at,
    NOW() AS updated_at
FROM FC_role r
WHERE r.name = 'Approver'
AND NOT EXISTS (
    SELECT 1 FROM FC_userrole ur 
    WHERE ur.user_id = @farrah_user_id AND ur.role_id = r.id AND ur.college_id = @ccs_id AND ur.department_id = @it_id
);

-- Restore approver profile as Department Chair
INSERT INTO FC_approver (user_id, approver_type, college_id, department_id, created_at, updated_at)
VALUES 
(@farrah_user_id, 'Department', @ccs_id, @it_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    college_id = VALUES(college_id),
    department_id = VALUES(department_id),
    updated_at = VALUES(updated_at);

-- Restore faculty profile
INSERT INTO FC_faculty (user_id, first_name, last_name, college_id, department_id, created_at, updated_at)
VALUES 
(@farrah_user_id, 'Farrah', 'Apag', @ccs_id, @it_id, NOW(), NOW())
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name),
    college_id = VALUES(college_id),
    department_id = VALUES(department_id),
    updated_at = VALUES(updated_at);

SELECT 'Account restored successfully!' as result;
