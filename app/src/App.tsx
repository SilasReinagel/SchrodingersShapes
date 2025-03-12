import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Game } from './pages/Game';
import { Designer } from './pages/Designer';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Game />} />
        <Route path="/designer" element={<Designer />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;