// src/components/Loader.js
import React from "react";
import './loader.css';

const Repeat = ({count, children}) => {
  const arr = new Array(Math.max(1, count)).fill(0);
  return arr.map((_, i) => React.cloneElement(children, { key: i }));
};

const KPICard = () => (
  <div className="skeleton kpi-card">
    <div className="skeleton-line kpi-title" />
    <div className="skeleton-line kpi-value" />
  </div>
);

const TableRow = () => (
  <div className="skeleton table-row">
    <div className="skeleton-cell c-1" />
    <div className="skeleton-cell c-2" />
    <div className="skeleton-cell c-3" />
    <div className="skeleton-cell c-4" />
    <div className="skeleton-cell c-5" />
  </div>
);

const Box = () => (
  <div className="skeleton box-shape" />
);

const ProductCard = () => (
  <div className="skeleton product-card">
    <div className="skeleton-rect product-image" />
    <div className="product-body">
      <div className="skeleton-line product-title" />
      <div className="skeleton-line product-sub" />
      <div className="skeleton-line product-price" />
    </div>
  </div>
);

const OrderCard = () => (
  <div className="skeleton order-card">
    <div className="skeleton-line order-header" />
    <div className="skeleton-line order-sub" />
    <div className="skeleton-items">
      <div className="skeleton-line item" />
      <div className="skeleton-line item" />
    </div>
  </div>
);

const LogRow = () => (
  <div className="skeleton log-row">
    <div className="skeleton-cell log-time" />
    <div className="skeleton-cell log-user" />
    <div className="skeleton-cell log-type" />
    <div className="skeleton-cell log-action" />
    <div className="skeleton-cell log-details" />
  </div>
);

/**
 * Props:
 *  - type: 'kpi'|'table'|'box'|'product'|'order'|'log-row'
 *  - count: number
 */
const Skeleton = ({ type = "table", count = 3 }) => {
  switch (type) {
    case "kpi":
      return <div className="skeleton-wrap kpi-wrap"><Repeat count={count}><KPICard /></Repeat></div>;
    case "box":
      return <div className="skeleton-wrap"><Repeat count={count}><Box /></Repeat></div>;
    case "product":
      return <div className="skeleton-wrap product-wrap"><Repeat count={count}><ProductCard /></Repeat></div>;
    case "order":
      return <div className="skeleton-wrap order-wrap"><Repeat count={count}><OrderCard /></Repeat></div>;
    case "log-row":
      return <div className="skeleton-wrap logs-wrap"><Repeat count={count}><LogRow /></Repeat></div>;
    case "table":
    default:
      return <div className="skeleton-wrap table-wrap"><Repeat count={count}><TableRow /></Repeat></div>;
  }
};

export default Skeleton;
