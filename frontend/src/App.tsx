
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegressionPlanner from './pages/RegressionPlanner';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="plan" element={<RegressionPlanner />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
