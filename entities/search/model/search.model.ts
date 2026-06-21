export interface SearchWorkflowResult {
  id: string;
  name: string;
}

export interface SearchCredentialResult {
  id: string;
  name: string;
  type: string;
}

export interface SearchResults {
  workflows: SearchWorkflowResult[];
  credentials: SearchCredentialResult[];
}

export const EMPTY_SEARCH_RESULTS: SearchResults = {
  workflows: [],
  credentials: [],
};
