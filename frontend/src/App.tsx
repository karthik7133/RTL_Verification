
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CsvProvider } from './context/CsvContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import RegressionPlanner from './pages/RegressionPlanner';

function App() {
  return (
    <CsvProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Dashboard />} />
            <Route path="plan" element={<RegressionPlanner />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </CsvProvider>
  );
}

export default App;
