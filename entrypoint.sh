#!/bin/bash

#mkdir -p /app/staticfiles/frontend
#cp -r /app/frontend_dist/* /app/staticfiles/frontend/
#mkdir -p /app/static

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

mysql -h "${DB_HOST}" -u "${DB_USER}" -p"${DB_PASSWORD}" --ssl=0 "${DB_NAME}" << 'EOF'

SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;
SET collation_connection = 'utf8mb4_unicode_ci';

-- Seed Users
INSERT INTO FC_user (email, university_id, first_name, last_name, created_at)
VALUES 
    ('20220025546@my.xu.edu.ph', 20220025546, 'Albert Floyd', 'Villanueva', NOW()),
    ('20190016375@my.xu.edu.ph', 20190016375, 'Nesyl', 'Ylanan', NOW()),
    ('201131134@my.xu.edu.ph', 201131134, 'Farrah', 'Apag', NOW()),
    ('20220024573@my.xu.edu.ph', 20220024573, 'Kim', 'Flores', NOW())
ON DUPLICATE KEY UPDATE
    first_name = VALUES(first_name),
    last_name = VALUES(last_name);

-- Ensure user 201131134 is not an Approver (keep other roles intact)
DELETE FROM FC_userrole
WHERE user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph')
  AND role_id = (SELECT id FROM FC_role WHERE name = 'Approver');

DELETE FROM FC_approver
WHERE user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph');

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
WHERE u.email = '201131134@my.xu.edu.ph' AND r.name = 'CISO'
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
WHERE u.email = '201131134@my.xu.edu.ph' AND r.name = 'OVPHE'
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
WHERE u.email = '201131134@my.xu.edu.ph' AND r.name = 'Faculty'
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
WHERE u.email = '20220025546@my.xu.edu.ph' AND r.name = 'CISO'
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
WHERE u.email = '20190016375@my.xu.edu.ph' AND r.name = 'Approver'
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
WHERE u.email = '20190016375@my.xu.edu.ph' AND r.name = 'CISO'
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
    @ciso_user_id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220024573@my.xu.edu.ph' AND r.name = 'Approver'
ON DUPLICATE KEY UPDATE
    is_active = VALUES(is_active);

INSERT INTO FC_userrole (user_id, role_id, college_id, department_id, assigned_by_id, assigned_date, is_active)
SELECT 
    u.id AS user_id, 
    r.id AS role_id,
    @ccs_id AS college_id,
    @it_id AS department_id,
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
    @ciso_user_id AS assigned_by_id,
    NOW() AS assigned_date,
    1 AS is_active
FROM FC_user u
CROSS JOIN FC_role r
WHERE u.email = '20220024573@my.xu.edu.ph' AND r.name = 'Student Assistant'
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
INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'College of Agriculture' AS name, 'COA' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'College of Arts and Sciences' AS name, 'CAS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'College of Computer Studies' AS name, 'CCS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'College of Engineering' AS name, 'COE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'College of Nursing' AS name, 'CON' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'School of Business and Management' AS name, 'SBM' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'School of Education' AS name, 'SOE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'School of Law' AS name, 'SOL' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

INSERT INTO FC_college (name, code, is_active)
SELECT * FROM (
    SELECT 'School of Medicine' AS name, 'SOM' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_college c WHERE c.code = v.code
);

-- Get college IDs
SET @coa_id = (SELECT id FROM FC_college WHERE code = 'COA' LIMIT 1);
SET @cas_id = (SELECT id FROM FC_college WHERE code = 'CAS' LIMIT 1);
SET @ccs_id = (SELECT id FROM FC_college WHERE code = 'CCS' LIMIT 1);
SET @coe_id = (SELECT id FROM FC_college WHERE code = 'COE' LIMIT 1);
SET @con_id = (SELECT id FROM FC_college WHERE code = 'CON' LIMIT 1);
SET @sbm_id = (SELECT id FROM FC_college WHERE code = 'SBM' LIMIT 1);
SET @soe_id = (SELECT id FROM FC_college WHERE code = 'SOE' LIMIT 1);
SET @sol_id = (SELECT id FROM FC_college WHERE code = 'SOL' LIMIT 1);
SET @som_id = (SELECT id FROM FC_college WHERE code = 'SOM' LIMIT 1);

