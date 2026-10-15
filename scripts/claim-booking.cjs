// Run only from the default branch by the issue_comment workflow.
module.exports = async ({ github, context, core }) => {
  const { issue, comment } = context.payload;
  const match = comment.body.trim().match(/^\/claim\s+([A-Za-z0-9_.-]{1,80})$/);
  if (!match || issue.pull_request || issue.state !== 'open') return;
  if (!issue.labels.some(x => x.name === 'booking-task')) return;
  const repo = context.repo;
  const reply = body => github.rest.issues.createComment({ ...repo, issue_number: issue.number, body });
  const permission = await github.rest.repos.getCollaboratorPermissionLevel({ ...repo, username: comment.user.login });
  if (!['admin', 'maintain', 'write'].includes(permission.data.permission)) {
    await reply('Claim denied: repository write access is required. Ask the coordinator to claim on your behalf.');
    return;
  }
  const ref = `heads/booking-claims/issue-${issue.number}`;
  const actor = { login: comment.user.login, agent: match[1], issue: issue.number, comment: comment.id };
  // The Git ref is the atomic lock. Labels and assignees are only display metadata.
  try {
    const existing = await github.rest.git.getRef({ ...repo, ref });
    const commit = await github.rest.git.getCommit({ ...repo, commit_sha: existing.data.object.sha });
    await reply(`Already claimed. Authoritative claim: ${commit.data.message}. Do not start competing work.`);
    return;
  } catch (error) { if (error.status !== 404) throw error; }
  if (!issue.labels.some(x => x.name === 'booking:ready')) {
    await reply('This task is not ready for claiming. Contact the coordinator.');
    return;
  }
  const base = await github.rest.git.getRef({ ...repo, ref: `heads/${context.payload.repository.default_branch}` });
  const parent = await github.rest.git.getCommit({ ...repo, commit_sha: base.data.object.sha });
  const claim = await github.rest.git.createCommit({ ...repo, message: JSON.stringify(actor), tree: parent.data.tree.sha, parents: [base.data.object.sha] });
  try {
    await github.rest.git.createRef({ ...repo, ref: `refs/${ref}`, sha: claim.data.sha });
  } catch (error) {
    if (error.status !== 422) throw error;
    await reply('Claim not acquired: another claim may have won. Check the booking-claims ref; do not begin work without confirmation.');
    return;
  }
  await reply(`CLAIM CONFIRMED: @${actor.login}, agent ${actor.agent}. Lock: ${ref}. Work on a separate branch, link this issue in your PR, and report evidence/tests. Only the coordinator may release or transfer this lock.`);
  try {
    await github.rest.issues.addLabels({ ...repo, issue_number: issue.number, labels: ['booking:claimed'] });
    await github.rest.issues.removeLabel({ ...repo, issue_number: issue.number, name: 'booking:ready' });
    await github.rest.issues.addAssignees({ ...repo, issue_number: issue.number, assignees: [actor.login] });
  } catch (error) { core.warning(`Claim remains valid; display metadata update failed: ${error.message}`); }
};
