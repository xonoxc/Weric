## ADDED Requirements

### Requirement: Cleanup evidence job deletes old records

The cleanup_evidence worker job SHALL delete evidence records older than 90 days. The job SHALL process all evidence records, not just the first 1000.

#### Scenario: Evidence older than 90 days exists

- **WHEN** the cleanup_evidence job runs and there are evidence records older than 90 days
- **THEN** those records are deleted from the database and the job reports the count of deleted records

#### Scenario: No old evidence exists

- **WHEN** the cleanup_evidence job runs and no evidence records are older than 90 days
- **THEN** the job completes with a count of 0 and no records are deleted

#### Scenario: More than 1000 old evidence records exist

- **WHEN** the cleanup_evidence job runs and there are 2500 evidence records older than 90 days
- **THEN** all 2500 records are deleted across multiple pages, not just the first 1000

### Requirement: Recompute scores job persists results

The recompute_scores worker job SHALL generate feed scores for all users and persist the updated scores to the interactions table. The job SHALL process all users, not just the first 10.

#### Scenario: Scores are recomputed for all users

- **WHEN** the recompute_scores job runs with 50 active users
- **THEN** feed scores are generated and persisted for all 50 users

#### Scenario: No users exist

- **WHEN** the recompute_scores job runs and there are no users
- **THEN** the job completes successfully with a count of 0

### Requirement: Rebuild recommendations job persists results

The rebuild_recommendations worker job SHALL generate recommendation feeds for all users and persist the results.

#### Scenario: Recommendations are rebuilt for all users

- **WHEN** the rebuild_recommendations job runs with 30 active users
- **THEN** recommendation feeds are generated and persisted for all 30 users

#### Scenario: No users exist

- **WHEN** the rebuild_recommendations job runs and there are no users
- **THEN** the job completes successfully with a count of 0

### Requirement: Worker job scheduler triggers periodic jobs

The worker SHALL run periodic jobs on a schedule. cleanup_evidence SHALL run daily, recompute_scores SHALL run hourly.

#### Scenario: Scheduler is active

- **WHEN** the worker starts
- **THEN** the scheduler registers cleanup_evidence (daily) and recompute_scores (hourly) jobs

#### Scenario: Scheduler triggers a job

- **WHEN** the scheduled interval elapses for recompute_scores
- **THEN** a recompute_scores job is enqueued in the job queue
