import React from 'react';
import { Tree } from "react-arborist";
import { Paper, Box, Typography, LinearProgress, IconButton, Grid } from '@mui/material';
import { ChevronRight, KeyboardArrowDown } from '@mui/icons-material';

// --- Custom Node Renderer (Final Version) ---
const Node = ({ node, style, dragHandle, tree }) => {
  const issue = node.data;
  const percentage = Math.round(issue.completion * 100);
  const isSelected = tree.isSelected(node.id);

  return (
    <Box
      ref={dragHandle}
      // This is the crucial part: merge the library's positioning style
      // with our MUI sx prop for highlighting and layout.
      style={style}
      sx={{
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        backgroundColor: isSelected ? 'action.selected' : 'transparent',
      }}
      onClick={() => node.select()}
    >
      <Grid container alignItems="center" sx={{ p: 0.5, width: '100%' }}>
        <Grid item xs={3}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            {/* The indent is now controlled by the Tree's indent prop */}
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); node.toggle(); }} sx={{ mr: 0.5 }}>
              {node.isLeaf ? <span style={{ width: 24 }} /> : (node.isOpen ? <KeyboardArrowDown /> : <ChevronRight />)}
            </IconButton>
            <Typography variant="body2">{issue.key}</Typography>
          </Box>
        </Grid>
        <Grid item xs={4}><Typography variant="body2" noWrap>{issue.fields?.summary}</Typography></Grid>
        <Grid item xs={2}><Typography variant="body2" noWrap>{issue.fields?.status?.name}</Typography></Grid>
        <Grid item xs={2}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <LinearProgress variant="determinate" value={percentage} sx={{ width: '100%', height: 10, borderRadius: 5, mr: 1 }} />
            <Typography variant="caption">{`${percentage}%`}</Typography>
          </Box>
        </Grid>
        <Grid item xs={1} sx={{ textAlign: 'center' }}><Typography variant="body2">{issue.issueCount}</Typography></Grid>
      </Grid>
    </Box>
  );
};

// Header component remains the same
const TreeHeader = () => (
    <Box sx={{ borderBottom: 1, borderColor: 'divider', fontWeight: 'bold' }}>
        <Grid container alignItems="center" sx={{ p: 0.5, px: 2 }}>
            <Grid item xs={3}><Typography variant="subtitle2">Key</Typography></Grid>
            <Grid item xs={4}><Typography variant="subtitle2">Summary</Typography></Grid>
            <Grid item xs={2}><Typography variant="subtitle2">Status</Typography></Grid>
            <Grid item xs={2}><Typography variant="subtitle2">Completion</Typography></Grid>
            <Grid item xs={1} sx={{ textAlign: 'center' }}><Typography variant="subtitle2">Issues</Typography></Grid>
        </Grid>
    </Box>
);

const InitiativeTree = ({ initiatives }) => {
  if (!initiatives || initiatives.length === 0) {
    return <Typography>No initiative data available.</Typography>;
  }
  const treeData = initiatives.map(init => ({ ...init, id: init.key }));

  return (
    <Paper elevation={3}>
        <Box sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>OKR Progress</Typography>
        </Box>
        <TreeHeader />
        <Tree
            initialData={treeData}
            openByDefault={false}
            width="100%"
            height={400}
            // Use the library's indent prop for clean indentation
            indent={24}
            disableMultiSelection
        >
            {Node}
        </Tree>
    </Paper>
  );
};

export default InitiativeTree;