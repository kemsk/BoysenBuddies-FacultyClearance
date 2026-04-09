UPDATE FC_approver 
SET approver_type = 'Department', 
    department_id = (SELECT id FROM FC_department WHERE abbreviation = 'IT' AND college_id = (SELECT id FROM FC_college WHERE abbreviation = 'CCS'))
WHERE user_id = (SELECT id FROM FC_user WHERE email = '201131134@my.xu.edu.ph');