-- Seed Departments for College of Agriculture (COA)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coa_id AS college_id, 'College of Agriculture Dean' AS name, 'COA_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coa_id AS college_id, 'Agricultural Sciences' AS name, 'AGRI' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coa_id AS college_id, 'Agricultural Business' AS name, 'AGBUS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coa_id AS college_id, 'Agriculture and Biosystems Engineering' AS name, 'AGBENG' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coa_id AS college_id, 'Food Technology' AS name, 'FOODTECH' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for College of Arts and Sciences (CAS)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'College of Arts and Sciences Dean' AS name, 'CAS_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Biology' AS name, 'BIO' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Chemistry' AS name, 'CHEM' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Development Communications' AS name, 'DEVCOM' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Economics' AS name, 'ECON' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'English' AS name, 'ENG' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'General Education & Integrated Discipline Studies' AS name, 'GEIDS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'International Studies' AS name, 'IS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Math' AS name, 'MATH' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Philosophy' AS name, 'PHIL' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Physics' AS name, 'PHYS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Psychology' AS name, 'PSYCH' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Sociology' AS name, 'SOCIO' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @cas_id AS college_id, 'Theology' AS name, 'THEO' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for College of Computer Studies (CCS)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'College of Computer Studies Dean' AS name, 'CCS_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Computer Science' AS name, 'CS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Entertainment and Multimedia Computing' AS name, 'EMC' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Information Systems' AS name, 'IS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @ccs_id AS college_id, 'Information Technology' AS name, 'IT' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for College of Engineering (COE)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'College of Engineering Dean' AS name, 'COE_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Chemical Engineering' AS name, 'CHE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Civil Engineering' AS name, 'CIV' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Electrical Engineering' AS name, 'EE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Electronics Engineering' AS name, 'ECE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Industrial Engineering' AS name, 'IE' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @coe_id AS college_id, 'Mechanical Engineering' AS name, 'ME' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for College of Nursing (CON)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @con_id AS college_id, 'College of Nursing Dean' AS name, 'CON_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for School of Business and Management (SBM)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @sbm_id AS college_id, 'School of Business and Management Dean' AS name, 'SBM_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @sbm_id AS college_id, 'Graduate Studies' AS name, 'GS' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @sbm_id AS college_id, 'Accountancy' AS name, 'ACC' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @sbm_id AS college_id, 'Business and Administration' AS name, 'BUSADMIN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for School of Education (SOE)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @soe_id AS college_id, 'School of Education Dean' AS name, 'SOE_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for School of Law (SOL)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @sol_id AS college_id, 'School of Law Dean' AS name, 'SOL_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

-- Seed Departments for School of Medicine (SOM)
INSERT INTO FC_department (college_id, name, code, is_active)
SELECT * FROM (
    SELECT @som_id AS college_id, 'School of Medicine Dean' AS name, 'SOM_DEAN' AS code, 1 AS is_active
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_department d WHERE d.college_id = v.college_id AND d.code = v.code
);

SET @cs_id = (SELECT id FROM FC_department WHERE code = 'CS' AND college_id = @ccs_id LIMIT 1);
SET @it_id = (SELECT id FROM FC_department WHERE code = 'IT' AND college_id = @ccs_id LIMIT 1);
SET @cas_dean_id = (SELECT id FROM FC_department WHERE code = 'CAS_DEAN' AND college_id = @cas_id LIMIT 1);

-- Seed Offices
INSERT INTO FC_office (name, code, is_active, display_order)
SELECT * FROM (
    SELECT 'University Library' AS name, 'LIB' AS code, 1 AS is_active, 0 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.code = v.code
);

INSERT INTO FC_office (name, code, is_active, display_order)
SELECT * FROM (
    SELECT 'University Registrar' AS name, 'REG' AS code, 1 AS is_active, 1 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.code = v.code
);

INSERT INTO FC_office (name, code, is_active, display_order)
SELECT * FROM (
    SELECT 'Office of the Vice President for Higher Education' AS name, 'OVPHE' AS code, 1 AS is_active, 2 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.code = v.code
);

INSERT INTO FC_office (name, code, is_active, display_order)
SELECT * FROM (
    SELECT 'Human Resources Office' AS name, 'HRO' AS code, 1 AS is_active, 3 AS display_order
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_office o WHERE o.code = v.code
);

-- Enforce Office display_order alignment with current approver flow office-step order
UPDATE FC_office SET display_order = 0 WHERE code = 'LIB';
UPDATE FC_office SET display_order = 1 WHERE code = 'REG';
UPDATE FC_office SET display_order = 2 WHERE code = 'OVPHE';
UPDATE FC_office SET display_order = 3 WHERE code = 'HRO';

