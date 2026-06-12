import axios from 'axios';

const defaultAdapter = axios.defaults.adapter;

const initMockDB = () => {
  if (!localStorage.getItem('mock_users')) {
    localStorage.setItem('mock_users', JSON.stringify([
      { id: 'u1', name: 'Admin User', email: 'admin@test.com', role: 'admin' },
      { id: 'u2', name: 'Manager User', email: 'manager@test.com', role: 'manager' },
      { id: 'u3', name: 'Agent One', email: 'agent1@test.com', role: 'agent' },
      { id: 'u4', name: 'Agent Two', email: 'agent2@test.com', role: 'agent' },
      { id: 'u5', name: 'Agent Three', email: 'agent3@test.com', role: 'agent' },
    ]));
  }
  if (!localStorage.getItem('mock_leads')) {
    localStorage.setItem('mock_leads', JSON.stringify([
      { id: 'l1', name: 'Aarav Mehta', email: 'aarav@example.com', phone: '+91 98765 43210', source: 'web', status: 'new', assigned_to: 'u3', notes: 'Interested in enterprise cloud plan.', created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'l2', name: 'Priya Sharma', email: 'priya@example.com', phone: '+91 91234 56789', source: 'referral', status: 'contacted', assigned_to: 'u3', notes: 'Scheduled demo for next Monday.', created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: 'l3', name: 'Rohan Gupta', email: 'rohan@example.com', phone: '+91 99887 76655', source: 'cold_call', status: 'qualified', assigned_to: 'u4', notes: 'Budget approved. Needs pricing details.', created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
      { id: 'l4', name: 'Sneha Patel', email: 'sneha@example.com', phone: '+91 95555 44444', source: 'social', status: 'won', assigned_to: 'u5', notes: 'Deal closed successfully!', created_at: new Date(Date.now() - 86400000 * 3).toISOString() },
      { id: 'l5', name: 'Vikram Singh', email: 'vikram@example.com', phone: '+91 96666 77777', source: 'other', status: 'lost', assigned_to: 'u4', notes: 'Competitor offering lower price.', created_at: new Date(Date.now() - 86400000 * 4).toISOString() },
    ]));
  }
  if (!localStorage.getItem('mock_activities')) {
    localStorage.setItem('mock_activities', JSON.stringify([
      { id: 'a1', lead_id: 'l1', action: 'lead_created', performed_by: 'u1', meta: { details: 'Lead created via web form' }, created_at: new Date(Date.now() - 86400000 * 2).toISOString() },
      { id: 'a2', lead_id: 'l2', action: 'status_updated', performed_by: 'u3', meta: { oldStatus: 'new', newStatus: 'contacted' }, created_at: new Date(Date.now() - 86400000 * 1).toISOString() },
      { id: 'a3', lead_id: 'l3', action: 'lead_assigned', performed_by: 'u1', meta: { assignedToName: 'Agent Two' }, created_at: new Date(Date.now() - 3600000 * 8).toISOString() },
    ]));
  }
};

const handleMockRequest = (config) => {
  initMockDB();
  const users = JSON.parse(localStorage.getItem('mock_users'));
  const leads = JSON.parse(localStorage.getItem('mock_leads'));
  const activities = JSON.parse(localStorage.getItem('mock_activities'));
  const currentUser = JSON.parse(localStorage.getItem('user')) || { id: 'u1', name: 'Admin User', email: 'admin@test.com', role: 'admin' };

  // Standardize config url - strip base URL if it's there
  let url = config.url || '';
  if (url.startsWith('http://localhost:5000/api')) {
    url = url.replace('http://localhost:5000/api', '');
  }
  if (url.startsWith('/api')) {
    url = url.replace(/^\/api/, '');
  }
  const method = config.method.toLowerCase();

  // POST /auth/login
  if (url === '/auth/login' && method === 'post') {
    const { email } = JSON.parse(config.data || '{}');
    const user = users.find(u => u.email === email) || users[0];
    return {
      status: 200,
      data: {
        success: true,
        data: {
          user,
          token: 'mock-token-' + user.role
        }
      }
    };
  }

  // GET /leads/stats
  if (url.includes('/leads/stats') && method === 'get') {
    const activeLeads = leads.filter(l => !l.deleted_at);
    const stats = {
      total: activeLeads.length,
      byStatus: { new: 0, contacted: 0, qualified: 0, won: 0, lost: 0 },
      bySource: {},
      agentLoad: []
    };
    activeLeads.forEach(l => {
      stats.byStatus[l.status] = (stats.byStatus[l.status] || 0) + 1;
      stats.bySource[l.source] = (stats.bySource[l.source] || 0) + 1;
    });
    // Calculate agent load
    const agents = users.filter(u => u.role === 'agent');
    agents.forEach(agent => {
      const activeLeadsCount = activeLeads.filter(l => l.assigned_to === agent.id && !['won', 'lost'].includes(l.status)).length;
      stats.agentLoad.push({
        agentName: agent.name,
        activeLeads: activeLeadsCount
      });
    });
    return { status: 200, data: { success: true, data: stats } };
  }

  // GET /leads
  if (url.startsWith('/leads') && method === 'get' && !url.includes('/stats') && !url.match(/\/leads\/[a-fA-F0-9-]+$/) && !url.match(/\/leads\/l\d+$/)) {
    let filteredLeads = leads.filter(l => !l.deleted_at);
    
    // Parse filters
    const params = config.params || {};
    const status = params.status;
    const source = params.source;
    const search = params.search;

    if (status) {
      filteredLeads = filteredLeads.filter(l => l.status === status);
    }
    if (source) {
      filteredLeads = filteredLeads.filter(l => l.source === source);
    }
    if (search) {
      const q = search.toLowerCase();
      filteredLeads = filteredLeads.filter(l => 
        (l.name && l.name.toLowerCase().includes(q)) || 
        (l.email && l.email.toLowerCase().includes(q)) || 
        (l.phone && l.phone.toLowerCase().includes(q))
      );
    }

    // Map assigned_agent_name
    filteredLeads = filteredLeads.map(l => {
      const agent = users.find(u => u.id === l.assigned_to);
      return {
        ...l,
        assigned_agent_name: agent ? agent.name : '—'
      };
    });

    // Sort leads by created_at desc
    filteredLeads.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));

    // Agent check (agents only see assigned leads)
    if (currentUser.role === 'agent') {
      filteredLeads = filteredLeads.filter(l => l.assigned_to === currentUser.id);
    }

    return {
      status: 200,
      data: {
        success: true,
        data: filteredLeads,
        total: filteredLeads.length
      }
    };
  }

  // GET /leads/:id
  const leadIdMatch = url.match(/\/leads\/([a-zA-F0-9-]+)$/);
  if (leadIdMatch && method === 'get') {
    const id = leadIdMatch[1];
    const lead = leads.find(l => l.id === id && !l.deleted_at);
    if (!lead) return { status: 404, data: { success: false, message: 'Lead not found' } };
    
    const agent = users.find(u => u.id === lead.assigned_to);
    const enrichedLead = {
      ...lead,
      assigned_agent_name: agent ? agent.name : '—'
    };
    return { status: 200, data: { success: true, data: enrichedLead } };
  }

  // POST /leads
  if (url === '/leads' && method === 'post') {
    const body = JSON.parse(config.data || '{}');
    // Least loaded algorithm mock
    const activeAgents = users.filter(u => u.role === 'agent');
    let assignedAgent = null;
    if (activeAgents.length > 0) {
      const agentLoads = activeAgents.map(a => {
        const load = leads.filter(l => l.assigned_to === a.id && !l.deleted_at && !['won', 'lost'].includes(l.status)).length;
        return { agent: a, load };
      });
      agentLoads.sort((a, b) => a.load - b.load);
      assignedAgent = agentLoads[0].agent;
    }

    const newLead = {
      id: 'l' + (leads.length + 1),
      name: body.name,
      email: body.email || '',
      phone: body.phone || '',
      source: body.source || 'other',
      status: body.status || 'new',
      assigned_to: assignedAgent ? assignedAgent.id : null,
      notes: body.notes || '',
      created_by: currentUser.id,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    leads.push(newLead);
    localStorage.setItem('mock_leads', JSON.stringify(leads));

    const newAct = {
      id: 'a' + (activities.length + 1),
      lead_id: newLead.id,
      action: 'lead_created',
      performed_by: currentUser.id,
      meta: { details: `Lead created and auto-assigned to ${assignedAgent ? assignedAgent.name : 'unassigned'}` },
      created_at: new Date().toISOString()
    };
    activities.push(newAct);
    localStorage.setItem('mock_activities', JSON.stringify(activities));

    return { status: 201, data: { success: true, data: newLead } };
  }

  // PUT /leads/:id
  if (leadIdMatch && method === 'put') {
    const id = leadIdMatch[1];
    const body = JSON.parse(config.data || '{}');
    const leadIndex = leads.findIndex(l => l.id === id && !l.deleted_at);
    if (leadIndex === -1) return { status: 404, data: { success: false, message: 'Lead not found' } };

    const oldLead = leads[leadIndex];
    const updatedLead = {
      ...oldLead,
      ...body,
      updated_at: new Date().toISOString()
    };
    leads[leadIndex] = updatedLead;
    localStorage.setItem('mock_leads', JSON.stringify(leads));

    if (body.status && body.status !== oldLead.status) {
      const newAct = {
        id: 'a' + (activities.length + 1),
        lead_id: id,
        action: 'status_updated',
        performed_by: currentUser.id,
        meta: { oldStatus: oldLead.status, newStatus: body.status },
        created_at: new Date().toISOString()
      };
      activities.push(newAct);
      localStorage.setItem('mock_activities', JSON.stringify(activities));
    }

    return { status: 200, data: { success: true, data: updatedLead } };
  }

  // DELETE /leads/:id
  if (leadIdMatch && method === 'delete') {
    const id = leadIdMatch[1];
    const leadIndex = leads.findIndex(l => l.id === id && !l.deleted_at);
    if (leadIndex === -1) return { status: 404, data: { success: false, message: 'Lead not found' } };
    leads[leadIndex].deleted_at = new Date().toISOString();
    localStorage.setItem('mock_leads', JSON.stringify(leads));
    return { status: 200, data: { success: true, message: 'Lead deleted successfully' } };
  }

  // GET /activity
  if (url.includes('/activity') && method === 'get') {
    let filtered = [...activities];
    const leadIdParam = config.url.match(/lead_id=([a-zA-Z0-9-]+)/) || config.url.match(/leadId=([a-zA-Z0-9-]+)/);
    if (leadIdParam) {
      filtered = filtered.filter(a => a.lead_id === leadIdParam[1]);
    }
    filtered.sort((a,b) => new Date(b.created_at) - new Date(a.created_at));
    return { status: 200, data: { success: true, data: filtered } };
  }

  // GET /auth/me
  if (url === '/auth/me' && method === 'get') {
    return { status: 200, data: { success: true, data: currentUser } };
  }

  return { status: 404, data: { success: false, message: 'Mock endpoint not found' } };
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: { 'Content-Type': 'application/json' },
  adapter: async (config) => {
    const isMock = localStorage.getItem('mock_mode') === 'true' || localStorage.getItem('token')?.startsWith('mock-token');
    if (isMock) {
      await new Promise(r => setTimeout(r, 200)); // smooth minimal simulation delay
      try {
        const response = handleMockRequest(config);
        if (response.status >= 200 && response.status < 300) {
          return {
            data: response.data,
            status: response.status,
            statusText: 'OK',
            headers: {},
            config,
            request: {}
          };
        } else {
          const err = new Error(response.data?.message || 'Mock Request Failed');
          err.response = response;
          throw err;
        }
      } catch (mockErr) {
        return Promise.reject(mockErr);
      }
    }
    return defaultAdapter(config);
  }
});

console.log('🔌 LeadFlow API Base URL:', API.defaults.baseURL);

// Attach JWT token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Handle 401 globally — auto-logout
API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default API;
