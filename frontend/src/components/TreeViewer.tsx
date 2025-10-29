import React, { useState } from 'react';
import '../App.css';

interface TreeNode {
  name: string;
  children?: TreeNode[];
}

interface TreeViewerProps {
  data: TreeNode;
}

const TreeNode: React.FC<{ node: TreeNode; level: number }> = ({ node, level }) => {
  const [isExpanded, setIsExpanded] = useState(true);
  
  const hasChildren = node.children && node.children.length > 0;
  
  return (
    <div className="tree-node" style={{ marginLeft: level > 0 ? '20px' : '0' }}>
      <div 
        className="tree-node-header"
        onClick={() => hasChildren && setIsExpanded(!isExpanded)}
        style={{ cursor: hasChildren ? 'pointer' : 'default' }}
      >
        {hasChildren && (
          <span className="tree-node-toggle">
            {isExpanded ? '▼' : '▶'}
          </span>
        )}
        {!hasChildren && (
          <span className="tree-node-toggle-placeholder"></span>
        )}
        <span className="tree-node-name">{node.name}</span>
      </div>
      {hasChildren && isExpanded && (
        <div className="tree-node-children">
          {node.children?.map((child, index) => (
            <TreeNode key={index} node={child} level={level + 1} />
          ))}
        </div>
      )}
    </div>
  );
};

const TreeViewer: React.FC<TreeViewerProps> = ({ data }) => {
  return (
    <div className="tree-viewer">
      <TreeNode node={data} level={0} />
    </div>
  );
};

export default TreeViewer;