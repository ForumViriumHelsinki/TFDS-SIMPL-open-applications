const createJsonResponse = <T>(data: T, init?: ResponseInit): Response => {
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    ...init,
  });
};

export const getWorkflowsConfiguration = async (
  _repositoryName?: string,
  _codeLocation?: string,
  _jobName?: string
): Promise<Response> => {
  const data = {
    jobName: _jobName ?? 'data_pipeline',
    repositoryName: _repositoryName ?? 'my_repository',
    codeLocation: _codeLocation ?? 'user_code',
    defaultYamlConfig:
      'ops:\n  process_data:\n    config:\n      url: https://default.com\n      api_key: default-key',
  };
  return createJsonResponse(data);
};

export const getWorkflows = async (_tag?: string): Promise<Response> => {
  const data = {
    codeLocations: [
      {
        id: 'cl-1',
        name: 'my-code-location',
        loadStatus: 'LOADED',
        locationDetails: {
          id: 'ld-1',
          name: 'my-code-location',
          repositories: [
            {
              id: 'repo-1',
              name: 'my-repository',
              jobs: [
                { id: 'job-1', name: 'data_processing_workflow' },
                { id: 'job-2', name: 'etl_pipeline' },
              ],
            },
            {
              id: 'repo-2',
              name: 'analytics-repository',
              jobs: [{ id: 'job-3', name: 'analytics_workflow' }],
            },
          ],
        },
      },
    ],
    total: 1,
  };
  return createJsonResponse(data);
};
