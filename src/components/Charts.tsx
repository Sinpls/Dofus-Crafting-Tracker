// src/components/Charts.tsx
import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { db } from '../services/DatabaseService';
import { ISale } from '../types';

const Charts: React.FC = () => {
  const [salesData, setSalesData] = useState<ISale[]>([]);

  useEffect(() => {
    const loadSalesData = async () => {
      const sales = await db.getSales();
      setSalesData(sales);
    };
    loadSalesData();
  }, []);

  const monthlySales = salesData.reduce((acc, sale) => {
    if (sale.sellDate) {
      const date = new Date(sale.sellDate);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!acc[monthYear]) {
        acc[monthYear] = { month: monthYear, sales: 0, profit: 0 };
      }
      acc[monthYear].sales += sale.sellPrice * sale.quantity;
      acc[monthYear].profit += sale.profit;
    }
    return acc;
  }, {} as { [key: string]: { month: string; sales: number; profit: number } });

  const chartData = Object.values(monthlySales).sort((a, b) => a.month.localeCompare(b.month));

  return (
    <div className="flex flex-col h-full space-y-4 overflow-hidden">
      <h2 className="text-xl font-bold">Sales and Profit Charts</h2>
      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{
              top: 20,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis yAxisId="left" orientation="left" stroke="#8884d8" />
            <YAxis yAxisId="right" orientation="right" stroke="#82ca9d" />
            <Tooltip />
            <Legend />
            <Bar yAxisId="left" dataKey="sales" fill="#8884d8" name="Total Sales" />
            <Bar yAxisId="right" dataKey="profit" fill="#82ca9d" name="Total Profit" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Charts;