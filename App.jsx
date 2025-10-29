import React, { useCallback, useState, useRef, useEffect } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  ReactFlowProvider,
} from 'reactflow';
import 'reactflow/dist/style.css';
import {
  buildTreeNodesAndEdges,
  findNodeByPath,
  pathToKeyArray,
} from './jsonUtils';

const initialSample = `{
  "user": {
    "id": 123,
    "name": "Alice",
    "address": {
      "city": "Wonderland",
      "zip": "12345"
    },
    "tags": ["admin", "editor"]
  },
  "items": [
    { "name": "Item A", "price": 9.99 },
    { "name": "Item B", "price": 19.99 }
  ]
}`;

function FlowCanvas({ nodes, edges, selectedNodeId, onNodeClick }) {
  const reactFlowInstance = useReactFlow();

  useEffect(() => {
    if (selectedNodeId) {
      const n = nodes.find((x) => x.id === selectedNodeId);
      if (n) {
        reactFlowInstance.setCenter(
          n.position.x + (n.width ?? 0) / 2,
          n.position.y + (n.height ?? 0) / 2,
          { duration: 800 }
        );
      }
    }
  }, [selectedNodeId, nodes, reactFlowInstance]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      attributionPosition="bottom-left"
      onNodeClick={(e, node) => onNodeClick(node)}
      nodesConnectable={false}
      elementsSelectable={true}
      connectionLineType="smoothstep"
    >
      <Background />
      <Controls />
      <MiniMap
        nodeStrokeColor={(n) => {
          if (n.data?.type === 'object') return '#5B21B6';
          if (n.data?.type === 'array') return '#059669';
          return '#B45309';
        }}
      />
    </ReactFlow>
  );
}

export default function App() {
  const [jsonText, setJsonText] = useState(initialSample);
  const [error, setError] = useState('');
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [selectedNodeId, setSelectedNodeId] = useState(null);
  const [matchMessage, setMatchMessage] = useState('');

  const visualize = useCallback(() => {
    setError('');
    setMatchMessage('');
    try {
      const parsed = JSON.parse(jsonText);
      const { nodes: newNodes, edges: newEdges } =
        buildTreeNodesAndEdges(parsed);
      setNodes(newNodes);
      setEdges(newEdges);
      setSelectedNodeId(null);
    } catch (e) {
      setError('Invalid JSON: ' + e.message);
      setNodes([]);
      setEdges([]);
    }
  }, [jsonText]);

  useEffect(() => {
    visualize();
  }, []); // run on mount

  const resetAll = () => {
    setJsonText('');
    setNodes([]);
    setEdges([]);
    setError('');
    setMatchMessage('');
  };

  const handleNodeClick = (node) => {
    if (node?.data?.path) {
      navigator.clipboard
        ?.writeText(node.data.path)
        .then(() => {
          setMatchMessage(`Copied path: ${node.data.path}`);
          setTimeout(() => setMatchMessage(''), 2000);
        })
        .catch(() => {});
    }
  };

  const doSearch = () => {
    setMatchMessage('');
    const input = document.getElementById('searchInput').value.trim();
    if (!input) {
      setMatchMessage('Enter a JSON path to search.');
      return;
    }
    const normalized = input.startsWith('$') ? input.slice(1) : input;
    const keyArr = pathToKeyArray(normalized);
    const match = findNodeByPath(nodes, keyArr);
    if (match) {
      setSelectedNodeId(match.id);
      setMatchMessage('Match found and centered.');
    } else {
      setMatchMessage('No match found.');
    }
  };

  return (
    <div className="app">
      <header className="header">
        <h1>Sanju JSON Tree Visualizer</h1>
        <div className="controls">
          <button onClick={visualize}>Visualize</button>
          <button onClick={resetAll}>Clear</button>
        </div>
      </header>

      <main className="main">
        <section className="left">
          <h2>Paste JSON text</h2>
          <textarea
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder="Paste JSON here"
          />
          <div className="row">
            <input
              id="searchInput"
              placeholder="Search path e.g. $.user.address.city or items[0].name"
            />
            <button onClick={doSearch}>Search</button>
          </div>
          {error && <div className="error">{error}</div>}
          {matchMessage && <div className="message">{matchMessage}</div>}
          <div className="legend">
            <div>
              <span className="dot object"></span>Object
            </div>
            <div>
              <span className="dot array"></span>Array
            </div>
            <div>
              <span className="dot primitive"></span>Primitive
            </div>
          </div>
        </section>

        <section className="right">
          <ReactFlowProvider>
            <FlowCanvas
              nodes={nodes}
              edges={edges}
              selectedNodeId={selectedNodeId}
              onNodeClick={handleNodeClick}
            />
          </ReactFlowProvider>
        </section>
      </main>

      <footer className="footer">
        <small>
          Click a node to copy its JSON path. Bonus: Clear button included.
        </small>
      </footer>
    </div>
  );
}
