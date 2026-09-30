import React from 'react';
import './DataTable.css';

const DataTable = ({ columns, data, onRowClick, emptyMessage = 'No data available', loading = false }) => {
  if (loading) {
    return (
      <div className="table-container">
        <div className="table-loading">Loading...</div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="table-container">
        <div className="table-empty">{emptyMessage}</div>
      </div>
    );
  }

  return (
    <div className="table-container">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column, index) => (
              <th key={index} style={{ width: column.width }}>
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr
              key={rowIndex}
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {columns.map((column, colIndex) => (
                <td key={colIndex}>
                  {column.render ? column.render(row) : row[column.accessor]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataTable;
