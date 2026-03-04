const MODEL_BASE_URL = import.meta.env.VITE_CASHFLOW_MODEL_URL || 'https://black-sea-08213fd00.2.azurestaticapps.net';

export function openModel({ clientId, soaRequestId, modelId } = {}) {
  const params = new URLSearchParams();
  if (clientId) params.set('clientId', clientId);
  if (soaRequestId) params.set('soaRequestId', soaRequestId);
  if (modelId) params.set('modelId', modelId);

  const url = `${MODEL_BASE_URL}?${params.toString()}`;
  window.open(url, '_blank', 'noopener');
}

export function getModelUrl({ clientId, soaRequestId, modelId } = {}) {
  const params = new URLSearchParams();
  if (clientId) params.set('clientId', clientId);
  if (soaRequestId) params.set('soaRequestId', soaRequestId);
  if (modelId) params.set('modelId', modelId);

  return `${MODEL_BASE_URL}?${params.toString()}`;
}
