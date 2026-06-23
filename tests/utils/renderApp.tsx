import type { ReactElement } from 'react';
import { render, type RenderResult } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AppProvider } from '../../src/app/store';
import { Repository } from '../../src/data/repository';
import { createMemoryStore } from '../../src/data/kv';
import { createAiClient, type AiClient } from '../../src/ai/client';

export interface RenderAppResult extends RenderResult {
  repo: Repository;
  ai: AiClient;
}

/** Render a component inside the router + app provider with isolated in-memory state. */
export function renderWithApp(
  ui: ReactElement,
  options: { repo?: Repository; ai?: AiClient; route?: string } = {},
): RenderAppResult {
  const repo = options.repo ?? new Repository(createMemoryStore());
  const ai =
    options.ai ??
    createAiClient({ mode: 'mock', model: 'm' }, { mockResponder: () => 'not json' });
  const result = render(
    <MemoryRouter initialEntries={[options.route ?? '/']}>
      <AppProvider repo={repo} ai={ai}>
        {ui}
      </AppProvider>
    </MemoryRouter>,
  );
  return { ...result, repo, ai };
}

export function mockAi(responder: (prompt: string) => string): AiClient {
  return createAiClient({ mode: 'mock', model: 'm' }, { mockResponder: (req) => responder(req.prompt) });
}
