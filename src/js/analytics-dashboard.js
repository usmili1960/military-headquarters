/**
 * Analytics Dashboard JavaScript
 * Handles analytics, charts, and statistics display
 */

let analyticsData = {};

// Initialize analytics dashboard
async function initAnalyticsDashboard() {
  console.log('📊 Initializing Analytics Dashboard...');
  
  await loadDashboardStats();
  await loadLoginTrends();
  await loadUserGrowth();
  await loadRecentActivity();
}

// Load dashboard statistics
async function loadDashboardStats() {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const response = await fetch('http://localhost:3000/api/admin/analytics/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load stats');

    const data = await response.json();
    analyticsData.stats = data.stats;

    // Update UI
    displayDashboardStats(data.stats);
  } catch (error) {
    console.error('Error loading dashboard stats:', error);
  }
}

// Display dashboard statistics
function displayDashboardStats(stats) {
  const statsContainer = document.getElementById('dashboardStats');
  if (!statsContainer) return;

  statsContainer.innerHTML = `
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">👥</div>
        <div class="stat-content">
          <h3>${stats.totalUsers}</h3>
          <p>Total Users</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">✅</div>
        <div class="stat-content">
          <h3>${stats.activeUsers}</h3>
          <p>Active Users</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">⏳</div>
        <div class="stat-content">
          <h3>${stats.pendingUsers}</h3>
          <p>Pending Approval</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div class="stat-content">
          <h3>${stats.totalProcedures}</h3>
          <p>Total Procedures</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🔐</div>
        <div class="stat-content">
          <h3>${stats.recentLogins}</h3>
          <p>Logins (7 Days)</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">🆕</div>
        <div class="stat-content">
          <h3>${stats.todaySignups}</h3>
          <p>New Today</p>
        </div>
      </div>
    </div>
  `;
}

// Load login trends
async function loadLoginTrends(days = 30) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const response = await fetch(`http://localhost:3000/api/admin/analytics/login-trends?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load login trends');

    const data = await response.json();
    analyticsData.loginTrends = data.trends;

    // Display chart
    displayLoginTrendsChart(data.trends);
  } catch (error) {
    console.error('Error loading login trends:', error);
  }
}

// Display login trends chart (simple ASCII/text-based for now)
function displayLoginTrendsChart(trends) {
  const chartContainer = document.getElementById('loginTrendsChart');
  if (!chartContainer) return;

  if (trends.length === 0) {
    chartContainer.innerHTML = '<p>No login data available</p>';
    return;
  }

  const maxCount = Math.max(...trends.map(t => t.count));
  
  let chartHtml = '<div class="chart-container"><h3>Login Trends (Last 30 Days)</h3>';
  chartHtml += '<div class="bar-chart">';
  
  trends.slice(-15).forEach(trend => {
    const percentage = (trend.count / maxCount) * 100;
    const date = new Date(trend._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    chartHtml += `
      <div class="bar-item">
        <div class="bar-label">${date}</div>
        <div class="bar-wrapper">
          <div class="bar-fill" style="width: ${percentage}%">
            <span class="bar-value">${trend.count}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  chartHtml += '</div></div>';
  chartContainer.innerHTML = chartHtml;
}

// Load user growth
async function loadUserGrowth(days = 30) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const response = await fetch(`http://localhost:3000/api/admin/analytics/user-growth?days=${days}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load user growth');

    const data = await response.json();
    analyticsData.userGrowth = data.growth;

    displayUserGrowthChart(data.growth);
  } catch (error) {
    console.error('Error loading user growth:', error);
  }
}

// Display user growth chart
function displayUserGrowthChart(growth) {
  const chartContainer = document.getElementById('userGrowthChart');
  if (!chartContainer) return;

  if (growth.length === 0) {
    chartContainer.innerHTML = '<p>No growth data available</p>';
    return;
  }

  const maxCount = Math.max(...growth.map(g => g.count));
  
  let chartHtml = '<div class="chart-container"><h3>User Registrations (Last 30 Days)</h3>';
  chartHtml += '<div class="bar-chart">';
  
  growth.slice(-15).forEach(item => {
    const percentage = (item.count / maxCount) * 100;
    const date = new Date(item._id).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    
    chartHtml += `
      <div class="bar-item">
        <div class="bar-label">${date}</div>
        <div class="bar-wrapper">
          <div class="bar-fill user-growth" style="width: ${percentage}%">
            <span class="bar-value">${item.count}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  chartHtml += '</div></div>';
  chartContainer.innerHTML = chartHtml;
}

// Load recent activity logs
async function loadRecentActivity(limit = 20) {
  try {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const response = await fetch(`http://localhost:3000/api/admin/activity-logs?limit=${limit}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) throw new Error('Failed to load activity logs');

    const data = await response.json();
    displayActivityLogs(data.logs);
  } catch (error) {
    console.error('Error loading activity logs:', error);
  }
}

// Display activity logs
function displayActivityLogs(logs) {
  const logsContainer = document.getElementById('activityLogs');
  if (!logsContainer) return;

  if (logs.length === 0) {
    logsContainer.innerHTML = '<p>No recent activity</p>';
    return;
  }

  let logsHtml = '<div class="activity-logs"><h3>Recent Activity</h3>';
  logsHtml += '<div class="activity-list">';
  
  logs.forEach(log => {
    const time = new Date(log.timestamp).toLocaleString();
    const user = log.userId?.fullName || log.adminId?.email || 'System';
    const icon = getActionIcon(log.action);
    
    logsHtml += `
      <div class="activity-item">
        <div class="activity-icon">${icon}</div>
        <div class="activity-content">
          <div class="activity-description">${log.description}</div>
          <div class="activity-meta">
            <span class="activity-user">${user}</span>
            <span class="activity-time">${time}</span>
          </div>
        </div>
      </div>
    `;
  });
  
  logsHtml += '</div></div>';
  logsContainer.innerHTML = logsHtml;
}

// Get icon for action type
function getActionIcon(action) {
  const icons = {
    login: '🔐',
    logout: '🚪',
    signup: '👤',
    profile_update: '✏️',
    user_approved: '✅',
    user_rejected: '❌',
    user_deleted: '🗑️',
    procedure_added: '📋',
    bulk_operation: '⚡',
    data_export: '📤',
    data_import: '📥',
    notification_sent: '🔔',
  };
  return icons[action] || '📌';
}

// Export analytics data
function exportAnalyticsReport() {
  const report = {
    generatedAt: new Date().toISOString(),
    stats: analyticsData.stats,
    loginTrends: analyticsData.loginTrends,
    userGrowth: analyticsData.userGrowth,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `analytics_report_${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// Initialize when document is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAnalyticsDashboard);
} else {
  initAnalyticsDashboard();
}
