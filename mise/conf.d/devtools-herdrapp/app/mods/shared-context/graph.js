// Build one node per canonical ticket; prerequisites always precede their dependants.
export function dependencyGraph(snapshot, roots) {
  const tickets = new Map(snapshot.tickets.map(ticket => [ticket.id, ticket]));
  const nodes = [], edges = [], visited = new Map(), visiting = new Set(), lanes = new Map();
  function visit(id) {
    if (visiting.has(id)) throw new Error(`Dependency cycle at ${id}.`);
    if (visited.has(id)) return visited.get(id);
    const ticket = tickets.get(id);
    if (!ticket) throw new Error(`Missing prerequisite ${id}. Refresh or correct the canonical record.`);
    visiting.add(id);
    let rank = 0;
    for (const blocker of ticket.blockedBy) {
      rank = Math.max(rank, visit(blocker) + 1);
      edges.push({ from: blocker, to: id });
    }
    visiting.delete(id); visited.set(id, rank);
    const lane = lanes.get(rank) ?? 0;
    lanes.set(rank, lane + 1);
    nodes.push({ record: ticket, x: 24 + rank * 270, y: 24 + lane * 116 });
    return rank;
  }
  for (const root of new Set(roots)) visit(root);
  return { nodes, edges, width: Math.max(280, ...nodes.map(node => node.x + 250)), height: Math.max(180, ...nodes.map(node => node.y + 112)) };
}
