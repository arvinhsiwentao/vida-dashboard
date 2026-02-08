import { useCallback, useState } from 'react';
import {
  ReactFlow,
  type Node,
  type Edge,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { motion, AnimatePresence } from 'framer-motion';
import dashboardData from './data/dashboard.json';
import './App.css';

// Custom node component
const CustomNode = ({ data }: { data: any }) => {
  const statusColors: Record<string, string> = {
    active: '#00ff88',
    connected: '#00ff88',
    ok: '#00ff88',
    paused: '#ffaa00',
    inactive: '#666666',
  };

  const getStatusColor = () => {
    if (data.status) return statusColors[data.status] || '#00ffff';
    if (data.lastStatus) return statusColors[data.lastStatus] || '#00ffff';
    return '#00ffff';
  };

  const color = getStatusColor();

  return (
    <div
      className="custom-node"
      style={{
        borderColor: color,
        boxShadow: `0 0 20px ${color}40, 0 0 40px ${color}20`,
      }}
    >
      <div className="node-header">
        {data.icon && <span className="node-icon">{data.icon}</span>}
        <span className="node-label">{data.label}</span>
      </div>
      {data.description && (
        <div className="node-description">{data.description}</div>
      )}
      {data.automationLevel !== undefined && (
        <div className="automation-bar">
          <div
            className="automation-fill"
            style={{ width: `${data.automationLevel}%`, background: color }}
          />
          <span className="automation-text">{data.automationLevel}%</span>
        </div>
      )}
      {data.schedule && (
        <div className="node-schedule">⏰ {data.schedule}</div>
      )}
      {data.progress !== undefined && (
        <div className="progress-bar">
          <div
            className="progress-fill"
            style={{ width: `${data.progress}%`, background: color }}
          />
          <span className="progress-text">{data.progress}%</span>
        </div>
      )}
      <div className="status-indicator" style={{ background: color }} />
    </div>
  );
};

const nodeTypes = { custom: CustomNode };

// Generate nodes and edges from data
const generateNodesAndEdges = () => {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Central VIDA node
  nodes.push({
    id: 'vida',
    type: 'custom',
    position: { x: 400, y: 300 },
    data: { label: '⬡ VIDA', description: 'AI Assistant Core', icon: '🤖' },
  });

  // Category positions
  const categories = [
    { id: 'skills', label: 'Skills', x: 100, y: 100, color: '#00ffff', data: dashboardData.skills },
    { id: 'integrations', label: 'Integrations', x: 700, y: 100, color: '#00ff88', data: dashboardData.integrations },
    { id: 'cron', label: 'Cron Jobs', x: 100, y: 500, color: '#bf00ff', data: dashboardData.cronJobs },
    { id: 'projects', label: 'Projects', x: 700, y: 500, color: '#ff6600', data: dashboardData.projects },
  ];

  categories.forEach((cat) => {
    // Category node
    nodes.push({
      id: cat.id,
      type: 'custom',
      position: { x: cat.x, y: cat.y },
      data: { label: cat.label, icon: '📁' },
    });

    // Edge from VIDA to category
    edges.push({
      id: `vida-${cat.id}`,
      source: 'vida',
      target: cat.id,
      style: { stroke: cat.color, strokeWidth: 2 },
      animated: true,
    });

    // Child nodes
    cat.data.forEach((item: any, index: number) => {
      const childId = `${cat.id}-${item.id}`;
      const offsetX = (index % 3) * 180 - 180;
      const offsetY = Math.floor(index / 3) * 100 + 120;

      nodes.push({
        id: childId,
        type: 'custom',
        position: { x: cat.x + offsetX, y: cat.y + offsetY },
        data: {
          label: item.name,
          description: item.description,
          status: item.status,
          automationLevel: item.automationLevel,
          schedule: item.schedule,
          progress: item.progress,
          icon: item.icon,
          lastStatus: item.lastStatus,
        },
      });

      edges.push({
        id: `${cat.id}-${childId}`,
        source: cat.id,
        target: childId,
        style: { stroke: cat.color, strokeWidth: 1 },
      });
    });
  });

  return { nodes, edges };
};

function App() {
  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges();
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNode(node.data);
  }, []);

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <h1>🤖 VIDA DASHBOARD</h1>
        <span className="status-badge">● All Systems Operational</span>
      </header>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        nodeTypes={nodeTypes}
        fitView
        className="react-flow-dark"
      >
        <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#1a1a2e" />
        <Controls />
      </ReactFlow>

      <AnimatePresence>
        {selectedNode && (
          <motion.div
            className="detail-panel"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25 }}
          >
            <button className="close-btn" onClick={() => setSelectedNode(null)}>×</button>
            <h2>{selectedNode.icon} {selectedNode.label}</h2>
            {selectedNode.description && <p>{selectedNode.description}</p>}
            {selectedNode.automationLevel !== undefined && (
              <div className="detail-stat">
                <span>Automation Level</span>
                <strong>{selectedNode.automationLevel}%</strong>
              </div>
            )}
            {selectedNode.schedule && (
              <div className="detail-stat">
                <span>Schedule</span>
                <strong>{selectedNode.schedule}</strong>
              </div>
            )}
            {selectedNode.progress !== undefined && (
              <div className="detail-stat">
                <span>Progress</span>
                <strong>{selectedNode.progress}%</strong>
              </div>
            )}
            {selectedNode.status && (
              <div className="detail-stat">
                <span>Status</span>
                <strong className={`status-${selectedNode.status}`}>{selectedNode.status}</strong>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="dashboard-footer">
        <span>Last sync: {new Date(dashboardData.lastUpdated).toLocaleString()}</span>
      </footer>
    </div>
  );
}

export default App;
