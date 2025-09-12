// --- Constants ---
const SUPPORT_STATUS_CATEGORIES = {
  backlog: new Set(['Delivery Backlog', 'Under Technical Review', 'Ready for Delivery', 'Under Triage']),
  inProgress: new Set(['In Progress', 'In Review', 'Pending Internal Team', 'Pending Reporter', 'Pending External Team', 'Ready for QA', 'In QA', 'Waiting for Deployment', 'Ready for UAT', 'In UAT']),
  done: new Set(['Done', 'Approved', 'Transferred', 'Duplicate', "Won't Fix"])
};
const SUPPORT_KPI_ISSUE_TYPES = new Set(['Bug', 'Critical', 'Task', 'Improvement']);
const TIME_SPENT_IN_PROGRESS_STATUSES = new Set([
  'In Progress', 'In Review', 'In QA', 'In UAT'
]);
const COMPLEXITY_MAP = new Map([['S', 2], ['M', 5], ['L', 8], ['XL', 13]]);
const STATUS_MAP = new Map([
    ['Delivery Backlog', 0],['Under Technical Review', 0],['Ready for Delivery', 0],['Under Triage', 0],
    ['Selected for Delivery', 0.05],['In Progress', 0.50],['In Review', 0.50],['Pending Internal Team', 0.50],
    ['Pending Reporter', 0.50],['Pending External Team', 0.50],['Ready for QA', 0.70],['In QA', 0.70],
    ['Waiting for Deployment', 0.80],['Ready for UAT', 0.90],['In UAT', 0.90],['Done', 1],
    ['Approved', 1],['Transferred', 1],['Duplicate', 1],["Won't Fix", 1]
]);

// --- General Purpose Calculation Helper ---
function calculateNuancedCompletion(issues, tshirtFieldId) {
  let totalComplexityWeight = 0;
  let totalEffectiveCompletedWeight = 0;
  
  (issues || []).forEach(issue => {
    if (!issue || !issue.fields || !issue.fields.status) return;

    const tShirtSize = issue.fields[tshirtFieldId]?.value || 'N/A';
    const status = issue.fields.status.name.trim();
    let complexityWeight = COMPLEXITY_MAP.get(tShirtSize) || 1;
    const statusPercentage = STATUS_MAP.get(status) || 0;
    
    totalEffectiveCompletedWeight += complexityWeight * statusPercentage;
    totalComplexityWeight += complexityWeight;
  });
  
  const overallCompletionRate = totalComplexityWeight > 0 ? (totalEffectiveCompletedWeight / totalComplexityWeight) : 0;
  return {
    totalComplexityWeight,
    totalEffectiveCompletedWeight,
    overallCompletionRate,
    analyzedIssueCount: (issues || []).length
  };
}

// --- Tree Calculation Logic ---
function calculateNodeStats(node) {
  const TSHIRT_FIELD_ID = process.env.JIRA_TSHIRT_FIELD_ID;
  if (!node || !node.fields) return { totalWeight: 0, completedWeight: 0, issueCount: 0 };

  if (!node.children || node.children.length === 0) {
    const tShirtSize = node.fields[TSHIRT_FIELD_ID]?.value || 'N/A';
    const complexityWeight = COMPLEXITY_MAP.get(tShirtSize) || 1;
    const statusPercentage = STATUS_MAP.get(node.fields.status?.name) || 0;
    
    node.completion = statusPercentage;
    node.issueCount = 0;

    return {
      totalWeight: complexityWeight,
      completedWeight: complexityWeight * statusPercentage,
      issueCount: 1,
    };
  }

  let totalChildWeight = 0;
  let totalChildCompletedWeight = 0;
  let totalChildIssueCount = 0;

  node.children.forEach(child => {
    const childStats = calculateNodeStats(child);
    totalChildWeight += childStats.totalWeight;
    totalChildCompletedWeight += childStats.completedWeight;
    totalChildIssueCount += childStats.issueCount;
  });

  node.completion = totalChildWeight > 0 ? totalChildCompletedWeight / totalChildWeight : 0;
  node.issueCount = totalChildIssueCount;
  
  const ownWeight = COMPLEXITY_MAP.get(node.fields[TSHIRT_FIELD_ID]?.value || 'N/A') || 1;
  
  return {
    totalWeight: ownWeight,
    completedWeight: ownWeight * node.completion,
    issueCount: 1 + totalChildIssueCount,
  };
}

export function calculateInitiativeTrees(trees) {
    (trees || []).forEach(tree => calculateNodeStats(tree));
    return trees;
}

