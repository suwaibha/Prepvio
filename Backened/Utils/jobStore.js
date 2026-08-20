const jobs = new Map();

export function createJob() {
  const jobId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const job = {
    id: jobId,
    status: "processing",
    progress: 0,
    result: null,
    error: null,
  };

  jobs.set(jobId, job);
  return job;
}

export function getJob(jobId) {
  return jobs.get(jobId) || null;
}

export function updateJob(jobId, updates) {
  const job = jobs.get(jobId);
  if (!job) {
    return null;
  }

  Object.assign(job, updates);
  return job;
}
