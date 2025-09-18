import React, { useState, useEffect } from 'react';
import api from '../../services/api';

// MUI Components for layout and feedback
import { Grid, Paper, Typography, CircularProgress, Alert } from '@mui/material';

// Import the refactored KPI components
import KpiCard from '../../components/kpi/KpiCard';
import InitiativeTree from '../../components/kpi/InitiativeTree';
import SupportChart from '../../components/kpi/SupportChart';
import TimeTrackingTable from '../../components/kpi/TimeTrackingTable';
import SprintProgress from '../../components/kpi/SprintProgress';
import ErrorBoundary from '../../components/kpi/ErrorBoundary';

function KpiDashboard() {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jiraInstance, setJiraInstance] = useState('vwgoa'); // Or manage this state as needed

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/kpis/dashboard-data', {
          params: { jiraInstance } // Use state for the instance
        });
        if (response.data.success) {
          setDashboardData(response.data);
        } else {
          throw new Error(response.data.error || 'An unknown backend error occurred.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [jiraInstance]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Alert severity="error">Failed to load dashboard: {error}</Alert>;
  }

  if (!dashboardData) {
    return <Typography>No data available.</Typography>;
  }

  const { data, overallCompletion, supportKpis, timeTrackingData } = dashboardData;

  return (
    <ErrorBoundary>
      <Grid container spacing={3}>
        {/* Row for main KPI cards */}
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard value={`${(overallCompletion * 100).toFixed(1)}%`} label="Overall Weighted Completion" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard value={supportKpis?.totals?.total || 0} label="Total Support Tickets" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard value={supportKpis?.totals?.inProgress || 0} label="Tickets In Progress" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard value={supportKpis?.totals?.backlog || 0} label="Tickets in Backlog" />
        </Grid>

        {/* Row for the Initiative Tree */}
        <Grid item xs={12}>
          <InitiativeTree initiatives={data} />
        </Grid>
        
        {/* Row for Sprint Progress */}
        <Grid item xs={12}>
            <SprintProgress jiraInstance={jiraInstance} />
        </Grid>

        {/* Row for Charts and Tables */}
{/*         <Grid item xs={12} lg={6}>
            <SupportChart kpis={supportKpis} />
        </Grid>
        <Grid item xs={12} lg={6}>
            <TimeTrackingTable timeData={timeTrackingData} />
        </Grid> */}
      </Grid>
    </ErrorBoundary>
  );
}

export default KpiDashboard;