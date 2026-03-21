-- Fix missing ON DELETE behavior for tasks.problemId and activityLog.problemId/solutionId
-- Without this, retention cleanup of rejected problems fails with FK constraint errors

-- tasks.problem_id: SET NULL on problem delete (task is already completed/expired)
DO $$ BEGIN
  ALTER TABLE tasks DROP CONSTRAINT IF EXISTS tasks_problem_id_problems_id_fk;
  ALTER TABLE tasks ADD CONSTRAINT tasks_problem_id_problems_id_fk
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- activity_log.problem_id: SET NULL on problem delete (preserve log entry, lose reference)
DO $$ BEGIN
  ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_problem_id_problems_id_fk;
  ALTER TABLE activity_log ADD CONSTRAINT activity_log_problem_id_problems_id_fk
    FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;

-- activity_log.solution_id: SET NULL on solution delete (cascaded from problem delete)
DO $$ BEGIN
  ALTER TABLE activity_log DROP CONSTRAINT IF EXISTS activity_log_solution_id_solutions_id_fk;
  ALTER TABLE activity_log ADD CONSTRAINT activity_log_solution_id_solutions_id_fk
    FOREIGN KEY (solution_id) REFERENCES solutions(id) ON DELETE SET NULL;
EXCEPTION WHEN others THEN NULL;
END $$;
