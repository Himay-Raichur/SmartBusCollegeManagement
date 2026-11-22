import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell, Legend } from "recharts";
import { Card, Empty } from "./ui.jsx";

const COLORS = ["#0b2545", "#38b6ff", "#14b8a6", "#f59e0b", "#ef4444", "#8b5cf6"];

export function BarCard({ title, data, xKey, yKey, color = "#0b2545" }) {
  return (
    <Card title={title}>
      {!data?.length ? (
        <Empty text="No data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey={xKey} fontSize={12} />
            <YAxis allowDecimals={false} fontSize={12} />
            <Tooltip />
            <Bar dataKey={yKey} fill={color} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}

// data: [{name, value}]
export function PieCard({ title, data }) {
  return (
    <Card title={title}>
      {!data?.length ? (
        <Empty text="No data yet" />
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie data={data} dataKey="value" nameKey="name" outerRadius={90} label>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </Card>
  );
}