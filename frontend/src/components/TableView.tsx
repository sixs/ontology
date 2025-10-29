import React from 'react';

interface Relation {
  relation: string;
  target: string;
}

interface TableItem {
  source: string;
  relations: Relation[];
}

interface TableViewProps {
  data: TableItem[];
}

const TableView: React.FC<TableViewProps> = ({ data }) => {
  return (
    <div className="table-view">
      <table>
        <thead>
          <tr>
            <th>Source</th>
            <th>Relation</th>
            <th>Target</th>
          </tr>
        </thead>
        <tbody>
          {data && data.length > 0 ? (
            data.map((item, index) => (
              <React.Fragment key={index}>
                {item.relations.map((relation, relIndex) => (
                  <tr key={`${index}-${relIndex}`}>
                    {relIndex === 0 && (
                      <td rowSpan={item.relations.length}>
                        {item.source}
                      </td>
                    )}
                    <td>{relation.relation}</td>
                    <td>{relation.target}</td>
                  </tr>
                ))}
              </React.Fragment>
            ))
          ) : (
            <tr>
              <td colSpan={3} className="no-data">暂无数据</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default TableView;