export function calculateOverallCompletion(processedTrees) {
    if (!processedTrees || processedTrees.length === 0) return 0;
    const TSHIRT_FIELD_ID = process.env.JIRA_TSHIRT_FIELD_ID;
    let totalWeight = 0;
    let completedWeight = 0;

    processedTrees.forEach(tree => {
        const tShirtSize = tree.fields[TSHIRT_FIELD_ID]?.value || 'N/A';
        const treeWeight = COMPLEXITY_MAP.get(tShirtSize) || 1;
        totalWeight += treeWeight;
        completedWeight += treeWeight * tree.completion;
    });

    return totalWeight > 0 ? completedWeight / totalWeight : 0;
}

// --- Sprint Calculation Logic ---
export function calculateSprintProgress(sprintReport, tshirtFieldId) {
  const { sprint, completedIssues, issuesNotCompleted, puntedIssues } = sprintReport;
  const sprintStartDate = new Date(sprint.startDate);
  const sprintEndDate = sprint.completeDate ? new Date(sprint.completeDate) : (sprint.endDate ? new Date(sprint.endDate) : null);
  const sprintIdString = sprint.id.toString();

  const isAddedDuringSprint = (issue) => {
    if (!issue || !issue.changelog) return false;
    for (const history of issue.changelog.histories) {
      const historyDate = new Date(history.created);
      if (historyDate > sprintStartDate) {
        for (const item of history.items) {
          if (item.field === 'Sprint' && item.to === sprintIdString) return true;
        }
      }
    }
    return false;
  };

  const allIssuesInSprint = [...completedIssues, ...issuesNotCompleted];
  const addedDuringSprint = allIssuesInSprint.filter(isAddedDuringSprint);
  const initialCommitment = allIssuesInSprint.filter(issue => !addedDuringSprint.includes(issue));

  const isCarryOver = (issue) => {
    if (!issue || !issue.changelog || addedDuringSprint.includes(issue)) return false;
    for (const history of issue.changelog.histories) {
      for (const item of history.items) {
        if (item.field === 'Sprint' && item.fromString) return true;
      }
    }
    return false;
  };
  
  const carryOverIssues = initialCommitment.filter(isCarryOver);
  const newPlannedIssues = initialCommitment.filter(issue => !isCarryOver(issue));
  
  const getWeightedStats = (issues) => {
    if (!Array.isArray(issues) || issues.length === 0) return { count: 0, weight: 0 };
    const calc = calculateNuancedCompletion(issues, tshirtFieldId);
    return { count: calc.analyzedIssueCount, weight: calc.totalComplexityWeight };
  };

  const completedStats = getWeightedStats(completedIssues);
  const notCompletedStats = getWeightedStats(issuesNotCompleted);
  const addedStats = getWeightedStats(addedDuringSprint);
  const puntedStats = getWeightedStats(puntedIssues);
  const carryOverStats = getWeightedStats(carryOverIssues);
  const newPlannedStats = getWeightedStats(newPlannedIssues);

  const totalWorkInSprintWeight = completedStats.weight + notCompletedStats.weight;
  const progressPercentage = totalWorkInSprintWeight > 0 ? completedStats.weight / totalWorkInSprintWeight : 0;

  const completedPlanned = [...carryOverIssues, ...newPlannedIssues].filter(
      issue => completedIssues.some(c => c.key === issue.key)
  );
  const completedAdded = addedDuringSprint.filter(
      issue => completedIssues.some(c => c.key === issue.key)
  );

  const plannedTimeResults = calculateTimeSpent(completedPlanned, sprintStartDate, sprintEndDate);
  const addedTimeResults = calculateTimeSpent(completedAdded, sprintStartDate, sprintEndDate);

  const timeBreakdown = {
      totalHours: plannedTimeResults.totalHours + addedTimeResults.totalHours,
      plannedHours: plannedTimeResults.totalHours,
      addedHours: addedTimeResults.totalHours,
  };

  return {
    progress: progressPercentage,
    scope: {
      carryOver: { ...carryOverStats, issues: carryOverIssues },
      newPlanned: { ...newPlannedStats, issues: newPlannedIssues },
      added: { ...addedStats, issues: addedDuringSprint },
      punted: { ...puntedStats, issues: puntedIssues },
    },
    status: {
      completed: { ...completedStats, issues: completedIssues },
      notCompleted: { ...notCompletedStats, issues: issuesNotCompleted },
    },
    issues: {
        carryOver: carryOverIssues,
        newPlanned: newPlannedIssues,
        addedDuringSprint: addedDuringSprint,
        completed: completedIssues,
        notCompleted: issuesNotCompleted,
        punted: puntedIssues,
    },
    timeBreakdown: timeBreakdown,
  };
}

