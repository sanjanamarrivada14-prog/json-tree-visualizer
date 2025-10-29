let idCounter = 1;
function nextId() {
  return 'node_' + idCounter++;
}

function buildTreeNodesAndEdges(obj) {
  idCounter = 1;
  const nodes = [];
  const edges = [];
  const spacingX = 220;
  const spacingY = 80;
  const positions = [];

  function ensureDepth(depth) {
    if (positions[depth] === undefined) positions[depth] = 0;
  }

  function recurse(value, key, depth, path, parentId) {
    ensureDepth(depth);
    const nodeId = nextId();
    const displayLabel =
      typeof key === 'number' ? '[' + key + ']' : key ?? 'root';
    const type =
      value === null
        ? 'primitive'
        : Array.isArray(value)
        ? 'array'
        : typeof value === 'object'
        ? 'object'
        : 'primitive';
    const primitiveText =
      type === 'primitive' && value !== null && typeof value !== 'object'
        ? `: ${String(value)}`
        : '';

    const node = {
      id: nodeId,
      data: { label: displayLabel + primitiveText, path, value, type },
      position: { x: depth * spacingX, y: positions[depth] * spacingY },
      style: {
        minWidth: 140,
        padding: 8,
        borderRadius: 8,
        border: '2px solid #ddd',
        background:
          type === 'object'
            ? '#eef2ff'
            : type === 'array'
            ? '#ecfdf5'
            : '#fff7ed',
      },
    };
    nodes.push(node);
    positions[depth]++;

    if (parentId) {
      edges.push({
        id: 'e_' + parentId + '_' + nodeId,
        source: parentId,
        target: nodeId,
        markerEnd: { type: 'arrow', color: '#999' },
      });
    }

    if (type === 'object') {
      for (const k of Object.keys(value)) {
        recurse(
          value[k],
          k,
          depth + 1,
          path ? path + '.' + k : String(k),
          nodeId
        );
      }
    } else if (type === 'array') {
      for (let i = 0; i < value.length; i++) {
        recurse(
          value[i],
          i,
          depth + 1,
          path ? path + '[' + i + ']' : '[' + i + ']',
          nodeId
        );
      }
    }
  }

  recurse(obj, null, 0, '$', null);
  return { nodes, edges };
}

function pathToKeyArray(pathStr) {
  const s = pathStr.trim().replace(/^\$\.?/, '');
  if (!s) return [];
  const parts = [];
  let buf = '';
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (ch === '.') {
      if (buf) {
        parts.push(buf);
        buf = '';
      }
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function findNodeByPath(nodes, keyArr) {
  if (!nodes || nodes.length === 0) return null;
  const joined = keyArr.join('.');
  for (const n of nodes) {
    if (!n.data || !n.data.path) continue;
    const p = String(n.data.path);
    const norm = p.replace(/^\$\.?/, '');
    if (norm === joined) return n;
    if (norm.endsWith(joined)) return n;
  }
  return null;
}

export { buildTreeNodesAndEdges, findNodeByPath, pathToKeyArray };
