module.exports = {
  apps: [
    {
      name: 'seo-worker',
      script: 'src/worker.js',
      instances: 1,
      exec_mode: 'fork',
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'development',
        WORKER_CONCURRENCY: 2,
        WORKER_MAX_JOBS_PER_MINUTE: 10,
      },
      env_production: {
        NODE_ENV: 'production',
        WORKER_CONCURRENCY: 2,
        WORKER_MAX_JOBS_PER_MINUTE: 10,
      },
      error_file: 'logs/worker-error.log',
      out_file: 'logs/worker-out.log',
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
    },
  ],
};
