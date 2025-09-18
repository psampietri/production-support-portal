import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Box, Grid, Typography, Alert, CircularProgress, Paper } from '@mui/material';
import KpiCard from '../../components/kpi/KpiCard';
import InitiativeTree from '../../components/kpi/InitiativeTree';
import SprintProgress from '../../components/kpi/SprintProgress';
import ErrorBoundary from '../../components/kpi/ErrorBoundary';
import '../../styles/kpi/Dashboard.css'; // Import main dashboard styles
import api from '../../services/api';


const KpiDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await api.get(`/kpis/dashboard-data`);
        if (response.data.success) {
          setDashboardData(response.data);
        } else {
          throw new Error(response.data.error || 'An unknown error occurred.');
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <Box textAlign="center"><CircularProgress /><Typography>Loading KPI Data...</Typography></Box>;
  }

  if (error) {
    return <Alert severity="error">Failed to load KPI dashboard: {error}</Alert>;
  }

  if (!dashboardData) {
    return <Typography>No KPI data available.</Typography>;
  }

  const { overallCompletion, data: initiatives } = dashboardData;

  return (
    <Box>
      <Typography variant="h4" gutterBottom>KPI Dashboard</Typography>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KpiCard value={`${(overallCompletion * 100).toFixed(1)}%`} label="Overall Weighted Completion" />
        </Grid>
        {/* Add more KpiCard instances here if needed */}
      </Grid>
      
      <Paper sx={{ p: 2, mb: 3 }}>
        <ErrorBoundary>
          <InitiativeTree initiatives={initiatives} />
        </ErrorBoundary>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <ErrorBoundary>
          <SprintProgress />
        </ErrorBoundary>
      </Paper>
    </Box>
  );
};

export default KpiDashboard;