// --- Other KPI Calculations ---
export function calculateSupportKpis(issues) {
  const kpis = { byType: {}, totals: { backlog: 0, inProgress: 0, done: 0, total: 0 } };
  
  (issues || []).forEach(issue => {
    if (!issue || !issue.fields || !issue.fields.issuetype || !issue.fields.status) return;
    const type = issue.fields.issuetype.name;
    if (!SUPPORT_KPI_ISSUE_TYPES.has(type)) return;
    const status = issue.fields.status.name;
    if (!kpis.byType[type]) {
      kpis.byType[type] = { backlog: 0, inProgress: 0, done: 0, total: 0 };
    }
    let category = '';
    if (SUPPORT_STATUS_CATEGORIES.backlog.has(status)) category = 'backlog';
    else if (SUPPORT_STATUS_CATEGORIES.inProgress.has(status)) category = 'inProgress';
    else if (SUPPORT_STATUS_CATEGORIES.done.has(status)) category = 'done';
    
    if (category) {
      kpis.byType[type][category]++;
      kpis.byType[type].total++;
      kpis.totals[category]++;
      kpis.totals.total++;
    }
  });
  return kpis;
}

function calculateBusinessDays(startDt, endDt) {
    if (!startDt || !endDt || endDt < startDt) return 0;
    let count = 0;
    const current = new Date(startDt);
    current.setHours(0, 0, 0, 0); 
    const finalEnd = new Date(endDt);
    finalEnd.setHours(0,0,0,0);
  
    while (current <= finalEnd) {
      const dayOfWeek = current.getDay();
      if (dayOfWeek !== 0 && dayOfWeek !== 6) count++;
      current.setDate(current.getDate() + 1);
    }
    return Math.max(0, count);
}

export function calculateTimeSpent(issues, sprintStartDate, sprintEndDate) {
    const HOURS_PER_BUSINESS_DAY = parseInt(process.env.HOURS_PER_BUSINESS_DAY) || 8;
    let totalProductiveHours = 0;
    const detailedBreakdown = [];

    (issues || []).forEach(issue => {
        if (!issue || !issue.fields || !issue.changelog) return;
        const ticketBreakdown = {
            key: issue.key,
            summary: issue.fields.summary,
            totalHours: 0,
            statusHours: {}
        };

        const allChanges = (issue.changelog.histories || [])
            .flatMap(h => h.items.filter(item => item.field === 'status').map(item => ({
                timestamp: new Date(h.created),
                from: item.fromString,
                to: item.toString
            })))
            .sort((a, b) => a.timestamp - b.timestamp);

        let lastTimestamp = new Date(issue.fields.created);
        
        allChanges.forEach(change => {
            if (TIME_SPENT_IN_PROGRESS_STATUSES.has(change.from)) {
                const effectiveStart = new Date(Math.max(lastTimestamp.getTime(), sprintStartDate.getTime()));
                const effectiveEnd = change.timestamp;

                if(effectiveStart < effectiveEnd){
                  const businessDays = calculateBusinessDays(effectiveStart, effectiveEnd);
                  const hours = businessDays * HOURS_PER_BUSINESS_DAY;
                  ticketBreakdown.statusHours[change.from] = (ticketBreakdown.statusHours[change.from] || 0) + hours;
                  ticketBreakdown.totalHours += hours;
                }
            }
            lastTimestamp = change.timestamp;
        });

        const currentStatus = issue.fields.status.name;
        if (TIME_SPENT_IN_PROGRESS_STATUSES.has(currentStatus)) {
            const effectiveStart = new Date(Math.max(lastTimestamp.getTime(), sprintStartDate.getTime()));
            const effectiveEnd = sprintEndDate ? new Date(sprintEndDate) : new Date();
            
            if(effectiveStart < effectiveEnd){
              const businessDays = calculateBusinessDays(effectiveStart, effectiveEnd);
              const hours = businessDays * HOURS_PER_BUSINESS_DAY;
              ticketBreakdown.statusHours[currentStatus] = (ticketBreakdown.statusHours[currentStatus] || 0) + hours;
              ticketBreakdown.totalHours += hours;
            }
        }

        if (ticketBreakdown.totalHours > 0) {
          detailedBreakdown.push(ticketBreakdown);
          totalProductiveHours += ticketBreakdown.totalHours;
        }
    });

    detailedBreakdown.sort((a, b) => a.key.localeCompare(b.key));
    return { totalHours: totalProductiveHours, breakdown: detailedBreakdown };
}