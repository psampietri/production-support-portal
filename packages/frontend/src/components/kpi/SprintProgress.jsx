import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import {
  Paper, Box, Typography, Select, MenuItem, LinearProgress, Grid,
  Table, TableBody, TableCell, TableHead, TableRow, Collapse, CardActionArea, Divider, CircularProgress, Alert
} from '@mui/material';

// --- MUI-based Sub-components ---

const ProgressBar = ({ value }) => {
  const percentage = Math.round(value * 100);
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
      <LinearProgress variant="determinate" value={percentage} sx={{ flexGrow: 1, height: 12, borderRadius: 6, mr: 2 }} />
      <Typography variant="h6">{`${percentage}%`}</Typography>
    </Box>
  );
};

const StatCard = ({ title, value, color, onClick }) => (
  <Grid item xs={6} sm={3}>
    <CardActionArea onClick={onClick}>
      <Paper elevation={2} sx={{ p: 2, textAlign: 'center', '&:hover': { backgroundColor: 'action.hover' } }}>
        <Typography variant="h4" sx={{ color: color || 'text.primary', fontWeight: 'bold' }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary">{title}</Typography>
      </Paper>
    </CardActionArea>
  </Grid>
);

const SprintIssueList = ({ title, issues }) => (
  <Collapse in={true} timeout="auto" unmountOnExit>
    <Box sx={{ my: 2, p: 2, border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
      <Typography variant="h6" gutterBottom>{title} ({issues.length})</Typography>
      {issues.length > 0 ? (
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Key</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {issues.map(issue => (
              <TableRow key={issue.key}>
                <TableCell>{issue.key}</TableCell>
                <TableCell>{issue.fields.summary}</TableCell>
                <TableCell>{issue.fields.status.name}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : <Typography sx={{ mt: 2 }}>No issues in this category.</Typography>}
    </Box>
  </Collapse>
);


// --- Main SprintProgress Component ---
const SprintProgress = ({ jiraInstance }) => {
  const [sprints, setSprints] = useState([]);
  const [selectedSprintId, setSelectedSprintId] = useState('');
  const [sprintData, setSprintData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [visibleList, setVisibleList] = useState(null);

  useEffect(() => {
    if (!jiraInstance) return;

    const fetchSprints = async () => {
      try {
        setError(null);
        setIsLoading(true);
        const response = await api.get('/api/kpis/sprints', {
          params: { jiraInstance }
        });

        if (response.data.success) {
          // FIXED: We must access the .data property of the response, which contains the array.
          const sprintsData = response.data.data || [];
          
          if (!Array.isArray(sprintsData)) {
            throw new Error("The API did not return a valid list of sprints.");
          }

          const activeSprint = sprintsData.find(s => s.state === 'active');
          setSprints(sprintsData);

          if (activeSprint) {
            setSelectedSprintId(activeSprint.id);
          } else if (sprintsData.length > 0) {
            setSelectedSprintId(sprintsData[0].id);
          } else {
            // No sprints found, stop loading.
            setIsLoading(false);
          }
        } else {
          throw new Error(response.data.error || 'Failed to fetch sprints.');
        }
      } catch (err) {
        console.error("Failed to fetch sprints", err);
        setError(err.message);
        setIsLoading(false);
      }
    };
    fetchSprints();
  }, [jiraInstance]);

  useEffect(() => {
    if (!selectedSprintId || !jiraInstance) return;

    const fetchSprintData = async () => {
      setVisibleList(null);
      setError(null);
      setIsLoading(true);
      try {
        const response = await api.get(`/api/kpis/sprint-progress/${selectedSprintId}`, {
          params: { jiraInstance }
        });
        
        if (response.data.success) {
          setSprintData(response.data.sprintProgress);
        } else {
          throw new Error(response.data.error || 'Failed to fetch sprint data.');
        }
      } catch (err) {
        console.error(`Failed to fetch sprint data for sprint ${selectedSprintId}`, err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchSprintData();
  }, [selectedSprintId, jiraInstance]);

  const toggleVisibleList = (listName) => {
    setVisibleList(current => (current === listName ? null : listName));
  };

  return (
    <Paper elevation={3} sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h6">Sprint Progress</Typography>
        <Select value={selectedSprintId} onChange={e => setSelectedSprintId(e.target.value)} size="small" disabled={sprints.length === 0}>
          {sprints.map(sprint => (
            <MenuItem key={sprint.id} value={sprint.id}>
              {sprint.name} ({sprint.state})
            </MenuItem>
          ))}
        </Select>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {isLoading && <CircularProgress />}
      {error && <Alert severity="error">{error}</Alert>}
      {!isLoading && !error && sprintData && (
        <>
          <ProgressBar value={sprintData.progress} />

          <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Scope Breakdown</Typography>
          <Grid container spacing={2}>
            <StatCard title="Carry Over" value={sprintData.scope.carryOver.count} color="info.main" onClick={() => toggleVisibleList('carryOver')} />
            <StatCard title="New Planned" value={sprintData.scope.newPlanned.count} onClick={() => toggleVisibleList('newPlanned')} />
            <StatCard title="Scope Added" value={`+${sprintData.scope.added.count}`} color="success.main" onClick={() => toggleVisibleList('added')} />
            <StatCard title="Punted" value={sprintData.scope.punted.count > 0 ? `-${sprintData.scope.punted.count}` : 0} color="error.main" onClick={() => toggleVisibleList('punted')} />
          </Grid>

          {visibleList === 'carryOver' && <SprintIssueList title="Carried Over Issues" issues={sprintData.scope.carryOver.issues} />}
          {visibleList === 'newPlanned' && <SprintIssueList title="New Planned Issues" issues={sprintData.scope.newPlanned.issues} />}
          {visibleList === 'added' && <SprintIssueList title="Issues Added Mid-Sprint" issues={sprintData.scope.added.issues} />}
          {visibleList === 'punted' && <SprintIssueList title="Punted Issues" issues={sprintData.scope.punted.issues} />}
        </>
      )}
       {!isLoading && !error && !sprintData && <Typography>No data available for this sprint.</Typography>}
    </Paper>
  );
};

export default SprintProgress;