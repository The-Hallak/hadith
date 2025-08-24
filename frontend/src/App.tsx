import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import AddHadith from './components/AddHadith';
import Quiz from './components/Quiz';
import HadithList from './components/HadithList';
import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <nav className="navbar">
          <div className="nav-container">
            <h1 className="nav-title">تطبيق حفظ الأحاديث</h1>
            <div className="nav-links">
              <Link to="/" className="nav-link">الأحاديث</Link>
              <Link to="/add" className="nav-link">إضافة حديث</Link>
              <Link to="/quiz" className="nav-link">الأسئلة</Link>
            </div>
          </div>
        </nav>

        <main className="main-content">
          <Routes>
            <Route path="/" element={<HadithList />} />
            <Route path="/add" element={<AddHadith />} />
            <Route path="/quiz" element={<Quiz />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;