-- Get admin IDs (using User directly)
SET @ciso_user_id = (SELECT id FROM FC_user WHERE email = '20220025546@my.xu.edu.ph' LIMIT 1);
SET @ovphe_user_id = (SELECT id FROM FC_user WHERE email = '20190016375@my.xu.edu.ph' LIMIT 1);

SET @farrah_user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph' LIMIT 1);

-- Seed Approver for main user (20220025546@my.xu.edu.ph) as Office approver in Human Resources Office
INSERT INTO FC_approver (user_id, approver_type, office_id)
VALUES (@ciso_user_id, 'Office', (SELECT id FROM FC_office WHERE code = 'HRO' LIMIT 1))
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    college_id = NULL,
    department_id = NULL,
    office_id = VALUES(office_id);

-- Seed Approver for Farrah Apag (201131134@my.xu.edu.ph) as College Dean
INSERT INTO FC_approver (user_id, approver_type, college_id, department_id)
VALUES (@farrah_user_id, 'College', @ccs_id, @ccs_dean_id)
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    college_id = VALUES(college_id),
    department_id = VALUES(department_id);

-- Seed Approver for OVPHE user (20190016375@my.xu.edu.ph) as Office approver
INSERT INTO FC_approver (user_id, approver_type, office_id)
VALUES (@ovphe_user_id, 'Office', (SELECT id FROM FC_office WHERE code = 'OVPHE' LIMIT 1))
ON DUPLICATE KEY UPDATE
    approver_type = VALUES(approver_type),
    office_id = VALUES(office_id);





INSERT INTO FC_faculty (user_id, first_name, last_name, college_id, department_id)
SELECT * FROM (
    SELECT @farrah_user_id AS user_id, 'Farrah' AS first_name, 'Apag' AS last_name, @ccs_id AS college_id, @it_id AS department_id
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_faculty f WHERE f.user_id = v.user_id
);

-- Seed ClearanceTimeline FIRST
INSERT INTO FC_clearancetimeline (name, academic_year_start, academic_year_end, term, clearance_start_date, clearance_end_date, created_by_id, is_active, created_at, updated_at)
SELECT * FROM (
    SELECT CONCAT('2501 Faculty Clearance') AS name, 2025 AS academic_year_start, 2026 AS academic_year_end, '1ST' AS term, CURDATE() AS clearance_start_date, CURDATE() AS clearance_end_date, @ovphe_user_id AS created_by_id, 1 AS is_active, NOW() AS created_at, NOW() AS updated_at
) AS v
WHERE NOT EXISTS (
    SELECT 1 FROM FC_clearancetimeline ct WHERE ct.academic_year_start = v.academic_year_start AND ct.academic_year_end = v.academic_year_end AND ct.term = v.term
);

-- Get latest timeline ID for reference
SET @latest_timeline_id = (SELECT id FROM FC_clearancetimeline ORDER BY id DESC LIMIT 1);

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
SET @reg_office_id = (SELECT id FROM FC_office WHERE code = 'REG' LIMIT 1);
SET @lib_office_id = (SELECT id FROM FC_office WHERE code = 'LIB' LIMIT 1);
SET @ovphe_office_id = (SELECT id FROM FC_office WHERE code = 'OVPHE' LIMIT 1);
SET @hro_office_id = (SELECT id FROM FC_office WHERE code = 'HRO' LIMIT 1);

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

-- Get step IDs and link colleges to all approver flow steps
INSERT IGNORE INTO FC_approverflowstep_colleges (approverflowstep_id, college_id)
SELECT afs.id, c.id
FROM FC_approverflowstep afs
CROSS JOIN FC_college c
WHERE afs.config_id = @config_id;

-- Remove approver record for user 201131134 (Farrah Apag) while keeping other roles
DELETE FROM FC_approver WHERE user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph');

EOF

echo "Database initialized."
echo "Generating faculty clearance requests..."
echo "Starting Gunicorn on port 8001..."
# Force override any environment variables that might affect binding
unset GUNICORN_CMD_ARGS

exec gunicorn XUFC.wsgi:application \
    --bind 0.0.0.0:8001 \
    --workers 3 \
    --timeout 120 \
    --max-requests 1000 \
    --max-requests-jitter 50 \
    --access-logfile - \
    --error-logfile -