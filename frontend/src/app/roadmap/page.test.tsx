import { render, screen, waitFor } from '@testing-library/react';
import RoadmapPage from './page';

jest.mock('@/utils/supabase/client', () => ({
  createClient: () => ({
    auth: {
      getSession: async () => ({ data: { session: { user: { id: 'test-user' }, access_token: 'test-token' } } })
    }
  })
}));

global.fetch = jest.fn();

describe('RoadmapPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state', async () => {
    (fetch as jest.Mock).mockImplementation(() => new Promise(() => {}));
    render(<RoadmapPage />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders error state', async () => {
    (fetch as jest.Mock).mockResolvedValue({ ok: false, json: async () => ({ error: 'Test error' }) });
    render(<RoadmapPage />);
    await waitFor(() => expect(screen.getByText('Test error')).toBeInTheDocument());
  });

  it('renders roadmap data', async () => {
    (fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        title: 'Test Roadmap',
        description: 'Test description',
        skill_gaps: { gap: 1 },
        learning_profile: { style: 'visual' },
        learning_paths: [
          {
            skill_name: 'Skill A',
            total_estimated_hours: 10,
            nodes: [
              { title: 'Node 1', node_type: 'video', difficulty: 'easy', estimated_time: 30, resources: [{ title: 'Res 1', url: '#' }] }
            ]
          }
        ],
        total_estimated_hours: 10,
        difficulty_level: 'easy',
        status: 'active',
        created_at: new Date().toISOString(),
      })
    });
    render(<RoadmapPage />);
    await waitFor(() => expect(screen.getByText('Test Roadmap')).toBeInTheDocument());
    expect(screen.getByText('Skill Gaps')).toBeInTheDocument();
    expect(screen.getByText('Learning Profile')).toBeInTheDocument();
    expect(screen.getByText('Learning Paths')).toBeInTheDocument();
    expect(screen.getByText('Skill A')).toBeInTheDocument();
    expect(screen.getByText('Node 1')).toBeInTheDocument();
  });
}); 